import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { verifyInvitation, acceptInvitation, VerifyInvitationResponse } from '../api/invitation';
import { getAuthToken } from '../components/dashboard/utils/dashboardUtils';
import { useAuth } from '../contexts/AuthContext';
import { getUserSkills } from '../api/auth';
import { updateProjectMemberRole } from '../api/project';
import { Button } from '../components/ui/Button';

const SUGGESTED_TARGET_SKILLS = [
  'Frontend Dev', 'Backend Dev', 'Fullstack Dev', 'UI/UX Design', 
  'QA & Testing', 'Project Management', 'DevOps', 'Database Dev', 'Content Writing'
];

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitationInfo, setInvitationInfo] = useState<VerifyInvitationResponse | null>(null);
  const [accepting, setAccepting] = useState(false);
  
  // Phase 2: Skills Selection
  const [showSkillsSetup, setShowSkillsSetup] = useState(false);
  const [coreSkills, setCoreSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ hoặc không tồn tại.');
      setLoading(false);
      return;
    }

    verifyInvitation(token)
      .then(data => {
        setInvitationInfo(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Có lỗi xảy ra khi xác thực thư mời.');
        setLoading(false);
      });
  }, [token]);

  // Load user core skills to pre-fill target skills
  useEffect(() => {
    if (showSkillsSetup) {
      const authToken = getAuthToken();
      if (!authToken) return;
      getUserSkills(authToken)
        .then(skills => {
          setCoreSkills(skills || []);
          // Automatically select core skills that match suggested ones, or pre-fill all of them
          setSelectedSkills(skills || []);
        })
        .catch(err => {
          console.error('Failed to load core skills in AcceptInvite:', err);
        });
    }
  }, [showSkillsSetup]);

  const handleAccept = async () => {
    if (!token) return;
    const authToken = getAuthToken();
    if (!authToken) {
      // Not logged in -> Redirect to login with return url
      const returnUrl = encodeURIComponent(`/invite/accept?token=${token}`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    try {
      setAccepting(true);
      await acceptInvitation(token);
      
      // If it is a Project invitation, prompt them to set their target skills for the project
      if (invitationInfo?.targetType === 'Project') {
        setShowSkillsSetup(true);
      } else {
        alert('Chấp nhận lời mời thành công!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi chấp nhận lời mời.');
    } finally {
      setAccepting(false);
    }
  };

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
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

  const handleSaveSkills = async () => {
    const authToken = getAuthToken();
    if (!authToken || !invitationInfo || !user) {
      navigate('/dashboard');
      return;
    }

    setSavingSkills(true);
    try {
      const orgId = invitationInfo.orgId;
      const projectId = invitationInfo.targetId;
      
      if (orgId && projectId) {
        // Save target skills for project member
        const skillsString = selectedSkills.join(', ');
        await updateProjectMemberRole(authToken, orgId, projectId, user.id, {
          role: invitationInfo.role,
          projectSkills: skillsString
        });
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving project target skills:', err);
      // Fallback navigate anyway
      navigate('/dashboard');
    } finally {
      setSavingSkills(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090F1A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#22C55E]/30 border-t-[#22C55E] rounded-full animate-spin"></div>
          <div className="text-slate-400 text-sm font-medium">Đang kiểm tra thư mời...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#090F1A] p-4 font-sans select-none overflow-y-auto">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#22C55E]/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#3B82F6]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative w-full max-w-lg bg-[#0F1A2A]/80 backdrop-blur-md border border-[#22C55E]/15 p-8 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        <AnimatePresence mode="wait">
          {!showSkillsSetup ? (
            <motion.div
              key="invite-details"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {error ? (
                <>
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/25 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 text-3xl shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                    ❌
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Không thể xác nhận thư mời</h2>
                  <p className="text-slate-400 mb-8 text-sm">{error}</p>
                  <Button
                    onClick={() => navigate('/')}
                    variant="secondary"
                    className="w-full"
                  >
                    Về trang chủ
                  </Button>
                </>
              ) : invitationInfo ? (
                <>
                  <div className="w-16 h-16 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#4ADE80] text-3xl shadow-[0_0_20px_rgba(34,197,94,0.15)] animate-bounce">
                    ✉️
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Bạn có một lời mời!</h2>
                  <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                    Bạn được mời tham gia vào dự án <strong>{invitationInfo.targetType === 'Project' ? 'Dự án' : 'Tổ chức'}</strong> với vai trò <span className="px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#4ADE80] border border-[#22C55E]/20 text-xs font-semibold">{invitationInfo.role}</span>.
                  </p>
                  
                  {!getAuthToken() && (
                    <div className="mb-6 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-left leading-relaxed">
                      ⚠️ Bạn cần phải <strong>Đăng nhập</strong> hoặc <strong>Tạo tài khoản</strong> bằng email <span className="underline font-semibold">{invitationInfo.email}</span> để chấp nhận lời mời này.
                    </div>
                  )}

                  <Button
                    onClick={handleAccept}
                    disabled={accepting}
                    variant="primary"
                    className="w-full"
                    isLoading={accepting}
                  >
                    {!getAuthToken() ? 'Đăng nhập để chấp nhận' : 'Chấp nhận tham gia'}
                  </Button>
                </>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="skills-setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#60A5FA] text-2xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  ⚡
                </div>
                <h2 className="text-xl font-bold text-white">Lựa chọn kỹ năng cho dự án</h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Hãy chỉ định các kỹ năng hoặc vai trò bạn muốn đảm nhận trong dự án này để AI hỗ trợ phân công công việc tối ưu nhất.
                </p>
              </div>

              {/* Display selected chips */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kỹ năng tham gia dự án</label>
                {selectedSkills.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-3 bg-[#162032]/40 rounded-xl border border-dashed border-slate-700/50 text-center">
                    Chưa chọn kỹ năng nào. Hãy chọn từ gợi ý hoặc nhập bên dưới.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-[#162032]/60 rounded-xl border border-[#22C55E]/10 max-h-[100px] overflow-y-auto">
                    {selectedSkills.map(skill => (
                      <span 
                        key={skill} 
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ADE80] text-xs font-medium"
                      >
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => handleToggleSkill(skill)}
                          className="hover:text-white transition-colors ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add custom tag */}
              <form onSubmit={handleAddCustomSkill} className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Nhập kỹ năng khác và nhấn Enter..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-[#162032] text-white placeholder-slate-500 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none transition-all text-xs"
                />
                <Button type="submit" variant="secondary" size="sm" className="!py-2">
                  Thêm
                </Button>
              </form>

              {/* Suggested core skills */}
              {coreSkills.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Kỹ năng cá nhân của bạn (Core Skills)</label>
                  <div className="flex flex-wrap gap-2">
                    {coreSkills.map(skill => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={`core-${skill}`}
                          onClick={() => handleToggleSkill(skill)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            isSelected 
                              ? 'bg-[#22C55E]/20 border-[#22C55E] text-[#4ADE80]'
                              : 'bg-[#162032] border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Gợi ý vai trò phổ biến</label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TARGET_SKILLS.map(skill => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => handleToggleSkill(skill)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected 
                            ? 'bg-[#22C55E]/20 border-[#22C55E] text-[#4ADE80]'
                            : 'bg-[#162032] border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  className="flex-1"
                  disabled={savingSkills}
                >
                  Bỏ qua
                </Button>
                <Button
                  onClick={handleSaveSkills}
                  variant="primary"
                  className="flex-1"
                  isLoading={savingSkills}
                >
                  Lưu & Tiếp tục
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AcceptInvite;
