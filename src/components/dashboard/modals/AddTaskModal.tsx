import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../ui/Button';
import { Status, Priority } from '../../../types';

// Add Task Modal
export const AddTaskModal: React.FC<{
  isOpen: boolean;
  status: Status;
  onClose: () => void;
  onSubmit: (title: string, priority: Priority, description: string, attachmentCount: number) => void;
}> = ({ isOpen, status, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [description, setDescription] = useState('');
  const [attachmentCount, setAttachmentCount] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), priority, description, attachmentCount);
    setTitle('');
    setPriority('medium');
    setDescription('');
    setAttachmentCount(0);
  };

  const statusLabels: Record<Status, string> = {
    'todo': 'Todo',
    'in-progress': 'In Progress',
    'ready-for-review': 'Ready for Review',
    'done': 'Done',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#0F1A2A] rounded-2xl shadow-2xl shadow-black/30 w-full max-w-md border border-[#22C55E]/10 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#22C55E]/10 flex items-center justify-between">
          <h3 className="font-bold text-white">New Task</h3>
          <span className="text-xs text-slate-500 bg-[#162032] px-2 py-1 rounded">{statusLabels[status]}</span>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Task title</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all capitalize ${
                    priority === p
                      ? p === 'high' ? 'border-red-500/50 bg-red-500/10 text-red-400'
                        : p === 'medium' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                        : 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-[#22C55E]/10 text-slate-400 hover:bg-[#162032]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Note (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add quick note for this task..."
              className="w-full min-h-20 px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Attachments count</label>
            <input
              type="number"
              min={0}
              value={attachmentCount}
              onChange={(e) => setAttachmentCount(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Create Task</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
