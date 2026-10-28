import React from 'react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  collapsed = false,
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : size === 'xl' ? 64 : 34;
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-xl' : 'text-lg';

  return (
    <div className={`flex items-center gap-2.5 font-sans tracking-tight select-none ${className}`}>
      {/* Official Money Vedass Brand Emblem */}
      <img
        src="/logo.png"
        alt="Money Vedass Logo"
        width={iconSize}
        height={iconSize}
        className="rounded-xl object-contain shrink-0 shadow-sm transition-transform active:scale-95"
        style={{ width: iconSize, height: iconSize }}
        loading="eager"
      />

      {!collapsed && (
        <div className="flex flex-col justify-center">
          <span className={`font-bold tracking-tight leading-none text-slate-900 dark:text-white ${textSize}`}>
            Money <span className="text-blue-600 dark:text-blue-400">Vedass</span>
          </span>
          {showSubtitle && (
            <span className="text-[10px] tracking-wider text-slate-500 dark:text-slate-400 font-semibold uppercase mt-0.5">
              Financial OS
            </span>
          )}
        </div>
      )}
    </div>
  );
};
