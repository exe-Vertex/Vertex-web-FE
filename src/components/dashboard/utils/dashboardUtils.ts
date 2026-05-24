import { OrgPlan, Project, Task, Status } from '../../../types';
import { normalizeProjects } from '../../../data/projectCompatibility';
import { AppNotification, MemberWorkloadLabel, ProjectFileItem } from './dashboardTypes';
import { getAccessToken, getUserInfo } from '../../../utils/authStorage';

export const ACTIVE_ORG_KEY = 'vertex.activeOrgId';

// ── Auth / Org helpers ──
export const getAuthToken = (): string | null => getAccessToken();

export const getActiveOrgId = (): string | null =>
  localStorage.getItem(ACTIVE_ORG_KEY);

export const setActiveOrgId = (orgId: string): void =>
  localStorage.setItem(ACTIVE_ORG_KEY, orgId);

export const getStoredUserPlan = (): OrgPlan => {
  const rawPlan = localStorage.getItem('userPlan');
  if (rawPlan === 'free' || rawPlan === 'pro' || rawPlan === 'business' || rawPlan === 'enterprise') return rawPlan as OrgPlan;
  // Fallbacks for old values
  if (rawPlan === 'student_pro' || rawPlan === 'paid') return 'pro';
  if (rawPlan === 'lecturer') return 'business';
  return 'free';
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
