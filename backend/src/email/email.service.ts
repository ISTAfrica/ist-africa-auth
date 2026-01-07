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

  async sendVerificationEmail(
    name: string,
    email: string,
    verifyUrl: string,
    otp?: string,
  ) {
    const html = this.getVerifyEmailTemplate(name, verifyUrl, otp);

    await this.transporter.sendMail({
      from: `"IST Africa Auth" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Verify your email',
      html: html,
    });
  }

  async sendAccountDisabledEmail(name: string, email: string, reason: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #d32f2f;">Account Disabled</h2>
        <p>Dear ${name},</p>
        <p>Your account has been <strong>disabled</strong> for the following reason:</p>
        <blockquote style="background: #f8d7da; padding: 12px; border-left: 4px solid #d32f2f;">
          ${reason}
        </blockquote>
        <p>If you believe this was a mistake, please contact our support team.</p>
        <p>— The IST Africa Admin Team</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"IST Africa Auth" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Your Account Has Been Disabled',
      html,
    });
  }

  async sendAccountReactivatedEmail(name: string, email: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #2e7d32;">Account Reactivated</h2>
        <p>Dear ${name},</p>
        <p>Good news! Your account has been <strong>reactivated</strong> and you can now log in again.</p>
        <p>Welcome back! If you have any issues accessing your account, please contact our support team.</p>
        <p>— The IST Africa Admin Team</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"IST Africa Auth" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Your Account Has Been Reactivated',
      html,
    });
  }

  private getVerifyEmailTemplate(
    name: string,
    verifyUrl: string,
    otp?: string,
  ): string {
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
              .btn { display:inline-block; background:#0d6efd; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none; }
              .text-center { text-align:center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>IST Africa Auth</h1>
              </div>
              <div class="content">
                  <h2>Hello ${name},</h2>
                  <p>Thank you for registering. Please click the button below to verify your email address and complete your setup.</p>
                  ${
                    otp
                      ? `<p>Your One-Time Password (OTP):</p>
                  <div class="otp-code">${otp}</div>`
                      : ''
                  }
                  <p class="text-center">
                    <a class="btn" href="${verifyUrl}">Verify my email</a>
                  </p>
                  <p>If you did not request this, please ignore this email.</p>
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
