import type { AuthTokens, MeResponse } from '../api/auth';

const ACCESS_TOKEN_KEY = 'vertex.accessToken';
const REFRESH_TOKEN_KEY = 'vertex.refreshToken';
const USER_ROLE_KEY = 'vertex.userRole';
const USER_NAME_KEY = 'vertex.userName';

export function setTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setUserInfo(user: MeResponse) {
  localStorage.setItem(USER_ROLE_KEY, user.role);
  localStorage.setItem(USER_NAME_KEY, user.name);
}

export function getUserRole() {
  return localStorage.getItem(USER_ROLE_KEY);
}
