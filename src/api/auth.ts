import { apiRequest } from './http';

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function register(name: string, email: string, password: string) {
  return apiRequest<AuthTokens>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login(email: string, password: string) {
  return apiRequest<AuthTokens>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(accessToken: string) {
  return apiRequest<MeResponse>('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function refresh(refreshToken: string) {
  return apiRequest<AuthTokens>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logout(refreshToken: string) {
  return apiRequest<void>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}
