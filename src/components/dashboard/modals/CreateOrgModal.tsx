import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2 } from 'lucide-react';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, slug: string) => void;
  loading?: boolean;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  const handleNameChange = (value: string) => {
    setName(value);
    if (autoSlug) {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-'),
      );
    }
  };

  const handleSlugChange = (value: string) => {
    setAutoSlug(false);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/--+/g, '-'),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    onSubmit(name.trim(), slug.trim());
  };

  const handleClose = () => {
    if (loading) return;
    setName('');
    setSlug('');
    setAutoSlug(true);
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
                  <Building2 size={18} className="text-[#22C55E]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Create Organization</h3>
                  <p className="text-xs text-slate-500">Set up a new workspace for your team</p>
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
                  Organization Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Design Studio"
                  autoFocus
                  className="w-full rounded-xl border border-[#22C55E]/10 bg-[#162032] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22C55E]/35 focus:ring-1 focus:ring-[#22C55E]/30 placeholder-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  URL Slug <span className="text-red-400">*</span>
                </label>
                <div className="flex rounded-xl overflow-hidden border border-[#22C55E]/10 focus-within:border-[#22C55E]/35 focus-within:ring-1 focus-within:ring-[#22C55E]/30">
                  <span className="bg-[#0F1A2A] px-4 py-2.5 text-sm text-slate-500 border-r border-[#22C55E]/10 flex-shrink-0">
                    vertex.app/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="design-studio"
                    className="w-full bg-[#162032] px-4 py-2.5 text-sm text-white outline-none placeholder-slate-500"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Only lowercase letters, numbers, and hyphens.
                </p>
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
                  disabled={!name.trim() || !slug.trim() || loading}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-sm font-semibold shadow-lg shadow-green-500/20 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
