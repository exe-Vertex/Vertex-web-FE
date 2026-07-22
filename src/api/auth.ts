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
  avatarUrl?: string;
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

export interface AuthMessageResponse {
  message: string;
}

export async function forgotPassword(email: string) {
  return apiRequest<AuthMessageResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return apiRequest<AuthMessageResponse>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
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

export async function getUserSkills(accessToken: string) {
  return apiRequest<string[]>('/api/auth/skills', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateUserSkills(accessToken: string, skills: string[]) {
  return apiRequest<{ message: string }>('/api/auth/skills', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skills),
  });
}

export async function externalLogin(provider: string, token: string) {
  return apiRequest<AuthTokens>('/api/auth/external-login', {
    method: 'POST',
    body: JSON.stringify({ provider, token }),
  });
}
