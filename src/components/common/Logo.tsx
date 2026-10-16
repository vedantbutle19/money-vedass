import React from 'react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ collapsed = false, className = '', size = 'md' }) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 36 : 28;
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`flex items-center gap-2.5 font-sans tracking-tight select-none ${className}`}>
      {/* Abstract geometric financial node symbol: Upward trajectory + vault balance */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4/5 h-4/5 p-0.5"
        >
          {/* Minimal financial growth glyph: ascending stepped bars & geometric convergence */}
          <path d="M4 19h16" opacity="0.4" />
          <path d="M6 15l4.5-4.5 4 4L20 8" />
          <path d="M15 8h5v5" />
          <circle cx="6" cy="15" r="1.2" fill="currentColor" />
          <circle cx="10.5" cy="10.5" r="1.2" fill="currentColor" />
          <circle cx="14.5" cy="14.5" r="1.2" fill="currentColor" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <span className={`font-semibold tracking-tight leading-none text-slate-900 dark:text-white ${textSize}`}>
            money vedass
          </span>
          <span className="text-[10px] tracking-wider text-slate-600 dark:text-slate-400 font-medium uppercase mt-0.5">
            Financial OS
          </span>
        </div>
      )}
    </div>
  );
};
