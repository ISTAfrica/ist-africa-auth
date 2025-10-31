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
    const user: User | null = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');
    await this.tokenModel.destroy({ where: { userId: user.id } });
    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    console.log('📅 Creating token at:', now.toISOString());
    console.log('📅 Token will expire at:', expiresAt.toISOString());
    const savedToken: PasswordResetToken = await this.tokenModel.create({
      userId: user.id,
      token,
      expiresAt,
    });

    console.log(
      '📅 Saved token expires at:',
      savedToken.expiresAt.toISOString(),
    );

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/resetPassword/${token}`;

    await this.emailService.sendPasswordResetEmail(
      user.name || user.email.split('@')[0],
      user.email,
      resetUrl,
    );

    return { message: 'Password reset email sent successfully' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const cleanToken = dto.token.replace(/^Bearer\s+/i, '').trim();

    console.log('🔍 Step 1: Received token:', cleanToken);
    console.log('🔍 Step 1: New password length:', dto.newPassword?.length);

    const resetToken: PasswordResetToken | null = await this.tokenModel.findOne(
      {
        where: { token: cleanToken },
      },
    );

    console.log('🔍 Step 2: Token found in DB?', resetToken ? 'YES' : 'NO');

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    const now = new Date();
    console.log('🕐 Current time:', now.toISOString());
    console.log('🕐 Token expires at:', resetToken.expiresAt.toISOString());

    const timeRemainingMs = resetToken.expiresAt.getTime() - now.getTime();
    const timeRemainingMinutes = Math.floor(timeRemainingMs / 1000 / 60);

    console.log('🕐 Time remaining (minutes):', timeRemainingMinutes);

    if (timeRemainingMs <= 0) {
      console.log('❌ Token expired!');
      await resetToken.destroy();
      throw new BadRequestException(
        'Token has expired. Please request a new password reset link.',
      );
    }

    console.log('✅ Token is valid!');
    console.log('🔍 Step 3: Looking for user with ID:', resetToken.userId);

    const user: User | null = await this.userModel.findByPk(resetToken.userId);

    console.log('🔍 Step 4: User found?', user ? 'YES' : 'NO');

    if (!user) throw new NotFoundException('User not found');

    console.log('🔍 Step 5: Hashing new password...');
    const hashedPassword: string = await bcrypt.hash(dto.newPassword, 10);

    console.log('🔍 Step 6: Updating user password...');
    await user.update({ password: hashedPassword });

    console.log('🔍 Step 7: Deleting token...');
    await resetToken.destroy();

    console.log('✅ Password reset successful!');

    return { message: 'Password has been reset successfully' };
  }
}
