import { Status, WorkspaceMember } from '../../../types';

import { OrgPlan } from '../../../types';

export type AppNotification = { id: string; text: string; time: string; read: boolean };
export type InviteRole = 'Leader' | 'Member' | 'Guest';
export type ProjectTab = 'board' | 'ai-planner' | 'insights' | 'members' | 'files';
export type PlannerDifficulty = 'Easy' | 'Medium' | 'Hard';
export type PlannerCategory = 'Auto detect' | 'Design' | 'Software' | 'Research' | 'Marketing' | 'Business' | 'Other';

export type GeneratedPlanSubtask = {
  title: string;
  description: string;
  assignee: string;
  estHours: number;
  priority: 'High' | 'Medium' | 'Low';
};

export type GeneratedPlanStep = {
  week: string;
  milestone: string;
  subtasks: GeneratedPlanSubtask[];
};

export type GeneratedPlanResponse = {
  plan: GeneratedPlanStep[];
  risks: string[];
};

export interface ProjectLinkItem {
  id: string;
  url: string;
  title: string;
  uploadedBy: string;
  uploadedAt: string;
}

export type ProjectFileItem = {
  id: string;
  name: string;
  sizeLabel: string;
  uploadedAt: string;
  uploadedBy: string;
  mimeType?: string;
  objectUrl?: string;
};

export type MemberWorkloadLabel = 'balanced' | 'overloaded' | 'underutilized';

export type MemberAssignmentSuggestion = {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  confidence: number;
  reason: string;
};

export type MembersDatabaseRow = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: string;
  title: string;
  bio: string;
  availability: 'available' | 'busy' | 'away';
  skills: string[];
  projectIds: string[];
  projectNames: string[];
  completedTasks: number;
  inProgressTasks: number;
  history: WorkspaceMember['history'];
  skillScore: number;
  workloadUtilization: number;
  workloadLabel: MemberWorkloadLabel;
  suggestionCount: number;
  topSuggestion: MemberAssignmentSuggestion | null;
};

export type BaseMembersDatabaseRow = Omit<
  MembersDatabaseRow,
  'skillScore' | 'workloadUtilization' | 'workloadLabel' | 'suggestionCount' | 'topSuggestion'
>;

export type ProjectWithMembers = import('../../../types').Project & { members: import('../../../types').User[] };

