// src/models/auth/passwordReset/Resetemail/resetEmail.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<number>('SMTP_PORT')) || 587,
      secure: false, // TLS auto-upgrade on port 587
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'), // Gmail App Password
      },
      tls: { rejectUnauthorized: false },
    });

    // Verify SMTP connection at startup
    this.testConnection();
  }

  private async testConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection successful');
      console.log('📧 Host:', this.configService.get<string>('SMTP_HOST'));
      console.log('📧 Port:', this.configService.get<number>('SMTP_PORT'));
      console.log('📧 User:', this.configService.get<string>('SMTP_USER'));
    } catch (err) {
      console.error('❌ SMTP connection failed:', err);
    }
  }

  async sendPasswordResetEmail(
    name: string,
    email: string,
    resetUrl: string,
  ): Promise<void> {
    console.log(`📧 Sending password reset email to: ${email}`);
    console.log('🔗 Reset URL:', resetUrl);

    const html = this.getPasswordResetTemplate(name, resetUrl);

    try {
      const info: nodemailer.SentMessageInfo = await this.transporter.sendMail({
        from: `"IST Africa Auth" <${this.configService.get<string>('SMTP_USER')}>`,
        to: email,
        subject: 'Password Reset Request - IST Africa Auth',
        html,
      });

      console.log('✅ Email sent successfully:', info.response);
      console.log('📬 Message ID:', info.messageId);
    } catch (err: any) {
      console.error('❌ Failed to send password reset email:', err.message);
      console.error('❌ Full error details:', JSON.stringify(err, null, 2));
      throw new InternalServerErrorException(
        `Failed to send password reset email: ${err.message}`,
      );
    }
  }

  private getPasswordResetTemplate(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05); border: 1px solid #dee2e6; }
          .header { background: #0d6efd; padding: 30px; color: #fff; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 40px; color: #495057; line-height: 1.7; }
          .content h2 { font-size: 20px; margin-top: 0; }
          .btn { display: inline-block; background: #0d6efd; color: #fff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; }
          .btn:hover { background: #0b5ed7; }
          .text-center { text-align: center; margin: 30px 0; }
          .warning-box { background-color: #fff3cd; border: 1px solid #ffecb5; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; background-color: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your IST Africa Auth password.</p>
            <p>Click below to create a new password:</p>
            <div class="text-center">
              <a class="btn" href="${resetUrl}">Reset My Password</a>
            </div>
            <p>If the button doesn’t work, copy this link into your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6;">${resetUrl}</p>
            <div class="warning-box">
              <p>⏰ This link will expire in 1 hour.</p>
            </div>
            <p>If you didn’t request this, you can safely ignore this email.</p>
            <p>Regards,<br><strong>The IST Africa Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} IST Africa. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
