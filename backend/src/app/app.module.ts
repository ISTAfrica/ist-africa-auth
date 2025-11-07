import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from '../models/users/users.module';
import { AuthModule } from '../models/auth/auth.module';
import { ChangePasswordModule } from '../models/auth/changepassword.module';
import { PasswordResetModule } from '../models/auth/passwordReset/passwordReset.module';
import { databaseConfig } from '../config/database.config';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../models/user/user.module';
import { ClientsModule } from '../models/clients/clients.module';
import { DefaultAdminModule } from '../commons/services/default-admin/default-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SequelizeModule.forRoot({
      ...databaseConfig(),
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    ChangePasswordModule,
    PasswordResetModule,
    EmailModule,
    UserModule,
    ClientsModule,
    DefaultAdminModule
  ],
})
export class AppModule {}
