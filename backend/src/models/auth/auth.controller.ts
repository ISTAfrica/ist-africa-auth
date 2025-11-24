/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Query,
  Redirect,
  Param,
  Patch,
  Req,
  UseGuards,
  Res, // Added to ensure correct import for @Res() decorator
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport'; // For Passport strategies (e.g., 'linkedin')

// --- Local Imports ---
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ClientCredentialsDto } from './dto/client-credentials.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body(new ValidationPipe()) registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }

  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  authenticate(
    @Body(new ValidationPipe()) authenticateDto: AuthenticateUserDto,
  ) {
    return this.authService.authenticate(authenticateDto);
  }

  @Get('jwks')
  getJwks() {
    return this.authService.getJwks();
  }

  @Get('verify-email')
  @Redirect()
  async verifyEmail(@Query('token') token: string) {
    const { accessToken, refreshToken } =
      await this.authService.verifyEmail(token);
    const frontendUrl = (
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
    const url = `${frontendUrl}/auth/verification-success?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`;
    return { url };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body(new ValidationPipe()) verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  resendOtp(@Body(new ValidationPipe()) resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body('refreshToken', new ValidationPipe()) refreshToken: string,
  ) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('tokens')
  @HttpCode(HttpStatus.OK)
  async exchangeAuthCode(
    @Query('code') code: string | undefined,
    @Body(new ValidationPipe()) credentials: ClientCredentialsDto,
  ) {
    if (!code) {
      throw new BadRequestException('Authorization code (code) is required');
    }

    return this.authService.exchangeAuthCode(code, credentials);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/:id/role')
  async updateRole(
    @Param('id') userId: string,
    @Body('role') role: 'user' | 'admin',
    @Req() req: Request & { user?: any },
  ) {
    console.log('Request user:', req.user);
    const id = Number(userId);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const callerRole = req.user?.role || req.user?.role;

    return this.authService.updateUserRole(callerRole, id, role);
  }

  // --- LinkedIn OAuth Routes ---

  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin')) // Triggers the redirect to LinkedIn's login page
  linkedinLogin() {
    // Initiates LinkedIn OAuth flow - guard handles redirect
  }

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin')) // Processes the code and runs the Strategy's validate() method
  async linkedinCallback(
    @Req() req: Request & { user?: any },
    @Res() res: Response,
  ) {
    // req.user contains the user object returned by the validate method in LinkedinStrategy
    if (!req.user) {
      const frontendUrl = (
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ).replace(/\/$/, '');
      // Handle failed login
      return res.redirect(
        `${frontendUrl}/auth/login?error=linkedin_login_failed`,
      );
    }

    // Direct LinkedIn login - generate tokens
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { accessToken, refreshToken } = await this.authService.linkedinLogin(
      req.user,
    );

    const frontendUrl = (
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');

    // Redirect to the frontend dashboard with tokens as query parameters
    const redirectUrl = `${frontendUrl}/auth/linkedin/callback?accessToken=${encodeURIComponent(
      accessToken,
    )}&refreshToken=${encodeURIComponent(refreshToken)}`;

    return res.redirect(redirectUrl);
  }
}
