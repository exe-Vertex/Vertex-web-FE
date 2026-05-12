import React, { useState, useEffect } from 'react';
import { Paperclip, Eye, Download, Trash2, Grid3X3, List, FileText, File, Video, FileImage, FileCode2 } from 'lucide-react';
import { ProjectFileItem } from '../utils/dashboardTypes';

export const ProjectFilesView: React.FC<{
  files: ProjectFileItem[];
  onUpload: (files: FileList | null) => void;
  onDelete: (fileId: string) => void;
  onRename: (fileId: string, newName: string) => void;
}> = ({ files, onUpload, onDelete, onRename }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [previewFile, setPreviewFile] = useState<ProjectFileItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ file: ProjectFileItem; x: number; y: number } | null>(null);

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

  const downloadFile = (file: ProjectFileItem) => {
    if (!file.objectUrl) return;
    const a = document.createElement('a');
    a.href = file.objectUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderPreviewBody = (file: ProjectFileItem) => {
    if (!file.objectUrl) {
      return <div className="h-[360px] flex items-center justify-center text-sm text-slate-500">Preview unavailable for this file.</div>;
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
    return <div className="h-[360px] flex items-center justify-center text-sm text-slate-500">Preview unavailable for this file type.</div>;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0F1A] p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Project Files</h2>
            <p className="text-sm text-slate-500 mt-1">Upload and track project documents.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#162032] p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-[#0F1A2A] text-[#22C55E]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Grid3X3 size={13} /> Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-[#0F1A2A] text-[#22C55E]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <List size={13} /> List
              </button>
            </div>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#22C55E]/20 text-xs font-semibold text-[#6EE7B7] hover:bg-[#162032] cursor-pointer">
              <Paperclip size={14} />
              Upload Files
              <input type="file" className="hidden" multiple onChange={(e) => onUpload(e.target.files)} />
            </label>
          </div>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2.5'}>
          {files.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#22C55E]/20 bg-[#0F1A2A] px-4 py-8 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
              <p className="font-semibold text-slate-300 mb-1">No files uploaded yet</p>
              <p>Drag files here or use Upload Files</p>
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
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{file.sizeLabel} • {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button onClick={() => setPreviewFile(file)} className="px-2 py-1 rounded-md border border-[#22C55E]/20 text-[#6EE7B7] hover:bg-[#162032]">Preview</button>
                      <button onClick={() => downloadFile(file)} disabled={!file.objectUrl} className="px-2 py-1 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032] disabled:opacity-40">Download</button>
                      <button onClick={() => onDelete(file.id)} className="px-2 py-1 rounded-md border border-red-500/20 text-red-300 hover:bg-red-500/10">Remove</button>
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
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{file.sizeLabel} • {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-[#6EE7B7] hover:bg-[#162032]"
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <button
                        onClick={() => downloadFile(file)}
                        disabled={!file.objectUrl}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032] disabled:opacity-40"
                      >
                        <Download size={12} /> Download
                      </button>
                      <button
                        onClick={() => onDelete(file.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-500/20 text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {previewFile && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setPreviewFile(null)} />
            <div className="relative bg-[#0F1A2A] border border-[#22C55E]/15 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#22C55E]/10 flex items-center justify-between">
                <p className="text-sm font-semibold text-white truncate pr-4">{previewFile.name}</p>
                <button onClick={() => downloadFile(previewFile)} className="text-xs px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-[#6EE7B7] hover:bg-[#162032]">Download</button>
              </div>
              <div className="p-4 flex items-center justify-center bg-[#0A0F1A]">
                {renderPreviewBody(previewFile)}
              </div>
              <div className="px-4 py-3 border-t border-[#22C55E]/10 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">{previewFile.sizeLabel} • Uploaded by {previewFile.uploadedBy} • {new Date(previewFile.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadFile(previewFile)} className="text-xs px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032]">Download</button>
                  {previewFile.objectUrl && (
                    <a href={previewFile.objectUrl} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1.5 rounded-md border border-[#22C55E]/20 text-slate-300 hover:bg-[#162032]">Open full size</a>
                  )}
                  <button onClick={() => setPreviewFile(null)} className="text-xs px-2.5 py-1.5 rounded-md border border-red-500/20 text-red-300 hover:bg-red-500/10">Close</button>
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
            <button onClick={() => { setPreviewFile(contextMenu.file); setContextMenu(null); }} className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-[#162032] rounded-md">Preview</button>
            <button onClick={() => { downloadFile(contextMenu.file); setContextMenu(null); }} className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-[#162032] rounded-md">Download</button>
            <button
              onClick={() => {
                const nextName = window.prompt('Rename file', contextMenu.file.name);
                if (nextName) onRename(contextMenu.file.id, nextName);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-2 text-xs text-slate-300 hover:bg-[#162032] rounded-md"
            >
              Rename
            </button>
            <button onClick={() => { onDelete(contextMenu.file.id); setContextMenu(null); }} className="w-full text-left px-2.5 py-2 text-xs text-red-300 hover:bg-red-500/10 rounded-md">Remove</button>
          </div>
        )}
      </div>
    </div>
  );
};
