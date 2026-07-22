import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Flag, Paperclip, MessageSquare, CheckSquare, Trash2, Plus, ChevronDown, Sparkles, Link as LinkIcon, File as FileIcon, ExternalLink, Star, Loader2, GripVertical } from 'lucide-react';
import { Task, User, Priority } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { listTaskAttachments, uploadTaskFile, addTaskLink, deleteTaskAttachment, promoteTaskAttachment, TaskAttachmentDto, listTaskComments, addTaskComment, TaskCommentDto, listSubtasks, createSubtask, updateSubtask, deleteSubtask, SubtaskDto } from '../../api/project';
import { API_BASE_URL } from '../../api/http';
import { generateSubtasks } from '../../api/ai';
import { getAuthToken } from './utils/dashboardUtils';
import { useToast } from '../ui/Toast';

interface TaskPanelProps {
  task: Task | null;
  onClose: () => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  assigneeOptions: User[];
  orgId: string | null;
  projectId: string | null;
  currentUserId: string | null;
  currentUserRole: string | null;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ 
  task, onClose, onDeleteTask, onUpdateTask, assigneeOptions, orgId, projectId, currentUserId, currentUserRole 
}) => {
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<TaskCommentDto[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState<SubtaskDto[]>([]);
  const [draggedSubtaskId, setDraggedSubtaskId] = useState<string | null>(null);
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState<string | null>(null);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachmentDto[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!task) return;
    setCommentInput('');
    setNewSubtask('');
    setComments([]);
    setAttachments([]);
    setSubtasks([]);
    setDraggedSubtaskId(null);
    setDragOverSubtaskId(null);
    setAssigneeOpen(false);
    setIsAddingLink(false);
    setIsUploadingAttachment(false);
    setNewLinkUrl('');
    setNewLinkTitle('');
    panelRef.current?.focus();
    
    if (orgId && projectId) {
      loadAttachments();
      loadSubtasks();
      loadComments();
    }
  }, [task?.id, orgId, projectId]);

  const loadAttachments = async () => {
    if (!task || !orgId || !projectId) return;
    try {
      const token = getAuthToken();
      if (!token) return;
      const data = await listTaskAttachments(token, orgId, projectId, task.id);
      setAttachments(data);
    } catch (err) {
      console.error('Failed to load task attachments:', err);
    }
  };

  const loadSubtasks = async () => {
    if (!task || !orgId || !projectId) return;
    try {
      const token = getAuthToken();
      if (!token) return;
      const data = await listSubtasks(token, orgId, projectId, task.id);
      setSubtasks(data.sort((a, b) => a.position - b.position));
    } catch (err) {
      console.error('Failed to load subtasks:', err);
    }
  };

  const loadComments = async () => {
    if (!task || !orgId || !projectId) return;
    try {
      const token = getAuthToken();
      if (!token) return;
      const data = await listTaskComments(token, orgId, projectId, task.id);
      setComments(data);
    } catch (err) {
      console.error('Failed to load task comments:', err);
    }
  };
  const canAttachToTask = () => Boolean(task && currentUserId === task.assignee?.id && task.status === 'in-progress');

  const uploadAttachmentFiles = async (files: File[], successMessage = 'File uploaded successfully') => {
    if (!task || !orgId || !projectId || files.length === 0) return;
    if (!canAttachToTask()) {
      showToast('Only the assignee can attach files while the task is in progress', 'error');
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    setIsUploadingAttachment(true);
    try {
      for (const file of files) {
        await uploadTaskFile(token, orgId, projectId, task.id, file);
      }
      await loadAttachments();
      showToast(files.length > 1 ? `${files.length} files uploaded successfully` : successMessage, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload file', 'error');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await uploadAttachmentFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteAttachment = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const imageFiles = Array.from(e.clipboardData.items)
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((file): file is File => Boolean(file))
      .map((file, index) => {
        const ext = file.type.split('/')[1]?.split('+')[0] || 'png';
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        return new File([file], `screenshot-${stamp}-${index + 1}.${ext}`, { type: file.type || 'image/png' });
      });

    if (imageFiles.length === 0) return;
    e.preventDefault();
    await uploadAttachmentFiles(imageFiles, 'Screenshot pasted and uploaded');
  };
  const handleAddLink = async () => {
    if (!task || !orgId || !projectId || !newLinkUrl.trim()) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await addTaskLink(token, orgId, projectId, task.id, { url: newLinkUrl, title: newLinkTitle });
      await loadAttachments();
      setIsAddingLink(false);
      setNewLinkUrl('');
      setNewLinkTitle('');
      showToast('Link added successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add link', 'error');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task || !orgId || !projectId) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await deleteTaskAttachment(token, orgId, projectId, task.id, attachmentId, currentUserRole || 'Member');
      await loadAttachments();
      showToast('Attachment deleted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete attachment', 'error');
    }
  };

  const handlePromoteAttachment = async (attachmentId: string) => {
    if (!task || !orgId || !projectId) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await promoteTaskAttachment(token, orgId, projectId, task.id, attachmentId, currentUserRole || 'Member');
      showToast('Attachment promoted to Project Files', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to promote attachment', 'error');
    }
  };

  if (!task) return null;

  const latestFeedback = comments[comments.length - 1];
  const reviewHint = task.status === 'done'
    ? 'Approved by reviewer. This task is complete.'
    : task.status === 'ready-for-review'
      ? 'Submitted for lecturer/leader review. Wait for approval or feedback.'
      : comments.length > 0
        ? 'Feedback received. Update the task, reply if needed, then submit again.'
        : 'Work on the task and submit it when ready for review.';

  const canManageSubtasks = currentUserId === task.assignee?.id || currentUserRole === 'Leader';

  const deadlineMeta = (() => {
    const due = new Date(task.endDate);
    if (Number.isNaN(due.getTime())) return { label: task.endDate, hint: 'No deadline status' };

    const now = new Date();
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((dueDay - nowDay) / 86400000);

    const label = due.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (diffDays < 0) return { label, hint: 'Quá hạn', hintClass: 'text-red-400 font-medium' };
    if (diffDays === 0) return { label, hint: 'Đến hạn hôm nay', hintClass: 'text-amber-400 font-medium' };
    if (diffDays === 1) return { label, hint: 'Còn 1 ngày nữa', hintClass: 'text-[#6EE7B7] font-medium' };
    return { label, hint: `Còn ${diffDays} ngày nữa`, hintClass: 'text-[#6EE7B7] font-medium' };
  })();

  const mentionMatch = commentInput.match(/@([a-zA-Z]*)$/);
  const mentionQuery = mentionMatch?.[1]?.toLowerCase() ?? '';
  const mentionCandidates = mentionMatch
    ? assigneeOptions.filter(member => member.name.toLowerCase().includes(mentionQuery)).slice(0, 5)
    : [];

  const handleDelete = () => {
    onDeleteTask(task.id);
    onClose();
  };

  const updateTask = (patch: Partial<Task>) => {
    onUpdateTask({ ...task, ...patch });
  };

  const handleGenerateSubtasks = async () => {
    if (!task || !orgId || !projectId || isGeneratingSubtasks || !canManageSubtasks) return;
    const token = getAuthToken();
    if (!token) return;
    setIsGeneratingSubtasks(true);
    try {
      const generatedList = await generateSubtasks(token, orgId, task.title, task.description || '');
      for (const title of generatedList) {
        await createSubtask(token, orgId, projectId, task.id, { title });
      }
      await loadSubtasks();
      showToast('Subtasks generated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate subtasks', 'error');
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const handleRewriteDescription = () => {
    const text = task.description?.trim()
      ? `${task.description.trim()} Refined by AI for clarity and execution.`
      : `Deliver ${task.title.toLowerCase()} with clear scope, quality criteria, and handoff notes.`;
    updateTask({ description: text });
  };

  const handleSetAssignee = (assignee?: User) => {
    updateTask({ assignee });
    setAssigneeOpen(false);
  };

  const handleSubmitForReview = () => {
    updateTask({ status: 'ready-for-review' });
  };

  const handleToggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    if (!task || !orgId || !projectId || !canManageSubtasks) return;
    const token = getAuthToken();
    if (!token) return;
    
    setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, isCompleted: !currentCompleted } : s));
    
    try {
      await updateSubtask(token, orgId, projectId, task.id, subtaskId, { isCompleted: !currentCompleted });
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle subtask', 'error');
      await loadSubtasks();
    }
  };

  const handleAddSubtask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task || !orgId || !projectId || !newSubtask.trim() || !canManageSubtasks) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await createSubtask(token, orgId, projectId, task.id, { title: newSubtask.trim() });
      setNewSubtask('');
      await loadSubtasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to add subtask', 'error');
    }
  };

  const handleDeleteSubtaskLocal = async (subtaskId: string) => {
    if (!task || !orgId || !projectId || !canManageSubtasks) return;
    const token = getAuthToken();
    if (!token) return;
    
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
    
    try {
      await deleteSubtask(token, orgId, projectId, task.id, subtaskId);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete subtask', 'error');
      await loadSubtasks();
    }
  };

  const handleSubtaskDragStart = (event: React.DragEvent<HTMLDivElement>, subtaskId: string) => {
    if (!canManageSubtasks) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', subtaskId);
    setDraggedSubtaskId(subtaskId);
  };

  const handleSubtaskDrop = async (event: React.DragEvent<HTMLDivElement>, targetSubtaskId: string) => {
    event.preventDefault();
    if (!task || !orgId || !projectId || !canManageSubtasks) return;

    const sourceSubtaskId = draggedSubtaskId || event.dataTransfer.getData('text/plain');
    setDraggedSubtaskId(null);
    setDragOverSubtaskId(null);

    if (!sourceSubtaskId || sourceSubtaskId === targetSubtaskId) return;

    const currentOrder = [...subtasks].sort((a, b) => a.position - b.position);
    const sourceIndex = currentOrder.findIndex(subtask => subtask.id === sourceSubtaskId);
    const targetIndex = currentOrder.findIndex(subtask => subtask.id === targetSubtaskId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextOrder = [...currentOrder];
    const [movedSubtask] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, movedSubtask);
    const reorderedSubtasks = nextOrder.map((subtask, index) => ({ ...subtask, position: index }));

    setSubtasks(reorderedSubtasks);

    const token = getAuthToken();
    if (!token) return;

    try {
      await Promise.all(
        reorderedSubtasks.map(subtask => updateSubtask(token, orgId, projectId, task.id, subtask.id, { position: subtask.position }))
      );
    } catch (err: any) {
      setSubtasks(currentOrder);
      showToast(err.message || 'Failed to reorder subtasks', 'error');
      await loadSubtasks();
    }
  };
  const handleAddAttachments = (files: FileList | null) => {
    // Read-only
  };

  const handleSendComment = async () => {
    if (!task || !orgId || !projectId || !commentInput.trim()) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      const created = await addTaskComment(token, orgId, projectId, task.id, { content: commentInput.trim() });
      setComments(prev => [...prev, created]);
      setCommentInput('');
    } catch (err: any) {
      showToast(err.message || 'Failed to send comment', 'error');
    }
  };
  const applyMention = (name: string) => {
    setCommentInput(prev => prev.replace(/@[a-zA-Z]*$/, `@${name} `));
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-30"
      />
      <motion.div
        key="panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        ref={panelRef}
        tabIndex={-1}
        onPaste={handlePasteAttachment}
        className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#101928]/96 backdrop-blur-xl shadow-2xl shadow-black/35 border-l border-white/6 z-40 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between gap-3 bg-[#0B1220]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Badge variant={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'info' : task.status === 'ready-for-review' ? 'warning' : 'default'} className="shrink-0">
                {task.status === 'done' ? 'Done' : task.status === 'in-progress' ? 'In Progress' : task.status === 'ready-for-review' ? 'Ready for Review' : 'Todo'}
            </Badge>
            <div className="flex items-center gap-2 min-w-0">
              <Avatar src={task.assignee?.avatar} fallback={task.assignee?.name?.charAt(0) || '?'} size="sm" className="w-6 h-6 shrink-0" />
              <span className="text-xs text-slate-300 truncate">{task.assignee?.name || 'Unassigned'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {task.status !== 'ready-for-review' && task.status !== 'done' && (
              <button
                onClick={handleSubmitForReview}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#6EE7B7] border border-[#22C55E]/30 bg-[#22C55E]/10 hover:border-[#22C55E]/50 transition-colors"
                title="Submit for review"
              >
                Submit
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 text-slate-500 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors"
              title="Delete task"
            >
              <Trash2 size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-[#162032] rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">{task.title}</h2>

          <div className="space-y-6">
            {/* Properties */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Assignee</label>
                <div className="relative">
                  <button
                    onClick={() => setAssigneeOpen(open => !open)}
                    className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#121C2C] border border-white/6 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar src={task.assignee?.avatar} fallback={task.assignee?.name.charAt(0) || '?'} size="sm" />
                      <span className="text-sm font-medium text-slate-300 truncate">{task.assignee?.name || 'Unassigned'}</span>
                    </div>
                    <ChevronDown size={14} className="text-slate-500" />
                  </button>
                  {assigneeOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-white/10 bg-[#0B1220] shadow-xl z-20 overflow-hidden">
                      {assigneeOptions.map(member => (
                        <button
                          key={member.id}
                          onClick={() => handleSetAssignee(member)}
                          className="w-full px-3 py-2 text-sm text-slate-300 hover:bg-[#162032] flex items-center gap-2"
                        >
                          <Avatar src={member.avatar} fallback={member.name.charAt(0)} size="sm" className="w-5 h-5" />
                          <span>{member.name}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => handleSetAssignee(undefined)}
                        className="w-full px-3 py-2 text-sm text-slate-400 hover:bg-[#162032] text-left border-t border-white/6"
                      >
                        Unassigned
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Deadline</label>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#121C2C] border border-white/6 relative cursor-pointer group">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                      {deadlineMeta.label}
                    </span>
                    <input
                      type="date"
                      value={task.endDate ? task.endDate.split('T')[0] : ''}
                      onClick={(e) => {
                        try {
                          (e.target as any).showPicker();
                        } catch (err) {}
                      }}
                      onChange={(e) => {
                        if (e.target.value && e.target.value !== (task.endDate?.split('T')[0] || '')) {
                          onUpdateTask({ ...task, endDate: e.target.value });
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                  {deadlineMeta && (
                    <span className={`text-xs ${deadlineMeta.hintClass}`}>{deadlineMeta.hint}</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Priority</label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#121C2C] border border-white/6">
                  <Flag size={16} className={
                    task.priority === 'high' ? 'text-red-500' : 
                    task.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  } />
                  <select
                    value={task.priority}
                    onChange={(e) => onUpdateTask({ ...task, priority: e.target.value as Priority })}
                    className="w-full text-sm font-medium text-slate-300 capitalize bg-transparent outline-none cursor-pointer"
                  >
                    <option value="low" className="bg-[#121C2C]">Low</option>
                    <option value="medium" className="bg-[#121C2C]">Medium</option>
                    <option value="high" className="bg-[#121C2C]">High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Description</label>
                <button
                  onClick={handleRewriteDescription}
                  className="text-xs text-[#6EE7B7] hover:text-[#A7F3D0] transition-colors inline-flex items-center gap-1"
                >
                  <Sparkles size={12} /> Generate description with AI
                </button>
              </div>
              <textarea
                defaultValue={task.description || ''}
                onBlur={(e) => {
                  if (e.target.value !== (task.description || '')) {
                    onUpdateTask({ ...task, description: e.target.value });
                  }
                }}
                placeholder="No description for this task. Click to edit..."
                className="w-full text-sm text-slate-300 leading-relaxed bg-[#0B1220] p-4 rounded-xl border border-white/6 outline-none focus:border-[#22C55E]/50 min-h-[100px] resize-y"
              />
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Attachments</label>
                {currentUserId === task.assignee?.id && task.status === 'in-progress' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAddingLink(!isAddingLink)}
                      className="text-xs text-[#6EE7B7] hover:text-[#A7F3D0] transition-colors inline-flex items-center gap-1"
                    >
                      <LinkIcon size={12} /> Add Link
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAttachment}
                      className="text-xs text-[#6EE7B7] hover:text-[#A7F3D0] transition-colors inline-flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isUploadingAttachment ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />} Add File
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                )}
              </div>
              {currentUserId === task.assignee?.id && task.status === 'in-progress' && (
                <p className="text-[11px] text-slate-500 mb-2">
                  Paste a screenshot here with Ctrl+V to attach it directly.
                </p>
              )}

              {isAddingLink && (
                <div className="bg-[#121C2C] border border-white/6 p-3 rounded-xl mb-3 flex flex-col gap-2">
                  <input
                    type="url"
                    placeholder="URL (e.g., https://...)"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="w-full bg-[#0B1220] border border-white/6 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:border-[#22C55E]/50 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Title (Optional)"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="w-full bg-[#0B1220] border border-white/6 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:border-[#22C55E]/50 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2 mt-1">
                    <Button variant="ghost" onClick={() => setIsAddingLink(false)} className="h-8 text-xs px-3">Cancel</Button>
                    <Button onClick={handleAddLink} className="h-8 text-xs px-3">Save</Button>
                  </div>
                </div>
              )}

              {attachments.length === 0 ? (
                <div className="text-sm text-slate-500 italic p-3 bg-[#121C2C] border border-white/6 rounded-xl text-center">
                  No attachments yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-[#121C2C] border border-white/6 rounded-xl hover:bg-[#1A263A] transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-[#0B1220] rounded-lg text-slate-400">
                          {att.type === 'link' ? <LinkIcon size={16} /> : <FileIcon size={16} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          {att.type === 'link' ? (
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-200 hover:text-[#6EE7B7] hover:underline truncate inline-flex items-center gap-1">
                              {att.title || att.url} <ExternalLink size={12} />
                            </a>
                          ) : att.url ? (
                            <a
                              href={att.url.startsWith('http') ? att.url : `${API_BASE_URL}/${att.url.replace(/^\/+/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-slate-200 hover:text-[#6EE7B7] hover:underline truncate inline-flex items-center gap-1"
                            >
                              {att.title} <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-slate-200 truncate">{att.title}</span>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{att.uploadedBy}</span>
                            {att.sizeLabel && (
                              <>
                                <span>•</span>
                                <span>{att.sizeLabel}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {currentUserRole === 'Leader' && (
                          <button
                            onClick={() => handlePromoteAttachment(att.id)}
                            title="Add to Project Files"
                            className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-[#0B1220] rounded-lg transition-colors"
                          >
                            <Star size={14} />
                          </button>
                        )}
                        {(currentUserId === task.assignee?.id && task.status === 'in-progress') && (
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#0B1220] rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Quick Actions</label>
              <div className="grid grid-cols-1 gap-2">
                {canManageSubtasks && (
                  <button disabled={isGeneratingSubtasks} onClick={handleGenerateSubtasks} className="px-3 py-2.5 text-xs rounded-xl bg-[#121C2C] border border-white/6 text-slate-300 hover:text-white hover:border-slate-500/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isGeneratingSubtasks ? <Loader2 size={14} className="animate-spin" /> : null}
                    Generate subtasks
                  </button>
                )}
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Subtasks</label>
                <span className="text-xs text-slate-500">
                  {subtasks.filter(t => t.isCompleted).length}/{subtasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <div
                    key={subtask.id}
                    draggable={canManageSubtasks}
                    onDragStart={(event) => handleSubtaskDragStart(event, subtask.id)}
                    onDragOver={(event) => {
                      if (!canManageSubtasks) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      setDragOverSubtaskId(subtask.id);
                    }}
                    onDrop={(event) => handleSubtaskDrop(event, subtask.id)}
                    onDragEnd={() => {
                      setDraggedSubtaskId(null);
                      setDragOverSubtaskId(null);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border group transition-all ${
                      dragOverSubtaskId === subtask.id && draggedSubtaskId !== subtask.id
                        ? 'bg-[#162032] border-[#22C55E]/45 shadow-[0_0_0_1px_rgba(34,197,94,0.12)]'
                        : 'bg-[#121C2C] border-white/6'
                    } ${draggedSubtaskId === subtask.id ? 'opacity-50' : ''} ${canManageSubtasks ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    {canManageSubtasks && <GripVertical size={14} className="text-slate-600 group-hover:text-slate-400 shrink-0" />}
                    <span className="w-5 text-center text-[11px] font-mono text-slate-500 shrink-0">{index + 1}</span>
                    <button disabled={!canManageSubtasks} onClick={() => handleToggleSubtask(subtask.id, subtask.isCompleted)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 disabled:cursor-not-allowed ${
                      subtask.isCompleted ? 'bg-[#22C55E] border-[#22C55E] text-white' : canManageSubtasks ? 'border-[#22C55E]/20 hover:border-[#22C55E]' : 'border-[#22C55E]/20'
                    }`}>
                      {subtask.isCompleted && <CheckSquare size={12} />}
                    </button>
                    <span className={`text-sm flex-1 break-words ${subtask.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                      {subtask.title}
                    </span>
                    {canManageSubtasks && (
                      <button onClick={() => handleDeleteSubtaskLocal(subtask.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#0B1220] rounded-lg transition-all shrink-0">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                
                {canManageSubtasks ? (
                  <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder="Add a subtask..."
                        className="w-full bg-[#121C2C] border border-white/6 rounded-xl pl-3 pr-10 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:border-[#22C55E]/50 focus:outline-none"
                      />
                      <button type="submit" disabled={!newSubtask.trim()} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:text-slate-400 transition-colors bg-[#0B1220] rounded-lg">
                        <Plus size={14} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">Only the assignee or project Leader can manage subtasks.</p>
                )}
              </div>
            </div>


          </div>
        </div>

        <div className="border-t border-white/6 bg-[#0B1220]">
          <div className="px-4 pt-3">
            <div className="rounded-xl border border-[#22C55E]/10 bg-[#121C2C] px-3 py-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <CheckSquare size={13} className="text-[#6EE7B7]" /> Review flow
              </div>
              <p className="mt-1">{reviewHint}</p>
              {latestFeedback && (
                <p className="mt-1 text-slate-500">Latest feedback: <span className="text-slate-300">{latestFeedback.content}</span></p>
              )}
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <MessageSquare size={15} className="text-[#6EE7B7]" /> Feedback
            </div>
            <span className="text-xs text-slate-500">{comments.length}</span>
          </div>

          <div className="px-4 pb-3 space-y-2 max-h-44 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#121C2C] px-3 py-3 text-center">
                <p className="text-sm text-slate-500">No feedback yet.</p>
              </div>
            ) : comments.map(comment => {
              const isMine = comment.userId === currentUserId;
              return (
                <div key={comment.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <Avatar src={comment.userAvatar} fallback={comment.userName?.charAt(0) || '?'} size="sm" className="w-7 h-7 shrink-0" />
                  <div className={`max-w-[82%] ${isMine ? 'items-end' : ''} flex flex-col`}>
                    <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed border ${isMine ? 'bg-[#22C55E]/10 border-[#22C55E]/25 text-emerald-100 rounded-tr-sm' : 'bg-[#121C2C] border-white/6 text-slate-200 rounded-tl-sm'}`}>
                      {comment.content}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 px-1">
                      {comment.userName} - {new Date(comment.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 pt-0 relative">
            {mentionCandidates.length > 0 && (
              <div className="absolute left-4 right-4 bottom-full mb-2 rounded-xl border border-white/10 bg-[#0B1220] shadow-xl overflow-hidden z-20">
                {mentionCandidates.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => applyMention(member.name)}
                    className="w-full px-3 py-2 text-sm text-slate-300 hover:bg-[#162032] flex items-center gap-2"
                  >
                    <Avatar src={member.avatar} fallback={member.name.charAt(0)} size="sm" className="w-5 h-5" />
                    <span>{member.name}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                placeholder="Reply to feedback..."
                className="flex-1 rounded-xl border border-white/6 bg-[#121C2C] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#22C55E]/45"
              />
              <Button onClick={handleSendComment} disabled={!commentInput.trim()} className="px-3">
                Send
              </Button>
            </div>
          </div>
        </div>      </motion.div>
    </AnimatePresence>
  );
};


