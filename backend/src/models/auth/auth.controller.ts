import {
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
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

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
  linkedinLogin(@Req() req: Request) {}

  // LinkedIn OAuth2 callback endpoint

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(
    @Req() req: Request & { user?: any },
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
      const { accessToken, refreshToken, user } =
        await this.authService.linkedinLogin(req.user);

      const finalFrontendPath =
        user.role === 'admin' ? '/admin/clients' : '/user/profile';

      const redirectUrl = `${frontendUrl}${finalFrontendPath}?loginSuccess=true&accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      return res.redirect(
        `${frontendUrl}/auth/login?error=linkedin_processing_failed`,
      );
    }
  }
}
