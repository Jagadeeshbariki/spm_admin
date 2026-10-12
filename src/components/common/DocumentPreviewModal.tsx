import React from 'react';
import { X, Download, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export function DocumentPreviewModal({ isOpen, onClose, url, title = 'Document Preview' }: DocumentPreviewModalProps) {
  if (!isOpen || !url) return null;

  const isImage = /\.(jpeg|jpg|png|gif|webp|svg)(\?.*)?$|image/i.test(url) || url.includes('image/');
  
  // Format embed URL for Google Drive or other viewers
  let embedUrl = url;
  if (url.includes('drive.google.com')) {
    embedUrl = url.replace(/\/view(\?.*)?$/, '/preview').replace(/\/view$/, '/preview');
    if (!embedUrl.includes('/preview')) {
      embedUrl = embedUrl.replace(/\/d\/([a-zA-Z0-9_-]+)(?:\/.*)?$/, '/d/$1/preview');
    }
  } else if (/\.(doc|docx|xls|xlsx|ppt|pptx)(\?.*)?$/i.test(url)) {
    embedUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-blue-600" />
            ) : (
              <FileText className="w-5 h-5 text-red-600" />
            )}
            <h3 className="font-bold text-slate-800 text-base truncate max-w-xl">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open
            </a>
            <a 
              href={url} 
              download 
              target="_blank" 
              rel="noreferrer" 
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 bg-slate-100 p-4 overflow-auto flex items-center justify-center relative">
          {isImage ? (
            <img 
              src={url} 
              alt={title} 
              className="max-w-full max-h-full object-contain rounded-xl shadow-md bg-white p-2 border border-slate-200"
            />
          ) : (
            <iframe 
              src={embedUrl} 
              className="w-full h-full rounded-xl border border-slate-200 bg-white shadow-inner"
              title={title}
            />
          )}
        </div>
      </div>
    </div>
  );
}
