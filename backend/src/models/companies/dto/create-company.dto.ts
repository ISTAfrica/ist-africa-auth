import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'IST Academy',
    description: 'The display name of the company.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'ist-academy',
    description:
      'URL-friendly slug. Lowercase letters, numbers and hyphens only. Auto-generated from name if omitted.',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must be lowercase letters, numbers and hyphens (e.g. "ist-academy")',
  })
  slug?: string;

  @ApiProperty({
    example: 'Learning arm of IST Africa',
    description: 'Optional description.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
