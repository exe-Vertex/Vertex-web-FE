import React from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#0F1A2A] rounded-2xl shadow-2xl shadow-black/30 w-full max-w-sm border border-red-500/10 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-red-500/10">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Trash2 size={18} className="text-red-500" /> {title}
          </h3>
        </div>
        <div className="p-6">
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            {message}
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium text-sm transition-colors shadow-lg shadow-red-500/15"
            >
              Xóa
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
