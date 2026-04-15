import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClientUser } from '../auth/entities/client-user.entity';
import { Client } from '../clients/entities/client.entity';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(ClientUser)
    private readonly clientUserModel: typeof ClientUser,
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
  ) {}

  // -------------------- My Apps --------------------
  /**
   * Lists apps the current user has access to.
   * - IAA admins see every active client (they can log into any).
   * - Regular users see only clients they've been explicitly assigned.
   */
  async listMyApps(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'role'],
    });
    if (!user) throw new NotFoundException('User not found');

    let clients: Client[];
    if (user.role === 'admin') {
      clients = await this.clientModel.findAll({
        where: { status: 'active' },
        attributes: ['id', 'client_id', 'name', 'description', 'redirect_uri'],
        order: [['name', 'ASC']],
      });
    } else {
      const assignments = await this.clientUserModel.findAll({
        where: { userId },
        attributes: ['clientId'],
      });
      const clientIds = assignments.map((a) => a.clientId);
      if (clientIds.length === 0) return [];

      clients = await this.clientModel.findAll({
        where: { id: clientIds, status: 'active' },
        attributes: ['id', 'client_id', 'name', 'description', 'redirect_uri'],
        order: [['name', 'ASC']],
      });
    }

    return clients.map((c) => {
      let homeUrl = '#';
      let faviconUrl: string | null = null;
      try {
        const u = new URL(c.redirect_uri);
        homeUrl = u.origin;
        faviconUrl = `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
      } catch {
        // invalid redirect_uri — leave defaults
      }
      return {
        client_id: c.client_id,
        name: c.name,
        description: c.description,
        home_url: homeUrl,
        favicon_url: faviconUrl,
      };
    });
  }

  async getProfile(userId: string): Promise<ReturnType<User['toJSON']>> {
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.toJSON();
  }

  async updateProfile(
    userId: string,
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
    userId: string,
    file: Express.Multer.File,
  ): Promise<ReturnType<User['toJSON']>> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      await fs.unlink(file.path);
      throw new NotFoundException('User not found');
    }

    const oldPicture = user.profilePicture;

    if (oldPicture) {
      try {
        const oldFilename = path.basename(new URL(oldPicture).pathname);
        const oldAvatarPath = path.join(process.cwd(), 'uploads', oldFilename);
        await fs.access(oldAvatarPath);
        await fs.unlink(oldAvatarPath);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(
            `Could not delete old avatar at ${oldPicture}:`,
            error.message,
          );
        } else {
          console.error(
            `Could not delete old avatar at ${oldPicture}:`,
            error,
          );
        }
      }
    }

    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3003}`;
    const newAvatarUrl = `${baseUrl}/uploads/${file.filename}`;

    await user.update({ profilePicture: newAvatarUrl });

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
