import React, { useState, useEffect } from 'react';
import { Paperclip, Eye, Download, Trash2, Grid3X3, List, FileText, File, Video, FileImage, FileCode2 } from 'lucide-react';
import { ProjectFileItem, ProjectLinkItem } from '../utils/dashboardTypes';
import { listProjectLinks, addProjectLink, deleteProjectLink } from '../../../api/project';
import { getAuthToken } from '../utils/dashboardUtils';
import { useToast } from '../../ui/Toast';
import { useLang } from '../../../contexts/LanguageContext';

export const ProjectFilesView: React.FC<{
  projectId: string;
  orgId: string | null;
  role: string;
  files: ProjectFileItem[];
  onUpload: (files: FileList | null) => void;
  onDelete: (fileId: string) => void;
  onRename: (fileId: string, newName: string) => void;
}> = ({ projectId, orgId, role, files, onUpload, onDelete, onRename }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'files' | 'links'>('files');
  const { lang } = useLang();
  const isVi = lang === 'vi';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [previewFile, setPreviewFile] = useState<ProjectFileItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ file?: ProjectFileItem; link?: ProjectLinkItem; x: number; y: number } | null>(null);
  
  const [links, setLinks] = useState<ProjectLinkItem[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  useEffect(() => {
    if (activeTab === 'links' && projectId && orgId) {
      loadLinks();
    }
  }, [activeTab, projectId, orgId]);

  const loadLinks = async () => {
    const token = getAuthToken();
    if (!token || !orgId) return;
    try {
      const data = await listProjectLinks(token, orgId, projectId);
      setLinks(data);
    } catch (err) {
      console.error('Failed to load links:', err);
    }
  };

  const handleAddLink = async () => {
    if (!newLinkUrl.trim()) return;
    const token = getAuthToken();
    if (!token || !orgId) return;
    
    try {
      await addProjectLink(token, orgId, projectId, {
        url: newLinkUrl,
        title: newLinkTitle
      }, role);
      showToast(isVi ? 'Đã thêm liên kết' : 'Link added');
      setNewLinkUrl('');
      setNewLinkTitle('');
      setIsAddingLink(false);
      loadLinks();
    } catch (err: any) {
      showToast(err.message || (isVi ? 'Không thể thêm liên kết' : 'Could not add link'), 'error');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    const token = getAuthToken();
    if (!token || !orgId) return;
    
    try {
      await deleteProjectLink(token, orgId, projectId, linkId);
      showToast(isVi ? 'Đã xóa liên kết' : 'Link deleted');
      loadLinks();
    } catch (err: any) {
      showToast(err.message || (isVi ? 'Không thể xóa liên kết' : 'Could not delete link'), 'error');
    }
  };

  const getExt = (name: string) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE';
  };

  const isImage = (file: ProjectFileItem) => (file.mimeType || '').startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name);
  const isPdf = (file: ProjectFileItem) => (file.mimeType || '').includes('pdf') || /\.pdf$/i.test(file.name);
  const isVideo = (file: ProjectFileItem) => (file.mimeType || '').startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);

  const getFileIcon = (file: ProjectFileItem) => {
    if (isImage(file)) return <FileImage size={14} className="text-sky-300" />;
    if (isPdf(file)) return <FileText size={14} className="text-red-300" />;
    if (isVideo(file)) return <Video size={14} className="text-violet-300" />;
    if (/\.(ai|psd)$/i.test(file.name)) return <FileCode2 size={14} className="text-emerald-300" />;
    return <File size={14} className="text-slate-300" />;
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  const downloadFile = async (file: ProjectFileItem) => {
    if (!file.objectUrl) return;
    try {
      // Append a cache-busting parameter to prevent browser from using opaque cache from <img> tags
      const response = await fetch(`${file.objectUrl}?download=${Date.now()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      // Fallback to normal navigation if fetch fails (e.g., due to strict CORS despite backend config)
      const a = document.createElement('a');
      a.href = file.objectUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const renderPreviewBody = (file: ProjectFileItem) => {
    if (!file.objectUrl) {
      return <div className="h-[360px] flex items-center justify-center text-sm text-slate-500">{isVi ? 'Không thể xem trước tệp này.' : 'This file cannot be previewed.'}</div>;
    }
    if (isImage(file)) {
      return <img src={file.objectUrl} alt={file.name} className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg border border-[#22C55E]/12" />;
    }
    if (isPdf(file)) {
      return <iframe src={file.objectUrl} title={file.name} className="w-full h-[60vh] rounded-lg border border-[#22C55E]/12 bg-[#0A0F1A]" />;
    }
    if (isVideo(file)) {
      return <video controls src={file.objectUrl} className="max-h-[60vh] w-auto max-w-full rounded-lg border border-[#22C55E]/12" />;
    }
    return <div className="h-[360px] flex items-center justify-center text-sm text-slate-500">{isVi ? 'Định dạng tệp này không hỗ trợ xem trước.' : 'Preview is not supported for this file type.'}</div>;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{isVi ? 'Tài liệu dự án' : 'Project files'}</h2>
              <p className="text-sm text-slate-500 mt-1">{isVi ? 'Quản lý tệp và liên kết.' : 'Manage files and links.'}</p>
            </div>
            <div className="flex bg-[#162032] p-1 rounded-lg ml-2">
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'files' ? 'bg-[#0F1A2A] text-[#22C55E] shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {isVi ? 'Tệp' : 'Files'}
              </button>
              <button
                onClick={() => setActiveTab('links')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'links' ? 'bg-[#0F1A2A] text-[#22C55E] shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {isVi ? 'Liên kết' : 'Links'}
              </button>
            </div>
          </div>
          
          {activeTab === 'files' ? (
            <div className="flex items-center gap-2">
              <div className="flex bg-[#162032] p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-[#0F1A2A] text-[#22C55E]' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Grid3X3 size={13} /> {isVi ? 'Lưới' : 'Grid'}
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-[#0F1A2A] text-[#22C55E]' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <List size={13} /> {isVi ? 'Danh sách' : 'List'}
                </button>
              </div>

              {role === 'Leader' && (
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#22C55E]/20 text-xs font-semibold text-[#6EE7B7] hover:bg-[#162032] cursor-pointer">
                  <Paperclip size={14} />
                  {isVi ? 'Tải tệp lên' : 'Upload files'}
                  <input type="file" className="hidden" multiple onChange={(e) => onUpload(e.target.files)} />
                </label>
              )}
            </div>
          ) : (
            role === 'Leader' && (
              <button
                onClick={() => setIsAddingLink(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#22C55E]/10 text-[#6EE7B7] hover:bg-[#22C55E]/20 text-xs font-semibold transition-all"
              >
                {isVi ? '+ Thêm liên kết' : '+ Add link'}
              </button>
            )
          )}
        </div>

        {activeTab === 'files' && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2.5'}>
          {files.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#22C55E]/20 bg-[#0F1A2A] px-4 py-8 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
              <p className="font-semibold text-slate-300 mb-1">{isVi ? 'Chưa có tệp nào' : 'No files yet'}</p>
              <p>{isVi ? 'Kéo thả tệp vào đây hoặc chọn Tải tệp lên' : 'Drag files here or select Upload files'}</p>
            </div>
          ) : files.map(file => {
            const compact = viewMode === 'list';
            return (
              <div
                key={file.id}
                className={`rounded-xl border border-[#22C55E]/12 bg-[#0F1A2A] ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ file, x: e.clientX, y: e.clientY });
                }}
              >
                {compact ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isImage(file) && file.objectUrl ? (
                        <button onClick={() => setPreviewFile(file)} className="w-10 h-10 rounded-lg border border-[#22C55E]/12 overflow-hidden flex-shrink-0 bg-[#162032]">
                          <img src={file.objectUrl} alt={file.name} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-[#22C55E]/12 bg-[#162032] flex items-center justify-center flex-shrink-0">
                          {getFileIcon(file)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-[#22C55E]/20 text-[#6EE7B7]">{getExt(file.name)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{file.sizeLabel} • {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button onClick={() => setPreviewFile(file)} className="px-2 py-1 rounded-md border border-[#22C55E]/20 text-[#6EE7B7] hover:bg-[#162032]">{isVi ? 'Xem trước' : 'Preview'}</button>
                      <button onClick={() => downloadFile(file)} disabled={!file.objectUrl} className="px-2 py-1 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032] disabled:opacity-40">{isVi ? 'Tải xuống' : 'Download'}</button>
                      {role === 'Leader' && (
                        <button onClick={() => onDelete(file.id)} className="px-2 py-1 rounded-md border border-red-500/20 text-red-300 hover:bg-red-500/10">{isVi ? 'Xóa' : 'Delete'}</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start gap-3">
                      {isImage(file) && file.objectUrl ? (
                        <button onClick={() => setPreviewFile(file)} className="w-14 h-14 rounded-lg border border-[#22C55E]/12 overflow-hidden flex-shrink-0 bg-[#162032]">
                          <img src={file.objectUrl} alt={file.name} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded-lg border border-[#22C55E]/12 bg-[#162032] flex items-center justify-center flex-shrink-0">
                          {getFileIcon(file)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-[#22C55E]/20 text-[#6EE7B7]">{getExt(file.name)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{file.sizeLabel} • {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-[#6EE7B7] hover:bg-[#162032]"
                      >
                        <Eye size={12} /> {isVi ? 'Xem trước' : 'Preview'}
                      </button>
                      <button
                        onClick={() => downloadFile(file)}
                        disabled={!file.objectUrl}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032] disabled:opacity-40"
                      >
                        <Download size={12} /> {isVi ? 'Tải xuống' : 'Download'}
                      </button>
                      {role === 'Leader' && (
                        <button
                          onClick={() => onDelete(file.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-500/20 text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 size={12} /> {isVi ? 'Xóa' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}

        {previewFile && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setPreviewFile(null)} />
            <div className="relative bg-[#0F1A2A] border border-[#22C55E]/15 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#22C55E]/10 flex items-center justify-between">
                <p className="text-sm font-semibold text-white truncate pr-4">{previewFile.name}</p>
                <button onClick={() => downloadFile(previewFile)} className="text-xs px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-[#6EE7B7] hover:bg-[#162032]">{isVi ? 'Tải xuống' : 'Download'}</button>
              </div>
              <div className="p-4 flex items-center justify-center bg-[#0A0F1A]">
                {renderPreviewBody(previewFile)}
              </div>
              <div className="px-4 py-3 border-t border-[#22C55E]/10 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">{previewFile.sizeLabel} • {isVi ? 'Được tải lên bởi' : 'Uploaded by'} {previewFile.uploadedBy} • {new Date(previewFile.uploadedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadFile(previewFile)} className="text-xs px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032]">{isVi ? 'Tải xuống' : 'Download'}</button>
                  {previewFile.objectUrl && (
                    <a href={previewFile.objectUrl} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032]">{isVi ? 'Mở kích thước đầy đủ' : 'Open full size'}</a>
                  )}
                  <button onClick={() => setPreviewFile(null)} className="text-xs px-2.5 py-1.5 rounded-md border border-red-500/20 text-red-300 hover:bg-red-500/10">{isVi ? 'Đóng' : 'Close'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {contextMenu && (
          <div
            className="fixed z-[130] w-40 rounded-xl border border-[#22C55E]/15 bg-[#0F1A2A] p-1.5 shadow-2xl"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          >
            <button onClick={() => { setPreviewFile(contextMenu.file); setContextMenu(null); }} className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-[#162032] rounded-md">{isVi ? 'Xem trước' : 'Preview'}</button>
            <button onClick={() => { downloadFile(contextMenu.file); setContextMenu(null); }} className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-[#162032] rounded-md">{isVi ? 'Tải xuống' : 'Download'}</button>
            <button
              onClick={() => {
                const nextName = window.prompt(isVi ? 'Đổi tên tệp' : 'Rename file', contextMenu.file.name);
                if (nextName) onRename(contextMenu.file.id, nextName);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-[#162032] rounded-md"
            >
              {isVi ? 'Đổi tên' : 'Rename'}
            </button>
            <button onClick={() => { onDelete(contextMenu.file.id); setContextMenu(null); }} className="w-full text-left px-2.5 py-2 text-xs text-red-300 hover:bg-red-500/10 rounded-md">{isVi ? 'Xóa' : 'Delete'}</button>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-3">
            {links.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#22C55E]/20 bg-[#0F1A2A] px-4 py-8 text-center text-sm text-slate-500">
                <p className="font-semibold text-slate-300 mb-1">{isVi ? 'Chưa có liên kết nào' : 'No links yet'}</p>
                <p>{isVi ? 'Chọn + Thêm liên kết để lưu URL quan trọng' : 'Select + Add link to save an important URL'}</p>
              </div>
            ) : links.map(link => (
              <div key={link.id} className="rounded-xl border border-[#22C55E]/12 bg-[#0F1A2A] px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#6EE7B7] hover:underline truncate block">
                    {link.title || link.url}
                  </a>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    <span className="text-slate-400">{link.url}</span> • {isVi ? 'Được thêm bởi' : 'Added by'} {link.uploadedBy} • {new Date(link.uploadedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={link.url} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032] text-xs">
                    {isVi ? 'Mở' : 'Open'}
                  </a>
                  {role === 'Leader' && (
                    <button onClick={() => handleDeleteLink(link.id)} className="px-2.5 py-1.5 rounded-md border border-red-500/20 text-red-300 hover:bg-red-500/10 text-xs">
                      {isVi ? 'Xóa' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isAddingLink && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setIsAddingLink(false)} />
            <div className="relative bg-[#0F1A2A] border border-[#22C55E]/15 rounded-2xl w-full max-w-md p-5">
              <h3 className="text-lg font-bold text-white mb-4">{isVi ? 'Thêm liên kết mới' : 'Add a new link'}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">URL</label>
                  <input
                    type="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#162032] border border-[#22C55E]/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22C55E]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">{isVi ? 'Tiêu đề (không bắt buộc)' : 'Title (optional)'}</label>
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder={isVi ? 'Ví dụ: Thiết kế Figma' : 'Example: Figma design'}
                    className="w-full bg-[#162032] border border-[#22C55E]/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22C55E]/50"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsAddingLink(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-[#162032]"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  onClick={handleAddLink}
                  disabled={!newLinkUrl.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#22C55E] text-black hover:bg-[#22C55E]/90 disabled:opacity-50"
                >
                  {isVi ? 'Thêm liên kết' : 'Add link'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
