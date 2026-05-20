import { apiRequest } from './http';

// ── Types ───────────────────────────────────────────────

export interface ProjectMemberDto {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: ProjectMemberDto | null;
  startDate: string;
  endDate: string;
  position: number;
  createdAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  deadline: string;
  taskCount: number;
  memberCount: number;
  progress: number;
  createdAt: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description?: string;
  deadline: string;
  progress: number;
  createdAt: string;
  tasks: TaskDto[];
  members: ProjectMemberDto[];
}

// ── Helpers ─────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// ── API Functions ───────────────────────────────────────

/** List all projects in an organization. */
export async function listProjects(token: string, orgId: string) {
  return apiRequest<ProjectSummary[]>(`/api/orgs/${orgId}/projects`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

/** Get full project details (tasks + members). */
export async function getProjectDetail(token: string, orgId: string, projectId: string) {
  return apiRequest<ProjectDetail>(`/api/orgs/${orgId}/projects/${projectId}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

/** Create a new project. */
export async function createProject(
  token: string,
  orgId: string,
  body: { name: string; description?: string; deadline: string },
) {
  return apiRequest<ProjectSummary>(`/api/orgs/${orgId}/projects`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

/** Update a project. */
export async function updateProject(
  token: string,
  orgId: string,
  projectId: string,
  body: { name?: string; description?: string; deadline?: string },
) {
  return apiRequest<void>(`/api/orgs/${orgId}/projects/${projectId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

/** Delete a project. */
export async function deleteProject(token: string, orgId: string, projectId: string) {
  return apiRequest<void>(`/api/orgs/${orgId}/projects/${projectId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

/** Create a task in a project. */
export async function createTask(
  token: string,
  orgId: string,
  projectId: string,
  body: {
    title: string;
    description?: string;
    status: string;
    priority: string;
    assigneeId?: string | null;
    startDate: string;
    endDate: string;
  },
) {
  return apiRequest<TaskDto>(`/api/orgs/${orgId}/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

/** Update a task. */
export async function updateTask(
  token: string,
  orgId: string,
  projectId: string,
  taskId: string,
  body: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    startDate?: string;
    endDate?: string;
    position?: number;
  },
) {
  return apiRequest<TaskDto>(`/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

/** Delete a task. */
export async function deleteTask(token: string, orgId: string, projectId: string, taskId: string) {
  return apiRequest<void>(`/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
