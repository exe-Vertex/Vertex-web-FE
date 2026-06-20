import { Project, User } from '../types';

type LegacyProjectRecord = Omit<Project, 'memberIds'> & {
  memberIds?: string[];
  members?: User[];
};

const isProjectRecord = (value: unknown): value is LegacyProjectRecord => {
  return Boolean(value && typeof value === 'object');
};

export const normalizeProjectRecord = (project: LegacyProjectRecord): Project => {
  const memberIds = Array.isArray(project.memberIds)
    ? project.memberIds.filter((id): id is string => typeof id === 'string')
    : Array.isArray(project.members)
      ? project.members
          .map(member => member?.id)
          .filter((id): id is string => typeof id === 'string')
      : [];

  return {
    ...project,
    memberIds,
    members: project.members,
  };
};

export const normalizeProjects = (projects: unknown): Project[] => {
  if (!Array.isArray(projects)) return [];

  return projects
    .filter(isProjectRecord)
    .map(project => normalizeProjectRecord(project));
};

export const resolveProjectMembers = (project: Project, memberLookup: Map<string, User>): User[] => {
  const projectMembers = Array.isArray(project.members) ? project.members : [];
  if (projectMembers.length > 0) {
    return projectMembers.map(member => {
      const profile = memberLookup.get(member.id);
      return {
        ...profile,
        ...member,
        avatar: member.avatar || profile?.avatar || '',
        email: member.email || profile?.email,
      };
    });
  }

  return project.memberIds
    .map(memberId => memberLookup.get(memberId))
    .filter((member): member is User => Boolean(member));
};