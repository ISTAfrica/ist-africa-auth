import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsOptional,
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
}
