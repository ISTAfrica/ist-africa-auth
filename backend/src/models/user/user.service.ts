import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async getProfile(userId: number): Promise<ReturnType<User['toJSON']>> {
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.toJSON();
  }

  async updateProfile(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<ReturnType<User['toJSON']>> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Store old role before updating
    const oldRole = user.role;

    await user.update(updateUserDto);

    // If user was promoted to admin (and isn't the default admin), disable default admin
    if (oldRole !== 'admin' && user.role === 'admin') {
      await this.disableDefaultAdmin(user);
    }

    return user.toJSON();
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<ReturnType<User['toJSON']>> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      await fs.unlink(file.path);
      throw new NotFoundException('User not found');
    }

    const oldAvatarUrl = user.avatarUrl;

    if (oldAvatarUrl) {
      try {
        const oldFilename = path.basename(new URL(oldAvatarUrl).pathname);
        const oldAvatarPath = path.join(process.cwd(), 'uploads', oldFilename);
        await fs.access(oldAvatarPath);
        await fs.unlink(oldAvatarPath);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(
            `Could not delete old avatar at ${oldAvatarUrl}:`,
            error.message,
          );
        } else {
          console.error(
            `Could not delete old avatar at ${oldAvatarUrl}:`,
            error,
          );
        }
      }
    }

    const baseUrl = process.env.API_BASE_URL || 'https://ist-africa-auth-1.onrender.com';
    const newAvatarUrl = `${baseUrl}/uploads/${file.filename}`;

    await user.update({ avatarUrl: newAvatarUrl });

    return user.toJSON();
  }

  /**
   * Disable the default admin account when a real admin is promoted.
   */
  private async disableDefaultAdmin(currentAdmin: User): Promise<void> {
    try {
      const attributes = (this.userModel as any).getAttributes?.() || {};
      const hasIsDefaultAdmin = 'isDefaultAdmin' in attributes;

      // Find the default admin safely
      const defaultAdmin = await this.userModel.findOne({
        where: hasIsDefaultAdmin
          ? { isDefaultAdmin: true }
          : { email: 'admin@example.com' },
      });

      if (
        defaultAdmin &&
        defaultAdmin.id !== currentAdmin.id &&
        defaultAdmin.isActive !== false
      ) {
        await defaultAdmin.update({ isActive: false });
        console.log(`Default admin (${defaultAdmin.email}) has been disabled.`);
      }
    } catch (error) {
      console.error('Failed to disable default admin:', error);
    }
  }
}
