import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Flag, Paperclip, MessageSquare, CheckSquare, Trash2, Plus, ChevronDown, Sparkles, Link as LinkIcon, File as FileIcon, ExternalLink, Star } from 'lucide-react';
import { Task, User, Priority } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { listTaskAttachments, uploadTaskFile, addTaskLink, deleteTaskAttachment, promoteTaskAttachment, TaskAttachmentDto } from '../../api/project';
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
  const [comments, setComments] = useState<Array<{ id: string; text: string; time: string }>>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachmentDto[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!task) return;
    setCommentInput('');
    setNewSubtask('');
    setComments([]);
    setAttachments([]);
    setAssigneeOpen(false);
    setIsAddingLink(false);
    setNewLinkUrl('');
    setNewLinkTitle('');
    
    if (orgId && projectId) {
      loadAttachments();
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !orgId || !projectId || !e.target.files?.length) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      await uploadTaskFile(token, orgId, projectId, task.id, e.target.files[0]);
      await loadAttachments();
      showToast('File uploaded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload file', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const deadlineMeta = (() => {
    const due = new Date(task.endDate);
    if (Number.isNaN(due.getTime())) return { label: task.endDate, hint: 'No deadline status' };

    const now = new Date();
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((dueDay - nowDay) / 86400000);

    const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffDays < 0) return { label, hint: 'Overdue', hintClass: 'text-red-300' };
    if (diffDays === 0) return { label, hint: 'Due today', hintClass: 'text-amber-300' };
    if (diffDays === 1) return { label, hint: '1 day left', hintClass: 'text-[#6EE7B7]' };
    return { label, hint: `${diffDays} days left`, hintClass: 'text-[#6EE7B7]' };
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

  const handleGenerateSubtasks = () => {
    // Read-only: API not implemented yet
  };

  const handleSuggestDeadline = () => {
    const base = new Date(task.endDate);
    const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
    safeBase.setDate(safeBase.getDate() + 2);
    updateTask({ endDate: safeBase.toISOString().split('T')[0] });
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

  const handleSuggestAssignee = () => {
    if (assigneeOptions.length === 0) return;
    const currentId = task.assignee?.id;
    const currentIndex = assigneeOptions.findIndex(member => member.id === currentId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % assigneeOptions.length : 0;
    handleSetAssignee(assigneeOptions[nextIndex]);
  };

  const handleSubmitForReview = () => {
    updateTask({ status: 'ready-for-review' });
  };

  const handleToggleSubtask = (subtaskId: string) => {
    // Read-only
  };

  const handleAddSubtask = () => {
    // Read-only
  };

  const handleAddAttachments = (files: FileList | null) => {
    // Read-only
  };

  const handleSendComment = () => {
    // Read-only
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
        className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#101928]/96 backdrop-blur-xl shadow-2xl shadow-black/35 border-l border-white/6 z-40 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between bg-[#0B1220]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'info' : task.status === 'ready-for-review' ? 'warning' : 'default'}>
                {task.status === 'done' ? 'Done' : task.status === 'in-progress' ? 'In Progress' : task.status === 'ready-for-review' ? 'Ready for Review' : 'Todo'}
              </Badge>
              <span className="text-xs text-slate-500 font-mono">#{task.id}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Avatar src={task.assignee?.avatar} fallback={task.assignee?.name?.charAt(0) || '?'} size="sm" className="w-6 h-6" />
              <span className="text-xs text-slate-300 truncate">{task.assignee?.name || 'Unassigned'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#121C2C] border border-white/6">
                  <Calendar size={16} className="text-slate-400" />
                  <input
                    type="date"
                    defaultValue={task.endDate ? task.endDate.split('T')[0] : ''}
                    onBlur={(e) => {
                      if (e.target.value && e.target.value !== (task.endDate?.split('T')[0] || '')) {
                        onUpdateTask({ ...task, endDate: e.target.value });
                      }
                    }}
                    className="w-full text-sm font-medium text-slate-300 bg-transparent outline-none focus:text-white"
                  />
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
                      className="text-xs text-[#6EE7B7] hover:text-[#A7F3D0] transition-colors inline-flex items-center gap-1"
                    >
                      <Paperclip size={12} /> Add File
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={handleGenerateSubtasks} className="px-3 py-2.5 text-xs rounded-xl bg-[#121C2C] border border-white/6 text-slate-300 hover:text-white hover:border-slate-500/40 transition-colors">
                  Generate subtasks
                </button>
                <button onClick={handleSuggestDeadline} className="px-3 py-2.5 text-xs rounded-xl bg-[#121C2C] border border-white/6 text-slate-300 hover:text-white hover:border-slate-500/40 transition-colors">
                  Suggest deadline
                </button>
                <button onClick={handleSuggestAssignee} className="px-3 py-2.5 text-xs rounded-xl bg-[#121C2C] border border-white/6 text-slate-300 hover:text-white hover:border-slate-500/40 transition-colors">
                  Suggest assignee
                </button>
                <button onClick={handleRewriteDescription} className="px-3 py-2.5 text-xs rounded-xl bg-[#121C2C] border border-white/6 text-slate-300 hover:text-white hover:border-slate-500/40 transition-colors">
                  Rewrite description
                </button>
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Subtasks</label>
                <span className="text-xs text-slate-500">
                  {task.subtasks?.filter(t => t.completed).length || 0}/{task.subtasks?.length || 0}
                </span>
              </div>
              <div className="space-y-2">
                {task.subtasks?.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#121C2C] border border-white/6">
                    <button onClick={() => handleToggleSubtask(subtask.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      subtask.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[#22C55E]/10 hover:border-[#22C55E]'
                    }`}>
                      {subtask.completed && <CheckSquare size={12} />}
                    </button>
                    <span className={`text-sm flex-1 ${subtask.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
                {(!task.subtasks || task.subtasks.length === 0) && (
                  <p className="text-sm text-slate-500 py-2">No subtasks yet.</p>
                )}
              </div>
            </div>


          </div>
        </div>

        {/* Footer Actions - Read Only */}
        <div className="p-4 border-t border-white/6 bg-[#0B1220] flex gap-3">
          <p className="text-sm text-slate-500">Comments are read-only (API not implemented).</p>
        </div>

        {comments.length > 0 && (
          <div className="px-4 pb-4 bg-[#0B1220] border-t border-white/6 space-y-2 max-h-36 overflow-y-auto">
            {comments.map(comment => (
              <div key={comment.id} className="rounded-xl border border-white/6 bg-[#121C2C] px-3 py-2">
                <p className="text-sm text-slate-200">{comment.text}</p>
                <p className="text-[11px] text-slate-500 mt-1">{comment.time}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
