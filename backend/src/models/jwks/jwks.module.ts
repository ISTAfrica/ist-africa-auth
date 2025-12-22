import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwksController } from './jwks.controller';
import { JwksService } from './jwks.service';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [JwksController],
  providers: [JwksService],
})
export class JwksModule {}