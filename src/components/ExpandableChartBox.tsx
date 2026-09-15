import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ExpandableChartBoxProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ExpandableChartBox({ 
  title, 
  children, 
  className,
  contentClassName = "flex-1 min-h-0 relative"
}: ExpandableChartBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
            {typeof title === 'string' ? (
              <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
            ) : (
              <div>{title}</div>
            )}
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors shrink-0"
              title="Minimize"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 p-4 relative">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col relative group min-w-0", className)}>
      <div className="flex items-center justify-between shrink-0 mb-2">
        {typeof title === 'string' ? (
          <h3 className="font-bold text-slate-800 text-xs truncate mr-2">{title}</h3>
        ) : (
          <div className="mr-2 truncate">{title}</div>
        )}
        <button 
          onClick={() => setIsExpanded(true)}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-all absolute right-2 top-2 z-10"
          title="Maximize"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
}
