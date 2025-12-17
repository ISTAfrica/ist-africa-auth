import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './models/auth/auth.module';
import { ChangePasswordModule } from './models/auth/changepassword.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './config/database.config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    SequelizeModule.forRoot(databaseConfig() as SequelizeModuleOptions),
    AuthModule,
    ChangePasswordModule,
  ],
})
export class AppModule {}
