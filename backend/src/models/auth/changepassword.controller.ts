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

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role?: string;
  };
}

@Controller('api/auth/change-password')
export class ChangePasswordController {
  constructor(private readonly changePasswordService: ChangePasswordService) {}

  @Patch()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body(new ValidationPipe({ whitelist: true })) dto: ChangePasswordDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not found or unauthorized');
    }

    const { currentPassword, newPassword, confirmPassword } = dto;

    return this.changePasswordService.changePassword(
      userId,
      currentPassword,
      newPassword,
      confirmPassword,
    );
  }
}
