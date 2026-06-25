import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/Button';
import { WandSparkles, Sparkles, Trash2, Plus } from 'lucide-react';
import { PlannerDifficulty, PlannerCategory, GeneratedPlanResponse, GeneratedPlanSubtask } from '../utils/dashboardTypes';
import { User } from '../../../types';

const MAX_PLANNER_WEEKS = 24;

export const AiPlannerView: React.FC<{
  plannerInput: { description: string; projectGoal: string; teamSize: number; deadlineWeeks: number; difficulty: PlannerDifficulty; category: PlannerCategory };
  setPlannerInput: React.Dispatch<React.SetStateAction<{ description: string; projectGoal: string; teamSize: number; deadlineWeeks: number; difficulty: PlannerDifficulty; category: PlannerCategory }>>;
  generatedPlan: GeneratedPlanResponse | null;
  setGeneratedPlan: React.Dispatch<React.SetStateAction<GeneratedPlanResponse | null>>;
  onGenerate: () => void;
  onRegenerate: () => void;
  onCreateBoard: () => void;
  hasExistingTasks?: boolean;
  workspaceMembers: User[];
}> = ({ plannerInput, setPlannerInput, generatedPlan, setGeneratedPlan, onGenerate, onRegenerate, onCreateBoard, hasExistingTasks = false, workspaceMembers }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftPlan, setDraftPlan] = useState<GeneratedPlanResponse | null>(null);

  const activePlan = isEditing ? draftPlan : generatedPlan;

  const assignmentCards = useMemo(() => {
    if (!activePlan || !activePlan.plan) return [];
    const map = new Map<string, string[]>();
    activePlan.plan.forEach(step => {
      const subtasks = step.subtasks || [];
      subtasks.forEach(sub => {
        const prev = map.get(sub.assignee) || [];
        map.set(sub.assignee, [...prev, sub.title]);
      });
    });
    return Array.from(map.entries()).map(([assignee, tasks]) => ({ assignee, tasks }));
  }, [activePlan]);

  const estimatedWorkload = useMemo(() => {
    if (!activePlan || !activePlan.plan) return [];
    return activePlan.plan.flatMap(step => step.subtasks || []);
  }, [activePlan]);

  const totalEstHours = useMemo(() => {
    return estimatedWorkload.reduce((sum, sub) => sum + sub.estHours, 0);
  }, [estimatedWorkload]);

  const potentialRisks = useMemo(() => {
    if (activePlan && Array.isArray(activePlan.risks) && activePlan.risks.length > 0) {
      return activePlan.risks;
    }
    const risks: string[] = [];
    if (plannerInput.deadlineWeeks <= 3) risks.push('Short timeline may compress design and review quality.');
    if (plannerInput.teamSize <= 2) risks.push('Small team size can create workload bottlenecks.');
    if (plannerInput.difficulty === 'Hard') risks.push('Hard difficulty may require extra revision rounds.');
    if (totalEstHours > 28) risks.push('Large estimated workload might cause deadline drift.');
    return risks.slice(0, 3);
  }, [activePlan, plannerInput.deadlineWeeks, plannerInput.teamSize, plannerInput.difficulty, totalEstHours]);

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await onGenerate();
    } finally {
      setIsGenerating(false);
    }
  };

  const startEditing = () => {
    if (!generatedPlan) return;
    setDraftPlan(JSON.parse(JSON.stringify(generatedPlan))); // Deep copy
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftPlan(null);
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (draftPlan) {
      setGeneratedPlan(draftPlan);
    }
    setIsEditing(false);
    setDraftPlan(null);
  };

  const updateDraftSubtask = (weekIndex: number, subtaskIndex: number, patch: Partial<GeneratedPlanSubtask>) => {
    if (!draftPlan) return;
    setDraftPlan({
      ...draftPlan,
      plan: draftPlan.plan.map((step, wi) =>
        wi !== weekIndex ? step : {
          ...step,
          subtasks: step.subtasks.map((sub, si) =>
            si !== subtaskIndex ? sub : { ...sub, ...patch }
          )
        }
      )
    });
  };

  const addDraftSubtask = (weekIndex: number) => {
    if (!draftPlan) return;
    setDraftPlan({
      ...draftPlan,
      plan: draftPlan.plan.map((step, wi) =>
        wi !== weekIndex ? step : {
          ...step,
          subtasks: [...step.subtasks, {
            title: 'New Task',
            description: 'Describe what needs to be done',
            assignee: workspaceMembers[0]?.name || 'Unassigned',
            estHours: 4,
            priority: 'Medium' as const
          }]
        }
      )
    });
  };

  const deleteDraftSubtask = (weekIndex: number, subtaskIndex: number) => {
    if (!draftPlan) return;
    setDraftPlan({
      ...draftPlan,
      plan: draftPlan.plan.map((step, wi) =>
        wi !== weekIndex ? step : {
          ...step,
          subtasks: step.subtasks.filter((_, si) => si !== subtaskIndex)
        }
      )
    });
  };

  const updateDraftMilestone = (weekIndex: number, milestone: string) => {
    if (!draftPlan) return;
    setDraftPlan({
      ...draftPlan,
      plan: draftPlan.plan.map((step, wi) =>
        wi !== weekIndex ? step : { ...step, milestone }
      )
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><WandSparkles size={16} className="text-[#EAB308]" />AI Project Planner</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">Describe your project</label>
              <textarea
                value={plannerInput.description}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-24 px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">Project goal</label>
              <input
                type="text"
                value={plannerInput.projectGoal}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, projectGoal: e.target.value }))}
                placeholder="Create an A1 poster for Tech Day 2026"
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Team members</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 6].map(value => (
                  <button
                    key={value}
                    onClick={() => setPlannerInput(prev => ({ ...prev, teamSize: value }))}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${plannerInput.teamSize === value ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30' : 'bg-[#162032] text-slate-400 border-[#22C55E]/10 hover:text-slate-200'}`}
                  >
                    {value === 6 ? '5+' : value}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Deadline (weeks)</label>
              <input type="number" min={2} max={MAX_PLANNER_WEEKS}
                value={plannerInput.deadlineWeeks}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, deadlineWeeks: Math.max(2, Math.min(MAX_PLANNER_WEEKS, Number(e.target.value) || 2)) }))}
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40" />
              <p className="mt-1 text-[11px] text-slate-500">Supports up to {MAX_PLANNER_WEEKS} weeks.</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Difficulty</label>
              <select
                value={plannerInput.difficulty}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, difficulty: e.target.value as PlannerDifficulty }))}
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40 cursor-pointer">
                <option className="bg-[#162032] text-white">Easy</option>
                <option className="bg-[#162032] text-white">Medium</option>
                <option className="bg-[#162032] text-white">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Project type</label>
              <select
                value={plannerInput.category}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, category: e.target.value as PlannerCategory }))}
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40 cursor-pointer">
                <option className="bg-[#162032] text-white">Auto detect</option>
                <option className="bg-[#162032] text-white">Design</option>
                <option className="bg-[#162032] text-white">Software</option>
                <option className="bg-[#162032] text-white">Research</option>
                <option className="bg-[#162032] text-white">Marketing</option>
                <option className="bg-[#162032] text-white">Business</option>
                <option className="bg-[#162032] text-white">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button icon={<Sparkles size={14} />} onClick={handleGenerate} disabled={isEditing}>
              {isGenerating ? 'Generating plan...' : 'Generate Plan'}
            </Button>
          </div>
        </div>

        {activePlan && activePlan.plan && (
          <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  AI Planning Result
                  {isEditing && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-md font-semibold">
                      Edit Mode
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Vertex turns your prompt and goal into tasks you can add to the current project board.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3">Project Timeline</h4>
                <div className="space-y-4">
                  {activePlan.plan.map((step, weekIdx) => (
                    <div key={`${step.week}-${weekIdx}`} className="bg-[#0F1A2A]/70 border border-[#22C55E]/12 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-[#22C55E]/10 pb-2">
                        <div className="flex-1">
                          <span className="text-xs text-[#22C55E] font-semibold">{step.week}</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={step.milestone}
                              onChange={(e) => updateDraftMilestone(weekIdx, e.target.value)}
                              className="w-full mt-1 px-2.5 py-1.5 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40"
                              placeholder="Milestone title"
                            />
                          ) : (
                            <h5 className="text-sm font-bold text-slate-100 mt-0.5">{step.milestone}</h5>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono self-start ml-2">Phase {weekIdx + 1}</span>
                      </div>

                      <div className="space-y-2.5">
                        {step.subtasks.map((sub, subIdx) => (
                          <div key={subIdx} className="bg-[#162032]/40 border border-[#22C55E]/5 hover:border-[#22C55E]/12 rounded-lg p-3 space-y-2.5 transition-all">
                            {isEditing ? (
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    value={sub.title}
                                    onChange={(e) => updateDraftSubtask(weekIdx, subIdx, { title: e.target.value })}
                                    className="flex-1 px-2.5 py-1 bg-[#101928] border border-[#22C55E]/15 rounded-md text-sm text-white outline-none focus:border-[#22C55E]/30"
                                    placeholder="Task Title"
                                  />
                                  <button
                                    onClick={() => deleteDraftSubtask(weekIdx, subIdx)}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                    title="Delete task"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <textarea
                                  value={sub.description}
                                  onChange={(e) => updateDraftSubtask(weekIdx, subIdx, { description: e.target.value })}
                                  className="w-full min-h-12 px-2.5 py-1 bg-[#101928] border border-[#22C55E]/15 rounded-md text-xs text-slate-300 outline-none focus:border-[#22C55E]/30 resize-y"
                                  placeholder="Task Description"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">Assignee</label>
                                    <select
                                      value={sub.assignee}
                                      onChange={(e) => updateDraftSubtask(weekIdx, subIdx, { assignee: e.target.value })}
                                      className="w-full px-2 py-1 bg-[#101928] border border-[#22C55E]/15 rounded-md text-xs text-white outline-none cursor-pointer"
                                    >
                                      {workspaceMembers.map(m => (
                                        <option key={m.id} value={m.name}>{m.name}</option>
                                      ))}
                                      <option value="Unassigned">Unassigned</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">Hours</label>
                                    <input
                                      type="number"
                                      value={sub.estHours}
                                      onChange={(e) => updateDraftSubtask(weekIdx, subIdx, { estHours: Number(e.target.value) })}
                                      className="w-full px-2 py-1 bg-[#101928] border border-[#22C55E]/15 rounded-md text-xs text-white outline-none"
                                      min={1}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">Priority</label>
                                    <select
                                      value={sub.priority}
                                      onChange={(e) => updateDraftSubtask(weekIdx, subIdx, { priority: e.target.value as any })}
                                      className="w-full px-2 py-1 bg-[#101928] border border-[#22C55E]/15 rounded-md text-xs text-white outline-none cursor-pointer"
                                    >
                                      <option value="High">High</option>
                                      <option value="Medium">Medium</option>
                                      <option value="Low">Low</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <span className="text-sm font-semibold text-slate-200">{sub.title}</span>
                                    <p className="text-xs text-slate-400 mt-1">{sub.description}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${
                                      sub.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                      sub.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                      {sub.priority}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium">{sub.estHours}h</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 border-t border-[#22C55E]/5 pt-2">
                                  <span className="text-[10px] text-slate-500">Assignee:</span>
                                  <span className="text-xs text-slate-300 font-medium">{sub.assignee}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {step.subtasks.length === 0 && (
                          <div className="text-xs text-slate-500 italic py-2 text-center">
                            No tasks for this week.
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <button
                          onClick={() => addDraftSubtask(weekIdx)}
                          className="w-full py-1.5 rounded-lg border border-dashed border-[#22C55E]/20 text-xs font-semibold text-[#6EE7B7] hover:bg-[#162032]/40 hover:border-[#22C55E]/45 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus size={12} /> Add Task
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Task Assignments</h4>
                  <div className="space-y-2.5">
                    {assignmentCards.map(card => (
                      <div key={card.assignee} className="flex items-center justify-between gap-3 bg-[#0F1A2A]/70 border border-[#22C55E]/8 rounded-lg px-3 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{card.assignee}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{card.tasks.length} tasks</p>
                          <p className="text-xs text-slate-500 mt-1 truncate max-w-[11rem]">{card.tasks.slice(0, 2).join(' / ')}</p>
                        </div>
                        <span className="text-xs text-[#6EE7B7] font-medium text-right max-w-[12rem]">Primary ownership</span>
                      </div>
                    ))}
                    {assignmentCards.length === 0 && (
                      <div className="text-xs text-slate-500 italic p-3 text-center">No assignments.</div>
                    )}
                  </div>
                </div>

                <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Estimated Workload</h4>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {estimatedWorkload.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 bg-[#0F1A2A]/70 border border-[#22C55E]/8 rounded-lg px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm text-slate-100 truncate">{sub.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{sub.assignee}</p>
                        </div>
                        <span className="text-xs text-[#6EE7B7] font-semibold shrink-0">{sub.estHours}h</span>
                      </div>
                    ))}
                    {estimatedWorkload.length === 0 && (
                      <div className="text-xs text-slate-500 italic p-3 text-center">No workload estimated.</div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Total estimated effort: <span className="text-slate-200 font-semibold">{totalEstHours}h</span></p>
                </div>

                <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Potential Risks</h4>
                  <div className="space-y-2.5">
                    {potentialRisks.length === 0 ? (
                      <div className="bg-[#0F1A2A]/70 border border-[#22C55E]/8 rounded-lg px-3 py-2.5 text-xs text-slate-400">
                        No major risks detected from current planner inputs.
                      </div>
                    ) : potentialRisks.map((risk, idx) => (
                      <div key={`${risk}_${idx}`} className="bg-[#0F1A2A]/70 border border-amber-500/20 rounded-lg px-3 py-2.5 text-xs text-amber-100">
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={saveEditing}>Save Changes</Button>
                    <Button variant="ghost" size="sm" onClick={cancelEditing}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={startEditing}>Edit Plan</Button>
                    <Button variant="ghost" size="sm" onClick={onRegenerate}>Regenerate</Button>
                  </>
                )}
              </div>
              <Button size="sm" onClick={onCreateBoard} disabled={isEditing}>{hasExistingTasks ? 'Add Tasks to Board' : 'Create Initial Tasks'}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



