import React from 'react';
import { MatchTeamState } from '../../types';
import { MatchBoxScoreRow } from './MatchBoxScoreRow';
import { computeTeamTotals } from './MatchTeamShootingCard';

interface MatchBoxScoreTableProps {
  home: MatchTeamState;
  away: MatchTeamState;
  boxTab: 'home' | 'away';
  onChangeTab: (tab: 'home' | 'away') => void;
}

export const MatchBoxScoreTable: React.FC<MatchBoxScoreTableProps> = ({
  home,
  away,
  boxTab,
  onChangeTab,
}) => {
  const activeBoxTeam = boxTab === 'home' ? home : away;
  const activeBoxTotals = computeTeamTotals(activeBoxTeam);

  return (
    <div className="h-[44%] min-h-[185px] max-h-[260px] shrink-0 fm-card rounded-2xl flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeTab('home')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
              boxTab === 'home' ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {home.name} ({home.score})
          </button>
          <button
            type="button"
            onClick={() => onChangeTab('away')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
              boxTab === 'away' ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {away.name} ({away.score})
          </button>
        </div>
        <span className="text-[11px] text-slate-400">
          Parziali: {activeBoxTeam.quarterScores.join(' - ')}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[620px] text-[11px] text-left whitespace-nowrap border-collapse">
          <thead className="bg-slate-950 text-slate-400 uppercase sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="py-2 px-2.5 sticky left-0 z-20 bg-slate-950">Giocatore</th>
              <th className="py-2 px-2 text-center">MIN</th>
              <th className="py-2 px-2 text-center font-bold text-white">PTS</th>
              <th className="py-2 px-2 text-center">REB</th>
              <th className="py-2 px-2 text-center">AST</th>
              <th className="py-2 px-2 text-center">STL</th>
              <th className="py-2 px-2 text-center">BLK</th>
              <th className="py-2 px-2 text-center">TO</th>
              <th className="py-2 px-2 text-center">FG%</th>
              <th className="py-2 px-2 text-center">3P%</th>
              <th className="py-2 px-2 text-center">FT%</th>
              <th className="py-2 px-2 text-center">PF</th>
              <th className="py-2 px-2.5 text-center text-orange-400">PIR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {activeBoxTeam.players.map((p) => (
              <MatchBoxScoreRow key={p.playerId} p={p} />
            ))}
          </tbody>
          <tfoot className="bg-slate-950 border-t-2 border-slate-700/80 font-extrabold text-slate-100 sticky bottom-0 z-10 tabular-nums">
            <tr>
              <td className="py-1.5 px-2.5 text-[10px] uppercase tracking-wider text-orange-400 sticky left-0 z-20 bg-slate-950">
                Totale Squadra
              </td>
              <td className="py-1.5 px-2 text-center text-slate-400">
                {Math.floor(activeBoxTotals.secondsPlayed / 60)}
              </td>
              <td className="py-1.5 px-2 text-center text-white">{activeBoxTotals.points}</td>
              <td className="py-1.5 px-2 text-center text-slate-200">{activeBoxTotals.rebounds}</td>
              <td className="py-1.5 px-2 text-center text-slate-200">{activeBoxTotals.assists}</td>
              <td className="py-1.5 px-2 text-center text-slate-200">{activeBoxTotals.steals}</td>
              <td className="py-1.5 px-2 text-center text-slate-200">{activeBoxTotals.blocks}</td>
              <td className="py-1.5 px-2 text-center text-slate-300">{activeBoxTotals.turnovers}</td>
              <td className="py-1.5 px-2 text-center text-slate-100">
                {activeBoxTotals.fga > 0
                  ? `${activeBoxTotals.fgm}/${activeBoxTotals.fga} (${activeBoxTotals.fgPct}%)`
                  : '-'}
              </td>
              <td className="py-1.5 px-2 text-center text-slate-100">
                {activeBoxTotals.tpa > 0
                  ? `${activeBoxTotals.tpm}/${activeBoxTotals.tpa} (${activeBoxTotals.threePct}%)`
                  : '-'}
              </td>
              <td className="py-1.5 px-2 text-center text-slate-100">
                {activeBoxTotals.fta > 0
                  ? `${activeBoxTotals.ftm}/${activeBoxTotals.fta} (${activeBoxTotals.ftPct}%)`
                  : '-'}
              </td>
              <td className="py-1.5 px-2 text-center text-slate-300">{activeBoxTotals.fouls}</td>
              <td className="py-1.5 px-2.5 text-center text-orange-400">{activeBoxTotals.pir}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
