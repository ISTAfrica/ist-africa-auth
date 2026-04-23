import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsOptional,
  IsBoolean,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    example: 'IST Academy',
    description: 'The unique name of the client application.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 'Learning management system for IST Africa',
    description: 'A brief description of the client application.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'http://localhost:3001/callback',
    description: 'The secure HTTP callback URL for the OAuth2 flow.',
  })
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
    require_tld: false,
  })
  redirect_uri: string;

  @ApiProperty({
    example: ['http://localhost:3001'],
    description: 'An array of allowed origins for CORS.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUrl(
    {
      require_protocol: true,
      protocols: ['http', 'https'],
      require_tld: false,
    },
    { each: true },
  )
  allowed_origins: string[];

  @ApiProperty({
    example: false,
    description:
      'If true, users must be associated with at least one of the companies in company_ids to log in.',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requires_company?: boolean;

  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description:
      'Companies this client serves. Required when requires_company is true.',
    required: false,
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  company_ids?: string[];
}
