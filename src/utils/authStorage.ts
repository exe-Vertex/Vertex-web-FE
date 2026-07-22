import type { AuthTokens, MeResponse } from '../api/auth';

const ACCESS_TOKEN_KEY = 'vertex.accessToken';
const REFRESH_TOKEN_KEY = 'vertex.refreshToken';
const USER_INFO_KEY = 'vertex.userInfo';

export function setTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setUserInfo(user: MeResponse) {
  const previousUser = getUserInfo();
  if (previousUser && previousUser.id !== user.id) {
    localStorage.removeItem('vertex.activeOrgId');
    localStorage.removeItem('userPlan');
  }

  localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
}

export function getUserInfo(): MeResponse | null {
  const raw = localStorage.getItem(USER_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MeResponse;
  } catch {
    return null;
  }
}

export function getUserRole(): string | null {
  return getUserInfo()?.role ?? null;
}

export function clearAll() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem('vertex.activeOrgId');
  localStorage.removeItem('userPlan');
}

/** @deprecated Use clearAll() instead */
export function clearTokens() {
  clearAll();
}
