export type UserRole = 'user' | 'admin';

export interface DeviceInfo {
  browser?: string | null;
  os?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
}

export interface JwtTokenRequest {
  email: string;
  userId: string;
  role: UserRole;
  tokenVersion: number;
  name?: string | null;
  password?: string | null;
  auth_code?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  profilePicture?: string | null;
  deviceInfo?: DeviceInfo | null;
}

export interface JwtTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface JwtTokenIssuer {
  issueTokens(payload: JwtTokenRequest): Promise<JwtTokenResponse>;
}
