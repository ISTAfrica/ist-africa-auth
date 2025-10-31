import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: Number(this.configService.get('SMTP_PORT')),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  async sendPasswordResetEmail(
    name: string,
    email: string,
    resetUrl: string,
  ): Promise<void> {
    const html = this.getPasswordResetTemplate(name, resetUrl);

    console.log('📧 Sending password reset email to:', email);
    console.log('🔗 Reset URL:', resetUrl);

    try {
      await this.transporter.sendMail({
        from: `"IST Africa Auth" <${this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: 'Password Reset Request - IST Africa Auth',
        html: html,
      });
      console.log('✅ Password reset email sent successfully to:', email);
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  private getPasswordResetTemplate(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🔐 Password Reset Request</h1>
            </div>
            <div style="padding: 40px 30px; background-color: #ffffff;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #555;">Hello ${name},</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #555;">We received a request to reset your password for your IST Africa Auth account.</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #555;">Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Reset Password</a>
              </div>
              
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6c757d;">Or copy and paste this link into your browser:</p>
              <div style="margin: 10px 0 25px 0; padding: 15px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; word-break: break-all; font-family: 'Courier New', monospace; font-size: 13px; color: #495057;">${resetUrl}</div>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⏰ This link will expire in 1 hour.</strong></p>
              </div>
              
              <p style="margin: 30px 0 0 0; font-size: 14px; color: #6c757d;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <p style="margin: 20px 0 0 0; font-size: 16px; color: #555;">Regards,<br>The IST Africa Team</p>
            </div>
            <div style="text-align: center; padding: 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <p style="margin: 5px 0; color: #6c757d; font-size: 13px;"><strong>IST Africa Auth</strong></p>
              <p style="margin: 5px 0; color: #6c757d; font-size: 13px;">Secure Authentication Service</p>
              <p style="margin: 15px 0 5px 0; color: #6c757d; font-size: 12px;">© ${new Date().getFullYear()} IST Africa. All rights reserved.</p>
              <p style="margin: 5px 0; color: #6c757d; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
