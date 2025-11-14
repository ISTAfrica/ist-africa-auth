import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiProperty({
    example: 'IST Academy',
    description: 'The unique name of the client application.',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @IsOptional()
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
    example: 'http://academy.ist.africa/callback',
    description: 'The secure HTTP callback URL for the OAuth2 flow.',
    required: false,
  })
  @IsUrl({ require_protocol: true, protocols: ['http'] })
  @Matches(/^http:\/\//, { message: 'Redirect URI must be HTTP' })
  @IsOptional()
  redirect_uri?: string;

  @ApiProperty({
    example: ['https://academy.ist.africa', 'https://app.academy.ist.africa'],
    description: 'An array of allowed origins for CORS.',
    required: false,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUrl({ require_protocol: true }, { each: true })
  @IsOptional()
  allowed_origins?: string[];
}
