import React from 'react';
import {
  computePlayerCareerSummary,
  computePlayerSeasonHighs,
  getHistoryEntryAverages,
} from '../../engine/careerStatsUtils';
import { Player, Team } from '../../types';

interface PlayerCareerStatsTableProps {
  player: Player;
  seasonYear: number;
  ownerTeam: Team | null;
}

function fmtAvg(val: number | null): string {
  return val === null ? '-' : val.toFixed(1);
}

function fmtPct(val: number | null): string {
  return val === null ? '-' : `${val}%`;
}

function fmtInt(val: number | null): string {
  return val === null ? '-' : String(val);
}

export const PlayerCareerStatsTable: React.FC<PlayerCareerStatsTableProps> = ({
  player,
  seasonYear,
  ownerTeam,
}) => {
  const s = player.seasonStats;
  const gp = s.gamesPlayed;
  const hasCurrentGames = gp > 0;

  const curFgPct = hasCurrentGames && s.fga > 0 ? Math.round((s.fgm / s.fga) * 100) : null;
  const curTpPct = hasCurrentGames && s.tpa > 0 ? Math.round((s.tpm / s.tpa) * 100) : null;
  const curFtPct = hasCurrentGames && s.fta > 0 ? Math.round((s.ftm / s.fta) * 100) : null;

  const summary = computePlayerCareerSummary(player.seasonStats, player.careerHistory);
  const highs = computePlayerSeasonHighs(player.gameLog);

  return (
    <div className="bg-slate-900/90 border border-red-900/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
          Statistiche Stagione & Storico Carriera
        </h3>
        <span className="text-[11px] text-slate-400">
          Medie per partita (Solo partite simulate)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-center border-collapse">
          <thead className="bg-slate-950 text-slate-400 uppercase border-y border-slate-800">
            <tr>
              <th className="py-2 px-2 text-left">Anno</th>
              <th className="py-2 px-2 text-left">Squadra</th>
              <th className="py-2 px-1.5">PG (GS)</th>
              <th className="py-2 px-1.5 text-orange-400">Pts</th>
              <th className="py-2 px-1.5">Min</th>
              <th className="py-2 px-1.5">DR</th>
              <th className="py-2 px-1.5">OR</th>
              <th className="py-2 px-1.5">R</th>
              <th className="py-2 px-1.5">A</th>
              <th className="py-2 px-1.5">FG%</th>
              <th className="py-2 px-1.5">3P%</th>
              <th className="py-2 px-1.5">FT%</th>
              <th className="py-2 px-1.5">ST</th>
              <th className="py-2 px-1.5">TO</th>
              <th className="py-2 px-1.5">B</th>
              <th className="py-2 px-1.5 text-emerald-400">PIR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {/* Stagione Corrente */}
            <tr className="bg-slate-950/40 font-semibold text-slate-100">
              <td className="py-2 px-2 text-left text-orange-300">
                {seasonYear}/{String(seasonYear + 1).slice(-2)}
              </td>
              <td className="py-2 px-2 text-left">
                {ownerTeam ? ownerTeam.name : 'Free Agent'}
              </td>
              <td className="py-2 px-1.5">
                {gp} ({s.gamesStarted ?? 0})
              </td>
              <td className="py-2 px-1.5 text-orange-400 font-bold">
                {hasCurrentGames ? (s.points / gp).toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1.5">
                {hasCurrentGames ? (s.minutes / gp).toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1.5">
                {hasCurrentGames ? ((s.dreb ?? 0) / gp).toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1.5">
                {hasCurrentGames ? ((s.oreb ?? 0) / gp).toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1.5">
                {hasCurrentGames ? (s.rebounds / gp).toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1.5">
                {hasCurrentGames ? (s.assists / gp).toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1.5">{fmtPct(curFgPct)}</td>
              <td className="py-2 px-1.5">{fmtPct(curTpPct)}</td>
              <td className="py-2 px-1.5">{fmtPct(curFtPct)}</td>
              <td className="py-2 px-1.5">
                {hasCurrentGames ? (s.steals / gp).toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1.5">
                {hasCurrentGames ? (s.turnovers / gp).toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1.5">
                {hasCurrentGames ? (s.blocks / gp).toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1.5 text-emerald-400 font-bold">
                {hasCurrentGames ? (s.pir / gp).toFixed(1) : '-'}
              </td>
            </tr>

            {/* Stagioni Precedenti Simulate */}
            {summary.history.length === 0 ? (
              <tr>
                <td
                  colSpan={16}
                  className="py-2.5 px-2 text-center text-[11px] text-slate-500 italic"
                >
                  Nessuna stagione precedente simulata — lo storico si aggiorna al termine di ogni stagione.
                </td>
              </tr>
            ) : (
              summary.history.map((h, idx) => {
                const row = getHistoryEntryAverages(h);
                return (
                  <tr key={`${h.seasonLabel}-${h.teamName}-${idx}`} className="text-slate-300">
                    <td className="py-1.5 px-2 text-left">{h.seasonLabel}</td>
                    <td className="py-1.5 px-2 text-left">
                      <span>{h.teamName}</span>
                      {h.league && h.league !== '-' && h.league !== 'Campionato' && (
                        <span className="ml-1.5 text-[10px] text-slate-500">
                          ({h.league})
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-1.5">
                      {row.gs !== null ? `${row.gp} (${row.gs})` : row.gp}
                    </td>
                    <td className="py-1.5 px-1.5 text-orange-300">{fmtAvg(row.ppg)}</td>
                    <td className="py-1.5 px-1.5">{fmtAvg(row.mpg)}</td>
                    <td className="py-1.5 px-1.5">{fmtAvg(row.drpg)}</td>
                    <td className="py-1.5 px-1.5">{fmtAvg(row.orpg)}</td>
                    <td className="py-1.5 px-1.5">{fmtAvg(row.rpg)}</td>
                    <td className="py-1.5 px-1.5">{fmtAvg(row.apg)}</td>
                    <td className="py-1.5 px-1.5">{fmtPct(row.fgPct)}</td>
                    <td className="py-1.5 px-1.5">{fmtPct(row.tpPct)}</td>
                    <td className="py-1.5 px-1.5">{fmtPct(row.ftPct)}</td>
                    <td className="py-1.5 px-1.5">{fmtAvg(row.spg)}</td>
                    <td className="py-1.5 px-1.5">{fmtAvg(row.tpg)}</td>
                    <td className="py-1.5 px-1.5">{fmtAvg(row.bpg)}</td>
                    <td className="py-1.5 px-1.5 text-emerald-400">{fmtAvg(row.pirPg)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-slate-950/90 border-t border-slate-700 text-[11px]">
            <tr className="font-bold text-slate-200">
              <td colSpan={2} className="py-2 px-2 text-left">
                Medie Carriera ({summary.totalPts} pts totali)
              </td>
              <td className="py-2 px-1.5">
                {summary.totalGs !== null
                  ? `${summary.totalGp} (${summary.totalGs})`
                  : summary.totalGp}
              </td>
              <td className="py-2 px-1.5 text-orange-400">{fmtAvg(summary.ppg)}</td>
              <td className="py-2 px-1.5">{fmtAvg(summary.mpg)}</td>
              <td className="py-2 px-1.5">{fmtAvg(summary.drpg)}</td>
              <td className="py-2 px-1.5">{fmtAvg(summary.orpg)}</td>
              <td className="py-2 px-1.5">{fmtAvg(summary.rpg)}</td>
              <td className="py-2 px-1.5">{fmtAvg(summary.apg)}</td>
              <td className="py-2 px-1.5">{fmtPct(summary.fgPct)}</td>
              <td className="py-2 px-1.5">{fmtPct(summary.tpPct)}</td>
              <td className="py-2 px-1.5">{fmtPct(summary.ftPct)}</td>
              <td className="py-2 px-1.5">{fmtAvg(summary.spg)}</td>
              <td className="py-2 px-1.5">{fmtAvg(summary.tpg)}</td>
              <td className="py-2 px-1.5">{fmtAvg(summary.bpg)}</td>
              <td className="py-2 px-1.5 text-emerald-400">{fmtAvg(summary.pirPg)}</td>
            </tr>
            <tr className="text-slate-400">
              <td colSpan={2} className="py-1.5 px-2 text-left">
                Massimi in stagione (Season Highs)
              </td>
              <td className="py-1.5 px-1.5">-</td>
              <td className="py-1.5 px-1.5 text-red-400 font-bold">{fmtInt(highs.points)}</td>
              <td className="py-1.5 px-1.5">{fmtInt(highs.minutes)}</td>
              <td className="py-1.5 px-1.5">{fmtInt(highs.dreb)}</td>
              <td className="py-1.5 px-1.5">{fmtInt(highs.oreb)}</td>
              <td className="py-1.5 px-1.5">{fmtInt(highs.rebounds)}</td>
              <td className="py-1.5 px-1.5">{fmtInt(highs.assists)}</td>
              <td className="py-1.5 px-1.5">{fmtPct(highs.fgPct)}</td>
              <td className="py-1.5 px-1.5">{fmtPct(highs.tpPct)}</td>
              <td className="py-1.5 px-1.5">{fmtPct(highs.ftPct)}</td>
              <td className="py-1.5 px-1.5">{fmtInt(highs.steals)}</td>
              <td className="py-1.5 px-1.5">{fmtInt(highs.turnovers)}</td>
              <td className="py-1.5 px-1.5">{fmtInt(highs.blocks)}</td>
              <td className="py-1.5 px-1.5 text-emerald-300 font-bold">{fmtInt(highs.pir)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
