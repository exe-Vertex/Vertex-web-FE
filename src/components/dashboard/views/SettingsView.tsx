import React, { useState } from 'react';
import { OrgPlan } from '../../../types';
import { useToast } from '../../ui/Toast';
import { Moon, Sun, Bell, Palette, HardDrive, Sparkles, CalendarDays, Users, Shield, Zap, Mail, Trash2, ShieldCheck, MoreHorizontal, UserPlus } from 'lucide-react';
import { MockOrgMember, MockBilling } from '../utils/dashboardTypes';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';

interface SettingsViewProps {
  userPlan: OrgPlan;
  orgName: string;
}

const mockMembers: MockOrgMember[] = [
  { id: 'u1', name: 'Minh Nguyen', email: 'minh@university.edu', avatar: 'https://i.pravatar.cc/150?u=u1', orgRole: 'owner', joinedAt: '2025-01-10', status: 'active' },
  { id: 'u2', name: 'Lan Pham', email: 'lan@university.edu', avatar: 'https://i.pravatar.cc/150?u=u2', orgRole: 'admin', joinedAt: '2025-02-15', status: 'active' },
  { id: 'u3', name: 'Hung Vu', email: 'hung@university.edu', avatar: 'https://i.pravatar.cc/150?u=u3', orgRole: 'member', joinedAt: '2026-01-05', status: 'active' },
  { id: 'u4', name: 'Trang Le', email: 'trang@university.edu', avatar: 'https://i.pravatar.cc/150?u=u4', orgRole: 'member', joinedAt: '2026-02-01', status: 'invited' },
];

const mockBillingFree: MockBilling = { plan: 'free', storageUsed: 0.34, storageLimit: 1, aiUsed: 12, aiLimit: 20, membersCount: 4, membersLimit: 5, renewalDate: 'N/A' };
const mockBillingPro: MockBilling = { plan: 'pro', storageUsed: 2.3, storageLimit: 10, aiUsed: 45, aiLimit: 100, membersCount: 4, membersLimit: 10, renewalDate: '2026-06-15' };
const mockBillingBusiness: MockBilling = { plan: 'business', storageUsed: 8.4, storageLimit: 50, aiUsed: 300, aiLimit: 500, membersCount: 15, membersLimit: 20, renewalDate: '2026-06-15' };
const mockBillingEnterprise: MockBilling = { plan: 'enterprise', storageUsed: 12.4, storageLimit: 1000, aiUsed: 1200, aiLimit: 9999, membersCount: 45, membersLimit: 999, renewalDate: '2027-01-01' };

const getBillingForPlan = (plan: OrgPlan) => {
  if (plan === 'pro') return mockBillingPro;
  if (plan === 'business') return mockBillingBusiness;
  if (plan === 'enterprise') return mockBillingEnterprise;
  return mockBillingFree;
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

export const SettingsView: React.FC<SettingsViewProps> = ({ userPlan, orgName }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'org-general' | 'org-members' | 'org-billing'>('profile');
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
  const [notifs, setNotifs] = useState({ assigned: true, overdue: true, comments: true });

  const billing = getBillingForPlan(userPlan);
  const storagePercent = Math.min(100, Math.round((billing.storageUsed / billing.storageLimit) * 100));
  const aiPercent = Math.min(100, Math.round((billing.aiUsed / billing.aiLimit) * 100));
  const membersPercent = Math.min(100, Math.round((billing.membersCount / billing.membersLimit) * 100));

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
    showToast('Redirecting to plans...');
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
                  <Avatar src="https://i.pravatar.cc/150?u=me" fallback="MN" size="lg" className="w-full h-full rounded-none" />
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
                  <input type="text" defaultValue="Minh Nguyen" className="w-full rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22C55E]/35 focus:ring-1 focus:ring-[#22C55E]/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email Address</label>
                  <input type="email" defaultValue="minh@university.edu" className="w-full rounded-xl border border-[#22C55E]/10 bg-[#0F1A2A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22C55E]/35 focus:ring-1 focus:ring-[#22C55E]/30" />
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
                <p className="text-sm text-slate-400 mt-1">Manage access and roles for your team ({billing.membersCount}/{billing.membersLimit} seats used).</p>
              </div>
              <Button icon={<UserPlus size={16} />}>Invite Member</Button>
            </div>

            <div className="bg-[#162032]/40 rounded-2xl border border-[#22C55E]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#0F1A2A] border-b border-[#22C55E]/10">
                    <tr>
                      <th className="px-6 py-4 font-medium text-slate-400">User</th>
                      <th className="px-6 py-4 font-medium text-slate-400">Role</th>
                      <th className="px-6 py-4 font-medium text-slate-400">Status</th>
                      <th className="px-6 py-4 font-medium text-slate-400">Joined</th>
                      <th className="px-6 py-4 font-medium text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22C55E]/5 text-slate-300">
                    {mockMembers.map(member => (
                      <tr key={member.id} className="hover:bg-[#22C55E]/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={member.avatar} fallback={member.name.charAt(0)} size="sm" />
                            <div>
                              <p className="font-medium text-white">{member.name}</p>
                              <p className="text-xs text-slate-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            member.orgRole === 'owner' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            member.orgRole === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            member.orgRole === 'lecturer' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-slate-500/10 text-slate-300 border-slate-500/20'
                          }`}>
                            {member.orgRole === 'owner' && <ShieldCheck size={12} />}
                            {member.orgRole === 'admin' && <Shield size={12} />}
                            {member.orgRole.charAt(0).toUpperCase() + member.orgRole.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {member.status === 'active' 
                            ? <span className="text-[#22C55E]">Active</span>
                            : <span className="text-yellow-500">Invited</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{member.joinedAt}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 text-slate-500 hover:text-white hover:bg-[#162032] rounded-lg transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'org-billing':
        return (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-xl font-bold text-white">Billing & Plan</h2>
              <p className="text-sm text-slate-400 mt-1">Manage your organization's subscription and quotas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#162032] to-[#0F1A2A] rounded-2xl border border-[#22C55E]/20 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-3 py-1 rounded-md border text-xs font-bold uppercase tracking-wider ${
                      billing.plan === 'pro' || billing.plan === 'business' || billing.plan === 'enterprise' 
                        ? 'border-blue-500/35 bg-blue-500/10 text-blue-300'
                        : 'border-[#22C55E]/35 bg-[#22C55E]/10 text-[#6EE7B7]'
                    }`}>
                      {billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)} Plan
                    </span>
                    <span className="text-xs text-slate-500">Renews on {billing.renewalDate}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-4">
                    {billing.plan === 'free' ? '$0' : billing.plan === 'pro' ? '$5' : billing.plan === 'business' ? '$15' : 'Custom'} <span className="text-sm font-normal text-slate-400">/mo</span>
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">Active workspace subscription for {orgName}.</p>
                </div>
                <div className="mt-6">
                  <Button onClick={handleUpgrade} className="w-full" variant={billing.plan === 'free' ? 'primary' : 'outline'}>
                    {billing.plan === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/10 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive size={14} className="text-orange-400" />
                      <span className="text-sm font-medium text-slate-200">Storage</span>
                    </div>
                    <span className="text-xs text-slate-400">{billing.storageUsed} GB / {billing.storageLimit === 1000 ? 'Unlimited' : `${billing.storageLimit} GB`}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0A0F1A] overflow-hidden">
                    <div className="h-full rounded-full bg-orange-400" style={{ width: `${storagePercent}%` }} />
                  </div>
                </div>

                <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/10 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-yellow-400" />
                      <span className="text-sm font-medium text-slate-200">AI Quota</span>
                    </div>
                    <span className="text-xs text-slate-400">{billing.aiUsed} / {billing.aiLimit > 1000 ? 'Unlimited' : billing.aiLimit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0A0F1A] overflow-hidden">
                    <div className="h-full rounded-full bg-yellow-400" style={{ width: `${aiPercent}%` }} />
                  </div>
                </div>

                <div className="bg-[#162032]/40 rounded-xl border border-[#22C55E]/10 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-blue-400" />
                      <span className="text-sm font-medium text-slate-200">Members</span>
                    </div>
                    <span className="text-xs text-slate-400">{billing.membersCount} / {billing.membersLimit > 100 ? 'Unlimited' : billing.membersLimit}</span>
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
    <div className="h-full w-full bg-[#0A0F1A] overflow-hidden flex">
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
    </div>
  );
};
