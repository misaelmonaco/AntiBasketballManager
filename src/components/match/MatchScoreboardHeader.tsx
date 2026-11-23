import React from 'react';
import { MatchTeamState } from '../../types';

interface MatchScoreboardHeaderProps {
  home: MatchTeamState;
  away: MatchTeamState;
  finished: boolean;
  quarterLabel: string;
  clockFormatted: string;
}

export const MatchScoreboardHeader: React.FC<MatchScoreboardHeaderProps> = ({
  home,
  away,
  finished,
  quarterLabel,
  clockFormatted,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 shrink-0">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Home */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow"
            style={{
              backgroundColor: home.primaryColor,
              color: home.secondaryColor,
            }}
          >
            {home.shortName}
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {home.name}
              {home.teamFoulsThisQuarter >= 4 && (
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-extrabold">
                  BONUS
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Falli: {home.teamFoulsThisQuarter} • Timeout: {home.timeoutsRemaining}
            </div>
          </div>
        </div>

        {/* Center Score & Clock */}
        <div className="flex items-center gap-5 bg-slate-950 px-6 py-2 rounded-2xl border border-slate-800">
          <span className="text-3xl font-black text-white tabular-nums">{home.score}</span>
          <div className="text-center px-3 border-x border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
              {finished ? 'FINALE' : quarterLabel}
            </div>
            <div className="text-lg font-mono font-extrabold text-slate-100 tabular-nums">
              {clockFormatted}
            </div>
          </div>
          <span className="text-3xl font-black text-white tabular-nums">{away.score}</span>
        </div>

        {/* Away */}
        <div className="flex items-center justify-end gap-3 min-w-[200px] text-right">
          <div>
            <div className="text-sm font-bold text-white flex items-center justify-end gap-2">
              {away.teamFoulsThisQuarter >= 4 && (
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-extrabold">
                  BONUS
                </span>
              )}
              {away.name}
            </div>
            <div className="text-[11px] text-slate-400">
              Falli: {away.teamFoulsThisQuarter} • Timeout: {away.timeoutsRemaining}
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow"
            style={{
              backgroundColor: away.primaryColor,
              color: away.secondaryColor,
            }}
          >
            {away.shortName}
          </div>
        </div>
      </div>
    </div>
  );
};
