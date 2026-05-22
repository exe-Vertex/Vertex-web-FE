import { Project, Task, User, Role, Priority, Status } from '../types';
import { ProjectDetail, TaskDto, ProjectMemberDto } from '../api/project';

/**
 * Maps a ProjectMemberDto from the Backend API to a User interface used by the UI.
 */
export function mapMemberToUser(m: ProjectMemberDto): User {
  return {
    id: m.userId,
    name: m.name,
    avatar: m.avatarUrl || `https://i.pravatar.cc/150?u=${m.userId}`,
    email: m.email,
    role: m.role as Role,
  };
}

/**
 * Maps a TaskDto from the Backend API to a Task interface used by the UI.
 */
export function mapTaskDtoToTask(dto: TaskDto): Task {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description || undefined,
    status: (dto.status || 'todo') as Status,
    priority: (dto.priority || 'medium') as Priority,
    startDate: dto.startDate ? dto.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: dto.endDate ? dto.endDate.split('T')[0] : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    assignee: dto.assignee ? mapMemberToUser(dto.assignee) : undefined,
    attachmentCount: 0,
    commentCount: 0,
    subtasks: [],
  };
}

/**
 * Maps a ProjectDetail from the Backend API to a Project interface used by the UI.
 */
export function mapProjectDetailToProject(detail: ProjectDetail): Project {
  const members = detail.members ? detail.members.map(mapMemberToUser) : [];
  const tasks = detail.tasks ? detail.tasks.map(mapTaskDtoToTask) : [];
  
  return {
    id: detail.id,
    name: detail.name,
    description: detail.description || undefined,
    memberIds: detail.members ? detail.members.map((m) => m.userId) : [],
    members: members,
    deadline: detail.deadline ? detail.deadline.split('T')[0] : new Date().toISOString().split('T')[0],
    tasks: tasks,
    progress: typeof detail.progress === 'number' ? detail.progress : 0,
  };
}
