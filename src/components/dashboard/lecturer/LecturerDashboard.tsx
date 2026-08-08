import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Settings, ChevronLeft, ChevronRight,
  Bell, Menu, X, LogOut, User, BookOpen, Users, Calendar,
  CheckCircle, Clock, AlertTriangle, TrendingUp, Search,
  ChevronDown, Sparkles,
} from 'lucide-react';
import { LecturerGroup } from '../../../data/lecturerTypes';
import { useAuth } from '../../../contexts/AuthContext';
import { GroupDetail } from './GroupDetail';
import { useLang } from '../../../contexts/LanguageContext';
import { DeadlineCalendar } from './DeadlineCalendar';
import { 
  getGroups, 
  getGroupDetail, 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead 
} from '../../../api/lecturer';

type LecturerView = 'overview' | 'groups' | 'group-detail' | 'deadlines';

interface LecturerDashboardProps {
  onNavigate?: (page: string) => void;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface LecturerSidebarProps {
  isOpen: boolean;
  activeView: LecturerView;
  activeClass: string | null;
  selectedGroupId: string | null;
  onNavigate: (view: LecturerView, classFilter?: string | null) => void;
  onSettings: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  groups: LecturerGroup[];
  classes: string[];
}

const LecturerSidebar: React.FC<LecturerSidebarProps> = ({
  isOpen, activeView, activeClass, onNavigate, onSettings, collapsed, setCollapsed, groups, classes
}) => {
  const [classesOpen, setClassesOpen] = useState(true);
  const { lang } = useLang();
  const isVi = lang === 'vi';

  const navItems = [
    { id: 'overview', label: isVi ? 'Tổng quan' : 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'groups', label: isVi ? 'Nhóm sinh viên' : 'Student groups', icon: <Users size={18} /> },
    { id: 'deadlines', label: isVi ? 'Hạn nộp' : 'Deadlines', icon: <Calendar size={18} /> },
    { id: 'settings', label: isVi ? 'Cài đặt' : 'Settings', icon: <Settings size={18} /> },
  ];

  const handleNav = (id: string) => {
    if (id === 'settings') { onSettings(); return; }
    if (id === 'groups')   { onNavigate('groups', null); return; }
    onNavigate(id as LecturerView);
  };

  const isNavActive = (id: string) => {
    if (id === 'overview' && activeView === 'overview') return true;
    if (id === 'groups'   && (activeView === 'groups' || activeView === 'group-detail')) return true;
    if (id === 'deadlines' && activeView === 'deadlines') return true;
    return false;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden" />
        )}
      </AnimatePresence>

      <aside className={`fixed left-0 top-16 bottom-0 bg-[#0F1A2A]/90 backdrop-blur-xl border-r border-[#F59E0B]/15 transition-all duration-300 z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)] ${collapsed ? 'w-[60px]' : 'w-64'}`}>
        <div className="flex flex-col h-full relative">

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex absolute -right-3 top-5 z-40 w-6 h-6 rounded-full bg-[#162032] border border-[#F59E0B]/35 items-center justify-center text-slate-400 hover:text-[#6EE7B7] hover:border-[#FCD34D]/65 hover:shadow-[0_8px_18px_rgba(34,197,94,0.24)] transition-all duration-200 shadow-md">
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          {/* Nav */}
          <nav className="p-3 pt-4 space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => handleNav(item.id)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isNavActive(item.id) ? 'text-white bg-[#F59E0B]/15 border border-[#F59E0B]/30 shadow-[0_10px_24px_rgba(245,158,11,0.2)]' : 'text-slate-400 border border-transparent hover:bg-[#162032] hover:text-white hover:border-[#F59E0B]/30 hover:shadow-[0_10px_24px_rgba(10,15,26,0.45)]'} ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <span className={isNavActive(item.id) ? 'text-[#FCD34D]' : ''}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && isNavActive(item.id) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />}
              </button>
            ))}
          </nav>

          <div className="mx-3 h-px bg-[#22C55E]/10" />

          {/* MY CLASS section */}
          {!collapsed && (
            <div className="px-3 pt-3 pb-2 flex-1 overflow-y-auto">
              <button onClick={() => setClassesOpen(o => !o)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-all duration-200 rounded-lg hover:bg-[#162032] hover:shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
                <span className="flex items-center gap-1.5"><BookOpen size={10} />{isVi ? 'LỚP CỦA TÔI' : 'MY CLASSES'}</span>
                <ChevronDown size={10} className={`transition-transform ${classesOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {classesOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 space-y-0.5">
                    {classes.map(cls => {
                      const count = groups.filter(g => g.className === cls).length;
                      const isActive = activeView === 'groups' && activeClass === cls;
                      return (
                        <button key={cls} onClick={() => onNavigate('groups', cls)}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive ? 'bg-[#22C55E]/15 border border-[#F59E0B]/35 text-white shadow-[0_8px_18px_rgba(34,197,94,0.12)]' : 'text-slate-400 border border-transparent hover:bg-[#162032] hover:text-white hover:border-[#F59E0B]/30'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-[#22C55E]' : 'bg-slate-600'}`} />
                            <span className="text-xs font-medium truncate">{cls}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1 ${isActive ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-slate-700 text-slate-500'}`}>{count}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Collapsed: class icons */}
          {collapsed && (
            <div className="flex-1 flex flex-col items-center pt-3 gap-2">
              {classes.map((cls, i) => (
                <button key={cls} onClick={() => onNavigate('groups', cls)}
                  title={cls}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-[10px] font-black ${activeClass === cls ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#F59E0B]/35 shadow-[0_8px_18px_rgba(34,197,94,0.14)]' : 'bg-[#162032] text-slate-500 border border-transparent hover:text-[#6EE7B7] hover:border-[#F59E0B]/35 hover:shadow-[0_8px_16px_rgba(10,15,26,0.5)]'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }> = ({ label, value, icon, color, sub }) => (
  <div className={`bg-[#0F1A2A] rounded-xl p-4 border ${color} flex items-start gap-3`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color.replace('border-', 'bg-').replace('/20', '/10')}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Dashboard Overview (Class-level) ────────────────────────────────────────
const DashboardOverview: React.FC<{
  onSelectGroup: (group: LecturerGroup) => void;
  groups: LecturerGroup[];
}> = ({ onSelectGroup, groups }) => {
  const totalGroups = groups.length;
  const activeProjects = groups.filter(g => g.progress > 0 && g.progress < 100).length;
  const { lang } = useLang();
  const isVi = lang === 'vi';
  const tasksWaitingReview = groups.flatMap(g => g.tasks || []).filter(t => t.status === 'ready-for-review').length;
  const groupsOverdue = groups.filter(g => g.reviewStatus === 'overdue').length;

  const groupsNeedingAttention = [...groups]
    .filter(g => g.reviewStatus === 'at-risk' || g.reviewStatus === 'overdue')
    .sort((a, b) => {
      const weight = (s: string) => (s === 'overdue' ? 0 : 1);
      const statusDiff = weight(a.reviewStatus) - weight(b.reviewStatus);
      if (statusDiff !== 0) return statusDiff;
      return a.progress - b.progress;
    })
    .slice(0, 6);

  const onTrackCount = groups.filter(g => g.reviewStatus === 'on-track').length;
  const atRiskCount = groups.filter(g => g.reviewStatus === 'at-risk').length;
  const overdueCount = groups.filter(g => g.reviewStatus === 'overdue').length;
  const chartMax = Math.max(onTrackCount, atRiskCount, overdueCount, 1);

  const upcomingDeadlines = [...groups]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{isVi ? 'Tổng quan' : 'Overview'}</h1>
        <p className="text-sm text-slate-500 mt-1">{isVi ? 'Theo dõi cảnh báo, tiến độ và hạn nộp của các lớp.' : 'Track alerts, progress, and deadlines across your classes.'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={isVi ? 'Nhóm' : 'Groups'} value={totalGroups} icon={<Users size={18} className="text-[#22C55E]" />} color="border-[#F59E0B]/35" />
        <StatCard label={isVi ? 'Dự án đang hoạt động' : 'Active projects'} value={activeProjects} icon={<TrendingUp size={18} className="text-blue-400" />} color="border-blue-500/20" />
        <StatCard label={isVi ? 'Công việc chờ duyệt' : 'Tasks awaiting review'} value={tasksWaitingReview} icon={<Clock size={18} className="text-purple-400" />} color="border-purple-500/20" />
        <StatCard label={isVi ? 'Nhóm quá hạn' : 'Overdue groups'} value={groupsOverdue} icon={<AlertTriangle size={18} className="text-red-400" />} color="border-red-500/20" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-[#0F1A2A] rounded-xl border border-[#3A3317] p-4">
          <h2 className="text-sm font-bold text-white mb-3">{isVi ? 'Nhóm cần chú ý' : 'Groups needing attention'}</h2>
          <div className="space-y-2">
            {groupsNeedingAttention.length === 0 ? (
              <p className="text-xs text-slate-500">{isVi ? 'Hiện không có nhóm nào gặp rủi ro.' : 'No groups are currently at risk.'}</p>
            ) : (
              groupsNeedingAttention.map(group => (
                <button key={group.id}
                  onClick={() => onSelectGroup(group)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-transparent hover:border-[#F59E0B]/30 hover:bg-[#162032] transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-white font-medium truncate">{group.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${group.reviewStatus === 'overdue' ? 'text-red-300 bg-red-500/10 border-red-500/25' : 'text-amber-300 bg-amber-500/10 border-amber-500/25'}`}>
                      {group.reviewStatus === 'overdue' ? (isVi ? 'Quá hạn' : 'Overdue') : (isVi ? 'Có rủi ro' : 'At risk')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{group.className}</p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="bg-[#0F1A2A] rounded-xl border border-[#3A3317] p-4">
          <h2 className="text-sm font-bold text-white mb-3">{isVi ? 'Tiến độ lớp' : 'Class progress'}</h2>
          <div className="space-y-3">
            {[
              { label: isVi ? 'Đúng tiến độ' : 'On track', value: onTrackCount, bar: 'bg-green-400' },
              { label: isVi ? 'Có rủi ro' : 'At risk', value: atRiskCount, bar: 'bg-amber-400' },
              { label: isVi ? 'Quá hạn' : 'Overdue', value: overdueCount, bar: 'bg-red-400' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300">{item.label}</span>
                  <span className="text-xs font-bold text-white">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-[#162032] overflow-hidden">
                  <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${(item.value / chartMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-[#0F1A2A] rounded-xl border border-[#3A3317] p-4">
        <h2 className="text-sm font-bold text-white mb-3">{isVi ? 'Hạn nộp sắp tới' : 'Upcoming deadlines'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {upcomingDeadlines.map(group => (
            <button key={group.id}
              onClick={() => onSelectGroup(group)}
              className="text-left px-3 py-2 rounded-lg border border-transparent hover:border-[#F59E0B]/30 hover:bg-[#162032] transition-all duration-200">
              <p className="text-sm font-medium text-white truncate">{group.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{group.deadline}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

// ── Group Card ────────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  'on-track': 'text-green-400 bg-green-400/10 border-amber-500/25',
  'at-risk':  'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'overdue':  'text-red-400   bg-red-400/10   border-red-400/20',
};
const statusLabels: Record<string, { vi: string; en: string }> = {
  'on-track': { vi: 'Đúng tiến độ', en: 'On track' },
  'at-risk': { vi: 'Có rủi ro', en: 'At risk' },
  'overdue': { vi: 'Quá hạn', en: 'Overdue' },
};

const GroupCard: React.FC<{ group: LecturerGroup; onClick: () => void }> = ({ group, onClick }) => {
  const reviewCount = group.tasks.filter(t => t.status === 'ready-for-review').length;
  const { lang } = useLang();
  const isVi = lang === 'vi';
  return (
    <motion.button whileHover={{ y: -2 }} onClick={onClick}
      className="text-left w-full bg-[#0F1A2A] rounded-xl p-4 border border-[#3A3317] hover:border-[#F59E0B]/35 hover:shadow-[0_18px_34px_rgba(10,15,26,0.45)] transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#6EE7B7] transition-colors">{group.name}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{group.className}</p>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ml-2 ${statusColors[group.reviewStatus]}`}>
          {statusLabels[group.reviewStatus][isVi ? 'vi' : 'en']}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-slate-500">{isVi ? 'Tiến độ' : 'Progress'}</span>
          <span className="text-[10px] font-semibold text-white">{group.progress}%</span>
        </div>
        <div className="h-1.5 bg-[#162032] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${group.reviewStatus === 'overdue' ? 'bg-red-400' : group.reviewStatus === 'at-risk' ? 'bg-amber-400' : 'bg-green-400'}`}
            style={{ width: `${group.progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Avatar stack */}
          {group.avatarInitials.slice(0, 3).map((init, i) => (
            <div key={i} className="w-5 h-5 rounded-full bg-[#162032] border border-[#3A3317] flex items-center justify-center text-[8px] font-bold text-slate-400"
              style={{ marginLeft: i > 0 ? '-4px' : 0 }}>
              {init[0]}
            </div>
          ))}
          {group.members > 3 && (
            <div className="w-5 h-5 rounded-full bg-[#162032] border border-[#3A3317] flex items-center justify-center text-[8px] text-slate-500"
              style={{ marginLeft: '-4px' }}>
              +{group.members - 3}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {reviewCount > 0 && (
            <span className="flex items-center gap-0.5 text-[#22C55E] font-semibold">
              <Clock size={9} />{reviewCount} {isVi ? 'chờ duyệt' : 'awaiting review'}
            </span>
          )}
          <span className="flex items-center gap-0.5"><Calendar size={9} />{group.deadline}</span>
        </div>
      </div>
    </motion.button>
  );
};

// ── AI Insights panel ────────────────────────────────────────────────────────
const AiInsightsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { lang } = useLang();
  const isVi = lang === 'vi';
  const insights = [
    { type: 'warning', text: isVi ? 'Nhóm 2 có thể trễ hạn ngày 18/03 vì giai đoạn thiết kế đã chậm 3 ngày.' : 'Group 2 may miss the March 18 deadline because design is three days behind.' },
    { type: 'warning', text: isVi ? 'Nhóm 7, 14 và 17 đã quá hạn. Nên gửi lời nhắc theo dõi.' : 'Groups 7, 14, and 17 are overdue. Consider sending follow-up reminders.' },
    { type: 'info', text: isVi ? 'Có 7 công việc thuộc 5 nhóm đang chờ bạn duyệt.' : 'Seven tasks across five groups are awaiting your review.' },
    { type: 'success', text: isVi ? 'Nhóm 5 đã đạt 90% và có thể nộp sớm.' : 'Group 5 is 90% complete and may submit early.' },
    { type: 'info', text: isVi ? 'Tiến độ trung bình của tất cả 20 nhóm là 58%.' : 'Average progress across all 20 groups is 58%.' },
  ];
  return (
    <motion.div initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
      className="fixed right-0 top-16 bottom-0 w-80 bg-[#0F1A2A] border-l border-[#F59E0B]/15 z-40 flex flex-col shadow-2xl">
      <div className="p-4 border-b border-[#F59E0B]/15 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-[#22C55E]" />
          <h3 className="text-sm font-bold text-white">{isVi ? 'Phân tích dự án bằng AI' : 'AI project insights'}</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {insights.map((ins, i) => (
          <div key={i} className={`p-3 rounded-lg border text-xs leading-relaxed ${ins.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-200' : ins.type === 'success' ? 'bg-green-500/5 border-amber-500/30 text-green-300' : 'bg-blue-500/5 border-blue-500/20 text-blue-300'}`}>
            {ins.text}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-[#F59E0B]/15">
        <p className="text-[10px] text-slate-600 text-center">{isVi ? 'Phân tích AI dựa trên dữ liệu nhóm hiện tại' : 'AI insights based on current group data'}</p>
      </div>
    </motion.div>
  );
};

// ── Groups Overview ───────────────────────────────────────────────────────────
const GroupsOverview: React.FC<{
  activeClass: string | null;
  onSelectGroup: (group: LecturerGroup) => void;
  groups: LecturerGroup[];
}> = ({ activeClass, onSelectGroup, groups }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'on-track' | 'at-risk' | 'overdue'>('all');
  const { lang } = useLang();
  const isVi = lang === 'vi';

  const filtered = groups.filter(g => {
    const matchClass  = !activeClass || g.className === activeClass;
    const matchStatus = filterStatus === 'all' || g.reviewStatus === filterStatus;
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchStatus && matchSearch;
  });

  const totalGroups   = groups.length;
  const activeCount   = groups.filter(g => g.progress > 0 && g.progress < 100).length;
  const reviewCount   = groups.flatMap(g => g.tasks || []).filter(t => t.status === 'ready-for-review').length;
  const overdueCount  = groups.filter(g => g.reviewStatus === 'overdue').length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">{isVi ? 'Nhóm sinh viên' : 'Student groups'}</h1>
        <p className="text-sm text-slate-500 mt-1">{isVi ? 'Xem, quản lý, mở chi tiết dự án và duyệt công việc.' : 'View groups, open project details, and review tasks.'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={isVi ? 'Tổng số nhóm' : 'Total groups'} value={totalGroups} icon={<Users size={18} className="text-[#22C55E]" />} color="border-[#F59E0B]/35" />
        <StatCard label={isVi ? 'Dự án đang hoạt động' : 'Active projects'} value={activeCount} icon={<TrendingUp size={18} className="text-blue-400" />} color="border-blue-500/20" />
        <StatCard label={isVi ? 'Công việc chờ duyệt' : 'Tasks awaiting review'} value={reviewCount} icon={<Clock size={18} className="text-purple-400" />} color="border-purple-500/20" />
        <StatCard label={isVi ? 'Nhóm quá hạn' : 'Overdue groups'} value={overdueCount} icon={<AlertTriangle size={18} className="text-red-400" />} color="border-red-500/20" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isVi ? 'Tìm kiếm nhóm...' : 'Search groups...'}
            className="w-full pl-9 pr-3 py-2 bg-[#162032] border border-[#3A3317] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]/45" />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'on-track', 'at-risk', 'overdue'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize ${filterStatus === s ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#F59E0B]/35' : 'bg-[#162032] text-slate-400 border border-transparent hover:border-[#3A3317] hover:text-white'}`}>
              {s === 'all' ? (isVi ? 'Tất cả' : 'All') : s === 'on-track' ? (isVi ? 'Đúng tiến độ' : 'On track') : s === 'at-risk' ? (isVi ? 'Có rủi ro' : 'At risk') : (isVi ? 'Quá hạn' : 'Overdue')}
            </button>
          ))}
        </div>
      </div>

      {/* Section heading */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-300">
          {activeClass ?? (isVi ? 'Tất cả nhóm' : 'All groups')}
          <span className="ml-2 text-slate-600 font-normal">({filtered.length} {isVi ? 'nhóm' : 'groups'})</span>
        </h2>
      </div>

      {/* Group grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map(group => (
          <GroupCard key={group.id} group={group} onClick={() => onSelectGroup(group)} />
        ))}
      </div>
    </div>
  );
};

// ── Main LecturerDashboard ────────────────────────────────────────────────────
export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({ onNavigate }) => {
  const [view,            setView]            = useState<LecturerView>('overview');
  const [activeClass,     setActiveClass]     = useState<string | null>(null);
  const [selectedGroup,   setSelectedGroup]   = useState<LecturerGroup | null>(null);
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [collapsed,       setCollapsed]       = useState(false);
  const [showNotif,       setShowNotif]       = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);
  const [showAI,          setShowAI]          = useState(false);
  
  const [groups,          setGroups]          = useState<LecturerGroup[]>([]);
  const [notifications,   setNotifications]   = useState<any[]>([]);
  const [classes,         setClasses]         = useState<string[]>([]);
  const [loading,         setLoading]         = useState(true);
  
  const { user, logout: authLogout } = useAuth();

  const { lang } = useLang();
  const isVi = lang === 'vi';
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchLecturerData = useCallback(async () => {
    try {
      setLoading(true);
      const loadedGroups = await getGroups();
      setGroups(loadedGroups);

      // Extract unique classes
      const uniqueClasses = Array.from(new Set(loadedGroups.map(g => g.className)));
      setClasses(uniqueClasses);

      const loadedNotifs = await getNotifications();
      setNotifications(loadedNotifs);
    } catch (err) {
      console.error('Failed to load lecturer data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLecturerData();
  }, [fetchLecturerData]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNavSidebar = (v: LecturerView, cls?: string | null) => {
    setView(v);
    if (cls !== undefined) setActiveClass(cls);
    setSidebarOpen(false);
    if (v !== 'group-detail') setSelectedGroup(null);
  };

  const handleSelectGroup = async (group: LecturerGroup) => {
    try {
      const fullDetail = await getGroupDetail(group.id);
      setSelectedGroup(fullDetail);
      setActiveClass(group.className);
      setView('group-detail');
    } catch (err) {
      console.error("Failed to load group details:", err);
      alert((isVi ? 'Không thể tải chi tiết nhóm: ' : 'Failed to load group details: ') + (err as Error).message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">{isVi ? 'Đang tải không gian giảng viên...' : 'Loading lecturer workspace...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A1628] flex flex-col overflow-hidden">
      {/* ── TopBar ── */}
      <header className="h-16 bg-[#0F1A2A] border-b border-[#F59E0B]/15 flex items-center justify-between px-4 relative z-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(o => !o)} className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#162032] transition-colors">
            <Menu size={20} />
          </button>
          <button
            onClick={() => onNavigate?.('landing')}
            title={isVi ? 'Về trang chủ' : 'Back to home'}
            className="vertex-brand flex items-center gap-2 cursor-pointer"
          >
            <div className="vertex-mark w-7 h-7 rounded-lg flex items-center justify-center text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.8"/>
                <path d="M6 6L12 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm"><span className="vertex-wordmark">Vertex</span></span>
            <span className="px-2 py-0.5 rounded-md border border-[#F59E0B]/35 bg-[#F59E0B]/12 text-[#FCD34D] text-[10px] font-bold uppercase tracking-wider">{isVi ? 'Giảng viên' : 'Lecturer'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Insights */}
          <button onClick={() => setShowAI(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${showAI ? 'bg-[#22C55E]/20 text-[#6EE7B7] border border-[#F59E0B]/35 shadow-[0_10px_22px_rgba(34,197,94,0.16)]' : 'bg-[#162032] text-slate-400 border border-[#3A3317] hover:text-[#6EE7B7] hover:border-[#F59E0B]/35 hover:shadow-[0_12px_24px_rgba(10,15,26,0.5)]'}`}>
            <Sparkles size={13} />{isVi ? 'Phân tích AI' : 'AI insights'}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotif(o => !o)}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#162032] hover:shadow-[inset_0_0_0_1px_rgba(34,197,94,0.22)] transition-all duration-200">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#22C55E] text-[#0F1A2A] rounded-full text-[9px] font-black flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
            <AnimatePresence>
              {showNotif && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-[#0F1A2A] rounded-xl border border-[#F59E0B]/15 shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-[#F59E0B]/15 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{isVi ? 'Thông báo' : 'Notifications'}</h3>
                    <button onClick={handleMarkAllRead}
                      className="text-[11px] text-[#22C55E] hover:underline">{isVi ? 'Đánh dấu đã đọc' : 'Mark all read'}</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">{isVi ? 'Không có thông báo' : 'No notifications'}</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-[#162032] flex gap-2.5 ${!n.read ? 'bg-[#22C55E]/5' : ''}`}>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${n.type === 'review' ? 'bg-purple-400' : n.type === 'overdue' ? 'bg-red-400' : 'bg-green-400'}`} />
                          <div>
                            <p className="text-xs text-slate-300">{n.text}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => setShowProfile(o => !o)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#162032] hover:shadow-[inset_0_0_0_1px_rgba(34,197,94,0.2)] transition-all duration-200">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#22C55E] to-[#EAB308] flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'TV'}
                </span>
              </div>
              <span className="text-sm font-medium text-white hidden sm:block">{user?.name || 'Dr. Tran Van Minh'}</span>
            </button>
            <AnimatePresence>
              {showProfile && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-[#0F1A2A] rounded-xl border border-[#F59E0B]/15 shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-[#F59E0B]/15">
                    <p className="text-xs font-semibold text-white">{user?.name || 'Dr. Tran Van Minh'}</p>
                    <p className="text-[11px] text-[#22C55E]">{isVi ? 'Giảng viên' : 'Lecturer'}</p>
                  </div>
                  <button onClick={async () => { await authLogout(); onNavigate?.('login'); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200">
                    <LogOut size={14} />{isVi ? 'Đăng xuất' : 'Sign out'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        <LecturerSidebar
          isOpen={sidebarOpen}
          activeView={view}
          activeClass={activeClass}
          selectedGroupId={selectedGroup?.id ?? null}
          onNavigate={handleNavSidebar}
          onSettings={() => {}}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          groups={groups}
          classes={classes}
        />

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Breadcrumb */}
          <div className="px-6 py-3 border-b border-[#F59E0B]/15 bg-[#0F1A2A] flex items-center gap-2 flex-shrink-0">
            <button onClick={() => handleNavSidebar('overview', null)} className="text-xs text-slate-500 hover:text-[#6EE7B7] transition-colors duration-200">{isVi ? 'Tổng quan' : 'Overview'}</button>
            {view === 'groups' && (
              <><span className="text-slate-700 text-xs">/</span><span className="text-xs text-[#22C55E] font-medium">{isVi ? 'Nhóm sinh viên' : 'Student groups'}</span></>
            )}
            {view === 'group-detail' && selectedGroup && (
              <>
                <span className="text-slate-700 text-xs">/</span>
                <button onClick={() => handleNavSidebar('groups', selectedGroup.className)} className="text-xs text-slate-500 hover:text-[#6EE7B7] transition-colors duration-200">{selectedGroup.className}</button>
                <span className="text-slate-700 text-xs">/</span>
                <span className="text-xs text-[#22C55E] font-medium">{selectedGroup.name}</span>
              </>
            )}
            {view === 'deadlines' && (
              <><span className="text-slate-700 text-xs">/</span><span className="text-xs text-[#22C55E] font-medium">{isVi ? 'Hạn nộp' : 'Deadlines'}</span></>
            )}
            {view === 'overview' && activeClass && (
              <><span className="text-slate-700 text-xs">/</span><span className="text-xs text-[#22C55E] font-medium">{activeClass}</span></>
            )}
          </div>

          <AnimatePresence mode="wait">
            {view === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden flex flex-col">
                <DashboardOverview onSelectGroup={handleSelectGroup} groups={groups} />
              </motion.div>
            )}
            {view === 'groups' && (
              <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden flex flex-col">
                <GroupsOverview activeClass={activeClass} onSelectGroup={handleSelectGroup} groups={groups} />
              </motion.div>
            )}
            {view === 'group-detail' && selectedGroup && (
              <motion.div key="group-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden flex flex-col">
                <GroupDetail group={selectedGroup} onBack={() => handleNavSidebar('groups', selectedGroup.className)} />
              </motion.div>
            )}
            {view === 'deadlines' && (
              <motion.div key="deadlines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden flex flex-col">
                <DeadlineCalendar groups={groups} onSelectGroup={handleSelectGroup} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* AI Insights panel */}
      <AnimatePresence>
        {showAI && <AiInsightsPanel onClose={() => setShowAI(false)} />}
      </AnimatePresence>
    </div>
  );
};
