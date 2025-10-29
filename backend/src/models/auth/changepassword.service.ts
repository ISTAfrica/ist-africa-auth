import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ChangePasswordService {
  constructor(private prisma: PrismaService) {}

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    try {
      // Validate user ID
      if (!userId || isNaN(Number(userId))) {
        throw new BadRequestException('Invalid user ID');
      }

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw new BadRequestException('New passwords do not match');
      }

      // Validate password requirements
      if (!newPassword || newPassword.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters');
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: Number(userId) },
        select: { id: true, password: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Prevent using same password
      const isSameAsOld = await bcrypt.compare(newPassword, user.password);
      if (isSameAsOld) {
        throw new BadRequestException(
          'New password cannot be the same as old password',
        );
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await this.prisma.user.update({
        where: { id: Number(userId) },
        data: { password: hashedPassword },
      });

      return { message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}
