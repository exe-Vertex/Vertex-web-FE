import React, { useState, useEffect } from 'react';
import { OrgPlan } from '../../../types';
import { useToast } from '../../ui/Toast';
import { 
  Moon, Sun, Bell, Palette, HardDrive, Sparkles, CalendarDays, 
  Users, Shield, Zap, Trash2, ShieldCheck, MoreHorizontal, 
  UserPlus, GraduationCap, Loader2, Check, X, ArrowRight, 
  QrCode, ShieldAlert, BadgeCheck, CheckCircle2
} from 'lucide-react';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  OrgDetail, 
  OrgMember, 
  createCheckoutSession, 
  getBillingTransaction 
} from '../../../api/org';
import { getAccessToken, getUserInfo } from '../../../utils/authStorage';

import { useLang } from '../../../contexts/LanguageContext';
interface SettingsViewProps {
  userPlan: OrgPlan;
  orgName: string;
  orgDetail?: OrgDetail | null;
  orgLoading?: boolean;
  onInviteMember?: () => void;
  onUpdateMemberRole?: (memberId: string, role: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpgradeSuccess?: () => void;
  initialCheckoutPlan?: 'pro' | 'business' | null;
  initialCheckoutCycle?: 'monthly' | 'yearly';
  onClearInitialCheckoutPlan?: () => void;
}

const ROLE_OPTIONS = ['admin', 'lecturer', 'member'] as const;
const ROLE_LABELS: Record<string, { vi: string; en: string }> = {
  owner: { vi: 'Chủ sở hữu', en: 'Owner' },
  admin: { vi: 'Quản trị viên', en: 'Administrator' },
  lecturer: { vi: 'Giảng viên', en: 'Lecturer' },
  member: { vi: 'Thành viên', en: 'Member' },
};


const ToggleRow: React.FC<{ title: string; description?: string; enabled: boolean; onToggle: () => void; }> = ({ title, description, enabled, onToggle }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-[#22C55E]/10 bg-[#162032]/50 px-4 py-3">
    <div className="pr-2">
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
    <button onClick={onToggle} className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors ${enabled ? 'bg-[#22C55E]' : 'bg-slate-700'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </div>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  userPlan, orgName, orgDetail, orgLoading, 
  onInviteMember, onUpdateMemberRole, onRemoveMember, onUpgradeSuccess,
  initialCheckoutPlan, initialCheckoutCycle = 'monthly', onClearInitialCheckoutPlan
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'org-general' | 'org-members' | 'org-billing'>('profile');
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
  const [notifs, setNotifs] = useState({ assigned: true, overdue: true, comments: true });
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);
  const { lang } = useLang();
  const isVi = lang === 'vi';
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'business'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [simulatedProgressText, setSimulatedProgressText] = useState(isVi ? 'Đang khởi tạo kết nối bảo mật...' : 'Initializing secure connection...');

  const membersCount = orgDetail?.members.length ?? 0;
  const maxMembers = orgDetail?.maxMembers ?? 5;
  const aiQuota = orgDetail?.aiQuota ?? 20;
  const aiUsed = orgDetail?.aiUsed ?? 0;
  const aiQuotaPercent = aiQuota > 0 ? Math.min(100, Math.round((aiUsed / aiQuota) * 100)) : 100;
  const storageLimitBytes = orgDetail?.storageLimit ?? (1024 * 1024 * 1024);
  const storageUsedBytes = orgDetail?.storageUsed ?? 0;
  const storageLimitGB = storageLimitBytes / (1024 * 1024 * 1024);
  const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024);
  const storagePercent = storageLimitBytes > 0
    ? Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100))
    : 100;
  const membersPercent = Math.min(100, Math.round((membersCount / maxMembers) * 100));

  const currentUser = getUserInfo();
  const currentMemberInOrg = orgDetail?.members?.find(m => m.userId === currentUser?.id);
  const hasAdminAccess = currentMemberInOrg?.role === 'owner' || currentMemberInOrg?.role === 'admin';

  useEffect(() => {
    if (initialCheckoutPlan) {
      if (!hasAdminAccess) {
        showToast(isVi ? 'Chỉ Chủ sở hữu hoặc Quản trị viên của tổ chức mới được phép nâng cấp gói.' : 'Only organization owners or administrators can upgrade the plan.', 'error');
        onClearInitialCheckoutPlan?.();
        return;
      }
      setSelectedPlan(initialCheckoutPlan);
      setBillingCycle(initialCheckoutCycle);
      setActiveTab('org-billing');
      setCheckoutStep(1);
      setShowCheckout(true);
      onClearInitialCheckoutPlan?.();
    }
  }, [initialCheckoutPlan, initialCheckoutCycle, hasAdminAccess]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const navItems = [
    { id: 'profile', label: isVi ? 'Hồ sơ của tôi' : 'My profile', category: 'Account' },
    { id: 'preferences', label: isVi ? 'Tùy chọn' : 'Preferences', category: 'Account' },
    { id: 'notifications', label: isVi ? 'Thông báo' : 'Notifications', category: 'Account' },
    { id: 'org-general', label: isVi ? 'Thông tin chung' : 'General', category: 'Organization' },
    { id: 'org-members', label: isVi ? 'Thành viên' : 'Members', category: 'Organization' },
    { id: 'org-billing', label: isVi ? 'Gói dịch vụ' : 'Billing & plan', category: 'Organization' },
  ];

  const handleUpgrade = () => {
    if (!hasAdminAccess) {
      showToast(isVi ? 'Chỉ Chủ sở hữu hoặc Quản trị viên của tổ chức mới được phép nâng cấp gói.' : 'Only organization owners or administrators can upgrade the plan.', 'error');
      return;
    }
    setCheckoutStep(1);
    setCheckoutResult(null);
    setShowCheckout(true);
  };

  const handleStartCheckout = async () => {
    const token = getAccessToken();
    const orgId = orgDetail?.id;
    if (!token || !orgId) {
      showToast(isVi ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' : 'Your session has expired. Please sign in again.', 'error');
      return;
    }

    setCheckoutLoading(true);
    try {
      const result = await createCheckoutSession(token, orgId, {
        plan: selectedPlan,
        billingCycle
      });
      setCheckoutResult(result);
      setCheckoutStep(2);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || (isVi ? 'Không thể tạo đơn hàng thanh toán PayOS.' : 'Could not create the PayOS payment order.'), 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOpenPayOSCheckout = () => {
    const token = getAccessToken();
    const orgId = orgDetail?.id;
    if (!token || !orgId || !checkoutResult) {
      showToast(isVi ? 'Không thể mở thanh toán, vui lòng thử lại.' : 'Could not open checkout. Please try again.', 'error');
      return;
    }

    if (checkoutResult.checkoutUrl) {
      window.open(checkoutResult.checkoutUrl, '_blank', 'noopener,noreferrer');
    }

    setCheckoutStep(3);
    setSimulatedProgressText(isVi ? 'Đang chờ PayOS xác nhận thanh toán...' : 'Waiting for PayOS payment confirmation...');

    let attempts = 0;
    const poller = window.setInterval(async () => {
      attempts += 1;
      try {
        const status = await getBillingTransaction(token, orgId, checkoutResult.transactionId);
        if (status.status === 'paid') {
          window.clearInterval(poller);
          setSimulatedProgressText(isVi ? 'Thanh toán thành công, đang cập nhật gói...' : 'Payment successful. Updating your plan...');
          await onUpgradeSuccess?.();
          setCheckoutStep(4);
          return;
        }

        if (status.status === 'failed' || status.status === 'expired' || status.status === 'cancelled') {
          window.clearInterval(poller);
          showToast(isVi ? `Thanh toán ${status.status}. Vui lòng tạo lại đơn thanh toán.` : `Payment ${status.status}. Please create a new payment order.`, 'error');
          setCheckoutStep(2);
          return;
        }

        setSimulatedProgressText(isVi ? 'Chưa nhận được webhook PayOS. Hệ thống sẽ tự cập nhật khi giao dịch hoàn tất...' : 'PayOS confirmation has not arrived yet. The system will update automatically when the transaction completes...');
      } catch (err: any) {
        console.error(err);
      }

      if (attempts >= 60) {
        window.clearInterval(poller);
        showToast(isVi ? 'Chưa thấy giao dịch hoàn tất. Bạn có thể quay lại kiểm tra sau.' : 'The transaction is not complete yet. You can check again later.', 'info');
        setCheckoutStep(2);
      }
    }, 3000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">{isVi ? 'Hồ sơ của tôi' : 'My profile'}</h2>
              <p className="text-sm text-slate-400 mt-1">{isVi ? 'Quản lý thông tin cá nhân và ảnh đại diện.' : 'Manage your personal information and profile picture.'}</p>
            </div>
            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                  <Avatar src={currentUser?.avatarUrl || "https://i.pravatar.cc/150?u=me"} fallback={currentUser?.name?.charAt(0) || "U"} size="lg" className="w-full h-full rounded-none" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-xs font-semibold text-white">{isVi ? 'Tải lên' : 'Upload'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-medium">{isVi ? 'Ảnh đại diện' : 'Profile picture'}</h3>
                  <p className="text-xs text-slate-400 mt-1">{isVi ? 'Định dạng JPG, GIF hoặc PNG. Tối đa 800 KB.' : 'JPG, GIF, or PNG. Maximum 800 KB.'}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">{isVi ? 'Tải lên' : 'Upload'}</Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">{isVi ? 'Xóa' : 'Remove'}</Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">{isVi ? 'Họ và tên' : 'Full name'}</label>
                  <input type="text" defaultValue={currentUser?.name || "Minh Nguyen"} className="w-full rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22C55E]/35 focus:ring-1 focus:ring-[#22C55E]/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">{isVi ? 'Địa chỉ email' : 'Email address'}</label>
                  <input type="email" defaultValue={currentUser?.email || "minh@university.edu"} className="w-full rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22C55E]/35 focus:ring-1 focus:ring-[#22C55E]/30" disabled />
                </div>
              </div>
              <Button onClick={() => showToast(isVi ? 'Đã lưu hồ sơ' : 'Profile saved')}>{isVi ? 'Lưu thay đổi' : 'Save changes'}</Button>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">{isVi ? 'Tùy chọn' : 'Preferences'}</h2>
              <p className="text-sm text-slate-400 mt-1">{isVi ? 'Tùy chỉnh trải nghiệm không gian làm việc.' : 'Customize your workspace experience.'}</p>
            </div>
            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300">{isVi ? 'Giao diện' : 'Appearance'}</h3>
                <div className="flex items-center justify-between rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-3">
                  <div className="pr-2">
                    <p className="text-sm font-medium text-slate-200">{isVi ? 'Chủ đề' : 'Theme'}</p>
                    <p className="text-xs text-slate-500 mt-1">{isVi ? 'Chuyển đổi giữa chế độ tối và sáng.' : 'Switch between dark and light mode.'}</p>
                  </div>
                  <button onClick={toggleTheme} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/20' : 'bg-[#162032] text-slate-300 border border-[#22C55E]/10'}`}>
                    {isDark ? <Moon size={14} /> : <Sun size={14} />} {isDark ? (isVi ? 'Tối' : 'Dark') : (isVi ? 'Sáng' : 'Light')}
                  </button>
                </div>
              </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-3">
                  <div className="pr-2">
                    <p className="text-sm font-medium text-slate-200">{lang === 'vi' ? 'Ngôn ngữ' : 'Language'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {lang === 'vi' ? 'Chọn ngôn ngữ hiển thị cho Vertex.' : 'Choose the display language for Vertex.'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-200">English</span>
                </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300">{isVi ? 'Tích hợp' : 'Integrations'}</h3>
                <ToggleRow title={isVi ? 'Lịch Google' : 'Google Calendar'} description={isVi ? 'Đồng bộ thời hạn công việc với lịch của bạn.' : 'Sync task deadlines with your calendar.'} enabled={false} onToggle={() => {}} />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">{isVi ? 'Thông báo' : 'Notifications'}</h2>
              <p className="text-sm text-slate-400 mt-1">{isVi ? 'Chọn những nội dung bạn muốn nhận thông báo.' : 'Choose which updates you want to receive.'}</p>
            </div>
            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 p-6 space-y-4">
              <ToggleRow title={isVi ? 'Được giao công việc' : 'Task assigned'} description={isVi ? 'Nhận thông báo khi có người giao công việc cho bạn.' : 'Receive a notification when someone assigns you a task.'} enabled={notifs.assigned} onToggle={() => setNotifs(p => ({ ...p, assigned: !p.assigned }))} />
              <ToggleRow title={isVi ? 'Công việc quá hạn' : 'Overdue tasks'} description={isVi ? 'Nhận thông báo khi công việc đã quá thời hạn.' : 'Receive a notification when a task becomes overdue.'} enabled={notifs.overdue} onToggle={() => setNotifs(p => ({ ...p, overdue: !p.overdue }))} />
              <ToggleRow title={isVi ? 'Bình luận và nhắc tên' : 'Comments and mentions'} description={isVi ? 'Nhận thông báo khi có người nhắc đến bạn trong bình luận.' : 'Receive a notification when someone mentions you in a comment.'} enabled={notifs.comments} onToggle={() => setNotifs(p => ({ ...p, comments: !p.comments }))} />
            </div>
          </div>
        );

      case 'org-general':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">{isVi ? 'Thông tin tổ chức' : 'Organization details'}</h2>
              <p className="text-sm text-slate-400 mt-1">{isVi ? 'Quản lý thông tin của' : 'Manage details for'} {orgName}.</p>
            </div>
            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">{isVi ? 'Tên tổ chức' : 'Organization name'}</label>
                <input type="text" defaultValue={orgName} className="w-full rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22C55E]/35 focus:ring-1 focus:ring-[#22C55E]/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">{isVi ? 'Đường dẫn tổ chức' : 'Organization URL'}</label>
                <div className="flex rounded-xl overflow-hidden border border-[#22C55E]/10 focus-within:border-[#22C55E]/35 focus-within:ring-1 focus-within:ring-[#22C55E]/30">
                  <span className="bg-[#162032] px-4 py-2.5 text-sm text-slate-500 border-r border-[#22C55E]/10">vertex.app/org/</span>
                  <input type="text" defaultValue={orgName.toLowerCase().replace(/\s+/g, '-')} className="w-full bg-[#0F1A2A] px-4 py-2.5 text-sm text-white outline-none" />
                </div>
                <p className="text-xs text-slate-500 mt-1">{isVi ? 'Thay đổi đường dẫn sẽ làm các liên kết cũ của tổ chức không còn hoạt động.' : 'Changing this URL will make old organization links stop working.'}</p>
              </div>
              <Button onClick={() => showToast(isVi ? 'Đã lưu thông tin tổ chức' : 'Organization details saved')}>{isVi ? 'Lưu thay đổi' : 'Save changes'}</Button>
            </div>
          </div>
        );

      case 'org-members':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{isVi ? 'Thành viên tổ chức' : 'Organization members'}</h2>
                <p className="text-sm text-slate-400 mt-1">{isVi ? 'Quản lý quyền truy cập và vai trò' : 'Manage access and roles'} ({membersCount}/{maxMembers} {isVi ? 'vị trí đã dùng' : 'seats used'}).</p>
              </div>
              <Button icon={<UserPlus size={16} />} onClick={onInviteMember}>{isVi ? 'Mời thành viên' : 'Invite member'}</Button>
            </div>

            {orgLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="text-[#22C55E] animate-spin" />
              </div>
            ) : !orgDetail ? (
              <div className="text-center py-16 text-slate-500">{isVi ? 'Chưa có dữ liệu tổ chức.' : 'No organization data.'}</div>
            ) : (
            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#0F1A2A] border-b border-[#22C55E]/10">
                    <tr>
                      <th className="px-6 py-4 font-medium text-slate-400">{isVi ? 'Người dùng' : 'User'}</th>
                      <th className="px-6 py-4 font-medium text-slate-400">{isVi ? 'Vai trò' : 'Role'}</th>
                      <th className="px-6 py-4 font-medium text-slate-400">{isVi ? 'Ngày tham gia' : 'Joined'}</th>
                      <th className="px-6 py-4 font-medium text-slate-400 text-right">{isVi ? 'Thao tác' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22C55E]/5 text-slate-300">
                    {orgDetail.members.map(member => (
                      <tr key={member.id} className="hover:bg-[#22C55E]/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={member.avatarUrl} fallback={member.name.charAt(0)} size="sm" />
                            <div>
                              <p className="font-medium text-white">{member.name}</p>
                              <p className="text-xs text-slate-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            member.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            member.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            member.role === 'lecturer' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-slate-500/10 text-slate-300 border-slate-500/20'
                          }`}>
                            {member.role === 'owner' && <ShieldCheck size={12} />}
                            {member.role === 'admin' && <Shield size={12} />}
                            {member.role === 'lecturer' && <GraduationCap size={12} />}
                            {ROLE_LABELS[member.role]?.[isVi ? 'vi' : 'en'] || member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(member.joinedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          {member.role !== 'owner' && (
                            <div className="relative inline-block">
                              <button
                                onClick={() => setRoleMenuOpen(roleMenuOpen === member.id ? null : member.id)}
                                className="p-1.5 text-slate-500 hover:text-white hover:bg-[#162032] rounded-lg transition-colors"
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              {roleMenuOpen === member.id && (
                                <div className="absolute right-0 top-8 z-50 w-44 bg-[#0F1A2A] border border-[#22C55E]/15 rounded-xl shadow-xl overflow-hidden">
                                  {ROLE_OPTIONS.filter(r => r !== member.role).map(r => (
                                    <button key={r} onClick={() => { onUpdateMemberRole?.(member.id, r); setRoleMenuOpen(null); }}
                                      className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#162032] transition-colors">
                                      {isVi ? 'Đặt làm' : 'Set as'} {ROLE_LABELS[r]?.[isVi ? 'vi' : 'en'] || r}
                                    </button>
                                  ))}
                                  <div className="h-px bg-[#22C55E]/10" />
                                  <button onClick={() => { onRemoveMember?.(member.id); setRoleMenuOpen(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                                    <Trash2 size={13} /> {isVi ? 'Xóa' : 'Remove'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        );

      case 'org-billing':
        const activePlan = orgDetail?.plan || userPlan;
        const isFree = activePlan === 'free';
        
        return (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-xl font-bold text-white">{isVi ? 'Gói dịch vụ' : 'Billing & plan'}</h2>
              <p className="text-sm text-slate-400 mt-1">{isVi ? 'Quản lý gói đăng ký và hạn mức của tổ chức.' : 'Manage your organization subscription and usage limits.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#162032] to-[#0F1A2A] rounded-2xl border border-[#22C55E]/20 p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#22C55E]/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-300" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-3 py-1 rounded-md border text-xs font-bold uppercase tracking-wider ${
                      activePlan === 'pro' || activePlan === 'business' || activePlan === 'enterprise' 
                        ? 'border-blue-500/35 bg-blue-500/10 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                        : 'border-[#22C55E]/35 bg-[#22C55E]/10 text-[#6EE7B7]'
                    }`}>
                      {activePlan === 'free' ? (isVi ? 'Gói miễn phí' : 'Free plan') : activePlan === 'business' ? (isVi ? 'Gói doanh nghiệp' : 'Business plan') : `${isVi ? 'Gói' : 'Plan'} ${activePlan.toUpperCase()}`}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-4 flex items-baseline gap-1.5">
                    {activePlan === 'free' ? 'VND 0' : activePlan === 'pro' ? 'VND 99,000' : activePlan === 'business' ? 'VND 249,000' : (isVi ? 'Tùy chỉnh' : 'Custom')}
                    <span className="text-sm font-normal text-slate-400">/{isVi ? 'tháng' : 'month'}</span>
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">{isVi ? 'Gói đang hoạt động cho' : 'Active plan for'} {orgName}.</p>
                </div>
                <div className="mt-6">
                  {isFree ? (
                    <Button onClick={handleUpgrade} className="w-full flex items-center justify-center gap-2" variant="primary">
                      <Sparkles size={14} className="text-yellow-300 animate-pulse" />
                      {isVi ? 'Nâng cấp gói dịch vụ' : 'Upgrade plan'}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#6EE7B7] bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-2 rounded-xl">
                        <Check size={14} /> {isVi ? 'Gói dịch vụ cao cấp đã hoạt động' : 'Premium plan is active'}
                      </div>
                      <Button onClick={handleUpgrade} className="w-full" variant="outline">
                        {isVi ? 'Thay đổi gói cước' : 'Change plan'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/10 p-5 hover:border-[#22C55E]/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive size={14} className="text-orange-400" />
                      <span className="text-sm font-medium text-slate-200">{isVi ? 'Bộ nhớ' : 'Storage'}</span>
                    </div>
                    <span className="text-xs text-slate-400">{storageUsedGB.toFixed(1)} GB / {storageLimitGB >= 1000 ? (isVi ? 'Không giới hạn' : 'Unlimited') : `${storageLimitGB.toFixed(0)} GB`}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0A0F1A] overflow-hidden">
                    <div className="h-full rounded-full bg-orange-400" style={{ width: `${storagePercent}%` }} />
                  </div>
                </div>

                <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/10 p-5 hover:border-[#22C55E]/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-yellow-400" />
                      <span className="text-sm font-medium text-slate-200">{isVi ? 'Hạn mức AI' : 'AI quota'}</span>
                    </div>
                    <span className="text-xs font-bold text-yellow-300">{aiUsed} / {aiQuota}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0A0F1A] overflow-hidden">
                    <div className="h-full rounded-full bg-yellow-400" style={{ width: `${aiQuotaPercent}%` }} />
                  </div>
                </div>

                <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/10 p-5 hover:border-[#22C55E]/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-blue-400" />
                      <span className="text-sm font-medium text-slate-200">{isVi ? 'Thành viên' : 'Members'}</span>
                    </div>
                    <span className="text-xs text-slate-400">{membersCount} / {maxMembers >= 999 ? (isVi ? 'Không giới hạn' : 'Unlimited') : maxMembers}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0A0F1A] overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${membersPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-[#0A0F1A] overflow-hidden flex relative">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-[#22C55E]/10 bg-[#0F1A2A] flex flex-col h-full overflow-y-auto">
        <div className="p-6">
          <h1 className="text-xl font-display font-bold text-white">{isVi ? 'Cài đặt' : 'Settings'}</h1>
        </div>

        <div className="px-3 pb-6 space-y-6">
          <div className="space-y-1">
            <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{isVi ? 'Tài khoản' : 'Account'}</h4>
            {navItems.filter(i => i.category === 'Account').map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id 
                    ? 'bg-[#22C55E]/10 text-[#22C55E]' 
                    : 'text-slate-400 hover:bg-[#162032] hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{isVi ? 'Tổ chức' : 'Organization'}</h4>
            {navItems.filter(i => i.category === 'Organization').map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id 
                    ? 'bg-[#22C55E]/10 text-[#22C55E]' 
                    : 'text-slate-400 hover:bg-[#162032] hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto bg-[#0A0F1A]">
        <div className="max-w-5xl mx-auto p-8 lg:p-12">
          {renderContent()}
        </div>
      </div>

      {/* Premium PayOS Checkout Overlay */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (checkoutStep !== 3) setShowCheckout(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />

            {/* Stepper Modal Container */}
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-[#0F1A2A]/95 border border-[#22C55E]/20 rounded-3xl w-[780px] max-w-full mx-4 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 flex flex-col"
            >
              {/* Stepper Header */}
              <div className="px-6 py-4 border-b border-[#22C55E]/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[#6EE7B7]">
                    <QrCode size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-md">{isVi ? 'Nâng cấp gói dịch vụ tổ chức' : 'Upgrade organization plan'}</h3>
                    <p className="text-xs text-slate-500">{isVi ? 'Thanh toán bảo mật qua PayOS' : 'Secure payment via PayOS'}</p>
                  </div>
                </div>
                {checkoutStep !== 3 && (
                  <button 
                    onClick={() => setShowCheckout(false)} 
                    className="w-8 h-8 rounded-xl hover:bg-[#162032] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Progress Steps Indicators */}
              <div className="px-8 py-4 bg-[#162032]/40 border-b border-[#22C55E]/5 flex justify-center items-center gap-2 text-xs font-semibold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${checkoutStep >= 1 ? 'bg-[#22C55E] text-white' : 'bg-slate-700'}`}>1</span>
                  <span className={checkoutStep >= 1 ? 'text-[#6EE7B7]' : ''}>{isVi ? 'Chọn gói' : 'Choose plan'}</span>
                </div>
                <div className="w-12 h-0.5 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${checkoutStep >= 2 ? 'bg-[#22C55E] text-white' : 'bg-slate-700'}`}>2</span>
                  <span className={checkoutStep >= 2 ? 'text-[#6EE7B7]' : ''}>{isVi ? 'Quét mã QR' : 'Scan QR'}</span>
                </div>
                <div className="w-12 h-0.5 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${checkoutStep >= 3 ? 'bg-[#22C55E] text-white' : 'bg-slate-700'}`}>3</span>
                  <span className={checkoutStep >= 3 ? 'text-[#6EE7B7]' : ''}>{isVi ? 'Xác nhận' : 'Confirm'}</span>
                </div>
              </div>

              {/* Steps Body */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[64vh]">
                
                {/* STEP 1: Plan Selector */}
                {checkoutStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h4 className="text-lg font-bold text-white">{isVi ? 'Chọn cấu hình nâng cấp' : 'Choose an upgrade plan'}</h4>
                      <p className="text-sm text-slate-400">{isVi ? 'Tăng giới hạn thành viên, AI quota và dung lượng lưu trữ' : 'Increase members, AI quota, and storage limits'}</p>
                    </div>

                    {/* Cycle Toggle */}
                    <div className="flex justify-center">
                      <div className="inline-flex bg-[#162032] p-1 rounded-full border border-[#22C55E]/10">
                        <button
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-[#22C55E] text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          {isVi ? 'Theo tháng' : 'Monthly'}
                        </button>
                        <button
                          onClick={() => setBillingCycle('yearly')}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${billingCycle === 'yearly' ? 'bg-[#22C55E] text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          {isVi ? 'Theo năm' : 'Yearly'}
                          <span className="bg-yellow-500/20 text-yellow-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">-20%</span>
                        </button>
                      </div>
                    </div>

                    {/* Pricing Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Gói Pro */}
                      <div 
                        onClick={() => setSelectedPlan('pro')}
                        className={`rounded-2xl border p-5 cursor-pointer flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] ${
                          selectedPlan === 'pro'
                            ? 'border-[#22C55E] bg-[#22C55E]/5 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                            : 'border-[#22C55E]/10 bg-[#162032]/30 hover:border-[#22C55E]/30'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center">
                            <h5 className="font-bold text-white text-md">PRO plan</h5>
                            {selectedPlan === 'pro' && <CheckCircle2 className="text-[#22C55E]" size={18} />}
                          </div>
                          <p className="text-slate-400 text-xs mt-1">{isVi ? 'Phù hợp cho cá nhân và nhóm sinh viên' : 'Best for individuals and student teams'}</p>
                          <div className="mt-4">
                            <span className="text-2xl font-bold text-white">
                              {billingCycle === 'yearly' ? 'VND 79,000' : 'VND 99,000'}
                            </span>
                            <span className="text-xs text-slate-500">{isVi ? '/tháng' : '/month'}</span>
                          </div>
                          {billingCycle === 'yearly' && (
                            <p className="text-[10px] text-yellow-300 mt-1 font-medium">{isVi ? 'Thanh toán hằng năm (948.000đ/năm)' : 'Billed yearly (VND 948,000/year)'}</p>
                          )}
                          <div className="mt-4 space-y-2 border-t border-[#22C55E]/10 pt-3 text-xs text-slate-300">
                            <p>• {isVi ? 'Tối đa' : 'Up to'} <strong className="text-white">{isVi ? '20 thành viên' : '20 members'}</strong> ({isVi ? 'Gốc 5' : 'from 5'})</p>
                            <p>• {isVi ? 'Tạo tối đa' : 'Create up to'} <strong className="text-white">{isVi ? '15 dự án' : '15 projects'}</strong> ({isVi ? 'Gốc 3' : 'from 3'})</p>
                            <p>• AI Quota <strong className="text-white">{isVi ? '200 yêu cầu/tháng' : '200 requests/month'}</strong> ({isVi ? 'Gốc 20' : 'from 20'})</p>
                            <p>• {isVi ? 'Bộ nhớ' : 'Storage'} <strong className="text-white">10 GB</strong> ({isVi ? 'Gốc 1 GB' : 'from 1 GB'})</p>
                          </div>
                        </div>
                      </div>

                      {/* Gói Business */}
                      <div 
                        onClick={() => setSelectedPlan('business')}
                        className={`rounded-2xl border p-5 cursor-pointer flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] ${
                          selectedPlan === 'business'
                            ? 'border-[#22C55E] bg-[#22C55E]/5 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                            : 'border-[#22C55E]/10 bg-[#162032]/30 hover:border-[#22C55E]/30'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center">
                            <h5 className="font-bold text-white text-md">BUSINESS plan</h5>
                            {selectedPlan === 'business' && <CheckCircle2 className="text-[#22C55E]" size={18} />}
                          </div>
                          <p className="text-slate-400 text-xs mt-1">{isVi ? 'Phù hợp cho lớp học hoặc doanh nghiệp' : 'Best for classes or businesses'}</p>
                          <div className="mt-4">
                            <span className="text-2xl font-bold text-white">
                              {billingCycle === 'yearly' ? 'VND 199,000' : 'VND 249,000'}
                            </span>
                            <span className="text-xs text-slate-500">{isVi ? '/tháng' : '/month'}</span>
                          </div>
                          {billingCycle === 'yearly' && (
                            <p className="text-[10px] text-yellow-300 mt-1 font-medium">{isVi ? 'Thanh toán hằng năm (2.388.000đ/năm)' : 'Billed yearly (VND 2,388,000/year)'}</p>
                          )}
                          <div className="mt-4 space-y-2 border-t border-[#22C55E]/10 pt-3 text-xs text-slate-300">
                            <p>• {isVi ? 'Tối đa' : 'Up to'} <strong className="text-white">{isVi ? '200 thành viên' : '200 members'}</strong> ({isVi ? 'Gốc 5' : 'from 5'})</p>
                            <p>• {isVi ? 'Tạo tối đa' : 'Create up to'} <strong className="text-white">{isVi ? '100 dự án' : '100 projects'}</strong> ({isVi ? 'Gốc 3' : 'from 3'})</p>
                            <p>• AI Quota <strong className="text-white">{isVi ? '1000 yêu cầu/tháng' : '1,000 requests/month'}</strong></p>
                            <p>• {isVi ? 'Bộ nhớ' : 'Storage'} <strong className="text-white">50 GB</strong></p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer Step 1 */}
                    <div className="flex justify-end gap-3 pt-3">
                      <Button variant="ghost" onClick={() => setShowCheckout(false)}>{isVi ? 'Hủy bỏ' : 'Cancel'}</Button>
                      <Button 
                        onClick={handleStartCheckout} 
                        isLoading={checkoutLoading} 
                        icon={<ArrowRight size={14} />}
                      >
                        {isVi ? 'Tiến hành thanh toán' : 'Continue to payment'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: PayOS checkout */}
                {checkoutStep === 2 && checkoutResult && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h4 className="text-lg font-bold text-white">{isVi ? 'Thanh toán qua PayOS' : 'Pay with PayOS'}</h4>
                      <p className="text-sm text-slate-400">{isVi ? 'Mở trang checkout PayOS để quét QR và hoàn tất thanh toán.' : 'Open PayOS checkout to scan the QR code and complete payment.'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                      
                      <div className="md:col-span-5 bg-[#0F1A2A] border border-[#22C55E]/15 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 relative group">
                        <div className="w-48 h-48 rounded-xl flex flex-col items-center justify-center relative overflow-hidden border border-[#22C55E]/20 bg-[#162032] text-[#6EE7B7] shadow-lg shadow-black/10">
                          <QrCode size={72} />
                          <span className="mt-3 px-3 text-center text-xs font-semibold text-slate-300">{isVi ? 'QR nằm trong trang PayOS' : 'QR code is on the PayOS page'}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6EE7B7] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          PAYOS SECURE CHECKOUT
                        </span>
                      </div>

                      {/* Billing detail information (Right) */}
                      <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/8 px-4 py-3 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{isVi ? 'Số tiền thanh toán' : 'Payment amount'}</p>
                              <p className="text-lg font-black text-yellow-400 mt-0.5">
                                VND {checkoutResult.amount.toLocaleString('en-US')}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-md">
                              {checkoutResult.billingCycle === 'yearly' ? (isVi ? 'Chu kỳ 1 năm' : '1-year cycle') : (isVi ? 'Chu kỳ 1 tháng' : '1-month cycle')}
                            </span>
                          </div>

                          <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/8 px-4 py-3">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{isVi ? 'Mã đơn PayOS' : 'PayOS order code'}</p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <code className="text-sm font-mono font-bold text-white select-all">
                                {checkoutResult.orderCode}
                              </code>
                              <span className="text-[9px] text-slate-400">{isVi ? 'Dùng để đối soát webhook' : 'Used for webhook reconciliation'}</span>
                            </div>
                          </div>

                          {/* Info Alert Box */}
                          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs text-blue-200 flex gap-2.5 items-start">
                            <Sparkles size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-white">{isVi ? 'SAU KHI THANH TOÁN THÀNH CÔNG' : 'AFTER SUCCESSFUL PAYMENT'}</p>
                              <p className="mt-1 text-slate-400 leading-relaxed">
                                {isVi ? 'Hệ thống sẽ tự động nâng cấp tổ chức của bạn lên gói ' : 'The system will automatically upgrade your organization to the '}<strong>{checkoutResult.plan.toUpperCase()}</strong>{isVi ? ' ngay lập tức.' : ' plan immediately.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Guide workflow */}
                        <div className="text-[10px] text-slate-500 border-t border-[#22C55E]/10 pt-3 flex justify-around">
                          <div className="text-center">
                            <p className="font-bold text-slate-300">1. {isVi ? 'Mở PayOS' : 'Open PayOS'}</p>
                              <p>{isVi ? 'Mở checkout PayOS' : 'Open PayOS checkout'}</p>
                          </div>
                          <span className="text-slate-700">→</span>
                          <div className="text-center">
                            <p className="font-bold text-slate-300">2. {isVi ? 'Quét QR' : 'Scan QR'}</p>
                            <p>{isVi ? 'Quét QR trong PayOS' : 'Scan the QR in PayOS'}</p>
                          </div>
                          <span className="text-slate-700">→</span>
                          <div className="text-center">
                            <p className="font-bold text-slate-300">3. {isVi ? 'Hoàn tất' : 'Complete'}</p>
                            <p>{isVi ? 'Webhook tự nâng gói' : 'Webhook applies upgrade'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 Action Buttons */}
                    <div className="flex justify-between items-center pt-3 border-t border-[#22C55E]/10">
                      <Button variant="ghost" onClick={() => setCheckoutStep(1)}>{isVi ? 'Quay lại' : 'Back'}</Button>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleOpenPayOSCheckout}
                          className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white hover:brightness-110 font-bold"
                          icon={<Check size={16} />}
                        >
                          {isVi ? 'Mở trang thanh toán PayOS' : 'Open PayOS checkout'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PayOS webhook waiting state */}
                {checkoutStep === 3 && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      {/* Pulsing visual circles */}
                      <div className="absolute inset-0 rounded-full bg-[#22C55E]/20 animate-ping" />
                      <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-[#22C55E] flex items-center justify-center animate-spin" />
                    </div>

                    <div className="text-center space-y-2">
                      <h4 className="text-md font-bold text-white">{isVi ? 'Đang xác thực giao dịch...' : 'Verifying transaction...'}</h4>
                      <p className="text-xs text-[#22C55E] font-mono h-5 animate-pulse">
                        {simulatedProgressText}
                      </p>
                    </div>

                    <div className="bg-[#162032]/30 px-4 py-3 rounded-xl border border-[#22C55E]/5 text-[11px] text-slate-500 max-w-sm text-center leading-relaxed">
                      {isVi ? 'Hệ thống đang chờ webhook PayOS. Khi PayOS xác nhận thanh toán hợp lệ, backend sẽ tự động nâng gói cho tổ chức.' : 'The system is waiting for the PayOS webhook. Once payment is confirmed, the backend will automatically upgrade the organization.'}
                    </div>
                  </div>
                )}

                {/* STEP 4: Success Upgrade Screen */}
                {checkoutStep === 4 && (
                  <div className="py-6 flex flex-col items-center text-center space-y-6">
                    
                    {/* Pulsing check circle indicator */}
                    <div className="w-20 h-20 rounded-full bg-[#22C55E]/15 border-2 border-[#22C55E] flex items-center justify-center text-[#22C55E] animate-bounce">
                      <Check size={42} />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold text-white">{isVi ? 'Nâng cấp thành công!' : 'Upgrade successful!'}</h4>
                      <p className="text-sm text-[#6EE7B7]">
                        {isVi ? 'Tổ chức của bạn đã được nâng cấp lên gói ' : 'Your organization has been upgraded to the '}<strong>{selectedPlan.toUpperCase()}</strong>{isVi ? ' thành công!' : ' plan successfully!'}
                      </p>
                    </div>

                    {/* Limits comparison overview */}
                    <div className="bg-[#162032]/40 border border-[#22C55E]/20 rounded-2xl p-5 w-full max-w-md space-y-3.5 text-sm text-slate-300">
                      <h5 className="font-semibold text-white text-xs border-b border-[#22C55E]/10 pb-2 text-left uppercase tracking-wider text-slate-500">{isVi ? 'Giới hạn dịch vụ mới' : 'New service limits'}</h5>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span>{isVi ? 'Số thành viên tối đa:' : 'Maximum members:'}</span>
                        <span className="font-bold text-white">
                          {selectedPlan === 'pro' ? (isVi ? '20 thành viên' : '20 members') : (isVi ? '200 thành viên' : '200 members')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span>{isVi ? 'Hạn mức lập kế hoạch AI:' : 'AI planning quota:'}</span>
                        <span className="font-bold text-white">
                          {selectedPlan === 'pro' ? (isVi ? '200 yêu cầu / tháng' : '200 requests / month') : (isVi ? '1000 yêu cầu / tháng' : '1,000 requests / month')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span>{isVi ? 'Dung lượng lưu trữ:' : 'Storage:'}</span>
                        <span className="font-bold text-white">
                          {selectedPlan === 'pro' ? (isVi ? '10 GB (Gốc 1 GB)' : '10 GB (from 1 GB)') : (isVi ? '50 GB (Gốc 1 GB)' : '50 GB (from 1 GB)')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                      {isVi ? 'Mọi giới hạn thành viên, quota AI và dung lượng mới đã được kích hoạt ngay lập tức cho tổ chức của bạn.' : 'The new member, AI quota, and storage limits are now active for your organization.'}
                    </p>

                    <div className="pt-2">
                      <Button 
                        onClick={() => setShowCheckout(false)}
                        className="bg-[#22C55E] text-white px-8"
                      >
                        {isVi ? 'Tuyệt vời, quay lại làm việc!' : 'Great, back to work!'}
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

