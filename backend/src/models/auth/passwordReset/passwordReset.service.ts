import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.model';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from './resetEmail/resetEmail.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,

    @InjectModel(PasswordResetToken)
    private readonly tokenModel: typeof PasswordResetToken,

    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    console.log('🔥 forgotPassword method called with email:', dto.email);

    const user: User | null = await this.userModel.findOne({
      where: { email: dto.email },
    });

    if (!user) throw new NotFoundException('User not found');

    // Remove existing tokens
    await this.tokenModel.destroy({ where: { userId: user.id } });

    // Generate and hash token
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10);

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save hashed token
    await this.tokenModel.create({
      userId: user.id,
      token: hashedToken,
      expiresAt,
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/resetPassword/${rawToken}`;

    console.log(`📧 Sending password reset email to: ${user.email}`);
    await this.emailService.sendPasswordResetEmail(
      user.name || user.email.split('@')[0],
      user.email,
      resetUrl,
    );

    return { message: 'Password reset email sent successfully' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const cleanToken = dto.token.replace(/^Bearer\s+/i, '').trim();

    const tokens = await this.tokenModel.findAll();
    const resetToken = tokens.find((t) =>
      bcrypt.compareSync(cleanToken, t.token),
    );

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (resetToken.expiresAt.getTime() - Date.now() <= 0) {
      await resetToken.destroy();
      throw new BadRequestException(
        'Token has expired. Please request a new password reset link.',
      );
    }

    const user: User | null = await this.userModel.findByPk(resetToken.userId);
    if (!user) throw new NotFoundException('User not found');

    const hashedPassword: string = await bcrypt.hash(dto.newPassword, 10);
    await user.update({ password: hashedPassword });

    await resetToken.destroy();

    return { message: 'Password has been reset successfully' };
  }
}
