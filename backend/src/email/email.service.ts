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
      rejectUnauthorized: false
    }
    });
  }

  // --- REPLACE sendVerificationEmail with sendOtpEmail ---
  async sendOtpEmail(name: string, email: string, otp: string) {
    const html = this.getOtpEmailTemplate(name, otp);

    await this.transporter.sendMail({
      from: `"IST Africa Auth" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Your IAA Verification Code',
      html: html,
    });
  }

  private getOtpEmailTemplate(name: string, otp: string): string {
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
              .content h2 { font-size: 20px; color: #212529; }
              .otp-code { background-color: #e9ecef; color: #0d6efd; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 15px 25px; border-radius: 8px; text-align: center; margin: 30px 0; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #6c757d; background-color: #f8f9fa; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>IST Africa Auth</h1>
              </div>
              <div class="content">
                  <h2>Hello ${name},</h2>
                  <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address and complete your setup.</p>
                  <div class="otp-code">${otp}</div>
                  <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                  <p>Regards,<br>The IST Africa Team</p>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} IST Africa. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }
}