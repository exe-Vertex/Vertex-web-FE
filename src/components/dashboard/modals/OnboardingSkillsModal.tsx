import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../ui/Button';

const SKILL_CATEGORIES = [
  {
    name: 'Frontend',
    skills: ['React', 'Vue', 'Angular', 'TypeScript', 'HTML/CSS', 'Tailwind CSS', 'Next.js', 'Vite']
  },
  {
    name: 'Backend',
    skills: ['C#/.NET', 'Java', 'Spring Boot', 'Node.js', 'Express', 'Python', 'Django', 'Go', 'NestJS']
  },
  {
    name: 'Database',
    skills: ['SQL Server', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Prisma']
  },
  {
    name: 'Design & UI/UX',
    skills: ['Figma', 'UI/UX Design', 'Adobe XD', 'Photoshop', 'Graphic Design']
  },
  {
    name: 'Management & DevOps',
    skills: ['Project Management', 'QA/Testing', 'Agile/Scrum', 'Git/Github', 'CI/CD', 'Devops']
  }
];

interface OnboardingSkillsModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSubmit: (skills: string[]) => Promise<void>;
  isClosable?: boolean;
}

export const OnboardingSkillsModal: React.FC<OnboardingSkillsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isClosable = false
}) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (selectedSkills.includes(trimmed)) {
      setSelectedSkills(selectedSkills.filter(s => s !== trimmed));
    } else {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setCustomSkill('');
  };

  const handleSave = async () => {
    if (selectedSkills.length === 0) {
      setError('Vui lòng chọn ít nhất 1 kỹ năng để tiếp tục.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(selectedSkills);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra khi lưu kỹ năng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={() => isClosable && onClose && onClose()} 
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#0F1A2A] rounded-2xl shadow-2xl shadow-black/50 w-full max-w-2xl border border-[#22C55E]/15 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#22C55E]/10 flex justify-between items-center bg-[#162032]/40">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse"></span>
              Chào mừng bạn đến với Vertex!
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Hãy chọn các kỹ năng chuyên môn của bạn để AI có thể phân chia công việc chính xác nhất.
            </p>
          </div>
          {isClosable && onClose && (
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Selected Skills Chips */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Kỹ năng đã chọn ({selectedSkills.length})</h4>
            {selectedSkills.length === 0 ? (
              <div className="text-sm text-slate-500 italic p-3 bg-[#162032]/30 rounded-xl border border-dashed border-slate-700/50 text-center">
                Chưa có kỹ năng nào được chọn. Nhấp vào các gợi ý bên dưới hoặc tự thêm kỹ năng của bạn.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-[#162032]/50 rounded-xl border border-[#22C55E]/5 max-h-[120px] overflow-y-auto">
                {selectedSkills.map(skill => (
                  <span 
                    key={skill} 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ADE80] text-xs font-medium"
                  >
                    {skill}
                    <button 
                      type="button" 
                      onClick={() => toggleSkill(skill)} 
                      className="text-[#4ADE80] hover:text-white hover:bg-[#22C55E]/20 rounded p-0.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Add custom skill input */}
          <form onSubmit={handleAddCustomSkill} className="flex gap-2">
            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              placeholder="Nhập kỹ năng khác (ví dụ: Python, Docker, Next.js)..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all text-sm"
            />
            <Button type="submit" variant="secondary" size="sm" className="!py-2.5">
              Thêm +
            </Button>
          </form>

          {/* Suggestion Categories */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-semibold text-slate-300">Gợi ý theo danh mục</h4>
            {SKILL_CATEGORIES.map(category => (
              <div key={category.name} className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{category.name}</span>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map(skill => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                          isSelected 
                            ? 'bg-[#22C55E]/20 border-[#22C55E] text-[#4ADE80] shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                            : 'bg-[#162032] border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#22C55E]/10 bg-[#162032]/40 flex flex-col sm:flex-row sm:justify-between items-center gap-3">
          <div className="text-xs text-red-400 font-medium">
            {error && <span>⚠️ {error}</span>}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            {isClosable && onClose && (
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
            )}
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleSave} 
              isLoading={isSubmitting}
              disabled={selectedSkills.length === 0}
              className="w-full sm:w-auto"
            >
              Lưu & Tiếp tục
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
