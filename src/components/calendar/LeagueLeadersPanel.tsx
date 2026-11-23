import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Team } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';

export type LeaderCategory = 'ppg' | 'rpg' | 'apg' | 'pir';

interface LeagueLeadersPanelProps {
  teams: Team[];
  userTeamId: string;
  leaderCat: LeaderCategory;
  onSelectCategory: (cat: LeaderCategory) => void;
  onOpenPlayerProfile: (playerId: string) => void;
}

export const LeagueLeadersPanel: React.FC<LeagueLeadersPanelProps> = ({
  teams,
  userTeamId,
  leaderCat,
  onSelectCategory,
  onOpenPlayerProfile,
}) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 fm-card rounded-2xl p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        <BarChart3 className="w-4 h-4 text-orange-400" />
        Classifiche Statistiche Lega (Top 15)
      </div>
      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
        {(
          [
            ['ppg', 'Top Scorer (PPG)'],
            ['rpg', 'Rimbalzisti (RPG)'],
            ['apg', 'Assistman (APG)'],
            ['pir', 'MVP / Valutazione (PIR)'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => onSelectCategory(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              leaderCat === id
                ? 'bg-orange-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    <div className="fm-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="fm-table-head">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-3">Giocatore</th>
              <th className="py-3 px-3">Squadra</th>
              <th className="py-3 px-2 text-center">GP</th>
              <th className="py-3 px-2 text-center">PPG</th>
              <th className="py-3 px-2 text-center">RPG</th>
              <th className="py-3 px-2 text-center">APG</th>
              <th className="py-3 px-3 text-center">PIR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {teams
              .flatMap((t) => t.roster.map((p) => ({ player: p, team: t })))
              .filter(({ player }) => player.seasonStats.gamesPlayed > 0)
              .map(({ player, team }) => {
                const gp = player.seasonStats.gamesPlayed;
                return {
                  player,
                  team,
                  gp,
                  ppg: player.seasonStats.points / gp,
                  rpg: player.seasonStats.rebounds / gp,
                  apg: player.seasonStats.assists / gp,
                  pir: player.seasonStats.pir / gp,
                };
              })
              .sort((a, b) => b[leaderCat] - a[leaderCat])
              .slice(0, 15)
              .map((row, idx) => (
                <tr
                  key={row.player.id}
                  className={`hover:bg-slate-800/40 ${
                    row.team.id === userTeamId ? 'bg-orange-500/5' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <CountryFlag nationality={row.player.nationality} size="sm" />
                      <button
                        onClick={() => onOpenPlayerProfile(row.player.id)}
                        className="font-bold text-white hover:text-orange-400 hover:underline cursor-pointer text-left"
                      >
                        {row.player.firstName} {row.player.lastName}
                      </button>
                      <FormationBadge isItalianFormation={row.player.isItalianFormation} />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-medium">{row.team.shortName}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.gp}</td>
                  <td
                    className={`py-2.5 px-2 text-center ${
                      leaderCat === 'ppg' ? 'font-extrabold text-orange-400' : 'text-slate-200'
                    }`}
                  >
                    {row.ppg.toFixed(1)}
                  </td>
                  <td
                    className={`py-2.5 px-2 text-center ${
                      leaderCat === 'rpg' ? 'font-extrabold text-orange-400' : 'text-slate-200'
                    }`}
                  >
                    {row.rpg.toFixed(1)}
                  </td>
                  <td
                    className={`py-2.5 px-2 text-center ${
                      leaderCat === 'apg' ? 'font-extrabold text-orange-400' : 'text-slate-200'
                    }`}
                  >
                    {row.apg.toFixed(1)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-center ${
                      leaderCat === 'pir' ? 'font-extrabold text-orange-400' : 'text-slate-200'
                    }`}
                  >
                    {row.pir.toFixed(1)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
