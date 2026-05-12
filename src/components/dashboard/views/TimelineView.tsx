import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Filter } from 'lucide-react';
import { Avatar } from '../../ui/Avatar';
import { Project, Task, Status } from '../../../types';

// Timeline Subcomponent (Simplified Gantt)
export const TimelineView: React.FC<{ project: Project; onTaskClick: (task: Task) => void }> = ({ project, onTaskClick }) => {
  const [scale, setScale] = useState<'day' | 'week' | 'month'>('week');
  const sortedTasks = [...project.tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const DAY_MS = 86400000;
  const startOfDay = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const startOfWeek = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d.getTime();
  };
  const startOfMonth = (ms: number) => {
    const d = new Date(ms);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const monthDiff = (fromMs: number, toMs: number) => {
    const from = new Date(fromMs);
    const to = new Date(toMs);
    return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  };

  const timelineBounds = useMemo(() => {
    if (sortedTasks.length === 0) {
      const now = startOfDay(Date.now());
      return { min: now - 7 * DAY_MS, max: now + 21 * DAY_MS };
    }

    const taskDates = sortedTasks.flatMap(task => [
      startOfDay(new Date(task.startDate).getTime()),
      startOfDay(new Date(task.endDate).getTime()),
    ]);
    const minTask = Math.min(...taskDates);
    const maxTask = Math.max(...taskDates);
    return {
      min: minTask - 2 * DAY_MS,
      max: maxTask + 2 * DAY_MS,
    };
  }, [sortedTasks]);

  const gridModel = useMemo(() => {
    const min = timelineBounds.min;
    const max = timelineBounds.max;

    if (scale === 'day') {
      const unitPx = 46;
      const start = startOfDay(min);
      const end = startOfDay(max);
      const totalUnits = Math.max(1, Math.floor((end - start) / DAY_MS) + 1);
      const labels = Array.from({ length: totalUnits }).map((_, idx) => {
        const ms = start + idx * DAY_MS;
        return {
          text: new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          key: `d_${ms}`,
        };
      });
      return { start, totalUnits, unitPx, labels };
    }

    if (scale === 'month') {
      const unitPx = 180;
      const start = startOfMonth(min);
      const end = startOfMonth(max);
      const totalUnits = Math.max(1, monthDiff(start, end) + 1);
      const labels = Array.from({ length: totalUnits }).map((_, idx) => {
        const d = new Date(start);
        d.setMonth(d.getMonth() + idx);
        return {
          text: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          key: `m_${d.getFullYear()}_${d.getMonth()}`,
        };
      });
      return { start, totalUnits, unitPx, labels };
    }

    const unitPx = 120;
    const start = startOfWeek(min);
    const end = startOfWeek(max);
    const totalUnits = Math.max(1, Math.floor((end - start) / (7 * DAY_MS)) + 1);
    const labels = Array.from({ length: totalUnits }).map((_, idx) => {
      const ms = start + idx * 7 * DAY_MS;
      const rangeStart = new Date(ms);
      const rangeEnd = new Date(ms + 6 * DAY_MS);
      return {
        text: `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${rangeEnd.toLocaleDateString('en-US', { day: 'numeric' })}`,
        key: `w_${ms}`,
      };
    });
    return { start, totalUnits, unitPx, labels };
  }, [timelineBounds, scale]);

  const timelineWidth = Math.max(920, gridModel.totalUnits * gridModel.unitPx);

  const periodLabel = useMemo(() => {
    if (gridModel.labels.length === 0) return 'No tasks';
    const first = gridModel.labels[0].text;
    const last = gridModel.labels[gridModel.labels.length - 1].text;
    return first === last ? first : `${first} - ${last}`;
  }, [gridModel.labels]);

  const getOffsetUnits = (ms: number) => {
    if (scale === 'day') return Math.floor((startOfDay(ms) - gridModel.start) / DAY_MS);
    if (scale === 'month') return monthDiff(gridModel.start, startOfMonth(ms));
    return Math.floor((startOfWeek(ms) - gridModel.start) / (7 * DAY_MS));
  };

  const todayUnits = getOffsetUnits(Date.now());
  const todayX = (todayUnits + 0.5) * gridModel.unitPx;

  const getTaskBar = (task: Task) => {
    const taskStartMs = new Date(task.startDate).getTime();
    const taskEndMs = new Date(task.endDate).getTime();
    const startUnits = getOffsetUnits(taskStartMs);
    const endUnits = getOffsetUnits(taskEndMs);
    const widthUnits = Math.max(1, endUnits - startUnits + 1);

    return {
      x: Math.max(0, startUnits) * gridModel.unitPx + 4,
      width: Math.max(32, widthUnits * gridModel.unitPx - 8),
    };
  };

  const statusClass: Record<Status, string> = {
    'todo': 'bg-slate-500/25 text-slate-300 border-slate-400/25',
    'in-progress': 'bg-blue-500/28 text-blue-300 border-blue-400/30',
    'ready-for-review': 'bg-[#EAB308]/28 text-[#F4E17A] border-[#EAB308]/35',
    'done': 'bg-green-500/28 text-green-300 border-green-400/30',
  };
  
  return (
    <div className="bg-[#0F1A2A] rounded-xl border border-[#22C55E]/10 shadow-sm h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[#22C55E]/10 bg-[#0A0F1A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-300">{periodLabel}</span>
        </div>
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setScale(mode)}
              className={`px-3 py-1 rounded text-xs font-medium border capitalize transition-colors ${
                scale === mode
                  ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                  : 'bg-[#162032] border-[#22C55E]/10 text-slate-400 hover:text-[#22C55E]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-[980px]" style={{ width: `${250 + timelineWidth}px` }}>
          <div className="sticky top-0 z-20 flex border-b border-[#22C55E]/10 bg-[#0F1A2A]">
            <div className="w-[250px] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Task</div>
            <div className="relative" style={{ width: `${timelineWidth}px` }}>
              <div className="absolute inset-0 pointer-events-none">
                {gridModel.labels.map((label, idx) => (
                  <div
                    key={label.key}
                    className="absolute top-0 bottom-0 border-l border-dashed border-[#22C55E]/10"
                    style={{ left: `${idx * gridModel.unitPx}px` }}
                  />
                ))}
                {todayUnits >= 0 && todayUnits < gridModel.totalUnits && (
                  <div className="absolute top-0 bottom-0 border-l border-[#EAB308]/70" style={{ left: `${todayX}px` }}>
                    <span className="absolute -top-5 -left-5 rounded bg-[#1A2638] px-1.5 py-0.5 text-[10px] font-semibold text-[#EAB308]">Today</span>
                  </div>
                )}
              </div>
              <div className="flex text-[11px] text-slate-500">
                {gridModel.labels.map((label, idx) => (
                  <div
                    key={label.key}
                    className="px-2 py-2 whitespace-nowrap"
                    style={{ width: `${gridModel.unitPx}px`, opacity: scale === 'day' && idx % 2 === 1 ? 0.5 : 1 }}
                  >
                    {label.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {sortedTasks.map((task, index) => {
              const bar = getTaskBar(task);
              return (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`w-full text-left flex border-b border-[#22C55E]/5 hover:bg-[#162032]/45 transition-colors ${index % 2 === 0 ? 'bg-[#0C1422]/35' : ''}`}
                >
                  <div className="w-[250px] px-4 py-3 flex items-center gap-3 border-r border-[#22C55E]/5">
                    <Avatar src={task.assignee?.avatar} fallback="?" size="sm" className="w-7 h-7 text-[11px]" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                      <p className="text-[11px] text-slate-500">{new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="relative py-3" style={{ width: `${timelineWidth}px` }}>
                    <div className="absolute inset-0 pointer-events-none">
                      {gridModel.labels.map((label, idx) => (
                        <div
                          key={`${task.id}_${label.key}`}
                          className="absolute top-0 bottom-0 border-l border-dashed border-[#22C55E]/10"
                          style={{ left: `${idx * gridModel.unitPx}px` }}
                        />
                      ))}
                    </div>

                    <motion.div
                      initial={{ width: 0, opacity: 0.8 }}
                      animate={{ width: bar.width, opacity: 1 }}
                      transition={{ duration: 0.35, delay: index * 0.03 }}
                      className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg border px-2.5 flex items-center ${statusClass[task.status]}`}
                      style={{ left: `${bar.x}px` }}
                    >
                      <span className="text-xs font-semibold truncate max-w-[220px]">{task.title}</span>
                    </motion.div>
                  </div>
                </button>
              );
            })}
            {sortedTasks.length === 0 && (
              <div className="py-14 text-center text-sm text-slate-500">No tasks yet. Create tasks to populate the timeline.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
