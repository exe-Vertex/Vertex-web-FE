import React, { useState, useMemo } from 'react';
import { Project, Task, Status } from '../../../types';

export const CalendarView: React.FC<{ project: Project; onTaskClick: (task: Task) => void }> = ({ project, onTaskClick }) => {
  const [monthOffset, setMonthOffset] = useState(0);

  const visibleMonthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const calendarDays = useMemo(() => {
    const monthStart = new Date(visibleMonthStart);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const gridStart = new Date(monthStart);
    const weekDay = (gridStart.getDay() + 6) % 7;
    gridStart.setDate(gridStart.getDate() - weekDay);

    const gridEnd = new Date(monthEnd);
    const endWeekDay = (gridEnd.getDay() + 6) % 7;
    gridEnd.setDate(gridEnd.getDate() + (6 - endWeekDay));

    const days: Date[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [visibleMonthStart]);

  const tasksByEndDate = useMemo(() => {
    const byDate: Record<string, Task[]> = {};
    project.tasks.forEach((task: Task) => {
      if (!byDate[task.endDate]) byDate[task.endDate] = [];
      byDate[task.endDate].push(task);
    });
    return byDate;
  }, [project.tasks]);

  const todayKey = new Date().toISOString().split('T')[0];

  const statusChipClass: Record<Status, string> = {
    'todo': 'border-slate-500/25 bg-slate-500/20 text-slate-200',
    'in-progress': 'border-blue-500/30 bg-blue-500/20 text-blue-200',
    'ready-for-review': 'border-[#EAB308]/35 bg-[#EAB308]/18 text-[#F4E17A]',
    'done': 'border-green-500/35 bg-green-500/20 text-green-200',
  };

  return (
    <div className="bg-[#0F1A2A] rounded-xl border border-[#22C55E]/10 shadow-sm h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[#22C55E]/10 bg-[#0A0F1A] flex items-center justify-between">
        <button
          onClick={() => setMonthOffset(prev => prev - 1)}
          className="px-2.5 py-1.5 rounded-md border border-[#22C55E]/15 text-xs text-slate-300 hover:bg-[#162032]"
        >
          Previous
        </button>
        <p className="text-sm font-semibold text-slate-200">
          {visibleMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button
          onClick={() => setMonthOffset(prev => prev + 1)}
          className="px-2.5 py-1.5 rounded-md border border-[#22C55E]/15 text-xs text-slate-300 hover:bg-[#162032]"
        >
          Next
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-[11px] uppercase tracking-wider text-slate-500 px-1 py-1">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 auto-rows-[120px]">
          {calendarDays.map((date) => {
            const key = date.toISOString().split('T')[0];
            const dayTasks = tasksByEndDate[key] || [];
            const inCurrentMonth = date.getMonth() === visibleMonthStart.getMonth();
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className={`rounded-lg border p-2 flex flex-col gap-1.5 ${inCurrentMonth ? 'border-[#22C55E]/12 bg-[#0C1422]/55' : 'border-[#22C55E]/6 bg-[#0C1422]/25 opacity-60'} ${isToday ? 'ring-1 ring-[#22C55E]/35' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isToday ? 'text-[#22C55E]' : 'text-slate-300'}`}>{date.getDate()}</span>
                  {dayTasks.length > 0 && <span className="text-[10px] text-slate-500">{dayTasks.length}</span>}
                </div>

                <div className="space-y-1 overflow-hidden">
                  {dayTasks.slice(0, 3).map(task => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded border truncate ${statusChipClass[task.status]}`}
                      title={task.title}
                    >
                      {task.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] text-slate-500 px-1">+{dayTasks.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
