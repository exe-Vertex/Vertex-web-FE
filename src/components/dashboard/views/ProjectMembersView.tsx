import React from 'react';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { ProjectWithMembers } from '../utils/dashboardTypes';

export const ProjectMembersView: React.FC<{
  project: ProjectWithMembers;
  onManageMembers: () => void;
}> = ({ project, onManageMembers }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Project Members</h2>
            <p className="text-sm text-slate-500 mt-1">Manage team roles and invitations.</p>
          </div>
          <Button size="sm" onClick={onManageMembers}>Manage Members</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {project.members.map((member, index) => (
            <div key={member.id} className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl p-4 flex items-center gap-3">
              <Avatar src={member.avatar} fallback={member.name.charAt(0)} size="sm" className="w-10 h-10" />
              <div>
                <p className="text-sm font-semibold text-white">{member.name}</p>
                <p className="text-xs text-slate-500">{index === 0 ? 'Leader' : 'Member'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
