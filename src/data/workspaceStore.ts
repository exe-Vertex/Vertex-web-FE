import { WorkspaceMember, User } from '../types';

export const workspaceMemberToUser = (member: WorkspaceMember): User => ({
  id: member.id,
  name: member.profile.name,
  avatar: member.profile.avatar,
  email: member.profile.email,
  role: member.profile.role,
});
