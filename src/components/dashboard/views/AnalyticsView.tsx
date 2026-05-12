import React, { useMemo } from 'react';
import { Project, Status } from '../../../types';
import { TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

export const AnalyticsView: React.FC<{
  project: Project;
  workload: { name: string; tasks: number }[];
  overdueTasks: number;
}> = ({ project, workload, overdueTasks }) => {
  const now = new Date();
  const nowStart = new Date(now);
  nowStart.setHours(0, 0, 0, 0);

  const statusCounts: Record<Status, number> = {
    'done': project.tasks.filter(task => task.status === 'done').length,
    'in-progress': project.tasks.filter(task => task.status === 'in-progress').length,
    'ready-for-review': project.tasks.filter(task => task.status === 'ready-for-review').length,
    'todo': project.tasks.filter(task => task.status === 'todo').length,
  };

  const totalTasks = project.tasks.length;
  const dueInTwoDays = project.tasks.filter(task => {
    if (task.status === 'done') return false;
    const end = new Date(task.endDate);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end.getTime() - nowStart.getTime()) / 86400000);
    return diffDays >= 0 && diffDays <= 2;
  }).length;

  const workloadMax = Math.max(...workload.map(item => item.tasks), 1);

  const doneThisWeek = useMemo(() => {
    const weekStart = new Date(nowStart);
    const day = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - day);
    return project.tasks.filter(task => {
      if (task.status !== 'done') return false;
      const end = new Date(task.endDate);
      end.setHours(0, 0, 0, 0);
      return end >= weekStart && end <= nowStart;
    }).length;
  }, [project.tasks, nowStart]);

  const productivityRows = useMemo(() => {
    const weekStart = new Date(nowStart);
    const day = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - day);

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return labels.map((label, index) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + index);
      const key = dayStart.toISOString().split('T')[0];
      const value = project.tasks.filter(task => task.status === 'done' && task.endDate === key).length;
      return { label, value };
    });
  }, [project.tasks, nowStart]);

  const recentActivity = useMemo(() => {
    const completed = project.tasks
      .filter(task => task.status === 'done' && task.assignee)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
      .slice(0, 2)
      .map(task => `${task.assignee?.name} completed "${task.title}"`);

    const comments = project.tasks
      .filter(task => (task.commentCount ?? 0) > 0 && task.assignee)
      .slice(0, 1)
      .map(task => `${task.assignee?.name} commented on "${task.title}"`);

    const uploads = project.tasks
      .filter(task => (task.attachmentCount ?? 0) > 0 && task.assignee)
      .slice(0, 1)
      .map(task => `${task.assignee?.name} uploaded files for "${task.title}"`);

    return [...completed, ...comments, ...uploads].slice(0, 5);
  }, [project.tasks]);

  const contributionScores = useMemo(() => {
    const totalTaskWeight = Math.max(1, project.tasks.length * 3);
    return workload.map(member => {
      const memberTasks = project.tasks.filter(task => task.assignee?.name === member.name);
      const scoreRaw = memberTasks.reduce((sum, task) => {
        const base = task.status === 'done' ? 3 : task.status === 'in-progress' ? 2 : 1;
        const engagement = Math.min(2, (task.commentCount ?? 0) + (task.attachmentCount ?? 0));
        return sum + base + engagement;
      }, 0);
      const score = Math.min(100, Math.round((scoreRaw / totalTaskWeight) * 100));
      return { name: member.name, score };
    }).sort((a, b) => b.score - a.score);
  }, [project.tasks, workload]);

  const aiInsight = useMemo(() => {
    const lowActivityByMember = workload.map(memberLoad => {
      const activityScore = project.tasks
        .filter(task => task.assignee?.name === memberLoad.name)
        .reduce((score, task) => {
          const doneScore = task.status === 'done' ? 2 : 0;
          const commentScore = Math.min(2, task.commentCount ?? 0);
          const attachmentScore = Math.min(2, task.attachmentCount ?? 0);
          return score + doneScore + commentScore + attachmentScore;
        }, 0);
      return { ...memberLoad, activityScore };
    });

    const busiest = [...lowActivityByMember].sort((a, b) => b.tasks - a.tasks)[0];
    const lightest = [...lowActivityByMember].sort((a, b) => a.tasks - b.tasks)[0];
    const lowActivityBusy = [...lowActivityByMember].sort((a, b) => (a.activityScore / Math.max(a.tasks, 1)) - (b.activityScore / Math.max(b.tasks, 1)))[0];

    const remaining = totalTasks - statusCounts.done;
    const expectedWeeksLeft = remaining / Math.max(doneThisWeek, 1);
    const deadlineDaysLeft = Math.ceil((new Date(project.deadline).getTime() - nowStart.getTime()) / 86400000);
    const targetWeeksLeft = Math.max(1, Math.ceil(deadlineDaysLeft / 7));
    const expectedDelayDays = Math.max(0, Math.round((expectedWeeksLeft - targetWeeksLeft) * 7));

    if (expectedDelayDays >= 2) {
      return {
        headline: `Project may miss deadline by ${expectedDelayDays} days.`,
        suggestion: `Move 1-2 tasks from ${busiest?.name || 'the busiest member'} to ${lightest?.name || 'available members'} and prioritize review bottlenecks.`,
      };
    }

    return {
      headline: `${lowActivityBusy?.name || 'A member'} has many tasks but lower activity.`,
      suggestion: `Rebalance workload by moving 1-2 tasks to ${lightest?.name || 'another member'} and track progress every 2 days.`,
    };
  }, [workload, project.tasks, totalTasks, statusCounts.done, doneThisWeek, project.deadline, nowStart]);

  const productivityMax = Math.max(...productivityRows.map(row => row.value), 1);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-[#22C55E]" />Project Progress Breakdown</h2>
          <p className="text-xs text-slate-500 mb-3">Total tasks: <span className="text-slate-200 font-semibold">{totalTasks}</span></p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-lg bg-[#162032]/70 border border-[#22C55E]/8 px-3 py-2 text-sm">
              <span className="text-green-300">Done</span>
              <span className="font-bold text-white">{statusCounts.done}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#162032]/70 border border-[#22C55E]/8 px-3 py-2 text-sm">
              <span className="text-blue-300">In progress</span>
              <span className="font-bold text-white">{statusCounts['in-progress']}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#162032]/70 border border-[#22C55E]/8 px-3 py-2 text-sm">
              <span className="text-[#EAB308]">Review</span>
              <span className="font-bold text-white">{statusCounts['ready-for-review']}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#162032]/70 border border-[#22C55E]/8 px-3 py-2 text-sm">
              <span className="text-slate-300">Todo</span>
              <span className="font-bold text-white">{statusCounts.todo}</span>
            </div>
          </div>
        </section>

        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Workload Distribution</h2>
          <div className="space-y-2.5">
            {workload.map(item => (
              <div key={item.name} className="rounded-lg border border-[#22C55E]/8 bg-[#162032]/70 px-3 py-2.5">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                  <span>{item.name}</span>
                  <span className="font-semibold text-white">{item.tasks}</span>
                </div>
                <div className="h-2 rounded-full bg-[#0F1A2A] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#EAB308]" style={{ width: `${(item.tasks / workloadMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Contribution Score</h2>
          <div className="space-y-2.5">
            {contributionScores.map(member => (
              <div key={member.name} className="rounded-lg border border-[#22C55E]/8 bg-[#162032]/70 px-3 py-2.5">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                  <span>{member.name}</span>
                  <span className="font-semibold text-[#6EE7B7]">{member.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#0F1A2A] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#60A5FA]" style={{ width: `${member.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-[#EAB308]" />Deadline Risk Analysis</h2>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-red-200">
              <p className="font-semibold">High risk</p>
              <p className="text-xs mt-1"><span className="font-semibold">{overdueTasks}</span> task{overdueTasks !== 1 ? 's' : ''} overdue</p>
            </div>
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-amber-100">
              <p className="font-semibold">Medium risk</p>
              <p className="text-xs mt-1"><span className="font-semibold">{dueInTwoDays}</span> task{dueInTwoDays !== 1 ? 's' : ''} due in 2 days</p>
            </div>
          </div>
        </section>

        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Team Activity</h2>
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Recent activity</p>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity found.</p>
            ) : recentActivity.map((item, index) => (
              <div key={`${item}_${index}`} className="rounded-lg border border-[#22C55E]/8 bg-[#162032]/70 px-3 py-2 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Productivity Chart</h2>
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Tasks completed this week</p>
          <div className="space-y-2.5">
            {productivityRows.map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-10 text-xs text-slate-400">{row.label}</span>
                <div className="flex-1 h-2 rounded-full bg-[#162032] overflow-hidden">
                  <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${(row.value / productivityMax) * 100}%` }} />
                </div>
                <span className="w-5 text-right text-xs font-semibold text-slate-200">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="xl:col-span-2 bg-[#0F1A2A] border border-[#22C55E]/12 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Sparkles size={16} className="text-[#22C55E]" />AI Analysis</h2>
          <div className="rounded-xl border border-[#22C55E]/20 bg-[#162032]/65 px-4 py-4">
            <p className="text-sm text-slate-100 font-semibold">{aiInsight.headline}</p>
            <p className="text-sm text-slate-300 mt-2">Suggestion: {aiInsight.suggestion}</p>
          </div>
        </section>
      </div>
    </div>
  );
};
