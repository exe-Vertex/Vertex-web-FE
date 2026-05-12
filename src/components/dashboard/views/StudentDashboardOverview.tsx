import React from 'react';
import { ProjectWithMembers } from '../utils/dashboardTypes';
import { computeProgressFromTasks, CURRENT_USER_ID } from '../utils/dashboardUtils';

export const StudentDashboardOverview: React.FC<{
  projects: ProjectWithMembers[];
  onOpenProject: (projectId: string) => void;
}> = ({ projects, onOpenProject }) => {
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayKey = todayStart.toISOString().split('T')[0];
  const activeProjects = projects.filter(project => project.tasks.some(task => task.status !== 'done')).length;
  const tasksDueToday = projects.reduce((count, project) => (
    count + project.tasks.filter(task => task.endDate === todayKey && task.status !== 'done').length
  ), 0);
  const overdueTaskCount = projects.reduce((count, project) => (
    count + project.tasks.filter(task => new Date(task.endDate) < todayStart && task.status !== 'done').length
  ), 0);

  const myTasksToday = projects
    .flatMap(project => project.tasks
      .filter(task => task.assignee?.id === CURRENT_USER_ID && task.status !== 'done')
      .map(task => ({
        ...task,
        projectId: project.id,
        projectName: project.name,
      })))
    .filter(task => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return start <= todayStart && end >= todayStart;
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 6);

  const overdueTasks = projects
    .flatMap(project => project.tasks
      .filter(task => task.status !== 'done' && new Date(task.endDate) < todayStart)
      .map(task => ({
        ...task,
        projectId: project.id,
        projectName: project.name,
      })))
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 6);

  const upcomingDeadlines = [...projects]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <section className="border-b border-[#22C55E]/10 pb-8">
          <h2 className="text-xl font-bold text-white">Project Summary</h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active projects</p>
              <p className="mt-3 text-3xl font-bold text-white">{activeProjects}</p>
            </div>
            <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tasks due today</p>
              <p className="mt-3 text-3xl font-bold text-white">{tasksDueToday}</p>
            </div>
            <div className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Overdue tasks</p>
              <p className="mt-3 text-3xl font-bold text-white">{overdueTaskCount}</p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#22C55E]/10 pb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">My Projects</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(project => {
              const progress = computeProgressFromTasks(project);
              const pendingTasks = project.tasks.filter(task => task.status !== 'done').length;
              const leader = project.members[0]?.name || 'Unassigned';

              return (
                <button
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                  className="bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl p-4 text-left transition-all duration-200 hover:border-[#22C55E]/28 hover:bg-[#132234] hover:shadow-[0_18px_42px_rgba(10,15,26,0.38)] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-semibold text-sm">{project.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">Leader: {leader}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#22C55E]">{progress}%</span>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <p className="flex items-center justify-between"><span>Members</span><span className="text-slate-200 font-semibold">{project.members.length}</span></p>
                    <p className="flex items-center justify-between"><span>Total tasks</span><span className="text-slate-200 font-semibold">{project.tasks.length}</span></p>
                    <p className="flex items-center justify-between"><span>Pending tasks</span><span className="text-slate-200 font-semibold">{pendingTasks}</span></p>
                    <p className="flex items-center justify-between"><span>Deadline</span><span className="text-slate-200 font-semibold">{new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></p>
                  </div>
                  <div className="h-1.5 mt-4 bg-[#162032] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#22C55E] to-[#EAB308]" style={{ width: `${progress}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="border-b border-[#22C55E]/10 pb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">My Tasks Today</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myTasksToday.length === 0 ? (
              <div className="md:col-span-2 rounded-xl border border-[#22C55E]/12 bg-[#0F1A2A] px-4 py-5 text-sm text-slate-500">
                No active tasks assigned to you today.
              </div>
            ) : myTasksToday.map(task => (
              <button
                key={task.id}
                onClick={() => onOpenProject(task.projectId)}
                className="w-full bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:border-[#22C55E]/28 hover:bg-[#132234]"
              >
                <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                <p className="text-xs text-slate-500 mt-1 truncate">{task.projectName}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-[#22C55E]/10 pb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">Overdue Tasks</h2>
          </div>
          <div className="space-y-3">
            {overdueTasks.length === 0 ? (
              <div className="rounded-xl border border-[#22C55E]/12 bg-[#0F1A2A] px-4 py-5 text-sm text-slate-500">
                No overdue tasks. Great progress.
              </div>
            ) : overdueTasks.map(task => {
              const overdueDays = Math.max(1, Math.ceil((todayStart.getTime() - new Date(task.endDate).getTime()) / 86400000));
              return (
                <button
                  key={task.id}
                  onClick={() => onOpenProject(task.projectId)}
                  className="w-full bg-[#0F1A2A] border border-red-500/20 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:bg-[#132234]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{task.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{task.projectName}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-300">
                      {overdueDays}d overdue
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">Upcoming Deadlines</h2>
          </div>
          <div className="space-y-3">
            {upcomingDeadlines.map(project => (
              <button
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="w-full bg-[#0F1A2A] border border-[#22C55E]/12 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:border-[#22C55E]/28 hover:bg-[#132234]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">{project.name}</span>
                  <span className="text-sm text-slate-400">{new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
