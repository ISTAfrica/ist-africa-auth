// src/models/auth/types/jwt-payload.type.ts

export interface JwtPayload {
  id: string;
  user_type?: string; // optional, based on your AuthService payload
  iat?: number; // issued at (optional)
  exp?: number; // expiration (optional)
  sub?: string; // JWT subject (optional)
}
