import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../ui/Button';

// Create Project Modal
export const CreateProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    setName('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#0F1A2A] rounded-2xl shadow-2xl shadow-black/30 w-full max-w-sm border border-[#22C55E]/10 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#22C55E]/10">
          <h3 className="font-bold text-white">New Project</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Project name</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
              className="w-full px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
