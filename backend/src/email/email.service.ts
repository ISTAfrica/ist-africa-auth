import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY not found. Email sending will fail.');
    }
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(
    name: string,
    email: string,
    verifyUrl: string,
    otp?: string,
  ) {
    console.log(`📧 Attempting to send verification email to: ${email}`);
    const html = this.getVerifyEmailTemplate(name, verifyUrl, otp);

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev',
        to: email,
        subject: 'Verify your email',
        html: html,
      });

      if (error) {
        console.error(`❌ Failed to send verification email to ${email}:`, error);
        throw new Error(error.message);
      }

      console.log(`✅ Verification email sent successfully to ${email}`, data?.id);
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${email}:`, error.message);
      throw error;
    }
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

    const { error } = await this.resend.emails.send({
      from: this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev',
      to: email,
      subject: 'Your Account Has Been Disabled',
      html,
    });

    if (error) {
      throw new Error(error.message);
    }
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

    const { error } = await this.resend.emails.send({
      from: this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev',
      to: email,
      subject: 'Your Account Has Been Reactivated',
      html,
    });

    if (error) {
      throw new Error(error.message);
    }
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
