import React, { useMemo, useState } from 'react';
import { CompactScoringPlay, PlayByPlayEvent } from '../../types';

interface ScoringPlayTimelineProps {
  plays: CompactScoringPlay[];
  homeShort: string;
  awayShort: string;
  compact?: boolean;
}

export function formatPlayClock(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function eventsToCompactScoringPlays(
  events: PlayByPlayEvent[],
  homeTeamId: string
): CompactScoringPlay[] {
  return events
    .filter((ev) => ev.pointsScored !== undefined && ev.scorerName)
    .map((ev) => ({
      q: ev.quarter,
      clock: ev.clockRemaining,
      side: ev.teamId === homeTeamId ? ('home' as const) : ('away' as const),
      pts: ev.pointsScored!,
      scorer: ev.scorerName!,
      hs: ev.homeScore,
      as: ev.awayScore,
    }));
}

function getQuarterBadgeLabel(q: number): string {
  return q <= 4 ? `Q${q}` : `OT${q - 4}`;
}

function getQuarterHeadingLabel(q: number): string {
  return q <= 4 ? `${q}° Quarto` : `${q - 4}° Supplementare`;
}

export const ScoringPlayTimeline: React.FC<ScoringPlayTimelineProps> = ({
  plays,
  homeShort,
  awayShort,
  compact = false,
}) => {
  const [quarterFilter, setQuarterFilter] = useState<number | 'ALL'>('ALL');

  const quarters = useMemo(() => {
    const set = new Set<number>();
    for (const p of plays) set.add(p.q);
    return Array.from(set).sort((a, b) => a - b);
  }, [plays]);

  const visiblePlays = useMemo(() => {
    if (quarterFilter === 'ALL') return plays;
    return plays.filter((p) => p.q === quarterFilter);
  }, [plays, quarterFilter]);

  if (plays.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-500">
        Nessun canestro registrato finora.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Header squadre e filtro quarto */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 text-[11px] shrink-0">
        <div className="flex items-center gap-2 font-bold">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
            Casa: {homeShort}
          </span>
          <span className="text-slate-600">↔</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
            Ospite: {awayShort}
          </span>
        </div>

        {quarters.length > 1 && (
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setQuarterFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                quarterFilter === 'ALL'
                  ? 'bg-orange-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tutti
            </button>
            {quarters.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuarterFilter(q)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  quarterFilter === q
                    ? 'bg-orange-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {getQuarterBadgeLabel(q)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista eventi cronologici */}
      <div
        className={`flex-1 overflow-y-auto bg-slate-950/90 rounded-b-xl divide-y divide-slate-800/60 ${
          compact ? 'mt-1.5' : 'mt-2 border border-slate-800/80 rounded-xl'
        }`}
      >
        {visiblePlays.map((play, idx) => {
          const prevQuarter = idx > 0 ? visiblePlays[idx - 1].q : null;
          const showQuarterDivider =
            quarterFilter === 'ALL' && (idx === 0 || prevQuarter !== play.q);

          return (
            <React.Fragment key={`${play.q}-${play.clock}-${play.hs}-${play.as}-${idx}`}>
              {showQuarterDivider && (
                <div className="px-3 py-1 bg-slate-900/90 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-center">
                  {getQuarterHeadingLabel(play.q)}
                </div>
              )}

              <div
                className={`px-3 ${
                  compact ? 'py-1.5 text-xs' : 'py-2 text-xs sm:text-[13px]'
                } flex items-center hover:bg-slate-900/60 transition-colors ${
                  play.side === 'home' ? 'justify-start' : 'justify-end'
                }`}
              >
                {play.side === 'home' ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-semibold text-slate-300 w-9 shrink-0 tabular-nums">
                      {formatPlayClock(play.clock)}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-extrabold text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                      {play.pts}
                    </span>
                    <span className="font-mono font-extrabold text-white whitespace-nowrap tabular-nums">
                      {play.hs} - {play.as}
                    </span>
                    <span className="text-slate-400 font-medium truncate">
                      {play.scorer}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-slate-400 font-medium truncate text-right">
                      {play.scorer}
                    </span>
                    <span className="font-mono font-extrabold text-white whitespace-nowrap tabular-nums">
                      {play.hs} - {play.as}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-extrabold text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                      {play.pts}
                    </span>
                    <span className="font-mono font-semibold text-slate-300 w-9 text-right shrink-0 tabular-nums">
                      {formatPlayClock(play.clock)}
                    </span>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
