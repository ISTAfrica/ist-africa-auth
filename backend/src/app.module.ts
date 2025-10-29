import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './models/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChangePasswordModule } from './models/auth/changepassword.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    ChangePasswordModule,
  ],
})
export class AppModule {}
