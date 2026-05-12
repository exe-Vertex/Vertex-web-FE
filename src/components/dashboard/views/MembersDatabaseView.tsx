import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import { MembersDatabaseRow } from '../utils/dashboardTypes';

export const MembersDatabaseView: React.FC<{
  members: MembersDatabaseRow[];
  searchQuery: string;
  onClearSearch: () => void;
  onOpenProject: (projectId: string) => void;
}> = ({ members, searchQuery, onClearSearch, onOpenProject }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;

    return members.filter(member => (
      member.name.toLowerCase().includes(q)
      || member.email.toLowerCase().includes(q)
      || member.title.toLowerCase().includes(q)
      || member.skills.some(skill => skill.toLowerCase().includes(q))
    ));
  }, [members, searchQuery]);

  useEffect(() => {
    if (!selectedMemberId && filteredMembers.length > 0) {
      setSelectedMemberId(filteredMembers[0].id);
      return;
    }
    if (selectedMemberId && !filteredMembers.some(member => member.id === selectedMemberId)) {
      setSelectedMemberId(filteredMembers[0]?.id || null);
    }
  }, [filteredMembers, selectedMemberId]);

  const selectedMember = filteredMembers.find(member => member.id === selectedMemberId) || null;

  useEffect(() => {
    if (!selectedMember) {
      setIsDrawerOpen(false);
    }
  }, [selectedMember]);

  const availabilityStyle: Record<MembersDatabaseRow['availability'], string> = {
    available: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    busy: 'text-amber-200 bg-amber-500/10 border-amber-500/25',
    away: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <div className="flex-1 bg-[#0A0F1A] p-6 overflow-hidden relative">
      <div className="h-full max-w-7xl mx-auto">
        <section className="min-h-0 rounded-2xl border border-[#22C55E]/12 bg-[#0F1A2A] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#22C55E]/12 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Members Database</h2>
              <p className="text-xs text-slate-500 mt-1">Read-only member directory powered by profile skills, task history, and AI workload analysis.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-1 rounded-md border border-[#22C55E]/20 bg-[#22C55E]/10 text-[#6EE7B7]">
                {filteredMembers.length} shown
              </span>
              {searchQuery.trim() && (
                <button
                  onClick={onClearSearch}
                  className="px-2 py-1 rounded-md border border-[#22C55E]/12 hover:border-[#22C55E]/25 hover:bg-[#162032] transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#0F1A2A] border-b border-[#22C55E]/12 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Member</th>
                  <th className="text-left font-semibold px-4 py-3">Role</th>
                  <th className="text-left font-semibold px-4 py-3">Skills</th>
                  <th className="text-left font-semibold px-4 py-3">Availability</th>
                  <th className="text-left font-semibold px-4 py-3">Skill score</th>
                  <th className="text-left font-semibold px-4 py-3">Workload</th>
                  <th className="text-left font-semibold px-4 py-3">Projects</th>
                  <th className="text-left font-semibold px-4 py-3">Done</th>
                  <th className="text-left font-semibold px-4 py-3">In progress</th>
                  <th className="text-left font-semibold px-4 py-3">Suggestions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">No members match your search.</td>
                  </tr>
                ) : filteredMembers.map(member => {
                  const isActive = selectedMemberId === member.id;
                  return (
                    <tr
                      key={member.id}
                      onClick={() => {
                        setSelectedMemberId(member.id);
                        setIsDrawerOpen(true);
                      }}
                      className={`border-b border-[#22C55E]/8 cursor-pointer transition-colors ${isActive ? 'bg-[#22C55E]/8' : 'hover:bg-[#162032]/80'}`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={member.avatar} fallback={member.name.charAt(0)} size="sm" className="w-9 h-9" />
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{member.name}</p>
                            <p className="text-xs text-slate-500 truncate">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{member.title}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex max-w-[220px] flex-wrap gap-1.5">
                          {member.skills.length === 0 ? (
                            <span className="text-xs text-slate-500">No skills</span>
                          ) : (
                            <>
                              {member.skills.slice(0, 2).map(skill => (
                                <span key={skill} className="rounded-full border border-[#22C55E]/16 bg-[#162032] px-2 py-1 text-[11px] text-slate-300">
                                  {skill}
                                </span>
                              ))}
                              {member.skills.length > 2 && (
                                <span className="rounded-full border border-[#22C55E]/12 bg-[#0F1A2A] px-2 py-1 text-[11px] text-slate-500">
                                  +{member.skills.length - 2}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold capitalize ${availabilityStyle[member.availability]}`}>
                          {member.availability}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                            <span className="font-semibold text-[#6EE7B7]">{member.skillScore}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#162032] overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#60A5FA]" style={{ width: `${member.skillScore}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${
                            member.workloadLabel === 'overloaded'
                              ? 'text-red-200 bg-red-500/10 border-red-500/20'
                              : member.workloadLabel === 'underutilized'
                                ? 'text-sky-200 bg-sky-500/10 border-sky-500/20'
                                : 'text-emerald-200 bg-emerald-500/10 border-emerald-500/20'
                          }`}>
                            {member.workloadLabel}
                          </span>
                          <p className="text-[11px] text-slate-500">{member.workloadUtilization}% load</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{member.projectNames.length}</td>
                      <td className="px-4 py-3.5 text-emerald-300 font-semibold">{member.completedTasks}</td>
                      <td className="px-4 py-3.5 text-amber-200 font-semibold">{member.inProgressTasks}</td>
                      <td className="px-4 py-3.5 text-slate-300">{member.suggestionCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isDrawerOpen && selectedMember && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 z-30 bg-black/45"
            />

            <motion.aside
              key={selectedMember.id}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-0 z-40 h-full w-full sm:w-[440px] border-l border-[#22C55E]/12 bg-[#0F1A2A] overflow-hidden"
            >
              <div className="p-5 border-b border-[#22C55E]/12 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Member Profile</p>
                  <div className="mt-4 flex items-center gap-3">
                    <Avatar src={selectedMember.avatar} fallback={selectedMember.name.charAt(0)} size="sm" className="w-12 h-12" />
                    <div>
                      <h3 className="text-white font-bold">{selectedMember.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedMember.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedMember.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="primary" size="sm">{selectedMember.role}</Badge>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${availabilityStyle[selectedMember.availability]}`}>
                      {selectedMember.availability}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-[#162032] transition-colors"
                  aria-label="Close member profile"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-5 h-[calc(100%-7.5rem)] overflow-y-auto">
                <section>
                  <h4 className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">Focus</h4>
                  <p className="text-sm text-slate-200">{selectedMember.title}</p>
                  {selectedMember.bio && (
                    <p className="mt-2 text-sm leading-6 text-slate-400">{selectedMember.bio}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMember.skills.length === 0 ? (
                      <span className="text-xs text-slate-500">No skills tagged yet.</span>
                    ) : selectedMember.skills.map(skill => (
                      <span key={skill} className="px-2 py-1 text-[11px] rounded-md border border-[#22C55E]/15 bg-[#162032] text-slate-300">{skill}</span>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">Workload Snapshot</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-[#22C55E]/10 bg-[#162032]/60 px-3 py-2">
                      <p className="text-[11px] text-slate-500">Completed</p>
                      <p className="text-base font-bold text-emerald-300">{selectedMember.completedTasks}</p>
                    </div>
                    <div className="rounded-lg border border-[#22C55E]/10 bg-[#162032]/60 px-3 py-2">
                      <p className="text-[11px] text-slate-500">In progress</p>
                      <p className="text-base font-bold text-amber-200">{selectedMember.inProgressTasks}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-[#22C55E]/10 bg-[#162032]/60 px-3 py-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>AI skill score</span>
                      <span className="font-semibold text-[#6EE7B7]">{selectedMember.skillScore}%</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[#0F1A2A] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#60A5FA]" style={{ width: `${selectedMember.skillScore}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Workload balance: <span className="capitalize text-slate-300">{selectedMember.workloadLabel}</span> ({selectedMember.workloadUtilization}% of team average)
                    </p>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">AI Assignment Suggestion</h4>
                  {selectedMember.topSuggestion ? (
                    <div className="rounded-lg border border-[#22C55E]/14 bg-[#162032]/65 px-3 py-2.5 space-y-1.5">
                      <p className="text-sm text-slate-100 font-semibold">{selectedMember.topSuggestion.taskTitle}</p>
                      <p className="text-[11px] text-slate-500">{selectedMember.topSuggestion.projectName}</p>
                      <p className="text-xs text-slate-300">{selectedMember.topSuggestion.reason}</p>
                      <p className="text-[11px] text-[#6EE7B7] font-semibold">Confidence: {selectedMember.topSuggestion.confidence}%</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No reassignment suggestions currently. Existing assignments look balanced.</p>
                  )}
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">Projects</h4>
                  <div className="space-y-2">
                    {selectedMember.projectNames.length === 0 ? (
                      <p className="text-xs text-slate-500">Not assigned to any project yet.</p>
                    ) : selectedMember.projectNames.map((projectName, index) => (
                      <button
                        key={`${selectedMember.id}_${projectName}`}
                        onClick={() => onOpenProject(selectedMember.projectIds[index])}
                        className="w-full text-left px-3 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032]/55 text-sm text-slate-200 hover:border-[#22C55E]/25 hover:bg-[#162032] transition-colors"
                      >
                        {projectName}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs uppercase tracking-[0.12em] text-slate-500 mb-2">Recent History</h4>
                  <div className="space-y-2">
                    {selectedMember.history.length === 0 ? (
                      <p className="text-xs text-slate-500">No historical records yet.</p>
                    ) : selectedMember.history.slice(0, 4).map(entry => (
                      <div key={entry.id} className="rounded-lg border border-[#22C55E]/10 bg-[#162032]/55 px-3 py-2">
                        <p className="text-sm text-slate-200">{entry.projectName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{entry.completedTasks} tasks completed • {entry.role}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
