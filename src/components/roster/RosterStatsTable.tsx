import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { computePlayerPerGameStats, PlayerPerGameStats } from '../../engine/leagueStats';
import { Player, Position } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';
import { nextSortState, SortableTh, SortDir } from '../SortableHeader';

type StatsSortKey =
  | 'name'
  | 'position'
  | 'gp'
  | 'gs'
  | 'mpg'
  | 'ppg'
  | 'rpg'
  | 'oreb'
  | 'dreb'
  | 'apg'
  | 'spg'
  | 'bpg'
  | 'tov'
  | 'fgPct'
  | 'tpPct'
  | 'ftPct'
  | 'pirAvg';

const POS_ORDER: Record<Position, number> = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 };
const STATS_DESC_KEYS: readonly StatsSortKey[] = [
  'gp',
  'gs',
  'mpg',
  'ppg',
  'rpg',
  'oreb',
  'dreb',
  'apg',
  'spg',
  'bpg',
  'tov',
  'fgPct',
  'tpPct',
  'ftPct',
  'pirAvg',
];

export const RosterStatsTable: React.FC<{
  roster: Player[];
  onOpenProfile: (playerId: string) => void;
}> = ({ roster, onOpenProfile }) => {
  const [sortKey, setSortKey] = useState<StatsSortKey>('pirAvg');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (clicked: StatsSortKey) => {
    const next = nextSortState(sortKey, sortDir, clicked, STATS_DESC_KEYS);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const rows = useMemo(() => {
    const mapped = roster.map((p) => ({
      player: p,
      stats: computePlayerPerGameStats(p),
    }));
    const dir = sortDir === 'asc' ? 1 : -1;
    return mapped.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = `${a.player.lastName} ${a.player.firstName}`.localeCompare(
          `${b.player.lastName} ${b.player.firstName}`
        );
      } else if (sortKey === 'position') {
        cmp = POS_ORDER[a.player.primaryPosition] - POS_ORDER[b.player.primaryPosition];
      } else {
        cmp = a.stats[sortKey as keyof PlayerPerGameStats] - b.stats[sortKey as keyof PlayerPerGameStats];
      }
      if (cmp !== 0) return cmp * dir;
      return b.player.overall - a.player.overall;
    });
  }, [roster, sortKey, sortDir]);

  return (
    <div className="fm-card rounded-2xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
        <div className="text-xs font-bold text-orange-300 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Medie & Statistiche Stagionali della Rosa ({rows.length} giocatori)
        </div>
        <span className="text-[11px] text-slate-400">
          Clicca sulle intestazioni per ordinare qualsiasi colonna
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="fm-table-head">
            <tr>
              <SortableTh label="Giocatore" sortKey="name" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3 px-3" />
              <SortableTh label="Ruolo" sortKey="position" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3 px-2" />
              <SortableTh label="PG" sortKey="gp" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="ST" sortKey="gs" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="MIN" sortKey="mpg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="PTS" sortKey="ppg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="REB" sortKey="rpg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="OREB" sortKey="oreb" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="DREB" sortKey="dreb" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="AST" sortKey="apg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="STL" sortKey="spg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="BLK" sortKey="bpg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="TOV" sortKey="tov" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="FG%" sortKey="fgPct" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="3P%" sortKey="tpPct" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="FT%" sortKey="ftPct" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
              <SortableTh label="PIR" sortKey="pirAvg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 tabular-nums">
            {rows.map(({ player: p, stats: st }) => (
              <tr key={p.id} className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <CountryFlag nationality={p.nationality} size="sm" />
                    <button
                      onClick={() => onOpenProfile(p.id)}
                      className="font-bold text-slate-100 hover:text-orange-400 hover:underline text-left cursor-pointer"
                    >
                      {p.firstName[0]}. {p.lastName}
                    </button>
                    <FormationBadge isItalianFormation={p.isItalianFormation} />
                  </div>
                </td>
                <td className="py-2.5 px-2 font-semibold text-slate-300">{p.primaryPosition}</td>
                <td className="py-2.5 px-2 text-center text-slate-300">{st.gp}</td>
                <td className="py-2.5 px-2 text-center text-slate-400">{st.gs}</td>
                <td className="py-2.5 px-2 text-center text-slate-300">{st.mpg.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-center font-extrabold text-white">{st.ppg.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-center text-slate-200">{st.rpg.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-center text-slate-400">{st.oreb.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-center text-slate-400">{st.dreb.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-center text-slate-200">{st.apg.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-center text-slate-300">{st.spg.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-center text-slate-300">{st.bpg.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-center text-slate-400">{st.tov.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-center text-slate-300">{st.gp > 0 ? `${st.fgPct.toFixed(0)}%` : '-'}</td>
                <td className="py-2.5 px-2 text-center text-slate-300">{st.gp > 0 ? `${st.tpPct.toFixed(0)}%` : '-'}</td>
                <td className="py-2.5 px-2 text-center text-slate-300">{st.gp > 0 ? `${st.ftPct.toFixed(0)}%` : '-'}</td>
                <td className="py-2.5 px-3 text-center font-black text-orange-400">{st.pirAvg.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
