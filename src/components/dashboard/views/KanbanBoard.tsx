import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Calendar as CalendarIcon, FileText, Paperclip, MessageSquare, Trash2 } from 'lucide-react';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import { Project, Task, Status } from '../../../types';

// Kanban Subcomponent
export const KanbanBoard: React.FC<{
  project: Project;
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, newStatus: Status) => void;
  onAddTask: (status: Status) => void;
  onDeleteTask: (taskId: string) => void;
}> = ({ project, onTaskClick, onTaskDrop, onAddTask, onDeleteTask }) => {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const todayStartMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  useEffect(() => {
    if (!menuTaskId) return;

    const handleOutsideMenuClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-task-menu]') || target.closest('[data-task-menu-button]')) return;
      setMenuTaskId(null);
    };

    document.addEventListener('mousedown', handleOutsideMenuClick);
    return () => document.removeEventListener('mousedown', handleOutsideMenuClick);
  }, [menuTaskId]);

  const columns: { id: Status; title: string; color: string }[] = [
    { id: 'todo', title: 'Todo', color: 'bg-slate-500' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500' },
    { id: 'ready-for-review', title: 'Ready for Review', color: 'bg-[#EAB308]' },
    { id: 'done', title: 'Done', color: 'bg-green-500' }
  ];

  return (
    <div className="flex h-full gap-6 min-w-[1000px]">
      {columns.map(col => {
        const tasks = project.tasks.filter(t => t.status === col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData('text/plain');
              if (taskId) onTaskDrop(taskId, col.id);
              setDragOverCol(null);
            }}
            className={`flex-1 flex flex-col rounded-xl border max-w-sm transition-all ${
              dragOverCol === col.id ? 'border-[#22C55E]/50 bg-[#22C55E]/5' : 'bg-[#0F1A2A]/40 backdrop-blur-md border-[#22C55E]/10'
            }`}
          >
            <div className="p-3 flex items-center justify-between border-b border-[#22C55E]/10 bg-[#0F1A2A]/80 rounded-t-xl backdrop-blur-sm sticky top-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                <h3 className="font-bold text-white text-sm">{col.title} ({tasks.length})</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  col.id === 'todo' ? 'bg-slate-500/15 text-slate-300 border-slate-500/25' :
                  col.id === 'in-progress' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                  col.id === 'ready-for-review' ? 'bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/30' :
                  'bg-green-500/15 text-green-300 border-green-500/30'
                }`}>{tasks.length}</span>
              </div>
              <button onClick={() => onAddTask(col.id)} className="text-slate-500 hover:text-[#22C55E] transition-colors">
                <Plus size={16} />
              </button>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {tasks.map(task => (
                (() => {
                  const endDateMs = new Date(task.endDate).getTime();
                  const isOverdue = task.status !== 'done' && endDateMs < todayStartMs;
                  return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', task.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <motion.div
                    layoutId={task.id}
                    onClick={() => onTaskClick(task)}
                    whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                    className={`relative bg-[#162032] p-4 rounded-xl shadow-sm border cursor-grab active:cursor-grabbing group ${
                      task.status === 'todo' ? 'border-slate-500/25' :
                      task.status === 'in-progress' ? 'border-blue-500/30' :
                      task.status === 'ready-for-review' ? 'border-[#EAB308]/35' :
                      'border-green-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'info'} className="text-[10px] px-1.5 py-0">
                          {task.priority}
                        </Badge>
                        {isOverdue && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-red-500/25 bg-red-500/10 text-red-300">
                            Overdue
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuTaskId(current => current === task.id ? null : task.id);
                        }}
                        data-task-menu-button
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#22C55E] transition-opacity"
                      >
                        <div className="w-6 h-6 rounded-full hover:bg-[#22C55E]/10 flex items-center justify-center">•••</div>
                      </button>
                    </div>
                    {menuTaskId === task.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        data-task-menu
                        className="absolute right-4 top-11 z-20 min-w-[9rem] rounded-xl border border-red-500/20 bg-[#0F1A2A] shadow-[0_16px_40px_rgba(0,0,0,0.35)] p-1.5"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                            setMenuTaskId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete task
                        </button>
                      </div>
                    )}
                    
                    <h4 className="font-bold text-white text-sm mb-2 line-clamp-2">{task.title}</h4>

                    <div className="flex items-center gap-2 mb-2 min-h-4">
                      {task.description && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#0F1A2A] border border-[#22C55E]/10 px-1.5 py-0.5 rounded-full">
                          <FileText size={10} /> Note
                        </span>
                      )}
                      {(task.attachmentCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#0F1A2A] border border-[#22C55E]/10 px-1.5 py-0.5 rounded-full">
                          <Paperclip size={10} /> {task.attachmentCount}
                        </span>
                      )}
                      {(task.commentCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#0F1A2A] border border-[#22C55E]/10 px-1.5 py-0.5 rounded-full">
                          <MessageSquare size={10} /> {task.commentCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-300' : 'text-slate-500'}`}>
                        <CalendarIcon size={12} />
                        <span>{new Date(task.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '-')}</span>
                      </div>
                      {task.assignee && (
                        <Avatar src={task.assignee.avatar} fallback={task.assignee.name.charAt(0)} size="sm" className="w-6 h-6 text-[10px]" />
                      )}
                    </div>
                  </motion.div>
                </div>
                  );
                })()
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
