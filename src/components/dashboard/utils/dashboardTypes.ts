import { Status, WorkspaceMember } from '../../../types';

export type AppNotification = { id: string; text: string; time: string; read: boolean };
export type InviteRole = 'Leader' | 'Member' | 'Guest';

export type DashboardUserPlan = 'free' | 'student_pro' | 'lecturer';
export type ProjectTab = 'board' | 'ai-planner' | 'insights' | 'members' | 'files';
export type PlannerDifficulty = 'Easy' | 'Medium' | 'Hard';
export type PlannerCategory = 'Design' | 'Research' | 'Engineering' | 'Marketing';

export type GeneratedPlanStep = {
  week: string;
  task: string;
  assignee: string;
  estHours: number;
  taskCount: number;
};

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

export type ProjectWithMembers = import('../../../types').Project & { members: import('../../../types').User[] };
