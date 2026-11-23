import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Player, Team } from '../../types';
import { CountryFlag } from '../CountryFlag';
import { SortableTh, SortDir, nextSortState } from '../SortableHeader';
import { OpponentTeamMetrics } from './opponentAnalytics';

type StatsSortKey =
  | 'name'
  | 'pos'
  | 'gp'
  | 'mpg'
  | 'ppg'
  | 'rpg'
  | 'apg'
  | 'spg'
  | 'bpg'
  | 'tpg'
  | 'fgPct'
  | 'tpPct'
  | 'ftPct'
  | 'pir';

interface OpponentStatsTabProps {
  team: Team;
  metrics: OpponentTeamMetrics;
  onOpenPlayerProfile: (playerId: string) => void;
}

interface PlayerAvgRow {
  player: Player;
  gp: number;
  mpg: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  tpg: number;
  fgPct: number;
  tpPct: number;
  ftPct: number;
  pir: number;
}

function toAvgRow(p: Player): PlayerAvgRow {
  const s = p.seasonStats;
  const gp = s.gamesPlayed;
  const d = Math.max(1, gp);
  return {
    player: p,
    gp,
    mpg: gp > 0 ? s.minutes / d : 0,
    ppg: gp > 0 ? s.points / d : 0,
    rpg: gp > 0 ? s.rebounds / d : 0,
    apg: gp > 0 ? s.assists / d : 0,
    spg: gp > 0 ? s.steals / d : 0,
    bpg: gp > 0 ? s.blocks / d : 0,
    tpg: gp > 0 ? s.turnovers / d : 0,
    fgPct: s.fga > 0 ? (s.fgm / s.fga) * 100 : 0,
    tpPct: s.tpa > 0 ? (s.tpm / s.tpa) * 100 : 0,
    ftPct: s.fta > 0 ? (s.ftm / s.fta) * 100 : 0,
    pir: gp > 0 ? s.pir / d : 0,
  };
}

export const OpponentStatsTab: React.FC<OpponentStatsTabProps> = ({
  team,
  metrics,
  onOpenPlayerProfile,
}) => {
  const [sortKey, setSortKey] = useState<StatsSortKey>('ppg');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: StatsSortKey) => {
    const next = nextSortState(sortKey, sortDir, key, [
      'gp',
      'mpg',
      'ppg',
      'rpg',
      'apg',
      'spg',
      'bpg',
      'tpg',
      'fgPct',
      'tpPct',
      'ftPct',
      'pir',
    ]);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const rows = useMemo(() => {
    const list = team.roster.map(toAvgRow);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = `${a.player.lastName} ${a.player.firstName}`.localeCompare(
          `${b.player.lastName} ${b.player.firstName}`,
          'it'
        );
      } else if (sortKey === 'pos') {
        cmp = a.player.primaryPosition.localeCompare(b.player.primaryPosition);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [team.roster, sortKey, sortDir]);

  const teamCards = [
    { label: 'PTS / Partita', value: metrics.ppgFor.toFixed(1), accent: 'text-orange-400' },
    { label: 'Subiti / Partita', value: metrics.ppgAgainst.toFixed(1), accent: 'text-rose-300' },
    {
      label: 'Diff. Punti',
      value:
        metrics.pointDiffPerGame > 0
          ? `+${metrics.pointDiffPerGame.toFixed(1)}`
          : metrics.pointDiffPerGame.toFixed(1),
      accent: metrics.pointDiffPerGame >= 0 ? 'text-emerald-400' : 'text-rose-400',
    },
    { label: 'FG%', value: `${metrics.teamFgPct.toFixed(1)}%`, accent: 'text-white' },
    { label: '3P%', value: `${metrics.teamThreePct.toFixed(1)}%`, accent: 'text-sky-300' },
    { label: 'FT%', value: `${metrics.teamFtPct.toFixed(1)}%`, accent: 'text-amber-300' },
    { label: 'REB / Partita', value: metrics.teamRpg.toFixed(1), accent: 'text-slate-100' },
    { label: 'AST / Partita', value: metrics.teamApg.toFixed(1), accent: 'text-slate-100' },
    { label: 'STL / BLK', value: `${metrics.teamSpg.toFixed(1)} / ${metrics.teamBpg.toFixed(1)}`, accent: 'text-slate-200' },
    { label: 'Palle Perse', value: metrics.teamTpg.toFixed(1), accent: 'text-slate-300' },
    { label: 'PIR Squadra', value: metrics.teamPirAvg.toFixed(1), accent: 'text-orange-300' },
  ];

  return (
    <div className="space-y-4">
      <div className="fm-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange-400">
            <BarChart3 className="w-4 h-4" />
            Medie di Squadra &amp; Efficienza al Tiro
          </div>
          <span className="text-[11px] text-slate-400">
            Partite giocate: <b className="text-slate-200">{metrics.played}</b>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {teamCards.map((c) => (
            <div
              key={c.label}
              className="p-2.5 rounded-xl bg-slate-950/75 border border-slate-800"
            >
              <div className="text-[10px] text-slate-400 font-semibold">{c.label}</div>
              <div className={`text-base font-black mt-0.5 tabular-nums ${c.accent}`}>
                {c.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fm-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
            Rendimento Individuale (Medie a Partita)
          </span>
          <span className="text-[11px] text-slate-400">Clicca sulle colonne per ordinare</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left">
            <thead className="fm-table-head">
              <tr>
                <SortableTh label="Giocatore" sortKey="name" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-2.5 px-3" />
                <SortableTh label="Ruolo" sortKey="pos" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="GP" sortKey="gp" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="MIN" sortKey="mpg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="PTS" sortKey="ppg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="REB" sortKey="rpg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="AST" sortKey="apg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="STL" sortKey="spg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="BLK" sortKey="bpg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="TO" sortKey="tpg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="FG%" sortKey="fgPct" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="3P%" sortKey="tpPct" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="FT%" sortKey="ftPct" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-1.5" />
                <SortableTh label="PIR" sortKey="pir" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 tabular-nums">
              {rows.map((r) => (
                <tr key={r.player.id} className="hover:bg-slate-800/40 text-slate-200">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <CountryFlag nationality={r.player.nationality} size="sm" />
                      <button
                        type="button"
                        onClick={() => onOpenPlayerProfile(r.player.id)}
                        className="font-bold text-white hover:text-orange-400 hover:underline text-left cursor-pointer"
                      >
                        {r.player.firstName} {r.player.lastName}
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-1.5 text-center font-bold text-slate-400">
                    {r.player.primaryPosition}
                  </td>
                  <td className="py-2 px-1.5 text-center text-slate-300">{r.gp}</td>
                  <td className="py-2 px-1.5 text-center text-slate-300">{r.mpg.toFixed(1)}</td>
                  <td className="py-2 px-1.5 text-center font-extrabold text-white">
                    {r.ppg.toFixed(1)}
                  </td>
                  <td className="py-2 px-1.5 text-center text-slate-200">{r.rpg.toFixed(1)}</td>
                  <td className="py-2 px-1.5 text-center text-slate-200">{r.apg.toFixed(1)}</td>
                  <td className="py-2 px-1.5 text-center text-slate-300">{r.spg.toFixed(1)}</td>
                  <td className="py-2 px-1.5 text-center text-slate-300">{r.bpg.toFixed(1)}</td>
                  <td className="py-2 px-1.5 text-center text-slate-400">{r.tpg.toFixed(1)}</td>
                  <td className="py-2 px-1.5 text-center text-slate-200">
                    {r.player.seasonStats.fga > 0 ? `${r.fgPct.toFixed(0)}%` : '-'}
                  </td>
                  <td className="py-2 px-1.5 text-center text-sky-300">
                    {r.player.seasonStats.tpa > 0 ? `${r.tpPct.toFixed(0)}%` : '-'}
                  </td>
                  <td className="py-2 px-1.5 text-center text-amber-300">
                    {r.player.seasonStats.fta > 0 ? `${r.ftPct.toFixed(0)}%` : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-center font-black text-orange-400">
                    {r.pir.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
