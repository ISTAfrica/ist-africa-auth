import {
  IsString,
  IsUrl,
  IsArray,
  ArrayUnique,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiProperty({
    example: 'IST Academy',
    description: 'The unique name of the client application.',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  name?: string;

  @ApiProperty({
    example: 'Learning management system for IST Africa',
    description: 'A brief description of the client application.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'http://localhost:3001/callback',
    description: 'The secure HTTP callback URL for the OAuth2 flow.',
    required: false,
  })
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
    require_tld: false,
  })
  @IsOptional()
  redirect_uri?: string;

  @ApiProperty({
    example: ['http://localhost:3001'],
    description: 'An array of allowed origins for CORS.',
    required: false,
  })
  @IsArray()
  @ArrayUnique()
  @IsUrl(
    {
      require_protocol: true,
      protocols: ['http', 'https'],
      require_tld: false,
    },
    { each: true },
  )
  @IsOptional()
  allowed_origins?: string[];
}
