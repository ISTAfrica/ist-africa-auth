import {
  Body,
  Controller,
  Patch,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChangePasswordService } from './changepassword.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Define a type-safe interface for the JWT user payload
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    user_type?: string;
  };
}

@Controller('api/change-password')
export class ChangePasswordController {
  constructor(private readonly changePasswordService: ChangePasswordService) {}

  @Patch()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: AuthenticatedRequest, // 👈 strongly typed request
    @Body(new ValidationPipe({ whitelist: true })) dto: ChangePasswordDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not found or unauthorized');
    }

    const { newPassword, confirmPassword } = dto;
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    return this.changePasswordService.changePassword(userId, dto);
  }
}
