import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Users, Calendar, CheckCircle, Clock, AlertTriangle,
  MessageSquare, GitBranch, LayoutGrid, Send, CheckCheck, RotateCcw, BarChart3,
  Eye,
} from 'lucide-react';
import { GroupComment, LecturerGroup, LecturerTask, TaskStatus } from '../../../data/lecturerTypes';
import { approveTask, requestChanges, addComment } from '../../../api/lecturer';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LanguageContext';

type Tab = 'overview' | 'tasks' | 'contributions' | 'timeline';

interface GroupDetailProps {
  group: LecturerGroup;
  onBack: () => void;
}

// Task status config
const statusConfig: Record<TaskStatus, { labelVi: string; labelEn: string; color: string; dot: string }> = {
  'todo': { labelVi: 'Cần làm', labelEn: 'To do', color: 'border-slate-600/50 bg-[#162032]', dot: 'bg-slate-600' },
  'in-progress': { labelVi: 'Đang thực hiện', labelEn: 'In progress', color: 'border-blue-500/20  bg-blue-500/5', dot: 'bg-blue-400' },
  'ready-for-review': { labelVi: 'Chờ duyệt', labelEn: 'Ready for review', color: 'border-[#F59E0B]/30 bg-[#22C55E]/5', dot: 'bg-[#22C55E]' },
  'approved': { labelVi: 'Đã duyệt', labelEn: 'Approved', color: 'border-amber-500/25 bg-green-500/5', dot: 'bg-green-400' },
};

const priorityColors: Record<string, string> = {
  high:   'text-red-400   bg-red-400/10   border-red-400/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  low:    'text-slate-400 bg-slate-700    border-slate-600',
};

type MemberContribution = {
  memberName: string;
  assigned: number;
  approved: number;
  inReview: number;
  inProgress: number;
  todo: number;
  completion: number;
};

const buildMemberContributions = (tasks: LecturerTask[]): MemberContribution[] => {
  return Array.from(new Set(tasks.map(task => task.assignee)))
    .map((memberName) => {
      const memberTasks = tasks.filter(task => task.assignee === memberName);
      const approved = memberTasks.filter(task => task.status === 'approved').length;
      const inReview = memberTasks.filter(task => task.status === 'ready-for-review').length;
      const inProgress = memberTasks.filter(task => task.status === 'in-progress').length;
      const todo = memberTasks.filter(task => task.status === 'todo').length;
      const completion = memberTasks.length
        ? Math.round(((approved + inReview * 0.7 + inProgress * 0.4) / memberTasks.length) * 100)
        : 0;

      return {
        memberName,
        assigned: memberTasks.length,
        approved,
        inReview,
        inProgress,
        todo,
        completion,
      };
    })
    .sort((left, right) => right.completion - left.completion);
};

const getContributionNote = (member: MemberContribution, isVi: boolean): string => {
  if (member.completion >= 80) return isVi ? 'Đóng góp tốt. Có thể tiếp tục giao các công việc quan trọng.' : 'Strong contribution. This member can continue handling important tasks.';
  if (member.inReview > 0) return isVi ? 'Có công việc đang chờ duyệt. Cần theo dõi sau khi phản hồi.' : 'Some work is awaiting review. Follow up after feedback.';
  if (member.inProgress > 0) return isVi ? 'Đang làm nhưng chưa hoàn tất. Hãy hỏi về trở ngại trong lần trao đổi tới.' : 'Work is in progress but incomplete. Ask about blockers at the next check-in.';
  return isVi ? 'Tiến độ còn thấp. Nên cân bằng lại công việc hoặc đặt mục tiêu ngắn hạn.' : 'Progress is low. Rebalance work or set a short-term goal.';
};

// Kanban task card
const KanbanCard: React.FC<{
  task: LecturerTask;
  isSelected?: boolean;
  isVi: boolean;
  onOpen?: (task: LecturerTask) => void;
  onApprove?: (id: string) => void;
  onRequestChanges?: (id: string) => void;
}> = ({ task, isVi, isSelected, onOpen, onApprove, onRequestChanges }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => onOpen?.(task)}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') onOpen?.(task);
    }}
    className={`w-full cursor-pointer rounded-lg p-3 border ${statusConfig[task.status].color} mb-2 transition-all duration-200 hover:border-[#F59E0B]/45 ${isSelected ? 'ring-1 ring-[#22C55E]/70 border-[#22C55E]/60' : ''}`}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <p className="text-xs font-medium text-white leading-snug">{task.title}</p>
      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${priorityColors[task.priority]}`}>
        {task.priority === 'high' ? (isVi ? 'Cao' : 'High') : task.priority === 'medium' ? (isVi ? 'Trung bình' : 'Medium') : (isVi ? 'Thấp' : 'Low')}
      </span>
    </div>
    <div className="flex items-center justify-between text-[10px] text-slate-500">
      <span className="flex items-center gap-1">
        <div className="w-4 h-4 rounded-full bg-[#162032] border border-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-400">
          {task.assignee[0]}
        </div>
        {task.assignee}
      </span>
      <span className="flex items-center gap-0.5"><Calendar size={9} />{task.deadline}</span>
    </div>

    {task.status === 'ready-for-review' && (
      <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-[#F59E0B]/15">
        <button type="button" onClick={(event) => { event.stopPropagation(); onApprove?.(task.id); }}
          className="flex-1 flex items-center justify-center gap-1 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-300 text-[10px] font-semibold rounded-md border border-amber-500/30 hover:border-amber-400/40 hover:shadow-[0_10px_22px_rgba(34,197,94,0.18)] transition-all duration-200">
          <CheckCheck size={10} />{isVi ? 'Phê duyệt' : 'Approve'}
        </button>
        <button type="button" onClick={(event) => { event.stopPropagation(); onRequestChanges?.(task.id); }}
          className="flex-1 flex items-center justify-center gap-1 py-1 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#6EE7B7] text-[10px] font-semibold rounded-md border border-[#F59E0B]/30 hover:border-[#FCD34D]/45 hover:shadow-[0_10px_22px_rgba(34,197,94,0.18)] transition-all duration-200">
          <RotateCcw size={10} />{isVi ? 'Yêu cầu sửa' : 'Request changes'}
        </button>
      </div>
    )}
  </div>
);
const KanbanColumn: React.FC<{
  status: TaskStatus;
  tasks: LecturerTask[];
  selectedTaskId?: string | null;
  isVi: boolean;
  onOpenTask: (task: LecturerTask) => void;
  onApprove: (id: string) => void;
  onRequestChanges: (id: string) => void;
}> = ({ status, tasks, isVi, selectedTaskId, onOpenTask, onApprove, onRequestChanges }) => (
  <div className="flex flex-col min-w-[200px] flex-1">
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2 h-2 rounded-full ${statusConfig[status].dot}`} />
      <span className="text-xs font-semibold text-slate-300">{isVi ? statusConfig[status].labelVi : statusConfig[status].labelEn}</span>
      <span className="ml-auto text-[10px] text-slate-600 bg-[#162032] px-1.5 py-0.5 rounded-full">{tasks.length}</span>
    </div>
    <div className="flex-1 min-h-20">
      {tasks.length === 0 ? (
        <div className="border border-dashed border-slate-700 rounded-lg p-3 text-center">
          <p className="text-[10px] text-slate-700">{isVi ? 'Không có công việc' : 'No tasks'}</p>
        </div>
      ) : (
        tasks.map(task => (
          <KanbanCard
            key={task.id}
            task={task}
            isVi={isVi}
            isSelected={task.id === selectedTaskId}
            onOpen={onOpenTask}
            onApprove={onApprove}
            onRequestChanges={onRequestChanges}
          />
        ))
      )}
    </div>
  </div>
);
const OverviewTab: React.FC<{ group: LecturerGroup; isVi: boolean }> = ({ group, isVi }) => (
  <div className="p-6 space-y-5">
    <div className="bg-[#0F1A2A] rounded-xl p-4 border border-[#3A3317]">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{isVi ? 'Mô tả dự án' : 'Project description'}</h4>
      <p className="text-sm text-slate-300 leading-relaxed">{group.description}</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Members */}
      <div className="bg-[#0F1A2A] rounded-xl p-4 border border-[#3A3317]">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Users size={11} />{isVi ? 'Thành viên' : 'Members'} ({group.members})
        </h4>
        <div className="space-y-2">
          {group.avatarInitials.map((init, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#162032] border border-[#F59E0B]/25 flex items-center justify-center text-xs font-bold text-[#22C55E]">
                {init[0]}
              </div>
              <div>
                <p className="text-xs font-medium text-white">{isVi ? 'Sinh viên' : 'Student'} {init}</p>
                <p className="text-[10px] text-slate-500">{isVi ? 'Thành viên' : 'Member'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-[#0F1A2A] rounded-xl p-4 border border-[#3A3317] space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle size={11} />{isVi ? 'Tiến độ' : 'Progress'}
        </h4>
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-slate-400">{isVi ? 'Tổng thể' : 'Overall'}</span>
            <span className="text-xs font-bold text-white">{group.progress}%</span>
          </div>
          <div className="h-2 bg-[#162032] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${group.reviewStatus === 'overdue' ? 'bg-red-400' : group.reviewStatus === 'at-risk' ? 'bg-amber-400' : 'bg-green-400'}`}
              style={{ width: `${group.progress}%` }} />
          </div>
        </div>
        <div className="pt-2 border-t border-[#162032] grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-600 text-[10px]">{isVi ? 'Đã duyệt' : 'Approved'}</p>
            <p className="text-green-400 font-semibold">{group.tasks.filter(t => t.status === 'approved').length}</p>
          </div>
          <div>
            <p className="text-slate-600 text-[10px]">{isVi ? 'Chờ duyệt' : 'In review'}</p>
            <p className="text-amber-400 font-semibold">{group.tasks.filter(t => t.status === 'ready-for-review').length}</p>
          </div>
          <div>
            <p className="text-slate-600 text-[10px]">{isVi ? 'Đang thực hiện' : 'In progress'}</p>
            <p className="text-blue-400 font-semibold">{group.tasks.filter(t => t.status === 'in-progress').length}</p>
          </div>
          <div>
            <p className="text-slate-600 text-[10px]">{isVi ? 'Cần làm' : 'To do'}</p>
            <p className="text-slate-400 font-semibold">{group.tasks.filter(t => t.status === 'todo').length}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Deadline */}
    <div className="bg-[#0F1A2A] rounded-xl p-4 border border-[#3A3317] flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#F59E0B]/30 flex items-center justify-center flex-shrink-0">
        <Calendar size={16} className="text-[#22C55E]" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{isVi ? 'Hạn nộp' : 'Deadline'}</p>
        <p className="text-sm font-bold text-white">{group.deadline}</p>
      </div>
      {group.reviewStatus === 'overdue' && (
        <span className="ml-auto flex items-center gap-1 text-xs text-red-400 font-semibold"><AlertTriangle size={12} />{isVi ? 'Quá hạn' : 'Overdue'}</span>
      )}
    </div>
  </div>
);

// Tasks tab
const TasksTab: React.FC<{
  tasks: LecturerTask[];
  selectedTask: LecturerTask | null;
  selectedTaskId: string | null;
  taskComments: GroupComment[];
  reviewHint: string;
  onSelectTask: (task: LecturerTask) => void;
  onAddComment: (taskId: string, text: string) => void;
  onApprove: (id: string) => void;
  onRequestChanges: (id: string) => void;
}> = ({ tasks, selectedTask, selectedTaskId, taskComments, reviewHint, onSelectTask, onAddComment, onApprove, onRequestChanges }) => {
  const [newComment, setNewComment] = useState('');

  const { lang } = useLang();
  const isVi = lang === 'vi';
  const handleSend = () => {
    if (!selectedTask || !newComment.trim()) return;
    onAddComment(selectedTask.id, newComment.trim());
    setNewComment('');
  };

  const columns: TaskStatus[] = ['todo', 'in-progress', 'ready-for-review', 'approved'];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-500 bg-[#22C55E]/10 border border-[#F59E0B]/30 px-2 py-1 rounded-lg text-[#22C55E] font-medium">{isVi ? 'Chọn công việc để xem chi tiết, trạng thái và phản hồi' : 'Select a task to view details, status, and feedback'}</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(status => (
            <KanbanColumn key={status} status={status} isVi={isVi}
              tasks={tasks.filter(t => t.status === status)}
              selectedTaskId={selectedTaskId}
              onOpenTask={onSelectTask}
              onApprove={onApprove}
              onRequestChanges={onRequestChanges}
            />
          ))}
        </div>

        <div className="rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-4">
          {selectedTask ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{isVi ? 'Công việc đã chọn' : 'Selected task'}</p>
                  <h3 className="mt-1 text-sm font-bold text-white leading-snug">{selectedTask.title}</h3>
                </div>
                <span className={`text-[9px] font-semibold px-2 py-1 rounded-full border flex-shrink-0 ${priorityColors[selectedTask.priority]}`}>
                  {selectedTask.priority}
                </span>
              </div>

              <div className="space-y-3 border-b border-[#F59E0B]/15 pb-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-[#162032] border border-slate-800 p-2">
                    <p className="text-[10px] text-slate-500">Trạng thái</p>
                    <p className="mt-0.5 font-semibold text-[#6EE7B7]">{isVi ? statusConfig[selectedTask.status].labelVi : statusConfig[selectedTask.status].labelEn}</p>
                  </div>
                  <div className="rounded-lg bg-[#162032] border border-slate-800 p-2">
                    <p className="text-[10px] text-slate-500">{isVi ? 'Người phụ trách' : 'Assignee'}</p>
                    <p className="mt-0.5 font-semibold text-white">{selectedTask.assignee}</p>
                  </div>
                  <div className="rounded-lg bg-[#162032] border border-slate-800 p-2">
                    <p className="text-[10px] text-slate-500">{isVi ? 'Bắt đầu' : 'Start'}</p>
                    <p className="mt-0.5 font-semibold text-white">{selectedTask.startDate || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-[#162032] border border-slate-800 p-2">
                    <p className="text-[10px] text-slate-500">{isVi ? 'Hạn hoàn thành' : 'Due date'}</p>
                    <p className="mt-0.5 font-semibold text-white">{selectedTask.deadline}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{isVi ? 'Mô tả' : 'Description'}</p>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {selectedTask.description || (isVi ? 'Chưa có mô tả.' : 'No description.')}
                  </p>
                </div>

                <div className="rounded-lg border border-[#22C55E]/10 bg-[#162032]/70 p-2 text-xs text-slate-400">
                  <p className="font-semibold text-slate-200">{isVi ? 'Quy trình duyệt' : 'Review workflow'}</p>
                  <p className="mt-1">{reviewHint}</p>
                </div>

                {selectedTask.status === 'ready-for-review' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => onApprove(selectedTask.id)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition-all duration-200">
                      <CheckCheck size={12} />{isVi ? 'Phê duyệt' : 'Approve'}
                    </button>
                    <button type="button" onClick={() => onRequestChanges(selectedTask.id)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#6EE7B7] text-xs font-semibold rounded-lg border border-[#F59E0B]/30 transition-all duration-200">
                      <RotateCcw size={12} />{isVi ? 'Yêu cầu sửa' : 'Request changes'}
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-3 mt-4 flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare size={13} className="text-[#22C55E]" />{isVi ? 'Lịch sử phản hồi' : 'Feedback history'}
                </h4>
                <span className="text-[11px] text-slate-500">{taskComments.length} {isVi ? 'phản hồi' : 'comments'}</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {taskComments.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-700 p-3 text-center">
                    <p className="text-[11px] text-slate-500">{isVi ? 'Chưa có phản hồi. Hãy để lại hướng dẫn hoặc chờ sinh viên nộp bài.' : 'No feedback yet. Leave guidance or wait for the student to submit.'}</p>
                  </div>
                )}
                {taskComments.map(c => (
                  <div key={c.id} className={`flex gap-2 ${c.role === 'lecturer' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${c.role === 'lecturer' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#F59E0B]/35' : 'bg-[#162032] text-slate-400 border border-slate-700'}`}>
                      {c.author[0]}
                    </div>
                    <div className={`max-w-xl ${c.role === 'lecturer' ? 'items-end' : ''} flex flex-col`}>
                      <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${c.role === 'lecturer' ? 'bg-[#22C55E]/10 border border-[#F59E0B]/30 text-emerald-100 rounded-tr-sm' : 'bg-[#162032] border border-slate-700 text-slate-300 rounded-tl-sm'}`}>
                        {c.taskRef && <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><GitBranch size={8} />{c.taskRef}</p>}
                        {c.text}
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1 px-1">{c.author} - {c.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2 border-t border-[#F59E0B]/15 pt-3">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={isVi ? 'Nhập phản hồi hoặc yêu cầu chỉnh sửa...' : 'Enter feedback or request changes...'}
                  className="flex-1 px-3 py-2 bg-[#162032] border border-[#3A3317] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]/45"
                />
                <button onClick={handleSend}
                  className="px-3 py-2 bg-gradient-to-r from-[#22C55E] to-[#EAB308] text-white rounded-lg border border-[#F59E0B]/40 hover:border-[#FDE68A]/70 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold flex-shrink-0">
                  <Send size={12} />{isVi ? 'Gửi' : 'Send'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 text-center">
              <Eye size={18} className="mb-2 text-slate-500" />
              <p className="text-sm font-semibold text-white">{isVi ? 'Chọn công việc để duyệt' : 'Select a task to review'}</p>
              <p className="mt-1 text-xs text-slate-500">{isVi ? 'Mở công việc để xem chi tiết, phê duyệt hoặc để lại phản hồi.' : 'Open a task to view details, approve it, or leave feedback.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const ContributionsTab: React.FC<{ tasks: LecturerTask[] }> = ({ tasks }) => {
  const memberContributions = buildMemberContributions(tasks);
  const { lang } = useLang();
  const isVi = lang === 'vi';
  const topContributor = memberContributions[0];

  const totalAssigned = memberContributions.reduce((sum, member) => sum + member.assigned, 0);
  const totalApproved = memberContributions.reduce((sum, member) => sum + member.approved, 0);
  const totalInReview = memberContributions.reduce((sum, member) => sum + member.inReview, 0);
  const averageCompletion = memberContributions.length
    ? Math.round(memberContributions.reduce((sum, member) => sum + member.completion, 0) / memberContributions.length)
    : 0;

  return (
    <div className="p-6 space-y-5">
      <div className="rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-white">{isVi ? 'Phân tích đóng góp' : 'Contribution intelligence'}</h3>
            <p className="mt-1 text-xs text-slate-400">{isVi ? 'Hoạt động thành viên dựa trên công việc đã duyệt, chờ duyệt và đang thực hiện.' : 'Live member activity based on approved, review, and in-progress tasks.'}</p>
          </div>
          <span className="rounded-full border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-2.5 py-1 text-[10px] font-semibold text-[#FCD34D]">
            {isVi ? 'Cập nhật từ trạng thái Kanban' : 'Updated from Kanban status'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{isVi ? 'Hoàn thành TB' : 'Avg completion'}</p>
          <p className="mt-1 text-xl font-black text-white">{averageCompletion}%</p>
          <p className="text-[11px] text-slate-500">{isVi ? 'Tốc độ nhóm' : 'Team velocity'}</p>
        </div>
        <div className="rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{isVi ? 'Đã giao' : 'Assigned'}</p>
          <p className="mt-1 text-xl font-black text-white">{totalAssigned}</p>
          <p className="text-[11px] text-slate-500">{isVi ? 'Công việc hiển thị' : 'Visible tasks'}</p>
        </div>
        <div className="rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{isVi ? 'Đã duyệt' : 'Approved'}</p>
          <p className="mt-1 text-xl font-black text-green-400">{totalApproved}</p>
          <p className="text-[11px] text-slate-500">{isVi ? 'Hạng mục hoàn tất' : 'Delivered items'}</p>
        </div>
        <div className="rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{isVi ? 'Chờ duyệt' : 'In review'}</p>
          <p className="mt-1 text-xl font-black text-[#6EE7B7]">{totalInReview}</p>
          <p className="text-[11px] text-slate-500">{isVi ? 'Đang chờ phản hồi' : 'Awaiting feedback'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3">
          {memberContributions.map((member, idx) => (
            <div key={member.memberName} className="rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-3">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center border ${idx === 0 ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#FCD34D]' : 'bg-[#162032] border-[#3A3317] text-slate-400'}`}>
                    #{idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-white">{member.memberName}</p>
                </div>
                <span className="rounded-full border border-[#F59E0B]/35 bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6EE7B7]">
                  {member.completion}%
                </span>
              </div>

              <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#162032]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#EAB308]" style={{ width: `${member.completion}%` }} />
              </div>

              <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                <div className="rounded bg-[#162032] px-1 py-1">
                  <p className="text-slate-500">All</p>
                  <p className="font-semibold text-white">{member.assigned}</p>
                </div>
                <div className="rounded bg-[#162032] px-1 py-1">
                  <p className="text-slate-500">Appr</p>
                  <p className="font-semibold text-green-400">{member.approved}</p>
                </div>
                <div className="rounded bg-[#162032] px-1 py-1">
                  <p className="text-slate-500">Rev</p>
                  <p className="font-semibold text-[#6EE7B7]">{member.inReview}</p>
                </div>
                <div className="rounded bg-[#162032] px-1 py-1">
                  <p className="text-slate-500">Prog</p>
                  <p className="font-semibold text-blue-400">{member.inProgress}</p>
                </div>
                <div className="rounded bg-[#162032] px-1 py-1">
                  <p className="text-slate-500">Todo</p>
                  <p className="font-semibold text-slate-300">{member.todo}</p>
                </div>
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                {getContributionNote(member, isVi)}
              </p>
            </div>
          ))}
        </div>

        <div className="xl:col-span-4 space-y-3">
          <div className="rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{isVi ? 'Đóng góp nổi bật' : 'Top contributor'}</h4>
            {topContributor ? (
              <>
                <p className="mt-2 text-lg font-bold text-white">{topContributor.memberName}</p>
                <p className="text-xs text-[#6EE7B7]">{topContributor.completion}% {isVi ? 'điểm đóng góp' : 'contribution score'}</p>
                <div className="mt-3 rounded-lg border border-[#F59E0B]/30 bg-[#162032] p-2 text-[11px] text-slate-300">
                  {getContributionNote(topContributor, isVi)}
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-500">{isVi ? 'Chưa có dữ liệu đóng góp.' : 'No contribution data available yet.'}</p>
            )}
          </div>

          <div className="rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{isVi ? 'Bảng xếp hạng' : 'Leaderboard'}</h4>
            <div className="space-y-2">
              {memberContributions.map((member) => (
                <div key={`rank-${member.memberName}`}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-300 truncate pr-2">{member.memberName}</span>
                    <span className="font-semibold text-white">{member.completion}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#162032] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#22C55E]"
                      style={{ width: `${member.completion}%` }}
                    />
                  </div>
                </div>
              ))}
              {memberContributions.length === 0 && (
                <p className="text-[11px] text-slate-500">{isVi ? 'Chưa có dữ liệu thành viên.' : 'No member data yet.'}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{isVi ? 'Gợi ý hướng dẫn' : 'Supervision tips'}</h4>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <p className="rounded-lg border border-[#3A3317] bg-[#162032] px-2 py-1.5">{isVi ? 'Hoàn tất công việc đang chờ duyệt trong vòng 24 giờ.' : 'Push in-review tasks to closure within 24 hours.'}</p>
              <p className="rounded-lg border border-[#3A3317] bg-[#162032] px-2 py-1.5">{isVi ? 'Phân công lại khi một thành viên có điểm dưới 50%.' : 'Reassign todo overload when one member falls below 50%.'}</p>
              <p className="rounded-lg border border-[#3A3317] bg-[#162032] px-2 py-1.5">{isVi ? 'Dùng mốc kiểm tra hàng tuần để tăng tỷ lệ duyệt.' : 'Use weekly checkpoints to keep the approval ratio increasing.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Timeline tab
const TimelineTab: React.FC<{ group: LecturerGroup; isVi: boolean }> = ({ group, isVi }) => (
  <div className="p-6">
    <div className="mb-5 rounded-xl border border-[#3A3317] bg-[#0F1A2A] p-4">
      <h3 className="text-sm font-bold text-white">{isVi ? 'Timeline dùng để làm gì?' : 'What is Timeline used for?'}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        {isVi ? 'Timeline hiển thị các cột mốc theo tuần để bạn nhanh chóng theo dõi tiến độ, phát hiện chậm trễ và chuẩn bị mục tiêu rõ ràng cho buổi hướng dẫn.' : 'Timeline shows milestone checkpoints by week so you can quickly see if the group is on schedule, identify delays early, and prepare supervision meetings with clear next targets.'}
      </p>
    </div>

    <div className="relative">
      {/* vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-[#22C55E]/10" />
      <div className="space-y-6">
        {group.timeline.map((item, i) => (
          <div key={i} className="flex gap-5 relative">
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center z-10 border-2 ${item.done ? 'bg-green-500/20 border-amber-500 text-green-400' : 'bg-[#162032] border-slate-600 text-slate-600'}`}>
              {item.done ? <CheckCircle size={14} /> : <Clock size={14} />}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.week}</span>
                <span className="text-[11px] text-slate-600 flex items-center gap-1"><Calendar size={9} />{item.date}</span>
              </div>
              <p className={`text-sm font-semibold ${item.done ? 'text-white' : 'text-slate-400'}`}>{item.milestone}</p>
              <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${item.done ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                {item.done ? (isVi ? 'Hoàn thành' : 'Completed') : (isVi ? 'Đang chờ' : 'Pending')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// GroupDetail
export const GroupDetail: React.FC<GroupDetailProps> = ({ group, onBack }) => {
  const { user } = useAuth();
  const { lang } = useLang();
  const isVi = lang === 'vi';
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [tasks, setTasks] = useState<LecturerTask[]>(group.tasks);
  const [comments, setComments] = useState<GroupComment[]>(group.comments);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    group.tasks.find(task => task.status === 'ready-for-review')?.id ?? group.tasks[0]?.id ?? null
  );

  const handleApprove = async (id: string) => {
    try {
      await approveTask(id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'approved' } : t));
    } catch (err) {
      console.error("Failed to approve task:", err);
      alert((isVi ? 'Không thể phê duyệt công việc: ' : 'Failed to approve task: ') + (err as Error).message);
    }
  };

  const handleRequestChanges = async (id: string) => {
    try {
      await requestChanges(id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'in-progress' } : t));
    } catch (err) {
      console.error("Failed to request changes:", err);
      alert((isVi ? 'Không thể yêu cầu chỉnh sửa: ' : 'Failed to request changes: ') + (err as Error).message);
    }
  };

  const handleAddComment = async (taskId: string, text: string) => {
    const selectedTask = tasks.find(task => task.id === taskId);
    if (!selectedTask) {
      alert(isVi ? 'Không thể thêm phản hồi: Không tìm thấy công việc.' : 'Cannot add comment: Task not found.');
      return;
    }

    try {
      await addComment(taskId, text);
      setComments(prev => [...prev, {
        id: `c${Date.now()}`,
        taskId,
        author: user?.name || (isVi ? 'Giảng viên' : 'Lecturer'),
        role: 'lecturer',
        text,
        time: isVi ? 'Vừa xong' : 'Just now',
        taskRef: selectedTask.title,
      }]);
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert((isVi ? 'Không thể thêm phản hồi: ' : 'Failed to add comment: ') + (err as Error).message);
    }
  };

  const selectedTask = tasks.find(task => task.id === selectedTaskId) ?? null;
  const taskComments = selectedTask ? comments.filter(comment => comment.taskId === selectedTask.id) : [];
  const reviewHint = selectedTask?.status === 'approved'
    ? (isVi ? 'Đã phê duyệt. Công việc đã hoàn tất quy trình duyệt.' : 'Approved. The task is closed for review.')
    : selectedTask?.status === 'ready-for-review'
      ? (isVi ? 'Sinh viên đã nộp. Hãy xem nội dung rồi phê duyệt hoặc yêu cầu chỉnh sửa.' : 'Submitted by student. Review the work, then approve or request changes.')
      : taskComments.length > 0
        ? (isVi ? 'Đã có phản hồi hoặc yêu cầu chỉnh sửa. Chờ sinh viên cập nhật và nộp lại.' : 'Changes were requested or feedback exists. Wait for the student to update and resubmit.')
        : (isVi ? 'Chưa nộp. Bạn vẫn có thể thêm phản hồi để hướng dẫn.' : 'Not submitted yet. Feedback can still be added as guidance.');
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: isVi ? 'Tổng quan' : 'Overview', icon: <LayoutGrid size={13} /> },
    { id: 'tasks', label: isVi ? 'Công việc' : 'Tasks', icon: <CheckCircle size={13} /> },
    { id: 'contributions', label: isVi ? 'Đóng góp' : 'Contributions', icon: <BarChart3 size={13} /> },
    { id: 'timeline', label: isVi ? 'Cột mốc' : 'Milestones', icon: <GitBranch size={13} /> },
  ];

  const reviewCount = tasks.filter(t => t.status === 'ready-for-review').length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Group Header */}
      <div className="px-6 py-4 bg-[#0F1A2A] border-b border-[#F59E0B]/15 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#6EE7B7] transition-colors duration-200 mb-3">
          <ArrowLeft size={13} />{isVi ? 'Quay lại danh sách nhóm' : 'Back to groups'}
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">{group.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{group.className}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users size={13} className="text-[#22C55E]" />
              <span>{group.members} {isVi ? 'thành viên' : 'members'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar size={13} className="text-[#22C55E]" />
              <span>{isVi ? 'Hạn nộp' : 'Deadline'}: {group.deadline}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle size={13} className="text-[#22C55E]" />
              <span>{group.progress}% {isVi ? 'hoàn thành' : 'complete'}</span>
            </div>
            {reviewCount > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-[#22C55E]/10 border border-[#F59E0B]/35 text-[#22C55E] flex items-center gap-1">
                <Clock size={11} />{reviewCount} {isVi ? 'chờ duyệt' : 'awaiting review'}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-[#162032] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${group.reviewStatus === 'overdue' ? 'bg-red-400' : group.reviewStatus === 'at-risk' ? 'bg-amber-400' : 'bg-green-400'}`}
            style={{ width: `${group.progress}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#F59E0B]/15 bg-[#0F1A2A] px-6 flex-shrink-0">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all duration-200 ${activeTab === tab.id ? 'border-[#F59E0B] text-[#6EE7B7]' : 'border-transparent text-slate-500 hover:text-white hover:border-[#F59E0B]/35'}`}>
            {tab.icon}{tab.label}
            {tab.id === 'tasks' && reviewCount > 0 && (
              <span className="ml-0.5 w-4 h-4 bg-[#22C55E]/20 text-[#22C55E] rounded-full text-[9px] font-black flex items-center justify-center">{reviewCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OverviewTab group={group} isVi={isVi} />
            </motion.div>
          )}
          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TasksTab
                tasks={tasks}
                selectedTask={selectedTask}
                selectedTaskId={selectedTaskId}
                taskComments={taskComments}
                reviewHint={reviewHint}
                onSelectTask={task => setSelectedTaskId(task.id)}
                onAddComment={handleAddComment}
                onApprove={handleApprove}
                onRequestChanges={handleRequestChanges}
              />
            </motion.div>
          )}
          {activeTab === 'contributions' && (
            <motion.div key="contributions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ContributionsTab tasks={tasks} />
            </motion.div>
          )}
          {activeTab === 'timeline' && (
            <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TimelineTab group={group} isVi={isVi} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};



