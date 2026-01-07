import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches, 
} from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email should not be empty' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  @Matches(/[^A-Za-z0-9]/, { 
    message: 'Password must contain at least one special character',
  })
  @IsNotEmpty({ message: 'Password should not be empty' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;
}
