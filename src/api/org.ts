import { apiRequest } from './http';

// ── Types (match backend response models) ──────────────

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  joinedAt: string;
}

export interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  maxMembers: number;
  aiQuota: number;
  storageLimit: number;
  createdAt: string;
  members: OrgMember[];
}

// ── Helpers ─────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// ── API Functions ───────────────────────────────────────

/** Create a new organization. The caller becomes the owner. */
export async function createOrg(
  token: string,
  body: { name: string; slug: string },
) {
  return apiRequest<OrgSummary>('/api/orgs', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

/** List organizations the current user belongs to. */
export async function listMyOrgs(token: string) {
  return apiRequest<OrgSummary[]>('/api/orgs', {
    method: 'GET',
    headers: authHeaders(token),
  });
}

/** Get full organization details including members. */
export async function getOrgDetail(token: string, orgId: string) {
  return apiRequest<OrgDetail>(`/api/orgs/${orgId}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

/** Invite a registered user to the organization by email. */
export async function inviteMember(
  token: string,
  orgId: string,
  body: { email: string; role: string },
) {
  return apiRequest<OrgMember>(`/api/orgs/${orgId}/members`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

/** Update a member's role (admin, lecturer, member). */
export async function updateMemberRole(
  token: string,
  orgId: string,
  memberId: string,
  body: { role: string },
) {
  return apiRequest<void>(`/api/orgs/${orgId}/members/${memberId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

/** Remove a member from the organization. */
export async function removeMember(
  token: string,
  orgId: string,
  memberId: string,
) {
  return apiRequest<void>(`/api/orgs/${orgId}/members/${memberId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
