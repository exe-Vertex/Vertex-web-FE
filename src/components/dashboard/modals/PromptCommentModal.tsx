import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../ui/Button';

interface PromptCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}

export const PromptCommentModal: React.FC<PromptCommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(comment);
    setComment('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0F1A2A] border border-[#22C55E]/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Vui lòng nhập nhận xét/lý do cho member biết:</h3>
              <p className="text-sm text-slate-400 mb-6">Nhận xét này sẽ được ghi vào phần mô tả của công việc.</p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ghi chú của bạn..."
                  className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-[#22C55E]/20 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all resize-y"
                  autoFocus
                />
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={onClose}>Hủy (Cancel drop)</Button>
                  <Button type="submit" variant="primary">Xác nhận</Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
