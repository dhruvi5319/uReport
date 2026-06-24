export interface AuthUser {
  personId: number;
  role: 'staff' | 'public' | 'anonymous';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: string;
  personId: number;
}
