import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './models/auth/auth.module';
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
  ],
})
export class AppModule {}