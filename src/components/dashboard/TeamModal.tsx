import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { X, UserPlus, Star, User as UserIcon, Link as LinkIcon, Copy, Share2, ChevronDown } from 'lucide-react';
import { SKILL_SUGGESTIONS, SKILL_CATEGORIES } from '../../data/skillSuggestions';
import { useLang } from '../../contexts/LanguageContext';
import { Avatar } from '../ui/Avatar';

const users: User[] = [];

interface TeamModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  members: User[];
  onAddMember: (user: User) => void;
  onRemoveMember: (userId: string) => void;
  onInvite: (payload: { email: string; role: TeamRole }) => void;
  onCreateInviteLink: () => Promise<string>;
  onUpdateMember?: (userId: string, role: TeamRole, skills: string | null) => Promise<void>;
}

type TeamRole = 'Leader' | 'Member' | 'Guest';

interface TeamMember extends User {
  teamRole: TeamRole;
}

const roleConfig: Record<TeamRole, { icon: React.ReactNode; color: string }> = {
  Leader: { icon: <Star size={12} />, color: 'text-[#EAB308] bg-[#EAB308]/10 border-[#EAB308]/20' },
  Member: { icon: <UserIcon size={12} />, color: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20' },
  Guest: { icon: <UserPlus size={12} />, color: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
};

const toTeamRole = (role?: string): TeamRole => {
  return role === 'Leader' || role === 'Guest' ? role : 'Member';
};


export const TeamModal: React.FC<TeamModalProps> = ({ open, onClose, projectId, projectName, members, onAddMember, onRemoveMember, onInvite, onCreateInviteLink, onUpdateMember }) => {
  const [projectMembers, setProjectMembers] = useState<TeamMember[]>([]);
  const [available, setAvailable] = useState<User[]>([]);
  const { lang } = useLang();
  const isVi = lang === 'vi';
  const roleLabels: Record<TeamRole, string> = {
    Leader: isVi ? 'Trưởng nhóm' : 'Leader',
    Member: isVi ? 'Thành viên' : 'Member',
    Guest: isVi ? 'Khách' : 'Guest',
  };

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('Member');
  const [copiedHint, setCopiedHint] = useState(false);
  const [joinLink, setJoinLink] = useState('');
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);
  const [inviteLinkError, setInviteLinkError] = useState('');
  const [editingSkillsFor, setEditingSkillsFor] = useState<string | null>(null);


  useEffect(() => {
    if (!open) return;
    setProjectMembers(members.map(member => ({
      ...member,
      teamRole: toTeamRole(member.role),
    })));

    const memberIds = new Set(members.map(member => member.id));
    setAvailable(users.filter(u => !memberIds.has(u.id)));
    setInviteEmail('');
    setInviteRole('Member');
    setCopiedHint(false);
  }, [open, members, projectId]);
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setJoinLink('');
    setInviteLinkError('');
    setInviteLinkLoading(true);

    onCreateInviteLink()
      .then(link => {
        if (!cancelled) setJoinLink(link);
      })
      .catch(error => {
        if (!cancelled) {
          setInviteLinkError(error instanceof Error ? error.message : 'Could not create the invitation link.');
        }
      })
      .finally(() => {
        if (!cancelled) setInviteLinkLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const save = (next: TeamMember[]) => {
    setProjectMembers(next);
  };

  const handleRemove = (id: string) => {
    const next = projectMembers.filter(m => m.id !== id);
    save(next);
    const removedUser = projectMembers.find(member => member.id === id);
    if (removedUser) onRemoveMember(id);
    setAvailable(users.filter(u => !next.find(m => m.id === u.id)));
  };

  const handleAdd = (user: User, role: TeamRole) => {
    const next = [...projectMembers, { ...user, teamRole: role }];
    save(next);
    onAddMember(user);
    setAvailable(users.filter(u => !next.find(n => n.id === u.id)));
  };

  const handleInviteEmail = () => {
    const email = inviteEmail.trim().toLowerCase();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) return;

    const existingUser = users.find(u => (u.email || '').toLowerCase() === email);
    if (existingUser && !projectMembers.some(member => member.id === existingUser.id)) {
      handleAdd(existingUser, inviteRole);
    }

    onInvite({ email, role: inviteRole });
    setInviteEmail('');
  };

  const copyValue = async (value: string, markCopied = false) => {
    try {
      await navigator.clipboard.writeText(value);
      if (markCopied) {
        setCopiedHint(true);
        window.setTimeout(() => setCopiedHint(false), 1800);
      }
    } catch {
      // Ignore clipboard errors in unsupported browsers.
    }
  };

  const handleShare = async () => {
    if (!joinLink) return;
    const shareText = `Join project ${projectName}: ${joinLink}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: isVi ? `Tham gia ${projectName}` : `Join ${projectName}`, text: shareText, url: joinLink });
        return;
      }
      await copyValue(shareText, true);
    } catch {
      // Ignore share cancellation.
    }
  };

  const changeRole = async (id: string, r: TeamRole) => {
    const current = projectMembers.find(m => m.id === id);
    if (!current || current.teamRole === 'Leader' || r === 'Leader') return;

    const next = projectMembers.map(m => m.id === id ? { ...m, teamRole: r } : m);
    save(next);
    if (onUpdateMember) {
      const target = next.find(m => m.id === id);
      await onUpdateMember(id, r, target?.projectSkills || null);
    }
  };

  const handleSkillsChange = (id: string, val: string) => {
    setProjectMembers(prev => prev.map(m => m.id === id ? { ...m, projectSkills: val } : m));
  };

  const saveProjectSkills = async (id: string, val: string) => {
    const member = projectMembers.find(m => m.id === id);
    if (!member) return;
    if (onUpdateMember) {
      await onUpdateMember(id, member.teamRole, val || null);
    }
  };

  const toggleProjectSkill = (id: string, current: string | null, skill: string) => {
    const list = (current || '').split(',').map(s => s.trim()).filter(Boolean);
    const lowerSkill = skill.toLowerCase();
    let nextList;
    if (list.some(s => s.toLowerCase() === lowerSkill)) {
      nextList = list.filter(s => s.toLowerCase() !== lowerSkill);
    } else {
      nextList = [...list, skill];
    }
    const val = nextList.join(', ');
    handleSkillsChange(id, val);
    saveProjectSkills(id, val);
  };

  const handleSkillsSave = async (id: string) => {
    const member = projectMembers.find(m => m.id === id);
    if (!member) return;
    save(projectMembers);
    if (onUpdateMember) {
      await onUpdateMember(id, member.teamRole, member.projectSkills || null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0F1A2A]/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 w-[560px] max-w-full mx-4 overflow-hidden border border-[#22C55E]/10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#22C55E]/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-white">{isVi ? 'Mời thành viên' : 'Invite members'}</h3>
            <p className="text-sm text-slate-400 mt-0.5">{projectName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{projectMembers.length} {isVi ? 'thành viên' : 'members'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#162032] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Invite section */}
        <div className="px-6 py-4 border-b border-[#22C55E]/5 bg-[#162032]/30 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Invite link</p>
            <div className="rounded-xl border border-[#22C55E]/15 bg-[#0A0F1A] p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${inviteLinkError ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-[#22C55E]/20 bg-[#22C55E]/10 text-[#6EE7B7]'}`}>
                    <LinkIcon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${inviteLinkError ? 'text-red-400' : 'text-slate-200'}`}>
                      {inviteLinkLoading ? 'Creating invitation link...' : inviteLinkError || 'Invitation link ready'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Anyone with the link joins as a Member. Expires after 7 days.</p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2 sm:justify-end">
                  <button
                    onClick={() => copyValue(joinLink, true)}
                    disabled={!joinLink || inviteLinkLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#22C55E]/20 text-xs font-semibold text-[#6EE7B7] hover:bg-[#162032] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Copy size={12} />
                    Copy link
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!joinLink || inviteLinkLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#22C55E]/20 text-xs font-semibold text-[#6EE7B7] hover:bg-[#162032] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Share2 size={12} />
                    {isVi ? 'Chia sẻ' : 'Share'}
                  </button>
                </div>
              </div>
              {copiedHint && (
                <div className="mt-2 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-1.5">
                  <p className="text-[11px] text-[#6EE7B7] font-medium">{isVi ? 'Đã sao chép! Hãy chia sẻ với nhóm' : 'Copied! Share it with your team'}</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-[10px] uppercase tracking-widest text-slate-600">{isVi ? 'hoặc' : 'or'}</div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_6.75rem]">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">{isVi ? 'Mời bằng email' : 'Invite by email'}</p>
              <div className="relative">
                <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="lan@student.edu"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0A0F1A] border border-[#22C55E]/10 text-sm text-white outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">{isVi ? 'Vai trò' : 'Role'}</p>
              <div className="relative">
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as TeamRole)}
                  className="h-10 w-full appearance-none rounded-lg border border-[#22C55E]/10 bg-[#0A0F1A] py-2 pl-3 pr-9 text-sm text-white outline-none transition-colors focus:border-[#22C55E]"
                >
                  <option value="Member">{roleLabels.Member}</option>
                  <option value="Guest">{roleLabels.Guest}</option>
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleInviteEmail}
                disabled={!inviteEmail.trim()}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#22C55E] text-white text-sm font-medium hover:bg-[#16A34A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <UserPlus size={14} />
                {isVi ? 'Gửi lời mời' : 'Invite'}
              </button>
            </div>
          </div>
        </div>

        {/* Members list */}
        <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2">
          {projectMembers.map(m => {
            const rc = roleConfig[m.teamRole];
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#162032]/60 border border-[#22C55E]/5 hover:border-[#22C55E]/15 transition-colors group">
                <div className="relative flex-shrink-0">
                  <Avatar src={m.avatar} fallback={m.name.charAt(0) || '?'} size="md" className="border-2 border-[#22C55E]/20" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#162032]"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{m.name}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${rc.color}`}>
                      {rc.icon}
                      {roleLabels[m.teamRole]}
                    </span>
                  </div>
                  <label className="mt-1 block text-[10px] uppercase tracking-wide text-slate-500">{isVi ? 'Kỹ năng trong dự án' : 'Project skills'}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={m.projectSkills || ''}
                      placeholder={isVi ? 'Ví dụ: Thiết kế UI, React, Backend' : 'Example: UI Design, React, Backend'}
                      onChange={e => handleSkillsChange(m.id, e.target.value)}
                      onBlur={() => handleSkillsSave(m.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="flex-1 w-full px-2 py-1 rounded bg-[#0A0F1A]/60 border border-[#22C55E]/10 text-[11px] text-slate-300 outline-none focus:border-[#22C55E]/40 placeholder:text-slate-600 transition-colors"
                    />
                    <button
                      onClick={() => setEditingSkillsFor(editingSkillsFor === m.id ? null : m.id)}
                      className={`shrink-0 px-3 py-1 rounded border text-[11px] font-medium transition-colors ${
                        editingSkillsFor === m.id
                          ? 'bg-[#22C55E]/20 border-[#22C55E]/40 text-[#6EE7B7]'
                          : 'bg-[#162032] border-[#22C55E]/10 text-slate-300 hover:text-white hover:border-[#22C55E]/30'
                      }`}
                    >
                      {editingSkillsFor === m.id ? (isVi ? 'Xong' : 'Done') : (isVi ? 'Chọn' : 'Select')}
                    </button>
                  </div>

                  {editingSkillsFor === m.id && (
                    <div className="mt-2 space-y-4 max-h-48 overflow-y-auto pr-1 custom-scrollbar bg-[#0A0F1A]/80 border border-[#22C55E]/10 rounded-lg p-3">
                      {[...SKILL_CATEGORIES, 'General'].map(category => (
                        <div key={category} className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{category}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(SKILL_SUGGESTIONS[category] || []).map(skill => {
                              const currentList = (m.projectSkills || '').split(',').map(s => s.trim().toLowerCase());
                              const added = currentList.includes(skill.toLowerCase());
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => toggleProjectSkill(m.id, m.projectSkills || null, skill)}
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium border transition-all ${
                                    added
                                      ? 'border-[#22C55E]/40 bg-[#22C55E]/15 text-[#6EE7B7]'
                                      : 'border-[#22C55E]/10 bg-[#162032] text-slate-400 hover:border-[#22C55E]/30 hover:bg-[#22C55E]/10 hover:text-[#6EE7B7]'
                                  }`}
                                >
                                  {added ? `✓ ${skill}` : `+ ${skill}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {m.teamRole === 'Leader' ? (
                    <span className="px-2 py-1 rounded-lg text-xs bg-[#0A0F1A] border border-[#EAB308]/20 text-[#EAB308]">
                      {isVi ? 'Người tạo dự án' : 'Project creator'}
                    </span>
                  ) : (
                    <select
                      value={m.teamRole}
                      onChange={e => changeRole(m.id, e.target.value as TeamRole)}
                      className="px-2 py-1 rounded-lg text-xs bg-[#0A0F1A] border border-[#22C55E]/10 text-slate-300 outline-none focus:border-[#22C55E]"
                    >
                      <option value="Member">{roleLabels.Member}</option>
                      <option value="Guest">{roleLabels.Guest}</option>
                    </select>
                  )}
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1"
                  >
                    {isVi ? 'Xóa' : 'Remove'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
