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
  Res, // Added from the LinkedIn branch
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard'; // Kept common import
import { AuthGuard } from '@nestjs/passport'; // Added from the LinkedIn branch
import type { Request, Response } from 'express'; // Added from the LinkedIn branch

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

  /**
   * Initiates LinkedIn OAuth2 authorization flow
   * Redirects user to LinkedIn's authorization page
   */
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  linkedinLogin(@Req() req: Request) {
    // Guard handles the redirect to LinkedIn
    console.log('[AuthController] /linkedin endpoint hit');
    console.log('[AuthController] Request headers:', req.headers);
    console.log('[AuthController] This should redirect to LinkedIn...');
  }

  /**
   * LinkedIn OAuth2 callback endpoint
   * Handles authorization code exchange and user creation/login
   */
  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinCallback(
    @Req() req: Request & { user?: any },
    @Res() res: Response,
  ) {
    console.log('[AuthController] LinkedIn callback received');

    if (!req.user) {
      console.error('[AuthController] No user data in LinkedIn callback');
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
      // Call the LinkedIn login service method
      const { accessToken, refreshToken, user } =
        await this.authService.linkedinLogin(req.user);

      console.log(
        `[AuthController] LinkedIn login successful for user: ${user.email}`,
      );

      // Redirect to frontend with tokens
      const frontendUrl = (
        process.env.FRONTEND_URL ||
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        'http://localhost:3000'
      ).replace(/\/$/, '');

      const redirectUrl = `${frontendUrl}/auth/linkedin/callback?accessToken=${encodeURIComponent(
        accessToken,
      )}&refreshToken=${encodeURIComponent(refreshToken)}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('[AuthController] LinkedIn callback error:', error);
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
