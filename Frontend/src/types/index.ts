export interface AuthenticateUserDto {
  email: string;
  password?: string;
}

export interface RegisterUserDto {
  name: string;
  email: string;
  password?: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface ResendOtpDto {
  email: string;
}

export interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  createdAt: string;
  avatarUrl?: string;
}