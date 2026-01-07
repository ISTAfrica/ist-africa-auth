import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

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
        from: `"IST Africa Auth" <${this.configService.get<string>('SMTP_USER')}>`,
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

  // Password reset email 
  private getPasswordResetTemplate(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
              .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
              .header { background: #0d6efd; padding: 30px; text-align: center; color: white; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 40px; color: #495057; line-height: 1.7; }
              .content h2 { font-size: 20px; color: #212529; margin-top: 0; }
              .content p { margin: 15px 0; }
              .btn { display: inline-block; background: #0d6efd; color:#ffffff !important; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; }
              .btn:hover { background: #0b5ed7; }
              .text-center { text-align: center; margin: 30px 0; }
              .warning-box { background-color: #fff3cd; border: 1px solid #ffecb5; border-radius: 6px; padding: 15px; margin: 20px 0; }
              .warning-box p { margin: 0; color: #856404; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #6c757d; background-color: #f8f9fa; border-top: 1px solid #dee2e6; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1> Password Reset Request</h1>
              </div>
              <div class="content">
                  <h2>Hello ${name},</h2>
                  <p>We received a request to reset the password for your IST Africa Auth account.</p>
                  <p>Click the button below to create a new password:</p>
                  
                  <div class="text-center">
                      <a class="btn" href="${resetUrl}">Reset My Password</a>
                  </div>
                  
                  <p style="font-size: 14px; color: #6c757d;">If the button doesn't work, copy and paste this link into your browser:</p>
                  <p style="font-size: 13px; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6;">${resetUrl}</p>
                  
                  <div class="warning-box">
                      <p><strong> This link will expire in 1 hour.</strong></p>
                  </div>
                  
                  <p style="margin-top: 30px;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                  <p style="margin-top: 20px;">Regards,<br><strong>The IST Africa Team</strong></p>
              </div>
              <div class="footer">
                  <p><strong>IST Africa Auth</strong></p>
                  <p>Secure Authentication Service</p>
                  <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} IST Africa. All rights reserved.</p>
                  <p>This is an automated email. Please do not reply.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }
}
