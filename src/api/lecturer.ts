import { apiRequest } from './http';
import { getAccessToken } from '../utils/authStorage';
import type { LecturerGroup } from '../data/lecturerTypes';

function getHeaders() {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Map the backend LecturerGroupDto to frontend LecturerGroup model
export async function getGroups(): Promise<LecturerGroup[]> {
  const backendGroups = await apiRequest<any[]>('/api/lecturer/groups', {
    headers: getHeaders(),
  });

  return backendGroups.map(g => ({
    id: g.projectId,
    name: g.projectName,
    className: g.orgName || 'FPT University',
    progress: g.progress,
    deadline: g.deadline,
    members: g.memberCount,
    avatarInitials: g.memberInitials || [],
    reviewStatus: g.reviewStatus || 'on-track',
    description: g.projectDescription || '',
    tasks: (g.reviewTasks || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      assignee: t.assigneeName || 'Unassigned',
      startDate: t.startDate,
      deadline: t.endDate || g.deadline,
      priority: (t.priority || 'medium').toLowerCase(),
      status: t.status === 'done' ? 'approved' : t.status,
    })),
    timeline: [],
    comments: [],
  }));
}

// Get detailed group information
export async function getGroupDetail(projectId: string): Promise<LecturerGroup> {
  const d = await apiRequest<any>(`/api/lecturer/groups/${projectId}`, {
    headers: getHeaders(),
  });

  // Map the backend tasks
  const tasks = (d.tasks || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    assignee: t.assigneeName || 'Unassigned',
    startDate: t.startDate,
    deadline: t.endDate,
    priority: t.priority || 'medium',
    status: t.status === 'done' ? 'approved' : t.status,
  }));

  // Map the backend comments
  const comments = (d.comments || []).map((c: any) => ({
    id: c.id,
    taskId: c.taskId,
    author: c.authorName,
    role: c.role,
    text: c.content,
    time: new Date(c.createdAt).toLocaleDateString(),
  }));

  // Generate static milestones week-by-week as frontend expectations
  const timeline = [
    { week: 'Week 1', milestone: 'Research and sketch ideas', date: 'Feb 21', done: d.progress >= 20 },
    { week: 'Week 2', milestone: 'Design main layout and reviews', date: 'Feb 25', done: d.progress >= 50 },
    { week: 'Week 3', milestone: 'Final reviews and exporting files', date: d.deadline, done: d.progress >= 90 },
  ];

  return {
    id: d.projectId,
    name: d.projectName,
    className: d.orgName || 'FPT University',
    progress: d.progress,
    deadline: d.deadline,
    members: d.memberCount,
    avatarInitials: d.memberNames ? d.memberNames.map((n: string) => n.substring(0, 2)) : [],
    reviewStatus: d.reviewStatus || 'on-track',
    description: d.projectDescription || '',
    tasks,
    timeline,
    comments,
  };
}

// Approve task
export async function approveTask(taskId: string): Promise<void> {
  await apiRequest<void>(`/api/lecturer/tasks/${taskId}/approve`, {
    method: 'POST',
    headers: getHeaders(),
  });
}

// Request changes
export async function requestChanges(taskId: string): Promise<void> {
  await apiRequest<void>(`/api/lecturer/tasks/${taskId}/request-changes`, {
    method: 'POST',
    headers: getHeaders(),
  });
}

// Add comment
export async function addComment(taskId: string, content: string): Promise<void> {
  await apiRequest<void>(`/api/lecturer/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });
}

// Get notifications
export async function getNotifications(): Promise<any[]> {
  const backendNotifs = await apiRequest<any[]>('/api/lecturer/notifications', {
    headers: getHeaders(),
  });
  return backendNotifs.map(n => ({
    id: n.id,
    type: n.type || 'info',
    text: n.message,
    read: n.isRead,
    time: new Date(n.createdAt).toLocaleDateString(),
  }));
}

// Mark notification as read
export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest<void>(`/api/lecturer/notifications/${id}/read`, {
    method: 'PUT',
    headers: getHeaders(),
  });
}

// Mark all notifications as read
export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<void>(`/api/lecturer/notifications/read-all`, {
    method: 'PUT',
    headers: getHeaders(),
  });
}
