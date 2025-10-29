import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from '../models/users/users.module';
import { AuthModule } from '../models/auth/auth.module';
import { ChangePasswordModule } from '../models/auth/changepassword.module';
import { databaseConfig } from '../config/database.config';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SequelizeModule.forRoot(databaseConfig()),
    UsersModule,
    SequelizeModule.forRoot(databaseConfig()),
    UsersModule,
    AuthModule,
    ChangePasswordModule,
    EmailModule,
  ],
})
export class AppModule {}
