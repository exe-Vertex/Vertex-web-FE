import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/Button';
import { WandSparkles, Sparkles } from 'lucide-react';
import { PlannerDifficulty, PlannerCategory, GeneratedPlanStep } from '../utils/dashboardTypes';

export const AiPlannerView: React.FC<{
  plannerInput: { description: string; projectGoal: string; teamSize: number; deadlineWeeks: number; difficulty: PlannerDifficulty; category: PlannerCategory };
  setPlannerInput: React.Dispatch<React.SetStateAction<{ description: string; projectGoal: string; teamSize: number; deadlineWeeks: number; difficulty: PlannerDifficulty; category: PlannerCategory }>>;
  generatedPlan: GeneratedPlanStep[] | null;
  onGenerate: () => void;
  onRegenerate: () => void;
  onCreateBoard: () => void;
}> = ({ plannerInput, setPlannerInput, generatedPlan, onGenerate, onRegenerate, onCreateBoard }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const assignmentCards = useMemo(() => {
    if (!generatedPlan) return [];
    const map = new Map<string, string[]>();
    generatedPlan.forEach(step => {
      const prev = map.get(step.assignee) || [];
      map.set(step.assignee, [...prev, step.task]);
    });
    return Array.from(map.entries()).map(([assignee, tasks]) => ({ assignee, tasks }));
  }, [generatedPlan]);

  const estimatedWorkload = generatedPlan || [];
  const totalEstHours = estimatedWorkload.reduce((sum, step) => sum + step.estHours, 0);

  const potentialRisks = useMemo(() => {
    const risks: string[] = [];
    if (plannerInput.deadlineWeeks <= 3) risks.push('Short timeline may compress design and review quality.');
    if (plannerInput.teamSize <= 2) risks.push('Small team size can create workload bottlenecks.');
    if (plannerInput.difficulty === 'Hard') risks.push('Hard difficulty may require extra revision rounds.');
    if (totalEstHours > 28) risks.push('Large estimated workload might cause deadline drift.');
    return risks.slice(0, 3);
  }, [plannerInput.deadlineWeeks, plannerInput.teamSize, plannerInput.difficulty, totalEstHours]);

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    window.setTimeout(() => {
      onGenerate();
      setIsGenerating(false);
    }, 700);
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
              <input type="number" min={2} max={8}
                value={plannerInput.deadlineWeeks}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, deadlineWeeks: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Difficulty</label>
              <select
                value={plannerInput.difficulty}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, difficulty: e.target.value as PlannerDifficulty }))}
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40">
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Project category</label>
              <select
                value={plannerInput.category}
                onChange={(e) => setPlannerInput(prev => ({ ...prev, category: e.target.value as PlannerCategory }))}
                className="w-full px-3 py-2 bg-[#162032] border border-[#22C55E]/15 rounded-lg text-sm text-white outline-none focus:border-[#22C55E]/40">
                <option>Design</option>
                <option>Research</option>
                <option>Engineering</option>
                <option>Marketing</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button icon={<Sparkles size={14} />} onClick={handleGenerate}>
              {isGenerating ? 'Generating plan...' : 'Generate Plan'}
            </Button>
          </div>
        </div>

        {generatedPlan && (
          <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-semibold">AI Planning Result</h3>
                <p className="text-xs text-slate-400 mt-1">Vertex turns your prompt and goal into a production-ready project workflow.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3">Project Timeline</h4>
                <div className="space-y-2.5">
                  {generatedPlan.map((step, idx) => (
                    <div key={`${step.week}-${idx}`} className="flex items-start justify-between gap-3 bg-[#0F1A2A]/70 border border-[#22C55E]/8 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-xs text-[#22C55E] font-semibold">{step.week} • {step.taskCount} tasks</p>
                        <p className="text-sm text-slate-200 mt-0.5">{step.task}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5">Phase {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3">Task Assignments</h4>
                <div className="space-y-2.5">
                  {assignmentCards.map(card => (
                    <div key={card.assignee} className="flex items-center justify-between gap-3 bg-[#0F1A2A]/70 border border-[#22C55E]/8 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{card.assignee}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{card.tasks.length} tasks</p>
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-[11rem]">{card.tasks.slice(0, 2).join(' • ')}</p>
                      </div>
                      <span className="text-xs text-[#6EE7B7] font-medium text-right max-w-[12rem]">Primary ownership</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#162032]/55 border border-[#22C55E]/8 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3">Estimated Workload</h4>
                <div className="space-y-2.5">
                  {estimatedWorkload.map(step => (
                    <div key={`${step.week}_${step.task}`} className="flex items-center justify-between gap-3 bg-[#0F1A2A]/70 border border-[#22C55E]/8 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-sm text-slate-100">{step.task}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.week}</p>
                      </div>
                      <span className="text-xs text-[#6EE7B7] font-semibold">{step.estHours}h</span>
                    </div>
                  ))}
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

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Adjust Scope</Button>
                <Button variant="outline" size="sm">Reassign Tasks</Button>
                <Button variant="ghost" size="sm" onClick={onRegenerate}>Regenerate</Button>
              </div>
              <Button size="sm" onClick={onCreateBoard}>Create Project</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
