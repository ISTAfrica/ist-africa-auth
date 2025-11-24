export type UserRole = 'user' | 'admin';

export interface JwtTokenRequest {
  email: string;
  userId: number;
  role: UserRole;
  name?: string | null;
  password?: string | null;
  auth_code?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
}

export interface JwtTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface JwtTokenIssuer {
  issueTokens(payload: JwtTokenRequest): Promise<JwtTokenResponse>;
}


