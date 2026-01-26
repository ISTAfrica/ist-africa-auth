import { Injectable, Logger, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
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

    const existingAdmins = await this.userModel.count({ where: { role: 'admin', isActive: true } });

    if (existingAdmins === 0 && (!email || !password)) {
      this.logger.error(
        'No active admin found and no DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD set in .env. ' +
        'Please provide default admin credentials before starting the application.',
      );
      throw new InternalServerErrorException(
        'Missing default admin credentials. Please set DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD in .env before starting the server.',
      );
    }

    if (existingAdmins > 0) {
      this.logger.debug('Active admin exists — skipping default admin creation');
      return;
    }

    let admin = await this.userModel.findOne({ where: { email } });

    if (admin) {
      admin.isActive = true;
      admin.isDefaultAdmin = true;
      await admin.save();
      this.logger.log('Reactivated default admin account');
    } else if (email && password) {
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
  }
}
