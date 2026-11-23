import React from 'react';
import { Calendar, FileText, Swords, Trophy } from 'lucide-react';
import { formatItalianDate } from '../../engine/calendarUtils';
import { Team } from '../../types';
import { OpponentTeamMetrics, TeamGameEntry } from './opponentAnalytics';

interface OpponentScheduleTabProps {
  team: Team;
  userTeam: Team;
  metrics: OpponentTeamMetrics;
  onSelectTeam: (teamId: string) => void;
  onOpenBoxScore: (gameId: string) => void;
}

export const OpponentScheduleTab: React.FC<OpponentScheduleTabProps> = ({
  team,
  userTeam,
  metrics,
  onSelectTeam,
  onOpenBoxScore,
}) => {
  const renderOpponentLabel = (entry: TeamGameEntry) => {
    if (entry.opponentId === userTeam.id) {
      return (
        <span className="font-extrabold text-orange-300">{entry.opponentName} (Tu)</span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onSelectTeam(entry.opponentId)}
        className="font-bold text-white hover:text-orange-400 hover:underline text-left cursor-pointer"
        title="Vai al dossier di questa squadra"
      >
        {entry.opponentName}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Precedenti H2H vs Squadra Utente */}
      <div className="fm-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-400">
            <Swords className="w-4 h-4" />
            Precedenti &amp; Sfide Dirette vs {userTeam.name}
          </div>
          {metrics.h2hGames.length > 0 && (
            <span className="text-[11px] font-bold text-slate-300 tabular-nums">
              Tu: {metrics.h2hLosses}V · {team.shortName}: {metrics.h2hWins}V
            </span>
          )}
        </div>

        {metrics.h2hGames.length === 0 ? (
          <div className="text-xs text-slate-400 py-2">
            Nessuno scontro in calendario nella stessa divisione di Regular Season.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {metrics.h2hGames.map((entry) => (
              <div
                key={entry.game.id}
                className="p-3 rounded-xl bg-slate-950/75 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400">
                    Giornata {entry.game.round} · {formatItalianDate(entry.date)}
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {entry.isHome
                      ? `${team.shortName} vs ${userTeam.shortName}`
                      : `${userTeam.shortName} vs ${team.shortName}`}
                  </div>
                </div>

                {entry.game.played ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-black tabular-nums ${
                        entry.won
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {entry.teamScore} - {entry.oppScore}
                    </span>
                    {entry.game.summary && (
                      <button
                        type="button"
                        onClick={() => onOpenBoxScore(entry.game.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        Tabellino
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 shrink-0">
                    In programma
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Ultimi Risultati + Prossime Partite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="fm-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            <Trophy className="w-4 h-4" />
            Ultimi Risultati ({metrics.recentGames.length})
          </div>

          {metrics.recentGames.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center">
              Nessuna partita ancora disputata in campionato.
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.recentGames.map((entry) => (
                <div
                  key={entry.game.id}
                  className="px-3 py-2.5 rounded-xl bg-slate-950/75 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                        entry.won
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {entry.won ? 'V' : 'P'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span>G{entry.game.round}</span>
                        <span>•</span>
                        <span>{entry.isHome ? 'Casa' : 'Trasferta'}</span>
                        <span>•</span>
                        <span>{formatItalianDate(entry.date)}</span>
                      </div>
                      <div className="truncate">{renderOpponentLabel(entry)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-white tabular-nums">
                      {entry.teamScore}-{entry.oppScore}
                    </span>
                    {entry.game.summary && (
                      <button
                        type="button"
                        onClick={() => onOpenBoxScore(entry.game.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                        title="Apri tabellino partita"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fm-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
            <Calendar className="w-4 h-4" />
            Prossime Partite ({metrics.upcomingGames.length})
          </div>

          {metrics.upcomingGames.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center">
              Regular Season completata.
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.upcomingGames.map((entry) => (
                <div
                  key={entry.game.id}
                  className="px-3 py-2.5 rounded-xl bg-slate-950/75 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.opponentColor }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span>Giornata {entry.game.round}</span>
                        <span>•</span>
                        <span>{formatItalianDate(entry.date)}</span>
                      </div>
                      <div className="truncate">{renderOpponentLabel(entry)}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      entry.isHome
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {entry.isHome ? 'Casa' : 'Trasferta'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
