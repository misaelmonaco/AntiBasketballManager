import React from 'react';

interface ClubBadgeProps {
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * Scudetto bicolore stile Football Manager / Pro Basketball Manager
 */
export const ClubBadge: React.FC<ClubBadgeProps> = ({
  shortName,
  primaryColor,
  secondaryColor,
  size = 'md',
}) => {
  const dims =
    size === 'xs'
      ? 'w-7 h-7 text-[9px] rounded-lg'
      : size === 'sm'
      ? 'w-9 h-9 text-[10px] rounded-xl'
      : size === 'lg'
      ? 'w-14 h-14 text-sm rounded-2xl'
      : 'w-11 h-11 text-xs rounded-xl';

  return (
    <div
      className={`${dims} relative overflow-hidden flex items-center justify-center font-black tracking-tight shrink-0 border border-white/15 shadow-lg`}
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor} 52%, ${secondaryColor} 52%, ${secondaryColor} 100%)`,
      }}
    >
      <span className="px-1 py-0.5 rounded bg-slate-950/80 text-white shadow-sm leading-none backdrop-blur-[1px]">
        {shortName}
      </span>
    </div>
  );
};
