import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ClientCredentialsDto } from './dto/client-credentials.dto';

@Controller('api')
export class CallbackController {
  constructor(private readonly authService: AuthService) {}

  @Post('callback')
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
}


