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
  Res,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ClientCredentialsDto } from './dto/client-credentials.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('api/auth')
// @UseGuards(JwtAuthGuard)
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

    const callerRole = req.user?.role || req.user?.role;

    return this.authService.updateUserRole(callerRole, id, role);
  }

  // -------------------- LinkedIn OAuth2 Routes --------------------

  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  linkedinLogin() {}

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(
    @Req() req: Request & { user?: any },
    @Res() res: Response,
  ) {
    if (!req.user) {
      const frontendUrl = (
        process.env.FRONTEND_URL ||
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        'http://localhost:3000'
      ).replace(/\/$/, '');
      return res.redirect(
        `${frontendUrl}/auth/login?error=linkedin_auth_failed`,
      );
    }

    try {
      // Extract the full response including user data
      const { accessToken, refreshToken, user } =
        await this.authService.linkedinLogin(req.user);

      const frontendUrl = (
        process.env.FRONTEND_URL ||
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        'http://localhost:3000'
      ).replace(/\/$/, '');

      // Determine redirect path based on user role
      const redirectPath =
        user.role === 'admin' ? '/admin/clients' : '/user/profile';

      // Redirect directly to the user's dashboard with auth params
      const redirectUrl = `${frontendUrl}${redirectPath}?accessToken=${encodeURIComponent(
        accessToken,
      )}&refreshToken=${encodeURIComponent(refreshToken)}&userId=${encodeURIComponent(
        user.id,
      )}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(
        user.email,
      )}&role=${encodeURIComponent(user.role)}&membershipStatus=${encodeURIComponent(
        user.membershipStatus,
      )}&profilePicture=${encodeURIComponent(
        user.profilePicture || '',
      )}&isVerified=${encodeURIComponent(user.isVerified)}`;

      return res.redirect(redirectUrl);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      const frontendUrl = (
        process.env.FRONTEND_URL ||
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        'http://localhost:3000'
      ).replace(/\/$/, '');
      return res.redirect(
        `${frontendUrl}/auth/login?error=linkedin_processing_failed`,
      );
    }
  }
}
