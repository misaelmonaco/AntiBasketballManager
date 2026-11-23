import React from 'react';
import { getLeagueConfig } from '../../data/teams';
import { filterRealCareerHistory } from '../../engine/careerStatsUtils';
import { Player, Team } from '../../types';

interface PlayerStatsTabProps {
  player: Player;
  seasonYear: number;
  ownerTeam: Team | null;
}

export const PlayerStatsTab: React.FC<PlayerStatsTabProps> = ({
  player,
  seasonYear,
  ownerTeam,
}) => {
  const gp = player.seasonStats.gamesPlayed;
  const divGp = Math.max(1, gp);
  const fgPct =
    player.seasonStats.fga > 0
      ? ((player.seasonStats.fgm / player.seasonStats.fga) * 100).toFixed(1)
      : '0.0';
  const tpPct =
    player.seasonStats.tpa > 0
      ? ((player.seasonStats.tpm / player.seasonStats.tpa) * 100).toFixed(1)
      : '0.0';
  const ftPct =
    player.seasonStats.fta > 0
      ? ((player.seasonStats.ftm / player.seasonStats.fta) * 100).toFixed(1)
      : '0.0';

  const realHistory = filterRealCareerHistory(player.careerHistory);
  const currentLeagueName = ownerTeam
    ? getLeagueConfig(ownerTeam.leagueId).name
    : '-';

  return (
    <div className="space-y-6">
      {/* Season Averages */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">
          Medie Stagionali {seasonYear}/{seasonYear + 1}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center">
            <thead className="bg-slate-950/80 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-2">GP</th>
                <th className="py-2.5 px-2">GS</th>
                <th className="py-2.5 px-2">MIN</th>
                <th className="py-2.5 px-2 text-orange-400">PTS</th>
                <th className="py-2.5 px-2">REB</th>
                <th className="py-2.5 px-2">OREB</th>
                <th className="py-2.5 px-2">DREB</th>
                <th className="py-2.5 px-2">AST</th>
                <th className="py-2.5 px-2">STL</th>
                <th className="py-2.5 px-2">BLK</th>
                <th className="py-2.5 px-2">TO</th>
                <th className="py-2.5 px-2">FG%</th>
                <th className="py-2.5 px-2">3P%</th>
                <th className="py-2.5 px-2">FT%</th>
                <th className="py-2.5 px-2 text-emerald-400">PIR</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-slate-100">
                <td className="py-3 px-2">{gp}</td>
                <td className="py-3 px-2">{player.seasonStats.gamesStarted ?? 0}</td>
                <td className="py-3 px-2">{(player.seasonStats.minutes / divGp).toFixed(1)}</td>
                <td className="py-3 px-2 text-orange-400">
                  {(player.seasonStats.points / divGp).toFixed(1)}
                </td>
                <td className="py-3 px-2">{(player.seasonStats.rebounds / divGp).toFixed(1)}</td>
                <td className="py-3 px-2">{((player.seasonStats.oreb ?? 0) / divGp).toFixed(1)}</td>
                <td className="py-3 px-2">{((player.seasonStats.dreb ?? 0) / divGp).toFixed(1)}</td>
                <td className="py-3 px-2">{(player.seasonStats.assists / divGp).toFixed(1)}</td>
                <td className="py-3 px-2">{(player.seasonStats.steals / divGp).toFixed(1)}</td>
                <td className="py-3 px-2">{(player.seasonStats.blocks / divGp).toFixed(1)}</td>
                <td className="py-3 px-2">{(player.seasonStats.turnovers / divGp).toFixed(1)}</td>
                <td className="py-3 px-2">{fgPct}%</td>
                <td className="py-3 px-2">{tpPct}%</td>
                <td className="py-3 px-2">{ftPct}%</td>
                <td className="py-3 px-2 text-emerald-400">
                  {(player.seasonStats.pir / divGp).toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Game Log (Last 10 Games) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">
          Game Log (Ultime 10 Partite)
        </h3>
        {(player.gameLog ?? []).length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Nessuna partita disputata finora in questa stagione.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center">
              <thead className="bg-slate-950/80 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2 text-left">Giornata</th>
                  <th className="py-2 px-2 text-left">Avversario</th>
                  <th className="py-2 px-2">Risultato</th>
                  <th className="py-2 px-2">MIN</th>
                  <th className="py-2 px-2 text-orange-400">PTS</th>
                  <th className="py-2 px-2">REB</th>
                  <th className="py-2 px-2">AST</th>
                  <th className="py-2 px-2">STL</th>
                  <th className="py-2 px-2">BLK</th>
                  <th className="py-2 px-2">TO</th>
                  <th className="py-2 px-2">FG</th>
                  <th className="py-2 px-2">3P</th>
                  <th className="py-2 px-2 text-emerald-400">PIR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {player.gameLog.slice(0, 10).map((g) => (
                  <tr key={g.gameId} className="hover:bg-slate-800/40">
                    <td className="py-2 px-2 text-left text-slate-400">G{g.round}</td>
                    <td className="py-2 px-2 text-left font-bold text-slate-200">
                      {g.isHome ? 'vs' : '@'} {g.opponentShort}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                          g.won
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-red-500/15 text-red-300'
                        }`}
                      >
                        {g.won ? 'V' : 'P'} {g.teamScore}-{g.oppScore}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-300">{g.minutes}</td>
                    <td className="py-2 px-2 font-bold text-orange-400">{g.points}</td>
                    <td className="py-2 px-2">{g.rebounds}</td>
                    <td className="py-2 px-2">{g.assists}</td>
                    <td className="py-2 px-2">{g.steals}</td>
                    <td className="py-2 px-2">{g.blocks}</td>
                    <td className="py-2 px-2 text-slate-400">{g.turnovers}</td>
                    <td className="py-2 px-2 text-slate-300">
                      {g.fgm}/{g.fga}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {g.tpm}/{g.tpa}
                    </td>
                    <td className="py-2 px-2 font-bold text-emerald-400">{g.pir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Career History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Storico Carriera</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Stagione</th>
                <th className="py-2 px-3">Squadra</th>
                <th className="py-2 px-3">Lega</th>
                <th className="py-2 px-2 text-center">GP</th>
                <th className="py-2 px-2 text-center">PPG</th>
                <th className="py-2 px-2 text-center">RPG</th>
                <th className="py-2 px-2 text-center">APG</th>
                <th className="py-2 px-2 text-center">PIR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="bg-orange-500/5 font-bold text-slate-100">
                <td className="py-2.5 px-3">
                  {seasonYear}/{(seasonYear + 1).toString().slice(2)}
                </td>
                <td className="py-2.5 px-3">
                  {ownerTeam ? ownerTeam.name : 'Svincolato'}
                </td>
                <td className="py-2.5 px-3">{currentLeagueName}</td>
                <td className="py-2.5 px-2 text-center">{gp}</td>
                <td className="py-2.5 px-2 text-center">
                  {gp > 0 ? (player.seasonStats.points / divGp).toFixed(1) : '-'}
                </td>
                <td className="py-2.5 px-2 text-center">
                  {gp > 0 ? (player.seasonStats.rebounds / divGp).toFixed(1) : '-'}
                </td>
                <td className="py-2.5 px-2 text-center">
                  {gp > 0 ? (player.seasonStats.assists / divGp).toFixed(1) : '-'}
                </td>
                <td className="py-2.5 px-2 text-center text-emerald-400">
                  {gp > 0 ? (player.seasonStats.pir / divGp).toFixed(1) : '-'}
                </td>
              </tr>
              {realHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-3 px-3 text-center text-slate-500 italic">
                    Nessuna stagione precedente simulata.
                  </td>
                </tr>
              ) : (
                realHistory.map((h, i) => (
                  <tr key={`${h.seasonLabel}-${i}`} className="text-slate-300">
                    <td className="py-2 px-3">{h.seasonLabel}</td>
                    <td className="py-2 px-3">{h.teamName}</td>
                    <td className="py-2 px-3">{h.league}</td>
                    <td className="py-2 px-2 text-center">{h.gamesPlayed}</td>
                    <td className="py-2 px-2 text-center">{h.ppg.toFixed(1)}</td>
                    <td className="py-2 px-2 text-center">{h.rpg.toFixed(1)}</td>
                    <td className="py-2 px-2 text-center">{h.apg.toFixed(1)}</td>
                    <td className="py-2 px-2 text-center">{h.pir.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
