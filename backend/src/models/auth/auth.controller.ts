import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Query,
  Redirect
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body(new ValidationPipe()) registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }

  @Post('authenticate')
  @HttpCode(HttpStatus.OK) 
  authenticate(@Body(new ValidationPipe()) authenticateDto: AuthenticateUserDto) {
    return this.authService.authenticate(authenticateDto);
  }

  @Get('jwks')
  getJwks() {
    return this.authService.getJwks();
  }

   @Get('verify-email')
  @Redirect() 
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    const frontendUrl = process.env.FRONTEND_URL;

    return { url: `${frontendUrl}/auth/verification-success` };
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
}