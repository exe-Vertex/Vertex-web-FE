import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../ui/Button';
import { useLang } from '../../../contexts/LanguageContext';

// Create Project Modal
export const CreateProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, deadline: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const { lang } = useLang();
  const isVi = lang === 'vi';
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deadline || deadline < today) return;
    onSubmit(name.trim(), deadline);
    setName('');
    setDeadline('');
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
          <h3 className="font-bold text-white">{isVi ? 'Dự án mới' : 'New Project'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{isVi ? 'Tên dự án' : 'Project name'}</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isVi ? 'Nhập tên dự án...' : 'Enter project name...'}
              className="w-full px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{isVi ? 'Hạn hoàn thành' : 'Deadline'}</label>
            <input
              type="date"
              required
              min={today}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#22C55E]/10 bg-[#162032] text-white focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>{isVi ? 'Hủy' : 'Cancel'}</Button>
            <Button type="submit" variant="primary">{isVi ? 'Tạo dự án' : 'Create'}</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
