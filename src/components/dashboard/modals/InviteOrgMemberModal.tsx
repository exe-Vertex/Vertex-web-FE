import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Shield, ShieldCheck, Users, GraduationCap } from 'lucide-react';

interface InviteOrgMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, role: string) => void;
  loading?: boolean;
  orgName?: string;
}

const ROLES = [
  { value: 'member', label: 'Member', icon: Users, description: 'Can view and edit assigned tasks', color: 'text-slate-300' },
  { value: 'lecturer', label: 'Lecturer', icon: GraduationCap, description: 'Can manage projects and review work', color: 'text-orange-400' },
  { value: 'admin', label: 'Admin', icon: Shield, description: 'Full management access except ownership', color: 'text-blue-400' },
] as const;

export const InviteOrgMemberModal: React.FC<InviteOrgMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  orgName = 'organization',
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmit(email.trim(), role);
  };

  const handleClose = () => {
    if (loading) return;
    setEmail('');
    setRole('member');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-[#0F1A2A]/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 w-[480px] max-w-full mx-4 overflow-hidden border border-[#22C55E]/10"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#22C55E]/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                  <UserPlus size={18} className="text-[#22C55E]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Invite Member</h3>
                  <p className="text-xs text-slate-500">Add someone to {orgName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg hover:bg-[#162032] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  autoFocus
                  className="w-full rounded-xl border border-[#22C55E]/10 bg-[#162032] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22C55E]/35 focus:ring-1 focus:ring-[#22C55E]/30 placeholder-slate-500"
                />
                <p className="text-xs text-slate-500">
                  The user must have a Vertex account to be invited.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Role</label>
                <div className="space-y-2">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#22C55E]/35 bg-[#22C55E]/8'
                            : 'border-[#22C55E]/10 bg-[#162032]/50 hover:border-[#22C55E]/20'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[#22C55E]/15' : 'bg-[#162032]'
                        }`}>
                          <Icon size={16} className={isSelected ? 'text-[#22C55E]' : r.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {r.label}
                          </p>
                          <p className="text-xs text-slate-500">{r.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0">
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-[#162032] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!email.trim() || loading}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-sm font-semibold shadow-lg shadow-green-500/20 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
