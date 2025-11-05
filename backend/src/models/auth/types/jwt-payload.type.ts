// src/models/auth/types/jwt-payload.type.ts

export interface JwtPayload {
  id: number; // or string, depending on your Prisma model
  user_type?: string; // optional, based on your AuthService payload
  iat?: number; // issued at (optional)
  exp?: number; // expiration (optional)
  sub?: string; // JWT subject (optional)
}
