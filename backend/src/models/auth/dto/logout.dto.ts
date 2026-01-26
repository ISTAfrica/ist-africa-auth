import { IsEnum } from 'class-validator';

export class LogoutDto {
  @IsEnum(['single', 'all'])
  type: 'single' | 'all';
}
