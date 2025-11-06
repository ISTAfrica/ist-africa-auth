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

export class CreateClientDto {
  @ApiProperty({ example: 'IST Academy', description: 'The unique name of the client application.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'Learning management system for IST Africa', description: 'A brief description of the client application.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'http://academy.ist.africa/callback', description: 'The secure HTTP callback URL for the OAuth2 flow.' })
  @IsUrl({ require_protocol: true, protocols: ['http'] })
  @Matches(/^http:\/\//, { message: 'Redirect URI must be HTTP' })
  redirect_uri: string;

  @ApiProperty({ example: ['https://academy.ist.africa', 'https://app.academy.ist.africa'], description: 'An array of allowed origins for CORS.' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUrl({ require_protocol: true }, { each: true })
  allowed_origins: string[];
}