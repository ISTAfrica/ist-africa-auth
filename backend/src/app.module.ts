import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './models/auth/auth.module';
import { RoleModule } from './models/roles/role.module'; // ✅ fixed path
import { databaseConfig } from './config/database.config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    SequelizeModule.forRoot(databaseConfig() as SequelizeModuleOptions),
    AuthModule,
    RoleModule,
  ],
})
export class AppModule {}
