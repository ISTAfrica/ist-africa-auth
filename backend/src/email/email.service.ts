import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { verifyEmailTemplate } from './templates/verify-email';
import { passwordResetTemplate } from './templates/password-reset';
import { accountDisabledTemplate } from './templates/account-disabled';
import { accountReactivatedTemplate } from './templates/account-reactivated';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<number>('SMTP_PORT')),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.from = `"IST Africa Auth" <${this.configService.get<string>('MAIL_FROM', 'noreply@ist.africa')}>`;
  }

  async sendVerificationEmail(
    name: string,
    email: string,
    verifyUrl: string,
    otp?: string,
  ) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Verify your email',
        html: verifyEmailTemplate(name, verifyUrl, otp),
      });
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send verification email to ${email}:`, error);
      if (otp) {
        console.log(`Email failed. Backup OTP for ${email}: ${otp}`);
      }
    }
  }

  async sendPasswordResetEmail(
    name: string,
    email: string,
    resetUrl: string,
  ): Promise<void> {
    console.log('Sending password reset email to:', email);

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Password Reset Request - IST Africa Auth',
        html: passwordResetTemplate(name, resetUrl),
      });
      console.log('Password reset email sent successfully to:', email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendAccountDisabledEmail(name: string, email: string, reason: string) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Your Account Has Been Disabled',
        html: accountDisabledTemplate(name, reason),
      });
    } catch (error) {
      console.error(`Failed to send disabled account email to ${email}:`, error);
    }
  }

  async sendAccountReactivatedEmail(name: string, email: string) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Your Account Has Been Reactivated',
        html: accountReactivatedTemplate(name),
      });
    } catch (error) {
      console.error(`Failed to send reactivated account email to ${email}:`, error);
    }
  }
}
