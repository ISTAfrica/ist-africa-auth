import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
// No need for extra imports like TransportOptions

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // We will build the options object directly inside createTransport.
    // This lets TypeScript correctly infer that we are creating SMTP transport options.
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // For port 587, secure is false and upgrades with STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },

      // ** THE FIX IS HERE **
      // Use a conditional spread to add the 'tls' object only in development.
      // This is a clean way to handle the logic without TypeScript errors.
      ...(isDevelopment && {
        tls: {
          rejectUnauthorized: false,
        },
      }),
    });
  }

  async sendVerificationEmail(
    email: string,
    verifyUrl: string,
    otp: string,
    username: string,
  ): Promise<void> {
    console.log('📧 Sending verification email to:', email);
    console.log('🔗 Verification URL:', verifyUrl);
    console.log('🔢 OTP:', otp);

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@istafrica.com',
      to: email,
      subject: 'Verify Your Email - IST Africa Auth',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6; 
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .email-container { 
                max-width: 600px; 
                margin: 40px auto; 
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; 
                padding: 40px 30px; 
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .content { 
                padding: 40px 30px;
                background-color: #ffffff;
              }
              .content p {
                margin: 0 0 20px 0;
                font-size: 16px;
                color: #555;
              }
              .otp-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                padding: 30px;
                margin: 30px 0;
                border-radius: 8px;
                font-size: 36px;
                font-weight: bold;
                letter-spacing: 8px;
              }
              .button-container {
                text-align: center;
                margin: 30px 0;
              }
              .button { 
                display: inline-block; 
                padding: 14px 40px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important; 
                text-decoration: none; 
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s;
              }
              .button:hover {
                transform: translateY(-2px);
              }
              .link-box {
                margin: 25px 0;
                padding: 15px;
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                word-break: break-all;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                color: #495057;
              }
              .warning {
                background-color: #d1ecf1;
                border-left: 4px solid #17a2b8;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .warning p {
                margin: 0;
                color: #0c5460;
                font-size: 14px;
              }
              .footer { 
                text-align: center; 
                padding: 30px;
                background-color: #f8f9fa;
                border-top: 1px solid #e9ecef;
              }
              .footer p {
                margin: 5px 0;
                color: #6c757d;
                font-size: 13px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>✉️ Verify Your Email</h1>
              </div>
              <div class="content">
                <p>Hello ${username},</p>
                <p>Welcome to IST Africa Auth! Thank you for registering.</p>
                <p>Please use this verification code to complete your account setup:</p>
                
                <div class="otp-box">${otp}</div>
                
                <p style="text-align: center; font-size: 14px; color: #6c757d;">Or click the button below to verify automatically:</p>
                
                <div class="button-container">
                  <a href="${verifyUrl}" class="button">Verify Email</a>
                </div>
                
                <p style="font-size: 14px; color: #6c757d;">Or copy and paste this link into your browser:</p>
                <div class="link-box">${verifyUrl}</div>
                
                <div class="warning">
                  <p><strong>⏰ This code and link will expire in 24 hours.</strong></p>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p><strong>IST Africa Auth</strong></p>
                <p>Secure Authentication Service</p>
                <p style="margin-top: 15px; font-size: 12px;">This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Verify Your Email

Hello ${username},

Welcome to IST Africa Auth! Thank you for registering.

Your verification code is: ${otp}

Or click this link to verify your email:
${verifyUrl}

This code and link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

---
IST Africa Auth
Secure Authentication Service
      `.trim(),
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully to:', email);
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/resetPassword/${token}`;

    console.log('📧 Sending password reset email to:', email);
    console.log('🔗 Reset URL:', resetUrl);

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@istafrica.com',
      to: email,
      subject: 'Password Reset Request - IST Africa Auth',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6; 
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .email-container { 
                max-width: 600px; 
                margin: 40px auto; 
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; 
                padding: 40px 30px; 
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .content { 
                padding: 40px 30px;
                background-color: #ffffff;
              }
              .content p {
                margin: 0 0 20px 0;
                font-size: 16px;
                color: #555;
              }
              .button-container {
                text-align: center;
                margin: 30px 0;
              }
              .button { 
                display: inline-block; 
                padding: 14px 40px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important; 
                text-decoration: none; 
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s;
              }
              .button:hover {
                transform: translateY(-2px);
              }
              .link-box {
                margin: 25px 0;
                padding: 15px;
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                word-break: break-all;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                color: #495057;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .warning p {
                margin: 0;
                color: #856404;
                font-size: 14px;
              }
              .footer { 
                text-align: center; 
                padding: 30px;
                background-color: #f8f9fa;
                border-top: 1px solid #e9ecef;
              }
              .footer p {
                margin: 5px 0;
                color: #6c757d;
                font-size: 13px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password for your IST Africa Auth account.</p>
                <p>Click the button below to create a new password:</p>
                
                <div class="button-container">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <p style="font-size: 14px; color: #6c757d;">Or copy and paste this link into your browser:</p>
                <div class="link-box">${resetUrl}</div>
                
                <div class="warning">
                  <p><strong>⏰ This link will expire in 1 hour.</strong></p>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              </div>
              <div class="footer">
                <p><strong>IST Africa Auth</strong></p>
                <p>Secure Authentication Service</p>
                <p style="margin-top: 15px; font-size: 12px;">This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Password Reset Request

Hello,

We received a request to reset your password for your IST Africa Auth account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email.

---
IST Africa Auth
Secure Authentication Service
      `.trim(),
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully to:', email);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}
