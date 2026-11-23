import React from 'react';
import { BarChart3, Calendar, ChevronLeft, ChevronRight, FastForward } from 'lucide-react';
import {
  formatItalianDate,
  formatItalianMonthYear,
  getMonthCalendarCells,
} from '../../engine/calendarUtils';
import { SeasonPhase } from '../../types';
import { FastSimTarget } from '../../store/gameStore';

export interface CalendarGameBadge {
  gameId: string;
  round: number;
  oppShort: string;
  isHome: boolean;
  played: boolean;
  score?: string;
}

export interface MonthScheduledGame {
  id: string;
  date: string;
  round: number;
  homeName: string;
  awayName: string;
  homeShort: string;
  awayShort: string;
  isUserGame: boolean;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
}

interface MonthlyCalendarPanelProps {
  calYear: number;
  calMonth: number;
  currentDate: string;
  phase: SeasonPhase;
  userGameByDate: Map<string, CalendarGameBadge>;
  gamesByDate: Map<string, MonthScheduledGame[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onRequestFastSim: (target: FastSimTarget) => void;
  onSelectPlayedGame?: (gameId: string) => void;
}

export const MonthlyCalendarPanel: React.FC<MonthlyCalendarPanelProps> = ({
  calYear,
  calMonth,
  currentDate,
  phase,
  userGameByDate,
  gamesByDate,
  onPrevMonth,
  onNextMonth,
  onRequestFastSim,
  onSelectPlayedGame,
}) => {
  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-`;
  const monthDates = Array.from(gamesByDate.keys())
    .filter((d) => d.startsWith(monthPrefix))
    .sort();

  return (
  <div className="space-y-4">
    <div className="flex items-center justify-between fm-card rounded-2xl p-3.5">
      <button
        onClick={onPrevMonth}
        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        <Calendar className="w-4 h-4 text-orange-400" />
        {formatItalianMonthYear(calYear, calMonth)}
        <span className="text-xs font-normal text-slate-400 ml-2 hidden sm:inline">
          (Clicca una data futura per simulare fino a quel giorno)
        </span>
      </div>
      <button
        onClick={onNextMonth}
        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>

    <div className="fm-card rounded-2xl p-4">
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {getMonthCalendarCells(calYear, calMonth).map((cellDate, idx) => {
          if (!cellDate) {
            return <div key={`empty_${idx}`} className="h-20 rounded-xl bg-slate-950/30" />;
          }
          const dayNum = Number(cellDate.split('-')[2]);
          const isToday = cellDate === currentDate;
          const isFuture = cellDate > currentDate;
          const gameInfo = userGameByDate.get(cellDate);
          const dayGames = gamesByDate.get(cellDate) ?? [];
          const otherGamesCount = dayGames.length - (gameInfo ? 1 : 0);

          const canFastSim = isFuture && phase !== 'finished';
          const canOpenBox = Boolean(gameInfo?.played && onSelectPlayedGame);

          return (
            <button
              key={cellDate}
              disabled={!canFastSim && !canOpenBox}
              onClick={() => {
                if (canFastSim) {
                  onRequestFastSim({
                    type: 'until_date',
                    targetDate: cellDate,
                    label: `Simula fino al ${formatItalianDate(cellDate)}`,
                  });
                } else if (canOpenBox && gameInfo) {
                  onSelectPlayedGame?.(gameInfo.gameId);
                }
              }}
              className={`h-20 p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                isToday
                  ? 'bg-orange-500/20 border-orange-500 text-white'
                  : canFastSim
                  ? 'bg-slate-950/80 border-slate-800 hover:border-sky-500/60 hover:bg-slate-800/70 cursor-pointer group'
                  : canOpenBox
                  ? 'bg-slate-950/70 border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-800/70 cursor-pointer group'
                  : 'bg-slate-950/40 border-slate-800/50 text-slate-500 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-bold ${
                    isToday ? 'text-orange-300' : isFuture ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {dayNum}
                </span>
                {isToday && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-500 text-slate-950">
                    Oggi
                  </span>
                )}
                {isFuture && phase !== 'finished' && (
                  <FastForward className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              {gameInfo ? (
                <div
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate ${
                    gameInfo.played
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-orange-500/15 border border-orange-500/30 text-orange-300'
                  }`}
                >
                  {gameInfo.isHome ? 'vs ' : '@ '}
                  {gameInfo.oppShort}
                  {gameInfo.score ? ` (${gameInfo.score})` : ''}
                </div>
              ) : otherGamesCount > 0 ? (
                <div className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 truncate">
                  {otherGamesCount} {otherGamesCount === 1 ? 'gara' : 'gare'}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>

    {/* Tutte le partite schedulate nel mese selezionato */}
    <div className="fm-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">
          Partite schedulate — {formatItalianMonthYear(calYear, calMonth)}
        </h3>
        <span className="text-xs text-slate-400">
          {monthDates.reduce((sum, d) => sum + (gamesByDate.get(d)?.length ?? 0), 0)} gare in questo mese
        </span>
      </div>

      {monthDates.length === 0 ? (
        <div className="text-xs text-slate-500 py-4 text-center">
          Nessuna partita di campionato schedulata in questo mese.
        </div>
      ) : (
        <div className="space-y-3">
          {monthDates.map((d) => {
            const games = gamesByDate.get(d) ?? [];
            const roundNum = games[0]?.round;
            return (
              <div key={d} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-orange-300">
                    {formatItalianDate(d)} {roundNum ? `• Giornata ${roundNum}` : ''}
                  </span>
                  <span className="text-[11px] text-slate-400">{games.length} partite</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {games.map((g) => (
                    <button
                      type="button"
                      key={g.id}
                      disabled={!g.played || !onSelectPlayedGame}
                      onClick={() => g.played && onSelectPlayedGame?.(g.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border text-left transition-colors ${
                        g.isUserGame
                          ? 'bg-orange-500/10 border-orange-500/40 text-white font-bold'
                          : 'bg-slate-900/70 border-slate-800/70 text-slate-300'
                      } ${
                        g.played && onSelectPlayedGame
                          ? 'hover:border-emerald-500/60 hover:bg-slate-800/80 cursor-pointer'
                          : 'cursor-default'
                      }`}
                    >
                      <span className="truncate flex-1">
                        {g.homeName} <span className="text-slate-500">vs</span> {g.awayName}
                      </span>
                      <span className="ml-2 shrink-0 font-mono text-[11px] flex items-center gap-1.5">
                        {g.played ? (
                          <>
                            <span className="text-emerald-400 font-bold">
                              {g.homeScore}-{g.awayScore}
                            </span>
                            {onSelectPlayedGame && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                                <BarChart3 className="w-3 h-3 text-orange-400" />
                                Tabellino
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500">Sched.</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
  );
};
