import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './models/auth/auth.module';
import { ChangePasswordModule } from './models/auth/changepassword.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SequelizeModule.forRoot(databaseConfig()),
    AuthModule,
    ChangePasswordModule,
  ],
})
export class AppModule {}
