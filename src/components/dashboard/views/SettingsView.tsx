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
  simulatePaymentSuccess 
} from '../../../api/org';
import { getAccessToken, getUserInfo } from '../../../utils/authStorage';

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
  onClearInitialCheckoutPlan?: () => void;
}

const ROLE_OPTIONS = ['admin', 'lecturer', 'member'] as const;

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
  initialCheckoutPlan, onClearInitialCheckoutPlan
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'org-general' | 'org-members' | 'org-billing'>('profile');
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
  const [notifs, setNotifs] = useState({ assigned: true, overdue: true, comments: true });
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);

  // ── Checkout Stepper States ──
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'business'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [simulatedProgressText, setSimulatedProgressText] = useState('Đang khởi tạo kết nối bảo mật...');

  const membersCount = orgDetail?.members.length ?? 0;
  const maxMembers = orgDetail?.maxMembers ?? 5;
  const aiQuota = orgDetail?.aiQuota ?? 20;
  const storageLimitBytes = orgDetail?.storageLimit ?? (1024 * 1024 * 1024);
  const storageLimitGB = storageLimitBytes / (1024 * 1024 * 1024);
  const storageUsedGB = storageLimitGB * 0.34; 
  const storagePercent = Math.min(100, Math.round((storageUsedGB / storageLimitGB) * 100));
  const membersPercent = Math.min(100, Math.round((membersCount / maxMembers) * 100));

  // Phân quyền: Kiểm tra người dùng hiện tại có quyền nâng cấp không
  const currentUser = getUserInfo();
  const currentMemberInOrg = orgDetail?.members?.find(m => m.userId === currentUser?.id);
  const hasAdminAccess = currentMemberInOrg?.role === 'owner' || currentMemberInOrg?.role === 'admin';

  // ── Auto open checkout flow from redirect ──
  useEffect(() => {
    if (initialCheckoutPlan) {
      if (!hasAdminAccess) {
        showToast('Chỉ Chủ sở hữu hoặc Quản trị viên của tổ chức mới được phép nâng cấp gói.', 'error');
        onClearInitialCheckoutPlan?.();
        return;
      }
      setSelectedPlan(initialCheckoutPlan);
      setActiveTab('org-billing');
      setCheckoutStep(1);
      setShowCheckout(true);
      onClearInitialCheckoutPlan?.();
    }
  }, [initialCheckoutPlan, hasAdminAccess]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const navItems = [
    { id: 'profile', label: 'My Profile', category: 'Account' },
    { id: 'preferences', label: 'Preferences', category: 'Account' },
    { id: 'notifications', label: 'Notifications', category: 'Account' },
    { id: 'org-general', label: 'General', category: 'Organization' },
    { id: 'org-members', label: 'Members', category: 'Organization' },
    { id: 'org-billing', label: 'Billing & Plan', category: 'Organization' },
  ];

  const handleUpgrade = () => {
    if (!hasAdminAccess) {
      showToast('Chỉ Chủ sở hữu hoặc Quản trị viên của tổ chức mới được phép nâng cấp gói.', 'error');
      return;
    }
    setCheckoutStep(1);
    setShowCheckout(true);
  };

  // ── Khởi tạo checkout đơn hàng ──
  const handleStartCheckout = async () => {
    const token = getAccessToken();
    const orgId = orgDetail?.id;
    if (!token || !orgId) {
      showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'error');
      return;
    }

    setCheckoutLoading(true);
    try {
      const result = await createCheckoutSession(token, orgId, {
        plan: selectedPlan,
        billingCycle: billingCycle
      });
      setCheckoutResult(result);
      setCheckoutStep(2); // Đi đến bước quét VietQR
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Không thể tạo đơn hàng thanh toán.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── Giả lập xác nhận thanh toán thành công ──
  const handleConfirmPayment = () => {
    setCheckoutStep(3); // Đi đến màn hình Loading giả lập
    
    // Tạo chuỗi chạy chữ loading mô phỏng kết nối ngân hàng
    const textSequence = [
      { text: 'Kết nối an toàn tới hệ thống VietQR Napas...', delay: 0 },
      { text: 'Đang kiểm tra giao dịch tài khoản MB Bank...', delay: 700 },
      { text: 'Phát hiện biến động số dư: +Khớp đơn hàng! 🌟', delay: 1400 },
      { text: 'Đang kích hoạt gói dịch vụ mới...', delay: 2000 }
    ];

    textSequence.forEach(step => {
      setTimeout(() => {
        setSimulatedProgressText(step.text);
      }, step.delay);
    });

    // Sau 2.5 giây thì gọi API thành công thực tế xuống Backend
    setTimeout(async () => {
      const token = getAccessToken();
      const orgId = orgDetail?.id;
      if (!token || !orgId || !checkoutResult) {
        showToast('Có lỗi xảy ra, vui lòng thử lại.', 'error');
        setCheckoutStep(2);
        return;
      }

      try {
        await simulatePaymentSuccess(token, orgId, {
          plan: selectedPlan,
          transactionId: checkoutResult.transactionId
        });

        // Đồng bộ hóa trạng thái trên toàn ứng dụng
        if (onUpgradeSuccess) {
          onUpgradeSuccess();
        }
        
        // Mở màn hình thành công
        setCheckoutStep(4);
      } catch (err: any) {
        console.error(err);
        showToast(err.message || 'Lỗi nâng cấp gói dịch vụ.', 'error');
        setCheckoutStep(2);
      }
    }, 2600);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">My Profile</h2>
              <p className="text-sm text-slate-400 mt-1">Manage your personal information and avatar.</p>
            </div>
            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                  <Avatar src={currentUser?.avatarUrl || "https://i.pravatar.cc/150?u=me"} fallback={currentUser?.name?.charAt(0) || "U"} size="lg" className="w-full h-full rounded-none" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-xs font-semibold text-white">Upload</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-medium">Profile Picture</h3>
                  <p className="text-xs text-slate-400 mt-1">JPG, GIF or PNG. Max size of 800K</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">Upload</Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">Remove</Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Full Name</label>
                  <input type="text" defaultValue={currentUser?.name || "Minh Nguyen"} className="w-full rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22C55E]/35 focus:ring-1 focus:ring-[#22C55E]/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email Address</label>
                  <input type="email" defaultValue={currentUser?.email || "minh@university.edu"} className="w-full rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22C55E]/35 focus:ring-1 focus:ring-[#22C55E]/30" disabled />
                </div>
              </div>
              <Button onClick={() => showToast('Profile saved')}>Save Changes</Button>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">Preferences</h2>
              <p className="text-sm text-slate-400 mt-1">Customize your workspace experience.</p>
            </div>
            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300">Appearance</h3>
                <div className="flex items-center justify-between rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-3">
                  <div className="pr-2">
                    <p className="text-sm font-medium text-slate-200">Theme</p>
                    <p className="text-xs text-slate-500 mt-1">Switch between Dark and Light mode.</p>
                  </div>
                  <button onClick={toggleTheme} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/20' : 'bg-[#162032] text-slate-300 border border-[#22C55E]/10'}`}>
                    {isDark ? <Moon size={14} /> : <Sun size={14} />} {isDark ? 'Dark' : 'Light'}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300">Integrations</h3>
                <ToggleRow title="Google Calendar" description="Sync assignment due dates to your schedule." enabled={false} onToggle={() => {}} />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">Notifications</h2>
              <p className="text-sm text-slate-400 mt-1">Choose what we should notify you about.</p>
            </div>
            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 p-6 space-y-4">
              <ToggleRow title="Task Assigned" description="Get notified when someone assigns a task to you." enabled={notifs.assigned} onToggle={() => setNotifs(p => ({ ...p, assigned: !p.assigned }))} />
              <ToggleRow title="Task Overdue" description="Get notified when a task passes its deadline." enabled={notifs.overdue} onToggle={() => setNotifs(p => ({ ...p, overdue: !p.overdue }))} />
              <ToggleRow title="Comments & Mentions" description="Get notified when someone mentions you in a comment." enabled={notifs.comments} onToggle={() => setNotifs(p => ({ ...p, comments: !p.comments }))} />
            </div>
          </div>
        );

      case 'org-general':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">Organization General Settings</h2>
              <p className="text-sm text-slate-400 mt-1">Manage details for {orgName}.</p>
            </div>
            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Organization Name</label>
                <input type="text" defaultValue={orgName} className="w-full rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22C55E]/35 focus:ring-1 focus:ring-[#22C55E]/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Organization Slug</label>
                <div className="flex rounded-xl overflow-hidden border border-[#22C55E]/10 focus-within:border-[#22C55E]/35 focus-within:ring-1 focus-within:ring-[#22C55E]/30">
                  <span className="bg-[#162032] px-4 py-2.5 text-sm text-slate-500 border-r border-[#22C55E]/10">vertex.app/org/</span>
                  <input type="text" defaultValue={orgName.toLowerCase().replace(/\s+/g, '-')} className="w-full bg-[#0F1A2A] px-4 py-2.5 text-sm text-white outline-none" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Changing the slug will break existing links to your organization.</p>
              </div>
              <Button onClick={() => showToast('Organization settings saved')}>Save Changes</Button>
            </div>
          </div>
        );

      case 'org-members':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Organization Members</h2>
                <p className="text-sm text-slate-400 mt-1">Manage access and roles for your team ({membersCount}/{maxMembers} seats used).</p>
              </div>
              <Button icon={<UserPlus size={16} />} onClick={onInviteMember}>Invite Member</Button>
            </div>

            {orgLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="text-[#22C55E] animate-spin" />
              </div>
            ) : !orgDetail ? (
              <div className="text-center py-16 text-slate-500">No organization data available.</div>
            ) : (
            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#0F1A2A] border-b border-[#22C55E]/10">
                    <tr>
                      <th className="px-6 py-4 font-medium text-slate-400">User</th>
                      <th className="px-6 py-4 font-medium text-slate-400">Role</th>
                      <th className="px-6 py-4 font-medium text-slate-400">Joined</th>
                      <th className="px-6 py-4 font-medium text-slate-400 text-right">Actions</th>
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
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
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
                                      Set as {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </button>
                                  ))}
                                  <div className="h-px bg-[#22C55E]/10" />
                                  <button onClick={() => { onRemoveMember?.(member.id); setRoleMenuOpen(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                                    <Trash2 size={13} /> Remove
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
              <h2 className="text-xl font-bold text-white">Billing & Plan</h2>
              <p className="text-sm text-slate-400 mt-1">Manage your organization's subscription and quotas.</p>
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
                      {activePlan.charAt(0).toUpperCase() + activePlan.slice(1)} Plan
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-4 flex items-baseline gap-1.5">
                    {activePlan === 'free' ? '0 VNĐ' : activePlan === 'pro' ? '99.000 VNĐ' : activePlan === 'business' ? '249.000 VNĐ' : 'Custom'}
                    <span className="text-sm font-normal text-slate-400">/tháng</span>
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">Active subscription for {orgName}.</p>
                </div>
                <div className="mt-6">
                  {isFree ? (
                    <Button onClick={handleUpgrade} className="w-full flex items-center justify-center gap-2" variant="primary">
                      <Sparkles size={14} className="text-yellow-300 animate-pulse" />
                      Nâng Cấp Gói Dịch Vụ
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#6EE7B7] bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-2 rounded-xl">
                        <Check size={14} /> Gói dịch vụ cao cấp đã hoạt động
                      </div>
                      <Button onClick={handleUpgrade} className="w-full" variant="outline">
                        Thay Đổi Gói Cước
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
                      <span className="text-sm font-medium text-slate-200">Storage</span>
                    </div>
                    <span className="text-xs text-slate-400">{storageUsedGB.toFixed(1)} GB / {storageLimitGB >= 1000 ? 'Unlimited' : `${storageLimitGB.toFixed(0)} GB`}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0A0F1A] overflow-hidden">
                    <div className="h-full rounded-full bg-orange-400" style={{ width: `${storagePercent}%` }} />
                  </div>
                </div>

                <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/10 p-5 hover:border-[#22C55E]/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-yellow-400" />
                      <span className="text-sm font-medium text-slate-200">AI Quota</span>
                    </div>
                    <span className="text-xs font-bold text-yellow-300">{aiQuota >= 9999 ? 'Không giới hạn' : `${aiQuota} yêu cầu`}</span>
                  </div>
                </div>

                <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/10 p-5 hover:border-[#22C55E]/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-blue-400" />
                      <span className="text-sm font-medium text-slate-200">Members</span>
                    </div>
                    <span className="text-xs text-slate-400">{membersCount} / {maxMembers >= 999 ? 'Không giới hạn' : maxMembers}</span>
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
          <h1 className="text-xl font-display font-bold text-white">Settings</h1>
        </div>

        <div className="px-3 pb-6 space-y-6">
          <div className="space-y-1">
            <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Account</h4>
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
            <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Organization</h4>
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

      {/* ─── Premium VietQR Simulated Checkout Overlay ─── */}
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
                    <h3 className="font-bold text-white text-md">Nâng Cấp Gói Dịch Vụ Tổ Chức</h3>
                    <p className="text-xs text-slate-500">Giả lập thanh toán bảo mật VietQR</p>
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
                  <span className={checkoutStep >= 1 ? 'text-[#6EE7B7]' : ''}>Chọn gói</span>
                </div>
                <div className="w-12 h-0.5 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${checkoutStep >= 2 ? 'bg-[#22C55E] text-white' : 'bg-slate-700'}`}>2</span>
                  <span className={checkoutStep >= 2 ? 'text-[#6EE7B7]' : ''}>Quét mã QR</span>
                </div>
                <div className="w-12 h-0.5 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${checkoutStep >= 3 ? 'bg-[#22C55E] text-white' : 'bg-slate-700'}`}>3</span>
                  <span className={checkoutStep >= 3 ? 'text-[#6EE7B7]' : ''}>Xác nhận</span>
                </div>
              </div>

              {/* Steps Body */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[64vh]">
                
                {/* ── STEP 1: Plan Selector ── */}
                {checkoutStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h4 className="text-lg font-bold text-white">Chọn cấu hình nâng cấp</h4>
                      <p className="text-sm text-slate-400">Gia tăng giới hạn thành viên, AI Quota và dung lượng cực nhanh</p>
                    </div>

                    {/* Cycle Toggle */}
                    <div className="flex justify-center">
                      <div className="inline-flex bg-[#162032] p-1 rounded-full border border-[#22C55E]/10">
                        <button
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-[#22C55E] text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Theo Tháng
                        </button>
                        <button
                          onClick={() => setBillingCycle('yearly')}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${billingCycle === 'yearly' ? 'bg-[#22C55E] text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Theo Năm
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
                            <h5 className="font-bold text-white text-md">Gói PRO</h5>
                            {selectedPlan === 'pro' && <CheckCircle2 className="text-[#22C55E]" size={18} />}
                          </div>
                          <p className="text-slate-400 text-xs mt-1">Phù hợp cho cá nhân & nhóm học sinh FPT</p>
                          <div className="mt-4">
                            <span className="text-2xl font-bold text-white">
                              {billingCycle === 'yearly' ? '79.000 VNĐ' : '99.000 VNĐ'}
                            </span>
                            <span className="text-xs text-slate-500">/tháng</span>
                          </div>
                          {billingCycle === 'yearly' && (
                            <p className="text-[10px] text-yellow-300 mt-1 font-medium">Billed annually (948.000đ/năm)</p>
                          )}
                          <div className="mt-4 space-y-2 border-t border-[#22C55E]/10 pt-3 text-xs text-slate-300">
                            <p>• Tối đa <strong className="text-white">20 thành viên</strong> (Gốc 5)</p>
                            <p>• Tạo tối đa <strong className="text-white">15 dự án</strong> (Gốc 3)</p>
                            <p>• AI Quota <strong className="text-white">200 yêu cầu/tháng</strong> (Gốc 20)</p>
                            <p>• Bộ nhớ <strong className="text-white">10 GB</strong> (Gốc 1 GB)</p>
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
                            <h5 className="font-bold text-white text-md">Gói BUSINESS</h5>
                            {selectedPlan === 'business' && <CheckCircle2 className="text-[#22C55E]" size={18} />}
                          </div>
                          <p className="text-slate-400 text-xs mt-1">Phù hợp cho lớp học hoặc doanh nghiệp</p>
                          <div className="mt-4">
                            <span className="text-2xl font-bold text-white">
                              {billingCycle === 'yearly' ? '199.000 VNĐ' : '249.000 VNĐ'}
                            </span>
                            <span className="text-xs text-slate-500">/tháng</span>
                          </div>
                          {billingCycle === 'yearly' && (
                            <p className="text-[10px] text-yellow-300 mt-1 font-medium">Billed annually (2.388.000đ/năm)</p>
                          )}
                          <div className="mt-4 space-y-2 border-t border-[#22C55E]/10 pt-3 text-xs text-slate-300">
                            <p>• Tối đa <strong className="text-white">200 thành viên</strong> (Gốc 5)</p>
                            <p>• Tạo tối đa <strong className="text-white">100 dự án</strong> (Gốc 3)</p>
                            <p>• AI Quota <strong className="text-white">1000 yêu cầu/tháng</strong></p>
                            <p>• Bộ nhớ <strong className="text-white">50 GB</strong></p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer Step 1 */}
                    <div className="flex justify-end gap-3 pt-3">
                      <Button variant="ghost" onClick={() => setShowCheckout(false)}>Hủy bỏ</Button>
                      <Button 
                        onClick={handleStartCheckout} 
                        isLoading={checkoutLoading} 
                        icon={<ArrowRight size={14} />}
                      >
                        Tiến Hành Thanh Toán
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: VietQR Scanning Page (Y hệt mẫu ảnh) ── */}
                {checkoutStep === 2 && checkoutResult && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h4 className="text-lg font-bold text-white">Quét mã QR để thanh toán</h4>
                      <p className="text-sm text-slate-400">Mở app ngân hàng và quét mã bên dưới</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                      
                      {/* QR Box - MB Bank template (Left) */}
                      <div className="md:col-span-5 bg-[#0F1A2A] border border-[#22C55E]/15 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 relative group">
                        <div className="w-48 h-48 bg-white p-2 rounded-xl flex items-center justify-center relative overflow-hidden shadow-lg shadow-black/10">
                          {/* VietQR live image template from api.vietqr.io */}
                          <img 
                            src={`https://img.vietqr.io/image/MB-0358688688-compact.png?amount=${checkoutResult.amount}&addInfo=${checkoutResult.transactionId}&accountName=VERTEX%20APP`}
                            alt="VietQR Chuyển khoản"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6EE7B7] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          🛡️ BẢO MẬT VIETQR
                        </span>
                      </div>

                      {/* Billing detail information (Right) */}
                      <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/8 px-4 py-3 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Số tiền thanh toán</p>
                              <p className="text-lg font-black text-yellow-400 mt-0.5">
                                {checkoutResult.amount.toLocaleString('vi-VN')} VNĐ
                              </p>
                            </div>
                            <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-md">
                              {checkoutResult.billingCycle === 'yearly' ? 'Chu kỳ 1 Năm' : 'Chu kỳ 1 Tháng'}
                            </span>
                          </div>

                          <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/8 px-4 py-3">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nội dung chuyển khoản</p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <code className="text-sm font-mono font-bold text-white select-all">
                                {checkoutResult.transactionId}
                              </code>
                              <span className="text-[9px] text-slate-400">Tự động sao chép</span>
                            </div>
                          </div>

                          {/* Info Alert Box */}
                          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs text-blue-200 flex gap-2.5 items-start">
                            <Sparkles size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-white">SAU KHI NẠP THÀNH CÔNG</p>
                              <p className="mt-1 text-slate-400 leading-relaxed">
                                Hệ thống sẽ tự động nhận diện và nâng cấp tài khoản của bạn lên gói <strong>{checkoutResult.plan.toUpperCase()}</strong> ngay lập tức.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Guide workflow */}
                        <div className="text-[10px] text-slate-500 border-t border-[#22C55E]/10 pt-3 flex justify-around">
                          <div className="text-center">
                            <p className="font-bold text-slate-300">1. Mở App</p>
                            <p>Mở ứng dụng Banking</p>
                          </div>
                          <span className="text-slate-700">→</span>
                          <div className="text-center">
                            <p className="font-bold text-slate-300">2. Quét QR</p>
                            <p>Quét mã VietQR MB Bank</p>
                          </div>
                          <span className="text-slate-700">→</span>
                          <div className="text-center">
                            <p className="font-bold text-slate-300">3. Hoàn tất</p>
                            <p>Bấm nút Xác nhận ở dưới</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 Action Buttons */}
                    <div className="flex justify-between items-center pt-3 border-t border-[#22C55E]/10">
                      <Button variant="ghost" onClick={() => setCheckoutStep(1)}>Quay lại</Button>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleConfirmPayment}
                          className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white hover:brightness-110 font-bold"
                          icon={<Check size={16} />}
                        >
                          Xác nhận đã chuyển khoản thành công
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Bank Loop Verification Loader (Simulated Webhook) ── */}
                {checkoutStep === 3 && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      {/* Pulsing visual circles */}
                      <div className="absolute inset-0 rounded-full bg-[#22C55E]/20 animate-ping" />
                      <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-[#22C55E] flex items-center justify-center animate-spin" />
                    </div>

                    <div className="text-center space-y-2">
                      <h4 className="text-md font-bold text-white">Đang xác thực giao dịch...</h4>
                      <p className="text-xs text-[#22C55E] font-mono h-5 animate-pulse">
                        {simulatedProgressText}
                      </p>
                    </div>

                    <div className="bg-[#162032]/30 px-4 py-3 rounded-xl border border-[#22C55E]/5 text-[11px] text-slate-500 max-w-sm text-center leading-relaxed">
                      Hệ thống đang quét biến động số dư VietQR. Quá trình kiểm tra ngân hàng tự động mất khoảng vài giây. Vui lòng không đóng cửa sổ này.
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Success Upgrade Confetti Screen ── */}
                {checkoutStep === 4 && (
                  <div className="py-6 flex flex-col items-center text-center space-y-6">
                    
                    {/* Pulsing check circle indicator */}
                    <div className="w-20 h-20 rounded-full bg-[#22C55E]/15 border-2 border-[#22C55E] flex items-center justify-center text-[#22C55E] animate-bounce">
                      <Check size={42} />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold text-white">Nâng Cấp Thành Công! 🎉</h4>
                      <p className="text-sm text-[#6EE7B7]">
                        Tổ chức của bạn đã được nâng cấp lên gói <strong>{selectedPlan.toUpperCase()}</strong> thành công!
                      </p>
                    </div>

                    {/* Limits comparison overview */}
                    <div className="bg-[#162032]/40 border border-[#22C55E]/20 rounded-2xl p-5 w-full max-w-md space-y-3.5 text-sm text-slate-300">
                      <h5 className="font-semibold text-white text-xs border-b border-[#22C55E]/10 pb-2 text-left uppercase tracking-wider text-slate-500">Giới hạn dịch vụ mới</h5>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span>Số thành viên tối đa (Seats):</span>
                        <span className="font-bold text-white">
                          {selectedPlan === 'pro' ? '20 thành viên' : '200 thành viên (Không giới hạn)'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span>AI Planner Quota:</span>
                        <span className="font-bold text-white">
                          {selectedPlan === 'pro' ? '200 yêu cầu / tháng' : '1000 yêu cầu / tháng'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span>Dung lượng lưu trữ:</span>
                        <span className="font-bold text-white">
                          {selectedPlan === 'pro' ? '10 GB (Gốc 1 GB)' : '50 GB (Gốc 1 GB)'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                      Mọi giới hạn lưu trữ dữ liệu, quota tính toán trí tuệ nhân tạo và dung lượng mới đã được kích hoạt ngay lập tức cho tổ chức của bạn.
                    </p>

                    <div className="pt-2">
                      <Button 
                        onClick={() => setShowCheckout(false)}
                        className="bg-[#22C55E] text-white px-8"
                      >
                        Tuyệt vời, quay lại làm việc!
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
