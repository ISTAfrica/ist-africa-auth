import { Module } from '@nestjs/common';
import { ChangePasswordController } from './changepassword.controller';
import { ChangePasswordService } from './changepassword.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChangePasswordController],
  providers: [ChangePasswordService],
  exports: [ChangePasswordService],
})
export class ChangePasswordModule {}
