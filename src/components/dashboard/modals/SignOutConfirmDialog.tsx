import React from 'react';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { Button } from '../../ui/Button';

// Sign Out Confirmation Dialog
export const SignOutConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#0F1A2A] rounded-2xl shadow-2xl shadow-black/30 w-full max-w-sm border border-[#22C55E]/10 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-[#22C55E]/10">
          <h3 className="font-bold text-white flex items-center gap-2">
            <LogOut size={18} className="text-red-400" /> Sign Out
          </h3>
        </div>
        <div className="p-6">
          <p className="text-slate-300 text-sm mb-6">
            Are you sure you want to sign out? Your unsaved changes will be preserved locally, but you'll need to sign in again to continue.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-medium text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
