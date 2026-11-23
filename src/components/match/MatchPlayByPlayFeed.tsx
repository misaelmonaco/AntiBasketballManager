import React, { useState } from 'react';
import { formatClock } from '../../engine/ratings';
import { PlayByPlayEvent } from '../../types';
import {
  eventsToCompactScoringPlays,
  ScoringPlayTimeline,
} from './ScoringPlayTimeline';

interface MatchPlayByPlayFeedProps {
  events: PlayByPlayEvent[];
  homeTeamId: string;
  homeShort: string;
  awayShort: string;
}

export const MatchPlayByPlayFeed: React.FC<MatchPlayByPlayFeedProps> = ({
  events,
  homeTeamId,
  homeShort,
  awayShort,
}) => {
  const [mode, setMode] = useState<'scoring' | 'full'>('scoring');
  const scoringPlays = eventsToCompactScoringPlays(events, homeTeamId);

  return (
    <div className="flex-1 min-h-[200px] fm-card rounded-2xl p-3 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Play-by-Play {mode === 'scoring' ? 'Marcatori' : 'Cronaca Completa'}
        </div>
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setMode('scoring')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              mode === 'scoring'
                ? 'bg-orange-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Marcatori ({scoringPlays.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('full')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              mode === 'full'
                ? 'bg-orange-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cronaca
          </button>
        </div>
      </div>

      {mode === 'scoring' ? (
        <ScoringPlayTimeline
          plays={scoringPlays}
          homeShort={homeShort}
          awayShort={awayShort}
          compact
        />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
          {events.map((ev) => (
            <div
              key={ev.id}
              className={`p-2.5 rounded-xl text-xs border ${
                ev.type === 'score3' || ev.type === 'score2'
                  ? 'bg-slate-950/90 border-orange-500/30 text-slate-100'
                  : ev.type === 'timeout' || ev.type === 'period'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 font-semibold'
                  : 'bg-slate-950/50 border-slate-800/70 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span>
                  Q{ev.quarter} • {formatClock(ev.clockRemaining)}
                </span>
                <span className="font-bold text-slate-400">
                  {ev.homeScore} - {ev.awayScore}
                </span>
              </div>
              <div>{ev.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
