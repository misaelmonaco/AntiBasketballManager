import React from 'react';
import { MatchTeamState } from '../../types';

interface MatchOnCourtStripProps {
  home: MatchTeamState;
  away: MatchTeamState;
  userTeamId: string;
  matchFinished: boolean;
  onQuickSubUserPlayer: (playerId: string) => void;
}

export const MatchOnCourtStrip: React.FC<MatchOnCourtStripProps> = ({
  home,
  away,
  userTeamId,
  matchFinished,
  onQuickSubUserPlayer,
}) => {
  const renderTeam = (team: MatchTeamState) => {
    const isUser = team.teamId === userTeamId;
    const onCourt = team.players.filter((p) => p.onCourt).slice(0, 5);
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider px-0.5">
          <span style={{ color: team.primaryColor }} className="brightness-125">
            {team.shortName} In Campo {isUser ? '(Tu)' : ''}
          </span>
          <span className="text-slate-500">
            {isUser && !matchFinished ? 'Clicca per cambio rapido' : 'Stamina / Falli'}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {onCourt.map((p) => {
            const surname = p.name.split(' ').slice(1).join(' ') || p.name;
            const stamPct = Math.round(p.stamina);
            const stamColor =
              stamPct >= 65
                ? 'bg-emerald-500'
                : stamPct >= 40
                ? 'bg-amber-400'
                : 'bg-red-500';
            return (
              <button
                key={p.playerId}
                type="button"
                disabled={!isUser || matchFinished}
                onClick={() => isUser && !matchFinished && onQuickSubUserPlayer(p.playerId)}
                title={
                  isUser && !matchFinished
                    ? `Sostituisci ${p.name} (${p.points} pt, ${p.fouls} falli, ${stamPct}% stamina)`
                    : `${p.name} (${p.points} pt, ${p.fouls} falli)`
                }
                className={`p-1.5 rounded-lg bg-slate-950/85 border text-left transition-colors ${
                  isUser && !matchFinished
                    ? 'border-slate-800 hover:border-orange-500/60 cursor-pointer'
                    : 'border-slate-800/70 cursor-default'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[9px] font-bold">
                  <span className="text-orange-400">{p.position}</span>
                  <span
                    className={
                      p.fouls >= 4 ? 'text-red-400 font-black' : 'text-slate-400'
                    }
                  >
                    {p.fouls}F
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-100 truncate">
                  {surname}
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 tabular-nums mt-0.5">
                  <span>{p.points}p</span>
                  <span>{stamPct}%</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-0.5">
                  <div className={`h-full ${stamColor}`} style={{ width: `${stamPct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fm-card rounded-2xl p-2.5 space-y-2 shrink-0">
      {renderTeam(home)}
      {renderTeam(away)}
    </div>
  );
};
