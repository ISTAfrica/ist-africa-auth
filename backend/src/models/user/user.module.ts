import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // The UserService needs Prisma, so we import this
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}