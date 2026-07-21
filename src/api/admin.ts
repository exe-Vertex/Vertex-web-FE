import { apiRequest } from './http';
import { getAuthToken } from '../components/dashboard/utils/dashboardUtils';

// ── Types ────────────────────────────────────────────────

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'active' | 'banned';
  plan: string;
  createdAt: string;
  aiQuota: number;
  aiUsed: number;
}

export interface AdminUserListResult {
  users: AdminUserDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AuditLogDto {
  id: string;
  admin: string;
  action: string;
  target?: string;
  detail: string;
  timestamp: string;
}

export interface AuditLogListResult {
  logs: AuditLogDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ── API Functions ────────────────────────────────────────

export interface AdminAiUsageDto {
  id: string;
  userId: string;
  userName: string;
  prompt: string;
  planSummary: string;
  createdAt: string;
  usageUnits: number;
}

export interface AdminAiUsageListResult {
  entries: AdminAiUsageDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}
const authHeaders = () => ({
  Authorization: `Bearer ${getAuthToken()}`,
});

/** Get paginated list of all users. */
export const getAdminUsers = async (
  search?: string,
  status?: string,
  page = 1,
  pageSize = 50,
): Promise<AdminUserListResult> => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  return await apiRequest<AdminUserListResult>(
    `/api/admin/users?${params.toString()}`,
    { method: 'GET', headers: authHeaders() },
  );
};

/** Ban or unban a user. */
export const updateUserStatus = async (
  userId: string,
  status: 'active' | 'banned',
): Promise<AdminUserDto> => {
  return await apiRequest<AdminUserDto>(
    `/api/admin/users/${userId}/status`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    },
  );
};

/** Update a user's AI quota. */
export const updateUserQuota = async (
  userId: string,
  aiQuota: number,
): Promise<AdminUserDto> => {
  return await apiRequest<AdminUserDto>(
    `/api/admin/users/${userId}/quota`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ aiQuota }),
    },
  );
};

/** Get paginated audit logs. */
export const getAuditLogs = async (
  page = 1,
  pageSize = 50,
): Promise<AuditLogListResult> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  return await apiRequest<AuditLogListResult>(
    `/api/admin/audit-logs?${params.toString()}`,
    { method: 'GET', headers: authHeaders() },
  );
};
/** Get real successful AI usage history. */
export const getAdminAiUsage = async (
  page = 1,
  pageSize = 500,
): Promise<AdminAiUsageListResult> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  return await apiRequest<AdminAiUsageListResult>(
    '/api/admin/ai-usage?' + params.toString(),
    { method: 'GET', headers: authHeaders() },
  );
};
