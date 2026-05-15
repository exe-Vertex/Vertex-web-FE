import { OrgPlan, Project, Task, Status } from '../../../types';
import { normalizeProjects } from '../../../data/projectCompatibility';
import { mockProjects } from '../../../data/mockData';
import { AppNotification, MemberWorkloadLabel, ProjectFileItem } from './dashboardTypes';

// ── Storage keys ──
export const PROJECTS_STORAGE_KEY = 'ppt_projects';
export const PROJECT_FILES_STORAGE_KEY = 'ppt_project_files';
export const SETTINGS_STORAGE_KEY = 'ppt_workspace_settings';
export const INVITE_INBOX_KEY = 'ppt_invite_inbox';

export const CURRENT_USER_EMAIL = 'minh@university.edu';
export const CURRENT_USER_ID = 'u1';

export const DEFAULT_WORKSPACES = [
  { id: 'ws-1', name: 'Design Studio Workspace' },
  { id: 'ws-2', name: 'Creative Hub' },
];

// ── Mock notifications ──
export const initialNotifications: AppNotification[] = [
  { id: '1', text: 'Task "Design Main Layout" is due tomorrow', time: '2 hours ago', read: false },
  { id: '2', text: 'Lan completed "Choose Color Palette"', time: '5 hours ago', read: false },
  { id: '3', text: 'New comment on "Sketch Ideas"', time: '1 day ago', read: true },
  { id: '4', text: 'Hung uploaded a storyboard draft', time: '2 days ago', read: true },
];

// ── Loaders ──
export const loadInviteInbox = (): Record<string, AppNotification[]> => {
  try {
    const raw = localStorage.getItem(INVITE_INBOX_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const createInviteNotification = (text: string): AppNotification => ({
  id: `invite_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  text,
  time: 'Just now',
  read: false,
});

export const loadDashboardNotifications = (): AppNotification[] => {
  const inbox = loadInviteInbox();
  const received = inbox[CURRENT_USER_EMAIL] || [];
  return [...received, ...initialNotifications];
};

export const getStoredUserPlan = (): OrgPlan => {
  const rawPlan = localStorage.getItem('userPlan');
  if (rawPlan === 'free' || rawPlan === 'pro' || rawPlan === 'business' || rawPlan === 'enterprise') return rawPlan as OrgPlan;
  // Fallbacks for old values
  if (rawPlan === 'student_pro' || rawPlan === 'paid') return 'pro';
  if (rawPlan === 'lecturer') return 'business';
  return 'free';
};

export const getWorkspaceName = (): string => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.workspaceName) return parsed.workspaceName as string;
    }
  } catch { /* ignore */ }
  return 'Design Studio Workspace';
};

export const loadProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const normalizedStoredProjects = normalizeProjects(parsed);
      if (normalizedStoredProjects.length > 0) return normalizedStoredProjects;
    }
  } catch { /* ignore parse errors */ }
  return normalizeProjects(mockProjects);
};

export const loadProjectFiles = (): Record<string, ProjectFileItem[]> => {
  try {
    const raw = localStorage.getItem(PROJECT_FILES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// ── Utilities ──
export const computeProgressFromTasks = (project: Project): number => {
  if (!project.tasks.length) return project.progress || 0;
  const weights: Record<Status, number> = {
    'todo': 0,
    'in-progress': 50,
    'ready-for-review': 80,
    'done': 100,
  };
  const total = project.tasks.reduce((sum, task) => sum + weights[task.status], 0);
  return Math.round(total / project.tasks.length);
};

export const TASK_SKILL_KEYWORDS: Record<string, string[]> = {
  UI: ['ui', 'layout', 'screen', 'wireframe', 'component'],
  Motion: ['motion', 'animation', 'transition', 'storyboard', 'video'],
  Research: ['research', 'survey', 'analysis', 'insight', 'discovery'],
  Writing: ['copy', 'content', 'writing', 'brief', 'documentation', 'report'],
  Engineering: ['build', 'develop', 'api', 'frontend', 'backend', 'integration', 'test'],
  Marketing: ['campaign', 'audience', 'brand', 'social', 'outreach'],
};

export const OPEN_TASK_WEIGHTS: Record<Status, number> = {
  todo: 1,
  'in-progress': 2,
  'ready-for-review': 1.5,
  done: 0,
};

export const inferTaskSkillTags = (task: Task): string[] => {
  const haystack = `${task.title} ${task.description || ''}`.toLowerCase();
  const matched = Object.entries(TASK_SKILL_KEYWORDS)
    .filter(([, keywords]) => keywords.some(keyword => haystack.includes(keyword)))
    .map(([skill]) => skill);

  return matched.length > 0 ? matched : ['Research'];
};

export const getWorkloadLabel = (utilization: number): MemberWorkloadLabel => {
  if (utilization >= 126) return 'overloaded';
  if (utilization <= 74) return 'underutilized';
  return 'balanced';
};
