import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthService } from './auth.service';
import { EmailModule } from '../../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}


