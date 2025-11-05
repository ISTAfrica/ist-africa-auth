import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../../models/users/entities/user.entity';
import { hash } from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DefaultAdminService implements OnModuleInit {
  private readonly logger = new Logger(DefaultAdminService.name);

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultAdmin();
  }

  private async ensureDefaultAdmin() {
    const email = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');
    const password = this.configService.get<string>('DEFAULT_ADMIN_PASSWORD');
    const name = this.configService.get<string>('DEFAULT_ADMIN_NAME') ?? 'Default Admin';

    if (!email || !password) {
      this.logger.warn('Default admin credentials not set in .env — skipping creation');
      return;
    }

    const existingAdmins = await this.userModel.count({ where: { role: 'admin', isActive: true } });

    if (existingAdmins === 0) {
      let admin = await this.userModel.findOne({ where: { email } });

      if (admin) {
        admin.isActive = true;
        admin.isDefaultAdmin = true;
        await admin.save();
        this.logger.log('Reactivated default admin account');
      } else {
        const hashed = await hash(password, 10);
        await this.userModel.create({
          email,
          name,
          password: hashed,
          role: 'admin',
          isVerified: true,
          isActive: true,
          isDefaultAdmin: true,
        });
        this.logger.log('Created default admin account');
      }
    } else {
      this.logger.debug('Active admin exists — skipping default admin creation');
    }
  }
}
