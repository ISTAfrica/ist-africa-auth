/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ClientCredentialsDto } from './dto/client-credentials.dto';
import { AuthGuard } from '@nestjs/passport';
import { LinkedInOAuthGuard } from './guards/linkedin.guard';
import type { Response, Request } from 'express';

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
    const url = `${frontendUrl}/auth/verification-success?accessToken=${encodeURIComponent(
      accessToken,
    )}&refreshToken=${encodeURIComponent(refreshToken)}`;
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
    const id = Number(userId);
    const callerRole = req.user?.role;
    return this.authService.updateUserRole(callerRole, id, role);
  }

  // -------------------- LinkedIn OAuth2 Routes --------------------

  @Get('linkedin')
  @UseGuards(LinkedInOAuthGuard)
  linkedinLogin() {}

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(
    @Req() req: Request & { user?: any; session?: any },
    @Res() res: Response,
  ) {
    const frontendUrl = (
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');

    if (!req.user) {
      return res.redirect(
        `${frontendUrl}/auth/login?error=linkedin_auth_failed`,
      );
    }

    try {
      const oauthParams = req.session?.oauth;

      const result = await this.authService.linkedinLogin(
        req.user,
        oauthParams
          ? {
              client_id: oauthParams.client_id,
              redirect_uri: oauthParams.redirect_uri,
              state: oauthParams.state,
            }
          : undefined,
      );

      if (req.session?.oauth) {
        delete req.session.oauth;
      }

      // OAuth2 Authorization Code Flow
      if ('redirect_uri' in result && result.redirect_uri) {
        const callbackUrl = `${frontendUrl}/auth/linkedin/callback?redirect_uri=${encodeURIComponent(
          result.redirect_uri,
        )}`;
        return res.redirect(callbackUrl);
      }

      // Direct Login (No OAuth2 Client)
      const { accessToken, refreshToken, user } = result;

      if (!user || !accessToken || !refreshToken) {
        throw new Error('Invalid response from linkedinLogin');
      }

      const callbackUrl = `${frontendUrl}/auth/linkedin/callback?accessToken=${encodeURIComponent(
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

      return res.redirect(callbackUrl);
    } catch (error) {
      return res.redirect(
        `${frontendUrl}/auth/login?error=linkedin_processing_failed`,
      );
    }
  }

  // -------------------- Logout Routes --------------------

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body(new ValidationPipe()) logoutDto: LogoutDto,
    @Req() req: Request & { user?: any },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('No authorization header found');
    }

    const accessToken = authHeader.replace('Bearer ', '');

    if (logoutDto.type === 'single') {
      return this.authService.logoutSingleDevice(userId, accessToken);
    } else if (logoutDto.type === 'all') {
      return this.authService.logoutAllDevices(userId);
    }

    throw new BadRequestException('Invalid logout type');
  }

  @Get('session')
  @UseGuards(AuthGuard('jwt'))
  checkSession() {
    return { ok: true };
  }
}
