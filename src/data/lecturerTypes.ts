export type TaskStatus = 'todo' | 'in-progress' | 'ready-for-review' | 'approved';
export type TaskPriority = 'high' | 'medium' | 'low';
export type ReviewStatus = 'on-track' | 'at-risk' | 'overdue';

export interface LecturerTask {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  startDate?: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface TimelineMilestone {
  week: string;
  milestone: string;
  date: string;
  done: boolean;
}

export interface GroupComment {
  id: string;
  taskId?: string;
  author: string;
  role: 'lecturer' | 'student';
  text: string;
  time: string;
  taskRef?: string;
}

export interface LecturerGroup {
  id: string;
  name: string;
  className: string;
  progress: number;
  deadline: string;
  members: number;
  avatarInitials: string[];
  reviewStatus: ReviewStatus;
  description: string;
  tasks: LecturerTask[];
  timeline: TimelineMilestone[];
  comments: GroupComment[];
}
