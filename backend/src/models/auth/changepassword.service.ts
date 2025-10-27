import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class ChangePasswordService {
  constructor(private readonly prisma: PrismaService) {}

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = dto;

    // 🔍 Ensure userId is valid
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException('Invalid user ID');
    }

    // 🔍 Check if the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 🔐 Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // 🔑 Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: Number(userId) },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }
}
