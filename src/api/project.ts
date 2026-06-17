import { apiRequest, API_BASE_URL } from './http';

// ── Types ───────────────────────────────────────────────

export interface ProjectMemberDto {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  projectSkills?: string | null;
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
  submissionLink?: string;
  createdAt: string;
}

export interface TaskAttachmentDto {
  id: string;
  taskId: string;
  type: string; // 'file' | 'link'
  url?: string;
  title?: string;
  size?: number;
  sizeLabel?: string;
  mimeType?: string;
  uploadedById?: string;
  uploadedBy: string;
  uploadedAt: string;
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

// ── Members ─────────────────────────────────────────────

/** List members of a project. */
export async function listProjectMembers(token: string, orgId: string, projectId: string) {
  return apiRequest<ProjectMemberDto[]>(`/api/orgs/${orgId}/projects/${projectId}/members`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

/** Add a member to a project. */
export async function addProjectMember(
  token: string,
  orgId: string,
  projectId: string,
  body: { emailOrUserId: string; role: string },
) {
  return apiRequest<ProjectMemberDto>(`/api/orgs/${orgId}/projects/${projectId}/members`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

/** Update a project member's role. */
export async function updateProjectMemberRole(
  token: string,
  orgId: string,
  projectId: string,
  memberId: string,
  body: { role: string; projectSkills?: string | null },
) {
  return apiRequest<ProjectMemberDto>(`/api/orgs/${orgId}/projects/${projectId}/members/${memberId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

/** Remove a member from a project. */
export async function removeProjectMember(
  token: string,
  orgId: string,
  projectId: string,
  memberId: string,
) {
  return apiRequest<void>(`/api/orgs/${orgId}/projects/${projectId}/members/${memberId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

/** List all files in a project. */
export async function listProjectFiles(
  token: string,
  orgId: string,
  projectId: string,
) {
  return apiRequest<any[]>(`/api/orgs/${orgId}/projects/${projectId}/files`, {
    headers: authHeaders(token),
  });
}

/** Upload files to a project. */
export async function uploadProjectFile(
  token: string,
  orgId: string,
  projectId: string,
  file: File,
  role: string = 'Member'
) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api/orgs/${orgId}/projects/${projectId}/files?role=${role}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  
  return res.json();
}

/** Delete a file from a project. */
export async function deleteProjectFile(
  token: string,
  orgId: string,
  projectId: string,
  fileId: string,
  role: string = 'Member'
) {
  return apiRequest<void>(`/api/orgs/${orgId}/projects/${projectId}/files/${fileId}?role=${role}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

// ── Links ─────────────────────────────────────────────

/** List all links in a project. */
export async function listProjectLinks(
  token: string,
  orgId: string,
  projectId: string,
) {
  return apiRequest<any[]>(`/api/orgs/${orgId}/projects/${projectId}/links`, {
    headers: authHeaders(token),
  });
}

/** Add a new link to a project. */
export async function addProjectLink(
  token: string,
  orgId: string,
  projectId: string,
  body: { url: string; title: string },
  role: string = 'Member'
) {
  return apiRequest<any>(`/api/orgs/${orgId}/projects/${projectId}/links?role=${role}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

/** Delete a link from a project. */
export async function deleteProjectLink(
  token: string,
  orgId: string,
  projectId: string,
  linkId: string,
  role: string = 'Member'
) {
  return apiRequest<void>(`/api/orgs/${orgId}/projects/${projectId}/links/${linkId}?role=${role}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

// ── Task Attachments ───────────────────────────────────────

export async function listTaskAttachments(token: string, orgId: string, projectId: string, taskId: string) {
  return apiRequest<TaskAttachmentDto[]>(`/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments`, {
    headers: authHeaders(token),
  });
}

export async function uploadTaskFile(
  token: string,
  orgId: string,
  projectId: string,
  taskId: string,
  file: File
) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments/file`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    let message = `Upload failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export async function addTaskLink(
  token: string,
  orgId: string,
  projectId: string,
  taskId: string,
  body: { url: string; title: string }
) {
  return apiRequest<TaskAttachmentDto>(`/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments/link`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

export async function deleteTaskAttachment(
  token: string,
  orgId: string,
  projectId: string,
  taskId: string,
  attachmentId: string,
  role: string = 'Member'
) {
  return apiRequest<void>(`/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}?role=${role}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function promoteTaskAttachment(
  token: string,
  orgId: string,
  projectId: string,
  taskId: string,
  attachmentId: string,
  role: string = 'Member'
) {
  return apiRequest<void>(`/api/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}/promote?role=${role}`, {
    method: 'POST',
    headers: authHeaders(token),
  });
}

