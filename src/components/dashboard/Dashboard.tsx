import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { TaskPanel } from './TaskPanel';
import { Task, Project, Status, Priority, User, WorkspaceMember, Role } from '../../types';
import { workspaceMemberToUser } from '../../data/workspaceStore';
import { normalizeProjects, resolveProjectMembers } from '../../data/projectCompatibility';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TeamModal } from './TeamModal';
import { ProfileModal } from './ProfileModal';
import { useToast } from '../ui/Toast';
import { OrgPlan } from '../../types';
import { useLang } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Bell, Menu, LayoutGrid, List, Plus, Calendar as CalendarIcon, CalendarDays, Filter, X, LogOut, Kanban, Sparkles, Users as UsersIcon, TrendingUp, AlertTriangle, WandSparkles, FileText, Paperclip, MessageSquare, Trash2, Eye, Download, Grid3X3, ImageIcon, File, Video, FileImage, FileCode2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentDashboardOverview } from './views/StudentDashboardOverview';
import { AiPlannerView } from './views/AiPlannerView';
import { AnalyticsView } from './views/AnalyticsView';
import { ProjectMembersView } from './views/ProjectMembersView';
import { MembersDatabaseView } from './views/MembersDatabaseView';
import { ProjectFilesView } from './views/ProjectFilesView';
import { KanbanBoard } from './views/KanbanBoard';
import { TimelineView } from './views/TimelineView';
import { CalendarView } from './views/CalendarView';
import { SettingsView } from './views/SettingsView';
import { AddTaskModal } from './modals/AddTaskModal';
import { CreateProjectModal } from './modals/CreateProjectModal';
import { SignOutConfirmDialog } from './modals/SignOutConfirmDialog';
import { CreateOrgModal } from './modals/CreateOrgModal';
import { InviteOrgMemberModal } from './modals/InviteOrgMemberModal';
import { PromptCommentModal } from './modals/PromptCommentModal';
import { DeleteConfirmDialog } from './modals/DeleteConfirmDialog';
import { AppNotification, ProjectTab, PlannerDifficulty, PlannerCategory, GeneratedPlanStep, GeneratedPlanResponse, ProjectFileItem, MemberWorkloadLabel, MemberAssignmentSuggestion, MembersDatabaseRow, BaseMembersDatabaseRow, ProjectWithMembers, InviteRole } from './utils/dashboardTypes';
import { getStoredUserPlan, computeProgressFromTasks, TASK_SKILL_KEYWORDS, OPEN_TASK_WEIGHTS, inferTaskSkillTags, getWorkloadLabel, getAuthToken, getActiveOrgId, setActiveOrgId } from './utils/dashboardUtils';
import { listMyOrgs, getOrgDetail, createOrg, inviteMember, updateMemberRole, removeMember } from '../../api/org';
import type { OrgSummary, OrgDetail } from '../../api/org';
import { listProjects, getProjectDetail, createProject, updateProject, deleteProject, createTask, updateTask, deleteTask, addProjectMember, updateProjectMemberRole, removeProjectMember, listProjectFiles, uploadProjectFile, deleteProjectFile, TaskDto } from '../../api/project';
import { mapProjectDetailToProject } from '../../utils/projectMapper';
import { useSignalR } from '../../hooks/useSignalR';
import { createInvitation } from '../../api/invitation';
import { chatWithAi, syncProjectData, generateProjectPlan } from '../../api/ai';
import { getUserSkills, updateUserSkills } from '../../api/auth';
import { getNotifications as fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/lecturer';
import { OnboardingSkillsModal } from './modals/OnboardingSkillsModal';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [storedUserPlan] = useState<OrgPlan>(getStoredUserPlan);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [projectViewMode, setProjectViewMode] = useState<'kanban' | 'timeline' | 'calendar'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState<Status>('todo');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'members' | 'settings'>('dashboard');
  const [projectTab, setProjectTab] = useState<ProjectTab>('board');
  const [projectFiles, setProjectFiles] = useState<Record<string, ProjectFileItem[]>>({});
  const [plannerInput, setPlannerInput] = useState({
    description: 'Poster campaign for environmental awareness',
    projectGoal: 'Create an A1 poster for Tech Day 2026',
    teamSize: 4,
    deadlineWeeks: 4,
    difficulty: 'Medium' as PlannerDifficulty,
    category: 'Design' as PlannerCategory,
  });
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlanResponse | null>(null);
  const { t } = useLang();
  const { user, logout: authLogout } = useAuth();

  // -- Skills state --
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [showOnboardingSkills, setShowOnboardingSkills] = useState(false);

  // -- Org state --
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(getActiveOrgId());
  const [orgDetail, setOrgDetail] = useState<OrgDetail | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showInviteOrgMember, setShowInviteOrgMember] = useState(false);
  const [orgActionLoading, setOrgActionLoading] = useState(false);
  const [commentPrompt, setCommentPrompt] = useState<{ taskId: string, newStatus: Status, taskDescription: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string, name: string } | null>(null);
  const [initialCheckoutPlan, setInitialCheckoutPlan] = useState<'pro' | 'business' | null>(null);
  const [initialCheckoutCycle, setInitialCheckoutCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentPlan = useMemo<OrgPlan>(() => {
    const plan = orgDetail?.plan?.toLowerCase();
    if (plan === 'free' || plan === 'pro' || plan === 'business' || plan === 'enterprise') {
      return plan;
    }
    return storedUserPlan;
  }, [orgDetail?.plan, storedUserPlan]);

  useEffect(() => {
    if (orgDetail?.plan) {
      localStorage.setItem('userPlan', currentPlan);
    }
  }, [currentPlan, orgDetail?.plan]);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      if (!user?.id) return;
      try {
        const data = await fetchNotifications();
        if (!cancelled) setNotifications(data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user?.id]);
  useEffect(() => {
    const pendingPlan = localStorage.getItem('checkout_plan_on_mount');
    const pendingCycle = localStorage.getItem('checkout_cycle_on_mount');
    if (pendingPlan === 'pro' || pendingPlan === 'business') {
      localStorage.removeItem('checkout_plan_on_mount');
      localStorage.removeItem('checkout_cycle_on_mount');
      setActiveTab('settings');
      setInitialCheckoutPlan(pendingPlan);
      setInitialCheckoutCycle(pendingCycle === 'yearly' ? 'yearly' : 'monthly');
    }
  }, []);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // -- Load orgs on mount --
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    listMyOrgs(token).then(list => {
      setOrgs(list);
      if (list.length > 0) {
        const savedId = getActiveOrgId();
        const targetId = savedId && list.some(o => o.id === savedId) ? savedId : list[0].id;
        setActiveOrgIdState(targetId);
        setActiveOrgId(targetId);
      }
    }).catch(() => { /* token expired or API down */ });
  }, []);

  // -- Load user skills on mount --
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    getUserSkills(token)
      .then(skills => {
        setUserSkills(skills);
        if (!skills || skills.length === 0) {
          setShowOnboardingSkills(true);
        }
      })
      .catch(err => {
        console.error('Failed to fetch user skills on mount:', err);
      });
  }, []);

  const handleOnboardingSkillsSubmit = async (skills: string[]) => {
    const token = getAuthToken();
    if (!token) return;
    await updateUserSkills(token, skills);
    setUserSkills(skills);
    setShowOnboardingSkills(false);
    showToast('K? nang c?a b?n dã du?c c?p nh?t thành công!');
  };

  // -- Load org detail when activeOrgId changes --
  useEffect(() => {
    if (!activeOrgId) { setOrgDetail(null); return; }
    const token = getAuthToken();
    if (!token) return;
    setOrgLoading(true);
    getOrgDetail(token, activeOrgId)
      .then(detail => setOrgDetail(detail))
      .catch(() => setOrgDetail(null))
      .finally(() => setOrgLoading(false));
  }, [activeOrgId]);

  // -- Refresh projects list from backend API --
  const refreshProjectsList = async () => {
    const token = getAuthToken();
    const orgId = activeOrgId;
    if (!token || !orgId) return;

    try {
      const summaries = await listProjects(token, orgId);
      if (!summaries || summaries.length === 0) {
        setProjects([]);
        setActiveProjectId('');
        return;
      }

      const details = await Promise.all(
        summaries.map(s => getProjectDetail(token, orgId, s.id))
      );

      // Re-fetch org details to keep members database in sync
      const orgDet = await getOrgDetail(token, orgId);
      if (orgDet) setOrgDetail(orgDet);

      const currentOrgRole = orgDet?.members.find(member => member.userId === user?.id)?.role;
      const canSeeAllOrgProjects = ['owner', 'admin', 'lecturer'].includes((currentOrgRole || '').toLowerCase());
      const mappedProjects = details
        .map(mapProjectDetailToProject)
        .filter(project => canSeeAllOrgProjects || !user?.id || project.memberIds.includes(user.id));
      setProjects(mappedProjects);

      setActiveProjectId(prevId => {
        if (prevId && mappedProjects.some(p => p.id === prevId)) {
          return prevId;
        }
        return mappedProjects[0]?.id || '';
      });
    } catch (err) {
      console.error('Error fetching projects:', err);
      showToast('Không th? t?i danh sách d? án t? server', 'error');
    }
  };

  // -- Load projects when activeOrgId changes --
  useEffect(() => {
    refreshProjectsList();

    // T? d?ng d?ng b? d? li?u d? án lên RAM Vector Store c?a AI khi ngu?i dùng t?i dashboard ho?c chuy?n Org
    const token = getAuthToken();
    if (token && activeOrgId) {
      syncProjectData(token, activeOrgId)
        .then(res => console.log('AI Vector Store auto-synced:', res.message))
        .catch(err => console.warn('AI Vector Store auto-sync failed:', err));
    }

    // 2. T? d?ng làm m?i d? li?u khi ngu?i dùng chuy?n l?i tab này (Window Focus)
    const handleFocus = () => {
      refreshProjectsList();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeOrgId]);

  // -- SignalR Integration --
  const { on, off } = useSignalR(getAuthToken(), activeProjectId);

  useEffect(() => {
    const handleTaskUpdated = (task: TaskDto) => {
      console.log('SignalR: Task updated', task);
      refreshProjectsList();
    };
    const handleTaskCreated = (task: TaskDto) => {
      console.log('SignalR: Task created', task);
      refreshProjectsList();
    };
    const handleTaskDeleted = (taskId: string) => {
      console.log('SignalR: Task deleted', taskId);
      refreshProjectsList();
    };

    on('TaskUpdated', handleTaskUpdated);
    on('TaskCreated', handleTaskCreated);
    on('TaskDeleted', handleTaskDeleted);

    return () => {
      off('TaskUpdated', handleTaskUpdated);
      off('TaskCreated', handleTaskCreated);
      off('TaskDeleted', handleTaskDeleted);
    };
  }, [on, off]);

  // -- Load project files when activeProjectId changes --
  useEffect(() => {
    if (!activeOrgId || !activeProjectId) return;
    const token = getAuthToken();
    if (!token) return;

    listProjectFiles(token, activeOrgId, activeProjectId).then(files => {
      setProjectFiles(prev => ({
        ...prev,
        [activeProjectId]: files.map((f: any) => ({
          id: f.id,
          name: f.fileName,
          sizeLabel: f.sizeLabel,
          uploadedAt: f.uploadedAt,
          uploadedBy: f.uploadedBy,
          mimeType: f.mimeType,
          objectUrl: `http://localhost:5093${f.fileUrl}`
        }))
      }));
    }).catch(console.error);
  }, [activeProjectId, activeOrgId]);

  // Click outside handler for profile menu & notification panel
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);



  // Derive workspace users from org members + project members (from API data)
  const workspaceUsers = useMemo(() => {
    const userMap = new Map<string, User>();

    // From orgDetail members
    if (orgDetail?.members) {
      orgDetail.members.forEach(m => {
        userMap.set(m.userId, {
          id: m.userId,
          name: m.name,
          avatar: m.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`,
          email: m.email,
          role: m.role as Role,
        });
      });
    }

    // From project members (may include members not in org detail response)
    projects.forEach(p => {
      p.members?.forEach(u => {
        if (!userMap.has(u.id)) userMap.set(u.id, u);
      });
    });

    return Array.from(userMap.values());
  }, [orgDetail, projects]);

  const currentWorkspaceMember = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      profile: {
        name: user.name,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
        email: user.email,
        role: user.role as Role,
        title: user.role === 'admin' ? 'System Admin' : user.role === 'lecturer' ? 'Lecturer' : 'Contributor',
        bio: 'Vertex user profile.',
      },
      skills: userSkills,
      availability: 'available' as const,
      taskStats: { completed: 0, inProgress: 0, bySkill: {} },
      projectsJoined: [],
      history: [],
    };
  }, [user, userSkills]);

  const currentUserName = currentWorkspaceMember?.profile.name || user?.name || 'User';
  const currentUserAvatar = currentWorkspaceMember?.profile.avatar || (user ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}` : 'https://i.pravatar.cc/150?u=me');
  const currentUserTitle = currentWorkspaceMember?.profile.title || (user?.role === 'admin' ? 'System Admin' : user?.role === 'lecturer' ? 'Lecturer' : 'Contributor');

  const memberLookup = useMemo(() => {
    return new Map(workspaceUsers.map(user => [user.id, user]));
  }, [workspaceUsers]);

  const membersDatabase = useMemo<BaseMembersDatabaseRow[]>(() => {
    const workspaceMemberMap = new Map<string, WorkspaceMember>(workspaceMembers.map(member => [member.id, member]));

    return workspaceUsers.map(user => {
      const profile = workspaceMemberMap.get(user.id);
      const assignedTasks = projects.flatMap(project => (
        project.tasks.filter(task => task.assignee?.id === user.id)
      ));
      const memberProjects = projects.filter(project => project.memberIds.includes(user.id));

      const completedTasks = assignedTasks.filter(task => task.status === 'done').length;
      const inProgressTasks = assignedTasks.filter(task => task.status === 'in-progress').length;

      const availability = profile?.availability
        ?? (inProgressTasks > 0 ? 'busy' : 'available');

      return {
        id: user.id,
        name: profile?.profile.name || user.name,
        avatar: profile?.profile.avatar || user.avatar,
        email: user.email || profile?.profile.email || `${user.name.toLowerCase().replace(/\s+/g, '.')}@team.local`,
        role: (profile?.profile.role || user.role || 'student').toUpperCase(),
        title: profile?.profile.title || 'Contributor',
        bio: profile?.profile.bio || '',
        availability,
        skills: profile?.skills || [],
        projectIds: memberProjects.map(project => project.id),
        projectNames: memberProjects.map(project => project.name),
        completedTasks,
        inProgressTasks,
        history: profile?.history || [],
      };
    });
  }, [projects, workspaceMembers, workspaceUsers]);

  const getProjectMembers = (project: Project): User[] => {
    return resolveProjectMembers(project, memberLookup);
  };

  const fallbackProject: Project = { id: '', name: 'No projects', memberIds: [], tasks: [], deadline: '', progress: 0 };
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || fallbackProject;
  const activeProjectMembers = useMemo(() => {
    return activeProject ? getProjectMembers(activeProject) : [];
  }, [activeProject, memberLookup]);
  const currentProjectMember = activeProjectMembers.find(member => member.id === user?.id);
  const isCurrentProjectLeader = (currentProjectMember?.role as string) === 'Leader';
  const activeProjectWithMembers: ProjectWithMembers = {
    ...activeProject,
    members: activeProjectMembers,
  };
  const projectsWithMembers: ProjectWithMembers[] = useMemo(() => {
    return projects.map(project => ({ ...project, members: getProjectMembers(project) }));
  }, [projects, memberLookup]);

  const projectProgressMap = useMemo(() => {
    return projects.reduce<Record<string, number>>((acc, project) => {
      acc[project.id] = computeProgressFromTasks(project);
      return acc;
    }, {});
  }, [projects]);
  const activeProjectProgress = projectProgressMap[activeProject.id] ?? activeProject.progress;

  const memberIntelligenceMap = useMemo(() => {
    const totalOpenWeight = projects.reduce((sum, project) => (
      sum + project.tasks.reduce((taskSum, task) => taskSum + OPEN_TASK_WEIGHTS[task.status], 0)
    ), 0);
    const avgOpenWeight = membersDatabase.length > 0 ? totalOpenWeight / membersDatabase.length : 0;

    const memberWorkloadMap = new Map<string, { weightedTasks: number; utilization: number; label: MemberWorkloadLabel }>();
    const memberSkillScoreMap = new Map<string, number>();

    membersDatabase.forEach(member => {
      const assignedTasks = projects.flatMap(project => (
        project.tasks.filter(task => task.assignee?.id === member.id)
      ));

      const weightedTasks = assignedTasks.reduce((sum, task) => sum + OPEN_TASK_WEIGHTS[task.status], 0);
      const utilization = avgOpenWeight > 0 ? Math.round((weightedTasks / avgOpenWeight) * 100) : 100;

      memberWorkloadMap.set(member.id, {
        weightedTasks,
        utilization,
        label: getWorkloadLabel(utilization),
      });

      const coverageSamples = assignedTasks.map(task => {
        const taskSkills = inferTaskSkillTags(task).map(skill => skill.toLowerCase());
        const memberSkills = member.skills.map(skill => skill.toLowerCase());
        const overlap = taskSkills.filter(skill => memberSkills.includes(skill)).length;
        return taskSkills.length > 0 ? overlap / taskSkills.length : 0;
      });

      const taskCoverage = coverageSamples.length > 0
        ? coverageSamples.reduce((sum, value) => sum + value, 0) / coverageSamples.length
        : member.skills.length > 0 ? 0.62 : 0.35;
      const completionFactor = Math.min(1, member.completedTasks / 16);
      const skillDepth = Math.min(1, member.skills.length / 5);
      const score = Math.round(Math.min(100, (taskCoverage * 68 + completionFactor * 22 + skillDepth * 10) * 100 / 100));
      memberSkillScoreMap.set(member.id, score);
    });

    const activeMemberIds = new Set(activeProjectMembers.map(member => member.id));
    const suggestionsByMember = new Map<string, MemberAssignmentSuggestion[]>();
    const activeTaskCandidates = activeProject.tasks.filter(task => task.status !== 'done');

    activeTaskCandidates.forEach(task => {
      const taskSkills = inferTaskSkillTags(task).map(skill => skill.toLowerCase());
      const candidateRows = membersDatabase.filter(member => activeMemberIds.has(member.id));
      if (candidateRows.length === 0) return;

      const scoreCandidate = (member: BaseMembersDatabaseRow): { value: number; reason: string } => {
        const memberSkills = member.skills.map(skill => skill.toLowerCase());
        const overlap = taskSkills.filter(skill => memberSkills.includes(skill)).length;
        const skillFit = taskSkills.length > 0 ? overlap / taskSkills.length : 0.5;

        const workloadStats = memberWorkloadMap.get(member.id);
        const utilization = workloadStats?.utilization ?? 100;
        const capacity = Math.max(0.2, 1 - Math.max(0, utilization - 80) / 100);

        const availabilityScore = member.availability === 'available'
          ? 1
          : member.availability === 'busy'
            ? 0.6
            : 0.3;

        const value = skillFit * 0.55 + capacity * 0.25 + availabilityScore * 0.2;

        let reason = 'Balanced current workload';
        if (skillFit >= 0.8 && taskSkills.length > 0) {
          reason = `Strong fit for ${taskSkills.slice(0, 2).join(', ')}`;
        } else if (capacity >= 0.85) {
          reason = 'Lower current workload capacity';
        } else if (member.availability === 'available') {
          reason = 'Currently available for focused execution';
        }

        return { value, reason };
      };

      const ranked = candidateRows
        .map(member => ({ member, ...scoreCandidate(member) }))
        .sort((a, b) => b.value - a.value);

      const best = ranked[0];
      if (!best) return;

      const currentAssigneeId = task.assignee?.id;
      const currentScore = currentAssigneeId
        ? (ranked.find(entry => entry.member.id === currentAssigneeId)?.value ?? 0)
        : -1;

      const needsSuggestion = !currentAssigneeId || (best.member.id !== currentAssigneeId && best.value - currentScore >= 0.14);
      if (!needsSuggestion) return;

      const nextSuggestion: MemberAssignmentSuggestion = {
        taskId: task.id,
        taskTitle: task.title,
        projectId: activeProject.id,
        projectName: activeProject.name,
        confidence: Math.round(best.value * 100),
        reason: best.reason,
      };

      suggestionsByMember.set(best.member.id, [...(suggestionsByMember.get(best.member.id) || []), nextSuggestion]);
    });

    return membersDatabase.reduce<Record<string, {
      skillScore: number;
      workloadUtilization: number;
      workloadLabel: MemberWorkloadLabel;
      suggestionCount: number;
      topSuggestion: MemberAssignmentSuggestion | null;
    }>>((acc, member) => {
      const workload = memberWorkloadMap.get(member.id);
      const suggestions = suggestionsByMember.get(member.id) || [];
      const topSuggestion = suggestions.sort((a, b) => b.confidence - a.confidence)[0] || null;

      acc[member.id] = {
        skillScore: memberSkillScoreMap.get(member.id) ?? 0,
        workloadUtilization: workload?.utilization ?? 100,
        workloadLabel: workload?.label ?? 'balanced',
        suggestionCount: suggestions.length,
        topSuggestion,
      };
      return acc;
    }, {});
  }, [projects, membersDatabase, activeProject, activeProjectMembers]);

  const membersDatabaseWithIntelligence = useMemo<MembersDatabaseRow[]>(() => {
    return membersDatabase.map(member => {
      const intelligence = memberIntelligenceMap[member.id];
      return {
        ...member,
        skillScore: intelligence?.skillScore ?? 0,
        workloadUtilization: intelligence?.workloadUtilization ?? 100,
        workloadLabel: intelligence?.workloadLabel ?? 'balanced',
        suggestionCount: intelligence?.suggestionCount ?? 0,
        topSuggestion: intelligence?.topSuggestion ?? null,
      };
    });
  }, [membersDatabase, memberIntelligenceMap]);

  // Filtered tasks based on search query
  const displayProject: ProjectWithMembers = searchQuery.trim() ? {
    ...activeProjectWithMembers,
    tasks: activeProject.tasks.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignee?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  } : activeProjectWithMembers;

  const teamWorkload = useMemo(() => {
    const map = new Map<string, number>();
    activeProject.tasks.forEach(task => {
      const key = task.assignee?.name || 'Unassigned';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, tasks]) => ({ name, tasks })).sort((a, b) => b.tasks - a.tasks);
  }, [activeProject]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    return activeProject.tasks.filter(task => new Date(task.endDate) < today && task.status !== 'done').length;
  }, [activeProject]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskDrop = async (taskId: string, newStatus: Status) => {
    const token = getAuthToken();
    const orgId = activeOrgId;
    const projectId = activeProjectId;
    if (!token || !orgId || !projectId) {
      showToast('Không d? thông tin d? kéo th? công vi?c', 'error');
      return;
    }

    const task = activeProject.tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentProjectMember = activeProject.members?.find(m => m.id === user?.id);
    const isAssignee = task.assignee?.id === user?.id;
    const isLeader = (currentProjectMember?.role as string) === 'Leader';
    if (!isLeader && !isAssignee) {
      showToast('Ch? Leader ho?c ngu?i ph? trách m?i có quy?n c?p nh?t công vi?c', 'error');
      return;
    }

    // Phân quy?n kéo th? chi ti?t theo yêu c?u
    if (task.status === 'done' && newStatus !== 'done') {
      if (!isLeader) {
        showToast('Ch? Leader m?i có quy?n chuy?n công vi?c t? Done v? tr?ng thái khác', 'error');
        return;
      }
    }

    if (task.status === 'todo' && newStatus === 'in-progress') {
      if (!isAssignee) {
        showToast('Ch? ngu?i du?c giao công vi?c (Assignee) m?i có th? chuy?n sang In Progress', 'error');
        return;
      }
    }

    if (task.status === 'in-progress' && newStatus === 'todo') {
      if (!isAssignee) {
        showToast('Ch? ngu?i du?c giao công vi?c (Assignee) m?i có th? chuy?n t? In Progress v? Todo', 'error');
        return;
      }
    }

    if (newStatus === 'ready-for-review') {
      if (!isAssignee) {
        showToast('Ch? ngu?i du?c giao công vi?c (Assignee) m?i có th? chuy?n sang Ready for Review', 'error');
        return;
      }
    }

    if (newStatus === 'done') {
      if (task.status !== 'ready-for-review') {
        showToast('Ch? có th? kéo sang Done t? c?t Ready for Review', 'error');
        return;
      }
      if (!isLeader) {
        showToast('Ch? Leader m?i có quy?n duy?t task (chuy?n sang Done)', 'error');
        return;
      }
    }

    let finalDescription = task.description || '';

    if (isLeader) {
      if (
        newStatus === 'done' ||
        (task.status === 'ready-for-review' && newStatus === 'in-progress')
      ) {
        setCommentPrompt({
          taskId,
          newStatus,
          taskDescription: finalDescription,
        });
        return; // D?ng lu?ng x? lý ? dây, d?i Modal tr? k?t qu? v?
      }
    }

    await executeTaskDrop(taskId, newStatus, finalDescription);
  };

  const handleCommentSubmit = async (comment: string) => {
    if (!commentPrompt) return;

    let finalDescription = commentPrompt.taskDescription;
    if (comment.trim()) {
      const today = new Date().toLocaleDateString('vi-VN');
      finalDescription = `**[Leader's Feedback - ${today}]:** ${comment.trim()}\n\n${finalDescription}`;
    }

    const { taskId, newStatus } = commentPrompt;
    setCommentPrompt(null);
    await executeTaskDrop(taskId, newStatus, finalDescription);
  };

  const executeTaskDrop = async (taskId: string, newStatus: Status, finalDescription: string) => {
    const token = getAuthToken();
    const orgId = activeOrgId;
    const projectId = activeProjectId;
    if (!token || !orgId || !projectId) return;

    try {
      // 1. C?p nh?t state local l?p t?c d? UI kéo th? ph?n h?i mu?t mà (Optimistic UI update)
      setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus, description: finalDescription } : t)
        };
      }));

      const task = activeProject.tasks.find(t => t.id === taskId);

      // 2. G?i request c?p nh?t lên Backend
      await updateTask(token, orgId, projectId, taskId, {
        status: newStatus,
        description: finalDescription !== (task?.description || '') ? finalDescription : undefined,
      });

      // 3. Fetch l?i d? d?m b?o d? li?u d?ng b? chính xác v?i DB
      await refreshProjectsList();
    } catch (err) {
      console.error('Error in executeTaskDrop:', err);
      showToast('Không th? luu tr?ng thái kéo th? công vi?c', 'error');
      await refreshProjectsList();
    }
  };

  const handleOpenAddTask = (status: Status) => {
    setAddTaskStatus(status);
    setShowAddTask(true);
  };

  const handleAddTask = async (title: string, priority: Priority, description: string, attachmentCount: number, endDate: string, assigneeId: string | null) => {
    const token = getAuthToken();
    const orgId = activeOrgId;
    const projectId = activeProjectId;
    if (!token || !orgId || !projectId) {
      showToast('Không d? thông tin d? t?o công vi?c', 'error');
      return;
    }

    try {
      const startDate = new Date().toISOString();

      await createTask(token, orgId, projectId, {
        title,
        description: description.trim() || undefined,
        status: addTaskStatus,
        priority,
        assigneeId: assigneeId,
        startDate,
        endDate,
      });

      showToast('Task created successfully!');
      setShowAddTask(false);
      await refreshProjectsList();
    } catch (err) {
      console.error('Error creating task:', err);
      showToast('Không th? t?o công vi?c m?i', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const token = getAuthToken();
    const orgId = activeOrgId;
    const projectId = activeProjectId;
    if (!token || !orgId || !projectId) {
      showToast('Không d? thông tin d? xóa công vi?c', 'error');
      return;
    }

    const taskToDelete = activeProject.tasks.find(task => task.id === taskId);
    if (!taskToDelete) return;

    const currentProjectMember = activeProject.members?.find(m => m.id === user?.id);
    if ((currentProjectMember?.role as string) !== 'Leader') {
      showToast('Ch? Leader m?i có quy?n xóa công vi?c', 'error');
      return;
    }

    try {
      await deleteTask(token, orgId, projectId, taskId);
      showToast(`Deleted task "${taskToDelete.title}"`);
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
      await refreshProjectsList();
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast('Không th? xóa công vi?c', 'error');
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const token = getAuthToken();
    const orgId = activeOrgId;
    const projectId = activeProjectId;
    if (!token || !orgId || !projectId) {
      showToast('Không d? thông tin d? c?p nh?t công vi?c', 'error');
      return;
    }

    const task = activeProject.tasks.find(t => t.id === updatedTask.id);
    const currentProjectMember = activeProject.members?.find(m => m.id === user?.id);
    const isAssignee = task?.assignee?.id === user?.id;

    if ((currentProjectMember?.role as string) !== 'Leader' && !isAssignee) {
      showToast('Ch? Leader ho?c ngu?i ph? trách m?i có quy?n c?p nh?t công vi?c', 'error');
      return;
    }

    try {
      await updateTask(token, orgId, projectId, updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description || '',
        status: updatedTask.status,
        priority: updatedTask.priority,
        assigneeId: updatedTask.assignee?.id || null,
        startDate: updatedTask.startDate,
        endDate: updatedTask.endDate,
      });

      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }

      await refreshProjectsList();
    } catch (err) {
      console.error('Error updating task:', err);
      showToast('Không th? c?p nh?t công vi?c', 'error');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const projectToDeleteObj = projects.find(p => p.id === projectId);
    if (!projectToDeleteObj) return;

    setProjectToDelete({ id: projectToDeleteObj.id, name: projectToDeleteObj.name });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const token = getAuthToken();
    const orgId = activeOrgId;
    if (!token || !orgId) {
      showToast('Không d? thông tin d? xóa d? án', 'error');
      return;
    }

    try {
      await deleteProject(token, orgId, projectToDelete.id);
      showToast(`Deleted project "${projectToDelete.name}"`);
      await refreshProjectsList();
    } catch (err) {
      console.error('Error deleting project:', err);
      showToast('Không th? xóa d? án', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  const handleAddProjectMember = async (user: User) => {
    const token = getAuthToken();
    const orgId = activeOrgId;
    const projectId = activeProjectId;
    if (!token || !orgId || !projectId) {
      showToast('Không d? thông tin d? thêm thành viên', 'error');
      return;
    }
    try {
      await addProjectMember(token, orgId, projectId, { emailOrUserId: user.id, role: 'Member' });
      showToast(`Added ${user.name} to ${activeProject.name}`);
      await refreshProjectsList();
    } catch (err) {
      console.error('Error adding project member:', err);
      showToast('Không th? thêm thành viên vào d? án', 'error');
    }
  };

  const handleInviteMember = async ({ email, role }: { email: string; role: InviteRole; projectCode: string; joinLink: string }) => {
    const token = getAuthToken();
    const orgId = activeOrgId;
    const projectId = activeProjectId;
    if (!token || !orgId || !projectId) {
      showToast('Không d? thông tin d? m?i thành viên', 'error');
      return;
    }

    const currentProjectMember = activeProject.members?.find(m => m.id === user?.id);
    if ((currentProjectMember?.role as string) !== 'Leader') {
      showToast('Ch? Leader m?i có quy?n m?i thành viên vào d? án', 'error');
      return;
    }

    try {
      await createInvitation({ email, role, targetType: 'Project', targetId: projectId });
      showToast(`Ðã g?i email m?i tham gia d? án t?i ${email}`);
    } catch (err: any) {
      console.error('Error inviting member by email:', err);
      showToast(err.message || `Không th? g?i l?i m?i t?i ${email}`, 'error');
    }
  };

  const handleRemoveProjectMember = async (userId: string) => {
    const member = activeProjectMembers.find(entry => entry.id === userId);
    if (!member) return;
    if (activeProjectMembers.length <= 1) {
      showToast('Each project needs at least one member.', 'error');
      return;
    }

    const token = getAuthToken();
    const orgId = activeOrgId;
    const projectId = activeProjectId;
    if (!token || !orgId || !projectId) {
      showToast('Không d? thông tin d? xóa thành viên', 'error');
      return;
    }

    try {
      await removeProjectMember(token, orgId, projectId, userId);
      showToast(`Removed ${member.name} from ${activeProject.name}`);
      await refreshProjectsList();
    } catch (err) {
      console.error('Error removing project member:', err);
      showToast('Không th? xóa thành viên kh?i d? án', 'error');
    }
  };

  const handleUpdateProjectMember = async (userId: string, role: string, skills: string | null) => {
    const token = getAuthToken();
    const orgId = activeOrgId;
    const projectId = activeProjectId;
    if (!token || !orgId || !projectId) return;

    try {
      await updateProjectMemberRole(token, orgId, projectId, userId, { role, projectSkills: skills });
      await refreshProjectsList();
    } catch (err) {
      console.error('Error updating project member:', err);
      showToast('Không th? c?p nh?t thông tin thành viên', 'error');
    }
  };

  const handleAddProject = async (name: string) => {
    const token = getAuthToken();
    const orgId = activeOrgId;
    if (!token || !orgId) {
      showToast('B?n chua dang nh?p ho?c chua ch?n t? ch?c', 'error');
      return;
    }

    try {
      const deadline = new Date(Date.now() + 30 * 86400000).toISOString();
      const newProjectSummary = await createProject(token, orgId, {
        name,
        description: 'New project',
        deadline,
      });

      showToast('Project created successfully!');

      await refreshProjectsList();

      setActiveProjectId(newProjectSummary.id);
      setActiveTab('projects');
      setProjectTab('board');
      setProjectViewMode('kanban');
      setShowCreateProject(false);
    } catch (err: any) {
      console.error('Error creating project:', err);
      showToast(err.message || 'Không th? t?o d? án m?i', 'error');
    }
  };

  const matchAssignee = (name: string, members: User[]): User | null => {
    if (!name || name.toLowerCase().trim() === 'unassigned') return null;
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const cleanName = clean(name);
    // 1. Exact match after cleaning
    let matched = members.find(m => clean(m.name) === cleanName);
    if (matched) return matched;
    // 2. Contains match
    matched = members.find(m => clean(m.name).includes(cleanName) || cleanName.includes(clean(m.name)));
    if (matched) return matched;
    // 3. Fallback to null
    return null;
  };

  const generateAiPlan = async (descriptionOverride?: string) => {
    if (!isCurrentProjectLeader) {
      showToast('Ch? Leader m?i có quy?n t?o AI plan', 'error');
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    const assignees = activeProjectMembers.length > 0 ? activeProjectMembers : workspaceUsers;
    const planningDescription = descriptionOverride ?? plannerInput.description;
    const weeks = Math.max(2, Math.min(24, plannerInput.deadlineWeeks));

    const teamMembersDto = assignees.map(a => {
      const isCurrentUser = a.id === user?.id;
      const coreSkillsList = isCurrentUser ? userSkills : [];
      return {
        name: a.name,
        targetSkills: a.projectSkills || null,
        coreSkills: coreSkillsList
      };
    });

    try {
      const response = await generateProjectPlan(token, {
        projectGoal: plannerInput.projectGoal,
        description: planningDescription,
        category: plannerInput.category,
        difficulty: plannerInput.difficulty,
        durationWeeks: weeks,
        teamSize: plannerInput.teamSize,
        teamMembers: teamMembersDto
      });

      console.log('AI raw response:', response);

      let jsonText = response?.planSummary;
      if (!jsonText || typeof jsonText !== 'string' || jsonText.trim().length === 0) {
        console.error('AI returned empty or invalid planSummary:', response);
        showToast('AI returned an empty response. Please try again.', 'error');
        return;
      }

      // Clean up markdown block if Gemini still returns it
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.error('Raw text was:', jsonText);
        showToast('AI returned invalid JSON format. Please try again.', 'error');
        return;
      }

      // Backward compatibility / robust normalization:
      let finalPlan: GeneratedPlanResponse;
      if (Array.isArray(parsedJson)) {
        // If it's a flat array of weekly steps (old structure)
        finalPlan = {
          plan: parsedJson.map((step: any) => ({
            week: step.week || "Week",
            milestone: step.task || "Milestone",
            subtasks: [
              {
                title: step.task || "Task",
                description: `AI generated from planner: ${planningDescription}`,
                assignee: step.assignee || "Unassigned",
                estHours: step.estHours || 10,
                priority: "Medium"
              }
            ]
          })),
          risks: []
        };
      } else if (parsedJson && Array.isArray(parsedJson.plan)) {
        // Correct new structure
        finalPlan = {
          plan: parsedJson.plan.map((step: any) => ({
            week: step.week || "Week",
            milestone: step.milestone || step.task || "Milestone",
            subtasks: Array.isArray(step.subtasks) ? step.subtasks.map((st: any) => ({
              title: st.title || st.task || "Task",
              description: st.description || `AI generated: ${st.title || st.task || "Task"}`,
              assignee: st.assignee || "Unassigned",
              estHours: typeof st.estHours === 'number' ? st.estHours : 10,
              priority: (st.priority === 'High' || st.priority === 'Medium' || st.priority === 'Low') ? st.priority : 'Medium'
            })) : []
          })),
          risks: Array.isArray(parsedJson.risks) ? parsedJson.risks.map((r: any) => String(r)) : []
        };
      } else {
        console.error('Invalid plan structure:', parsedJson);
        showToast('AI returned plan in unexpected format. Please try again.', 'error');
        return;
      }

      setGeneratedPlan(finalPlan);
      if (descriptionOverride) {
        setPlannerInput(prev => ({ ...prev, description: planningDescription }));
      }
      showToast('AI plan generated successfully from Gemini!');
    } catch (error) {
      console.error("AI Generation error:", error);
      showToast('Failed to connect to AI or invalid data format returned.', 'error');
    }
  };

  const regenerateAiPlan = () => {
    generateAiPlan();
  };

  const createProjectBoardFromPlan = async () => {
    if (!isCurrentProjectLeader) {
      showToast('Ch? Leader m?i có quy?n t?o task t? AI plan', 'error');
      return;
    }

    const token = getAuthToken();
    const orgId = activeOrgId;
    const projectId = activeProjectId;
    if (!token || !orgId || !projectId) {
      showToast('Missing required info to save project plan', 'error');
      return;
    }
    if (!generatedPlan || !generatedPlan.plan || generatedPlan.plan.length === 0) return;

    showToast('Saving AI generated tasks to database...');
    
    try {
      const assigneesList = activeProjectMembers.length > 0 ? activeProjectMembers : workspaceUsers;
      let tasksCreated = 0;

      // Create all tasks sequentially to preserve order
      for (let weekIdx = 0; weekIdx < generatedPlan.plan.length; weekIdx++) {
        const weekStep = generatedPlan.plan[weekIdx];
        const weekSubtasks = weekStep.subtasks || [];
        
        for (let subIdx = 0; subIdx < weekSubtasks.length; subIdx++) {
          const subtask = weekSubtasks[subIdx];
          const matchedMember = matchAssignee(subtask.assignee, assigneesList);
          
          const start = new Date();
          start.setDate(start.getDate() + weekIdx * 7);
          const end = new Date(start);
          end.setDate(end.getDate() + 5);
          
          await createTask(token, orgId, projectId, {
            title: subtask.title,
            description: subtask.description || `AI generated: ${subtask.title}`,
            status: 'todo',
            priority: (subtask.priority?.toLowerCase() || 'medium') as Priority,
            assigneeId: matchedMember?.id || null,
            startDate: start.toISOString(),
            endDate: end.toISOString()
          });

          tasksCreated++;
        }
      }
      
      await refreshProjectsList();
      
      setActiveTab('projects');
      setProjectTab('board');
      setProjectViewMode('kanban');
      setGeneratedPlan(null);
      showToast(`Added ${tasksCreated} AI-generated tasks to ${activeProject.name}!`);
    } catch (err) {
      console.error('Failed to save AI plan', err);
      showToast('Failed to save AI plan to database', 'error');
    }
  };

  const handleGenerateTasksFromHeader = () => {
    if (!isCurrentProjectLeader) {
      showToast('Ch? Leader m?i có quy?n t?o AI plan', 'error');
      return;
    }

    setGeneratedPlan(null);
    setPlannerInput(prev => ({
      ...prev,
      description: `Add more actionable tasks for "${activeProject.name}". Existing tasks: ${activeProject.tasks.slice(0, 8).map(task => task.title).join(', ') || 'none'}. New direction: `,
      projectGoal: `Expand ${activeProject.name} with additional tasks`,
      teamSize: Math.max(1, activeProjectMembers.length || prev.teamSize),
    }));
    setProjectTab('ai-planner');
  };
  const handleUploadProjectFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !activeOrgId) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      const currentProjectMember = activeProject.members?.find(m => m.id === user?.id);
      const role = (currentProjectMember?.role as string) || 'Member';

      const uploads = Array.from(fileList);
      for (const file of uploads) {
        await uploadProjectFile(token, activeOrgId, activeProjectId, file, role);
      }

      // Refresh files
      const files = await listProjectFiles(token, activeOrgId, activeProjectId);
      setProjectFiles(prev => ({
        ...prev,
        [activeProjectId]: files.map((f: any) => ({
          id: f.id,
          name: f.fileName,
          sizeLabel: f.sizeLabel,
          uploadedAt: f.uploadedAt,
          uploadedBy: f.uploadedBy,
          mimeType: f.mimeType,
          objectUrl: `http://localhost:5093${f.fileUrl}`
        }))
      }));

      showToast(`${uploads.length} file${uploads.length > 1 ? 's' : ''} uploaded`);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload file(s)', 'error');
    }
  };

  const handleDeleteProjectFile = async (fileId: string) => {
    if (!activeOrgId) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      const currentProjectMember = activeProject.members?.find(m => m.id === user?.id);
      const role = (currentProjectMember?.role as string) || 'Member';

      await deleteProjectFile(token, activeOrgId, activeProjectId, fileId, role);

      setProjectFiles(prev => ({
        ...prev,
        [activeProjectId]: (prev[activeProjectId] || []).filter(file => file.id !== fileId),
      }));
      showToast('File deleted successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete file', 'error');
    }
  };

  const handleRenameProjectFile = (fileId: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    setProjectFiles(prev => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).map(file => (
        file.id === fileId ? { ...file, name: trimmedName } : file
      )),
    }));
  };

  // -- Org action handlers --
  const refreshOrgDetail = () => {
    if (!activeOrgId) return;
    const token = getAuthToken();
    if (!token) return;
    getOrgDetail(token, activeOrgId).then(setOrgDetail).catch(() => { });
  };

  const handleCreateOrg = async (name: string, slug: string) => {
    const token = getAuthToken();
    if (!token) return;
    setOrgActionLoading(true);
    try {
      const newOrg = await createOrg(token, { name, slug });
      setOrgs(prev => [...prev, newOrg]);
      setActiveOrgIdState(newOrg.id);
      setActiveOrgId(newOrg.id);
      setShowCreateOrg(false);
      showToast(`Organization "${name}" created!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create organization', 'error');
    } finally {
      setOrgActionLoading(false);
    }
  };

  const handleInviteOrgMember = async (email: string, role: string) => {
    if (!activeOrgId) return;
    const token = getAuthToken();
    if (!token) return;
    setOrgActionLoading(true);
    try {
      await createInvitation({ email, role, targetType: 'Organization', targetId: activeOrgId });
      setShowInviteOrgMember(false);
      showToast(`Ðã g?i email m?i tham gia t? ch?c t?i ${email}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to invite member', 'error');
    } finally {
      setOrgActionLoading(false);
    }
  };

  const handleUpdateOrgMemberRole = async (memberId: string, role: string) => {
    if (!activeOrgId) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await updateMemberRole(token, activeOrgId, memberId, { role });
      refreshOrgDetail();
      showToast(`Role updated to ${role}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleRemoveOrgMember = async (memberId: string) => {
    if (!activeOrgId) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await removeMember(token, activeOrgId, memberId);
      refreshOrgDetail();
      await refreshProjectsList();
      showToast('Member removed');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  const handleSwitchOrg = (orgId: string) => {
    setActiveOrgIdState(orgId);
    setActiveOrgId(orgId);
    const org = orgs.find(o => o.id === orgId);
    if (org) setWorkspaceName(org.name);
  };

  const handleSignOut = async () => {
    await authLogout();
    showToast('Signed out successfully');
    setTimeout(() => {
      onNavigate?.('login');
    }, 300);
    setShowSignOutConfirm(false);
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const markNotification = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };
  const handleDashboardQuickPlan = () => {
    const prompt = plannerInput.description.trim();
    if (!prompt) {
      showToast('Please enter a planning prompt first.', 'error');
      return;
    }
    generateAiPlan(prompt);
    setActiveTab('projects');
    setProjectTab('ai-planner');
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const planBadgeLabel = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
  const planBadgeClass = currentPlan === 'pro' || currentPlan === 'business' || currentPlan === 'enterprise'
    ? 'border-blue-500/35 bg-blue-500/10 text-blue-300'
    : 'border-[#22C55E]/35 bg-[#22C55E]/10 text-[#6EE7B7]';

  useEffect(() => {
    if (!selectedTask) return;
    const latestTask = activeProject.tasks.find(task => task.id === selectedTask.id) || null;
    setSelectedTask(latestTask);
  }, [projects, activeProjectId]);

  const handleSaveProfile = async (member: WorkspaceMember) => {
    if (member.id === user?.id) {
      const token = getAuthToken();
      if (!token) throw new Error('Phiên dang nh?p dã h?t h?n, vui lòng dang nh?p l?i.');
      await updateUserSkills(token, member.skills);
      setUserSkills(member.skills);
    }

    setWorkspaceMembers(prev => {
      const next = prev.some(entry => entry.id === member.id)
        ? prev.map(entry => (entry.id === member.id ? member : entry))
        : [...prev, member];
      return next;
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0A0F1A] flex flex-col">
      {/* Topbar */}
      <header className="h-16 bg-[#0F1A2A]/80 backdrop-blur-xl border-b border-[#22C55E]/10 flex items-center justify-between px-4 sticky top-0 z-20 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-[#162032] rounded-lg lg:hidden text-slate-400"
          >
            <Menu size={20} />
          </button>
          <div
            className="vertex-brand flex items-center gap-2 cursor-pointer group"
            onClick={() => onNavigate?.('landing')}
            title="Back to Home"
          >
            <div className="vertex-mark w-8 h-8 rounded-lg flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.8" />
                <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.8" />
                <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.8" />
                <path d="M6 6L12 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-lg hidden sm:inline-block vertex-wordmark">Vertex</span>
            <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${planBadgeClass}`}>
              {planBadgeLabel}
            </span>
          </div>
        </div>

        <div className={`flex-1 max-w-xl mx-4 hidden md:block transition-opacity ${activeTab === 'projects' || activeTab === 'dashboard' || activeTab === 'members' ? '' : 'invisible pointer-events-none'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder={t.dashboard.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-[#162032] border-transparent focus:bg-[#0A0F1A] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 rounded-lg outline-none transition-all text-sm text-white placeholder-slate-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:bg-[#162032] rounded-full relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0F1A2A]"></span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-12 w-80 bg-[#0F1A2A] border border-[#22C55E]/10 rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[#22C55E]/10 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">{t.dashboard.notifications}</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[#22C55E] hover:underline">{t.dashboard.markAllRead}</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-[#22C55E]/10 hover:bg-[#162032] transition-colors cursor-pointer ${!n.read ? 'bg-[#22C55E]/5' : ''}`}
                        onClick={() => markNotification(n.id)}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <div className="w-2 h-2 rounded-full bg-[#22C55E] mt-1.5 flex-shrink-0"></div>}
                          <div className={!n.read ? '' : 'ml-4'}>
                            <p className="text-sm text-slate-300">{n.text}</p>
                            <p className="text-xs text-slate-500 mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="h-8 w-px bg-[#22C55E]/10 mx-1"></div>
          {/* Profile Menu */}
          <div ref={profileMenuRef} className="flex items-center gap-3 relative">
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-[#162032] p-1.5 rounded-lg transition-colors"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <Avatar src={currentUserAvatar} fallback={currentUserName.charAt(0)} size="sm" />
              <span className="text-sm font-medium text-slate-300 hidden sm:inline-block">{currentUserName} (You)</span>
            </div>

            {showProfileMenu && (
              <div className="absolute right-4 top-14 bg-[#0F1A2A] border border-[#22C55E]/10 rounded-xl shadow-lg shadow-black/30 py-2 w-56 z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#22C55E]/10 bg-[#162032]/60">
                  <p className="text-sm font-semibold text-white">{currentUserName} (You)</p>
                  <p className="text-xs text-slate-500 mt-0.5">{currentUserTitle}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#162032]"
                >
                  Profile & Skills
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#162032]"
                >
                  Account Settings
                </button>
                <div className="h-px bg-[#22C55E]/10 my-1"></div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowSignOutConfirm(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeProject={activeProjectId}
          activeTab={activeTab}
          onSelectProject={(id) => { setActiveProjectId(id); setActiveTab('projects'); setProjectTab('board'); setProjectViewMode('kanban'); }}
          projects={projects.map(p => ({ id: p.id, name: p.name }))}
          onOpenDashboard={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
          onOpenProjects={() => { setActiveTab('projects'); setProjectTab('board'); setProjectViewMode('kanban'); setIsSidebarOpen(false); }}
          onOpenSettings={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
          onOpenMembers={() => { setActiveTab('members'); setIsSidebarOpen(false); }}
          onCreateProject={() => setShowCreateProject(true)}
          onDeleteProject={(id) => handleDeleteProject(id)}
          onViewPlans={() => onNavigate?.('pricing')}
          userPlan={currentPlan}
          workspaceName={orgDetail?.name || workspaceName}
          workspaces={orgs.map(o => ({ id: o.id, name: o.name }))}
          activeWorkspaceId={activeOrgId || ''}
          onSwitchWorkspace={(id) => {
            handleSwitchOrg(id);
          }}
          onCreateWorkspace={() => setShowCreateOrg(true)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          {/* Project header */}
          {activeTab === 'projects' && (
            <div className="px-6 py-3 border-b border-[#22C55E]/10 bg-[#0F1A2A] flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                <span className="text-white font-bold" title={activeProject.description || ''}>{activeProject.name}</span>
                <span className="text-slate-600">•</span>
                <span className="text-[#22C55E] font-semibold">{activeProjectProgress}%</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-semibold">{activeProjectMembers[0]?.name || 'Unassigned'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{activeProjectMembers.length} members</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{activeProject.tasks.length} tasks</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{new Date(activeProject.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#162032] p-1 rounded-lg">
                    {([
                      { id: 'kanban', label: 'Board', icon: Kanban },
                      { id: 'timeline', label: 'Timeline', icon: CalendarIcon },
                      { id: 'calendar', label: 'Calendar', icon: CalendarDays },
                    ] as const).map(tab => {
                      const Icon = tab.icon;
                      const isActive = projectTab === 'board' && projectViewMode === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setProjectTab('board');
                            setProjectViewMode(tab.id);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isActive ? 'bg-[#0F1A2A] text-[#22C55E] shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          <Icon size={13} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1 bg-[#162032] p-1 rounded-lg">
                    {([
                      ...(isCurrentProjectLeader ? [{ id: 'ai-planner', label: 'AI Planner' } as const] : []),
                      { id: 'insights', label: 'Insights' },
                      { id: 'members', label: 'Members' },
                      { id: 'files', label: 'Files' },
                    ] as const).map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (tab.id === 'ai-planner') {
                            setGeneratedPlan(null);
                          }
                          setProjectTab(tab.id);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${projectTab === tab.id ? 'bg-[#0F1A2A] text-[#22C55E] shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTeamModal(true)}
                    className="px-3 py-1.5 rounded-lg border border-[#22C55E]/20 text-xs font-semibold text-[#6EE7B7] hover:bg-[#162032] hover:border-[#22C55E]/35 transition-all"
                  >
                    + Invite
                  </button>
                  {isCurrentProjectLeader && (
                    <Button size="sm" icon={<WandSparkles size={14} />} onClick={handleGenerateTasksFromHeader}>AI Generate</Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search indicator */}
          {activeTab === 'projects' && projectTab === 'board' && searchQuery.trim() && (
            <div className="px-6 py-2 bg-[#22C55E]/10 border-b border-[#22C55E]/20 flex items-center justify-between">
              <span className="text-sm text-[#22C55E]">
                Found {displayProject.tasks.length} task{displayProject.tasks.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </span>
              <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-white">Clear</button>
            </div>
          )}

          {/* Active tab content */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {activeTab === 'dashboard' && (
              <StudentDashboardOverview
                projects={projectsWithMembers}
                onOpenProject={(projectId) => {
                  setActiveProjectId(projectId);
                  setActiveTab('projects');
                  setProjectTab('board');
                  setProjectViewMode('kanban');
                }}
              />
            )}

            {activeTab === 'projects' && projectTab === 'board' && (
              <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#0A0F1A] p-6">
                {projectViewMode === 'kanban' ? (
                  <KanbanBoard
                    project={displayProject}
                    currentUserRole={activeProject.members?.find(m => m.id === user?.id)?.role}
                    onTaskClick={handleTaskClick}
                    onTaskDrop={handleTaskDrop}
                    onAddTask={handleOpenAddTask}
                    onDeleteTask={handleDeleteTask}
                  />
                ) : projectViewMode === 'timeline' ? (
                  <TimelineView project={displayProject} onTaskClick={handleTaskClick} />
                ) : (
                  <CalendarView project={displayProject} onTaskClick={handleTaskClick} />
                )}
              </div>
            )}

            {activeTab === 'projects' && projectTab === 'ai-planner' && isCurrentProjectLeader && (
              <AiPlannerView
                plannerInput={plannerInput}
                setPlannerInput={setPlannerInput}
                generatedPlan={generatedPlan}
                setGeneratedPlan={setGeneratedPlan}
                onGenerate={generateAiPlan}
                onRegenerate={regenerateAiPlan}
                onCreateBoard={createProjectBoardFromPlan}
                hasExistingTasks={activeProject.tasks.length > 0}
                workspaceMembers={activeProjectMembers.length > 0 ? activeProjectMembers : workspaceUsers}
              />
            )}

            {activeTab === 'projects' && projectTab === 'insights' && (
              <AnalyticsView project={activeProjectWithMembers} workload={teamWorkload} overdueTasks={overdueTasks} />
            )}

            {activeTab === 'projects' && projectTab === 'members' && (
              <ProjectMembersView
                project={activeProjectWithMembers}
                onManageMembers={() => setShowTeamModal(true)}
              />
            )}

            {activeTab === 'projects' && projectTab === 'files' && (
              <ProjectFilesView
                projectId={activeProjectId}
                orgId={activeOrgId}
                role={(activeProject?.members?.find(m => m.id === user?.id)?.role as string) || 'Member'}
                files={projectFiles[activeProjectId] || []}
                onUpload={handleUploadProjectFiles}
                onDelete={handleDeleteProjectFile}
                onRename={handleRenameProjectFile}
              />
            )}

            {activeTab === 'members' && (
              <MembersDatabaseView
                members={membersDatabaseWithIntelligence}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onOpenProject={(projectId) => {
                  setActiveProjectId(projectId);
                  setActiveTab('projects');
                  setProjectTab('board');
                  setProjectViewMode('kanban');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                userPlan={currentPlan}
                orgName={orgDetail?.name || workspaceName}
                orgDetail={orgDetail}
                orgLoading={orgLoading}
                onInviteMember={() => setShowInviteOrgMember(true)}
                onUpdateMemberRole={handleUpdateOrgMemberRole}
                onRemoveMember={handleRemoveOrgMember}
                onUpgradeSuccess={refreshProjectsList}
                initialCheckoutPlan={initialCheckoutPlan}
                initialCheckoutCycle={initialCheckoutCycle}
                onClearInitialCheckoutPlan={() => setInitialCheckoutPlan(null)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Task Detail Panel */}
      <TaskPanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onDeleteTask={handleDeleteTask}
        onUpdateTask={handleUpdateTask}
        assigneeOptions={activeProjectMembers}
        orgId={activeOrgId}
        projectId={activeProject.id}
        currentUserId={user?.id || null}
        currentUserRole={activeProject.members?.find(m => m.id === user?.id)?.role || 'Member'}
      />

      <TeamModal
        open={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        projectId={activeProject.id}
        projectName={activeProject.name}
        members={activeProjectMembers}
        onAddMember={handleAddProjectMember}
        onRemoveMember={handleRemoveProjectMember}
        onInvite={handleInviteMember}
        onUpdateMember={handleUpdateProjectMember}
      />
      <ProfileModal
        open={showProfileModal}
        member={currentWorkspaceMember}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTask}
        status={addTaskStatus}
        assigneeOptions={activeProjectMembers}
        onClose={() => setShowAddTask(false)}
        onSubmit={handleAddTask}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSubmit={handleAddProject}
      />

      {/* Sign Out Confirmation */}
      <SignOutConfirmDialog
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
      />

      {/* Delete Project Confirmation */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xóa d? án"
        message={`B?n có ch?c ch?n mu?n xóa d? án "${projectToDelete?.name || ''}"? M?i d? li?u công vi?c và t?p dính kèm liên quan s? b? xóa vinh vi?n và không th? hoàn tác.`}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDeleteProject}
      />

      {/* Create Organization Modal */}
      <CreateOrgModal
        isOpen={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        onSubmit={handleCreateOrg}
        loading={orgActionLoading}
      />

      {/* Invite Org Member Modal */}
      <InviteOrgMemberModal
        isOpen={showInviteOrgMember}
        onClose={() => setShowInviteOrgMember(false)}
        onSubmit={handleInviteOrgMember}
        loading={orgActionLoading}
        orgName={orgDetail?.name || workspaceName}
      />

      {/* Prompt Comment Modal */}
      <PromptCommentModal
        isOpen={!!commentPrompt}
        onClose={() => setCommentPrompt(null)}
        onSubmit={handleCommentSubmit}
      />

      {/* Onboarding Skills Modal */}
      <OnboardingSkillsModal
        isOpen={showOnboardingSkills}
        onSubmit={handleOnboardingSkillsSubmit}
        isClosable={userSkills && userSkills.length > 0}
        onClose={() => setShowOnboardingSkills(false)}
      />
    </div>
  );
};







