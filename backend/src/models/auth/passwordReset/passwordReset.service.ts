import { Injectable } from '@nestjs/common';
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

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userModel.findOne({
        where: { email: dto.email },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      await this.tokenModel.destroy({ where: { userId: user.id } });

      const rawToken = randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(rawToken, 10);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await this.tokenModel.create({
        userId: user.id,
        token: hashedToken,
        expiresAt,
      });

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const resetUrl = `${frontendUrl}/auth/resetPassword/${rawToken}`;

      await this.emailService.sendPasswordResetEmail(
        user.name || user.email.split('@')[0],
        user.email,
        resetUrl,
      );

      return {
        success: true,
        message: 'Password reset email sent successfully',
      };
    } catch (error) {
      console.error('Forgot Password Error:', error);
      return {
        success: false,
        message: 'Something went wrong. Please try again later.',
      };
    }
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cleanToken = dto.token.replace(/^Bearer\s+/i, '').trim();

      const tokens = await this.tokenModel.findAll();
      const resetToken = tokens.find((t) =>
        bcrypt.compareSync(cleanToken, t.token),
      );

      if (!resetToken) {
        return { success: false, message: 'Invalid or expired token' };
      }

      if (resetToken.expiresAt.getTime() <= Date.now()) {
        await resetToken.destroy();
        return {
          success: false,
          message:
            'Token has expired. Please request a new password reset link.',
        };
      }

      const user = await this.userModel.findByPk(resetToken.userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
      await user.update({ password: hashedPassword });

      await resetToken.destroy();

      return { success: true, message: 'Password has been reset successfully' };
    } catch (error) {
      console.error('Reset Password Error:', error);
      return {
        success: false,
        message: 'Something went wrong. Please try again later.',
      };
    }
  }
}
