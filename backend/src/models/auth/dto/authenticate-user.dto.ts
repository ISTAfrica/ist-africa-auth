import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';

export class AuthenticateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  client_id?: string;

  @IsUrl({require_tld: false}, { message: 'Redirect URI must be a valid URL' }) 
  @IsOptional()
  redirect_uri?: string;

  @IsString()
  @IsOptional()
  state?: string;
}