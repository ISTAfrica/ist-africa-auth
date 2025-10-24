export interface AuthenticateUserDto {
  email: string;
  password?: string;
}

export interface RegisterUserDto {
  name: string;
  email: string;
  password?: string;
}