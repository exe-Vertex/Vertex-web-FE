import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { TaskPanel } from './TaskPanel';
import { mockProjects, users } from '../../data/mockData';
import { Task, Project, Status, Priority, User, WorkspaceMember } from '../../types';
import { loadWorkspaceMembers, saveWorkspaceMembers, workspaceMemberToUser } from '../../data/workspaceStore';
import { normalizeProjects, resolveProjectMembers } from '../../data/projectCompatibility';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TeamModal } from './TeamModal';
import { SettingsModal } from './SettingsModal';
import { ProfileModal } from './ProfileModal';
import { useToast } from '../ui/Toast';
import { useLang } from '../../contexts/LanguageContext';
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
import { AddTaskModal } from './modals/AddTaskModal';
import { CreateProjectModal } from './modals/CreateProjectModal';
import { SignOutConfirmDialog } from './modals/SignOutConfirmDialog';
import { AppNotification, DashboardUserPlan, ProjectTab, PlannerDifficulty, PlannerCategory, GeneratedPlanStep, ProjectFileItem, MemberWorkloadLabel, MemberAssignmentSuggestion, MembersDatabaseRow, ProjectWithMembers, InviteRole } from './utils/dashboardTypes';
import { PROJECTS_STORAGE_KEY, PROJECT_FILES_STORAGE_KEY, SETTINGS_STORAGE_KEY, INVITE_INBOX_KEY, CURRENT_USER_EMAIL, CURRENT_USER_ID, DEFAULT_WORKSPACES, initialNotifications, loadInviteInbox, createInviteNotification, loadDashboardNotifications, getStoredUserPlan, getWorkspaceName, loadProjects, loadProjectFiles, computeProgressFromTasks, TASK_SKILL_KEYWORDS, OPEN_TASK_WEIGHTS, inferTaskSkillTags, getWorkloadLabel } from './utils/dashboardUtils';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>(loadWorkspaceMembers);
  const [userPlan] = useState<DashboardUserPlan>(getStoredUserPlan);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(getWorkspaceName);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('ws-1');
  const [activeProjectId, setActiveProjectId] = useState(mockProjects[0].id);
  const [projectViewMode, setProjectViewMode] = useState<'kanban' | 'timeline' | 'calendar'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(loadDashboardNotifications);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState<Status>('todo');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'members'>('dashboard');
  const [projectTab, setProjectTab] = useState<ProjectTab>('board');
  const [projectFiles, setProjectFiles] = useState<Record<string, ProjectFileItem[]>>(loadProjectFiles);
  const [plannerInput, setPlannerInput] = useState({
    description: 'Poster campaign for environmental awareness',
    projectGoal: 'Create an A1 poster for Tech Day 2026',
    teamSize: 4,
    deadlineWeeks: 4,
    difficulty: 'Medium' as PlannerDifficulty,
    category: 'Design' as PlannerCategory,
  });
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlanStep[] | null>(null);
  const { t } = useLang();

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Persist projects to localStorage
  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(PROJECT_FILES_STORAGE_KEY, JSON.stringify(projectFiles));
  }, [projectFiles]);

  const workspaceUsers = useMemo(() => {
    const fromWorkspace = workspaceMembers.map(workspaceMemberToUser);
    const allUsers = [...fromWorkspace, ...users];
    return allUsers.reduce<User[]>((acc, user) => {
      if (!acc.some(entry => entry.id === user.id)) acc.push(user);
      return acc;
    }, []);
  }, [workspaceMembers]);

  const currentWorkspaceMember = useMemo(() => {
    return workspaceMembers.find(member => member.id === CURRENT_USER_ID) || workspaceMembers[0] || null;
  }, [workspaceMembers]);

  const currentUserName = currentWorkspaceMember?.profile.name || 'Minh';
  const currentUserAvatar = currentWorkspaceMember?.profile.avatar || 'https://i.pravatar.cc/150?u=me';
  const currentUserTitle = currentWorkspaceMember?.profile.title || 'Contributor';

  const memberLookup = useMemo(() => {
    return new Map(workspaceUsers.map(user => [user.id, user]));
  }, [workspaceUsers]);

  const membersDatabase = useMemo<MembersDatabaseRow[]>(() => {
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

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const activeProjectMembers = useMemo(() => {
    return activeProject ? getProjectMembers(activeProject) : [];
  }, [activeProject, memberLookup]);
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

      const scoreCandidate = (member: MembersDatabaseRow): { value: number; reason: string } => {
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

  const handleTaskDrop = (taskId: string, newStatus: Status) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    })));
  };

  const handleOpenAddTask = (status: Status) => {
    setAddTaskStatus(status);
    setShowAddTask(true);
  };

  const handleAddTask = (title: string, priority: Priority, description: string, attachmentCount: number) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title,
      description: description.trim() || undefined,
      attachmentCount: Math.max(0, attachmentCount || 0),
      status: addTaskStatus,
      priority,
      assignee: activeProjectMembers[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    };
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? { ...p, tasks: [...p.tasks, newTask] } : p
    ));
    setShowAddTask(false);
    showToast('Task created successfully!');
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = activeProject.tasks.find(task => task.id === taskId);
    if (!taskToDelete) return;

    setProjects(prev => prev.map(project =>
      project.id === activeProjectId
        ? { ...project, tasks: project.tasks.filter(task => task.id !== taskId) }
        : project
    ));
    showToast(`Deleted task "${taskToDelete.title}"`);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setProjects(prev => prev.map(project => (
      project.id === activeProjectId
        ? {
            ...project,
            tasks: project.tasks.map(task => task.id === updatedTask.id ? updatedTask : task),
          }
        : project
    )));
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      showToast('You must keep at least one project.', 'error');
      return;
    }
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;

    const nextProjects = projects.filter(p => p.id !== projectId);
    setProjects(nextProjects);

    if (activeProjectId === projectId) {
      setActiveProjectId(nextProjects[0].id);
    }
    showToast(`Deleted project "${projectToDelete.name}"`);
  };

  const handleAddProjectMember = (user: User) => {
    setProjects(prev => prev.map(project => (
      project.id === activeProjectId && !project.memberIds.includes(user.id)
        ? { ...project, memberIds: [...project.memberIds, user.id] }
        : project
    )));
    showToast(`Invited ${user.name} to ${activeProject.name}`);
  };

  const handleInviteMember = ({ email, role, projectCode, joinLink }: { email: string; role: InviteRole; projectCode: string; joinLink: string }) => {
    const receiverInbox = loadInviteInbox();
    const receiverNotification = createInviteNotification(
      `You were invited to "${activeProject.name}" as ${role}. Use code ${projectCode} to join.`
    );
    const nextReceiverItems = [receiverNotification, ...(receiverInbox[email] || [])];
    receiverInbox[email] = nextReceiverItems;
    localStorage.setItem(INVITE_INBOX_KEY, JSON.stringify(receiverInbox));

    setNotifications(prev => [
      createInviteNotification(`Invite sent to ${email}. Join link: ${joinLink}`),
      ...prev,
    ]);
    showToast(`Invite sent to ${email}`);
  };

  const handleRemoveProjectMember = (userId: string) => {
    const member = activeProjectMembers.find(entry => entry.id === userId);
    if (!member) return;
    if (activeProjectMembers.length <= 1) {
      showToast('Each project needs at least one member.', 'error');
      return;
    }

    setProjects(prev => prev.map(project => {
      if (project.id !== activeProjectId) return project;
      return {
        ...project,
        memberIds: project.memberIds.filter(memberId => memberId !== userId),
        tasks: project.tasks.map(task => task.assignee?.id === userId ? { ...task, assignee: undefined } : task),
      };
    }));
    showToast(`Removed ${member.name} from ${activeProject.name}`);
  };

  const handleAddProject = (name: string) => {
    const newProject: Project = {
      id: `p${Date.now()}`,
      name,
      description: 'New project',
      memberIds: [users[0].id],
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      tasks: [],
      progress: 0,
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setActiveTab('projects');
    setProjectTab('board');
    setProjectViewMode('kanban');
    setShowCreateProject(false);
    showToast('Project created successfully!');
  };

  const generateAiPlan = (descriptionOverride?: string) => {
    const assignees = activeProjectMembers.length > 0 ? activeProjectMembers : workspaceUsers;
    const planningDescription = descriptionOverride ?? plannerInput.description;
    const defaultStepsByCategory: Record<PlannerCategory, string[]> = {
      Design: ['Research topic', 'Sketch ideas', 'Design poster', 'Presentation slides'],
      Research: ['Define hypothesis', 'Collect sources', 'Analyze findings', 'Prepare report'],
      Engineering: ['Define scope', 'Build core feature', 'Testing and fixes', 'Deployment prep'],
      Marketing: ['Audience research', 'Campaign concept', 'Asset production', 'Performance report'],
    };
    const defaultSteps = defaultStepsByCategory[plannerInput.category];
    const weeks = Math.max(2, Math.min(8, plannerInput.deadlineWeeks));
    const difficultyMultiplier: Record<PlannerDifficulty, number> = {
      Easy: 0.8,
      Medium: 1,
      Hard: 1.35,
    };
    const baseHours = [6, 4, 10, 3, 5, 7, 8, 4];
    const plan = Array.from({ length: weeks }).map((_, idx) => ({
      week: `Week ${idx + 1}`,
      task: defaultSteps[idx] || `Execution task ${idx + 1}`,
      assignee: assignees[idx % assignees.length]?.name || 'Unassigned',
      estHours: Math.max(2, Math.round((baseHours[idx] || 6) * difficultyMultiplier[plannerInput.difficulty])),
      taskCount: plannerInput.difficulty === 'Hard' ? 3 : plannerInput.difficulty === 'Easy' ? 1 : 2,
    }));
    setGeneratedPlan(plan);
    if (descriptionOverride) {
      setPlannerInput(prev => ({ ...prev, description: planningDescription }));
    }
    showToast('AI plan generated successfully!');
  };

  const regenerateAiPlan = () => {
    generateAiPlan();
  };

  const createProjectBoardFromPlan = () => {
    if (!generatedPlan || generatedPlan.length === 0) return;
    const newTasks: Task[] = generatedPlan.map((step, idx) => {
      const assignee = activeProjectMembers.find(m => m.name === step.assignee) || activeProjectMembers[0];
      const start = new Date();
      start.setDate(start.getDate() + idx * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 5);
      return {
        id: `p_${Date.now()}_${idx}`,
        title: step.task,
        status: idx === 0 ? 'in-progress' : idx === generatedPlan.length - 1 ? 'todo' : 'ready-for-review',
        assignee,
        priority: idx === 0 ? 'high' : 'medium',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        description: `AI generated from planner: ${plannerInput.description}`,
      };
    });

    setProjects(prev => prev.map(project =>
      project.id === activeProjectId
        ? { ...project, tasks: [...project.tasks, ...newTasks] }
        : project
    ));
    setActiveTab('projects');
    setProjectTab('board');
    setProjectViewMode('kanban');
    showToast('Project board created from AI plan!');
  };

  const handleGenerateTasksFromHeader = () => {
    setGeneratedPlan(null);
    setProjectTab('ai-planner');
  };

  const handleUploadProjectFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const uploads: ProjectFileItem[] = Array.from(fileList).map(file => ({
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      sizeLabel: file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Minh',
      mimeType: file.type,
      objectUrl: URL.createObjectURL(file),
    }));

    setProjectFiles(prev => ({
      ...prev,
      [activeProjectId]: [...uploads, ...(prev[activeProjectId] || [])],
    }));
    showToast(`${uploads.length} file${uploads.length > 1 ? 's' : ''} uploaded`);
  };

  const handleDeleteProjectFile = (fileId: string) => {
    setProjectFiles(prev => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).filter(file => file.id !== fileId),
    }));
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

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    showToast('Signed out successfully');
    setTimeout(() => {
      onNavigate?.('landing');
    }, 300);
    setShowSignOutConfirm(false);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
  const planBadgeLabel = userPlan === 'student_pro' ? 'Pro' : 'Free';
  const planBadgeClass = userPlan === 'student_pro'
    ? 'border-blue-500/35 bg-blue-500/10 text-blue-300'
    : 'border-[#22C55E]/35 bg-[#22C55E]/10 text-[#6EE7B7]';

  useEffect(() => {
    if (!selectedTask) return;
    const latestTask = activeProject.tasks.find(task => task.id === selectedTask.id) || null;
    setSelectedTask(latestTask);
  }, [projects, activeProjectId]);

  const handleSaveProfile = (member: WorkspaceMember) => {
    const nextMembers = workspaceMembers.some(entry => entry.id === member.id)
      ? workspaceMembers.map(entry => (entry.id === member.id ? member : entry))
      : [...workspaceMembers, member];

    saveWorkspaceMembers(nextMembers);
    setWorkspaceMembers(nextMembers);

    const updatedUser = workspaceMemberToUser(member);
    setProjects(prev => prev.map(project => ({
      ...project,
      tasks: project.tasks.map(task => (
        task.assignee?.id === member.id
          ? { ...task, assignee: updatedUser }
          : task
      )),
    })));
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
                <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.8"/>
                <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.8"/>
                <path d="M6 6L12 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                        onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
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
                    setShowSettingsModal(true);
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
          onOpenSettings={() => { setShowSettingsModal(true); setIsSidebarOpen(false); }}
          onOpenMembers={() => { setActiveTab('members'); setIsSidebarOpen(false); }}
          onCreateProject={() => setShowCreateProject(true)}
          onDeleteProject={(id) => handleDeleteProject(id)}
          onViewPlans={() => onNavigate?.('pricing')}
          userPlan={userPlan}
          workspaceName={workspaceName}
          workspaces={DEFAULT_WORKSPACES}
          activeWorkspaceId={activeWorkspaceId}
          onSwitchWorkspace={(id) => {
            setActiveWorkspaceId(id);
            const ws = DEFAULT_WORKSPACES.find(w => w.id === id);
            if (ws) setWorkspaceName(ws.name);
          }}
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
                    { id: 'ai-planner', label: 'AI Planner' },
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
                  <Button size="sm" icon={<WandSparkles size={14} />} onClick={handleGenerateTasksFromHeader}>AI Generate</Button>
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
                  <KanbanBoard project={displayProject} onTaskClick={handleTaskClick} onTaskDrop={handleTaskDrop} onAddTask={handleOpenAddTask} onDeleteTask={handleDeleteTask} />
                ) : projectViewMode === 'timeline' ? (
                  <TimelineView project={displayProject} onTaskClick={handleTaskClick} />
                ) : (
                  <CalendarView project={displayProject} onTaskClick={handleTaskClick} />
                )}
              </div>
            )}

            {activeTab === 'projects' && projectTab === 'ai-planner' && (
              <AiPlannerView
                plannerInput={plannerInput}
                setPlannerInput={setPlannerInput}
                generatedPlan={generatedPlan}
                onGenerate={generateAiPlan}
                onRegenerate={regenerateAiPlan}
                onCreateBoard={createProjectBoardFromPlan}
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
      />
      <SettingsModal open={showSettingsModal} onClose={() => { setShowSettingsModal(false); setWorkspaceName(getWorkspaceName()); }} userPlan={userPlan} />
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
    </div>
  );
};
