import React, { useMemo, useState } from 'react';
import { Binoculars, Eye, Star } from 'lucide-react';
import { formatEuro } from '../../engine/ratings';
import { getAttributeEstimate, getSalaryEstimate } from '../../engine/scoutingEngine';
import { Player, Position, Team } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';
import { SortableTh, SortDir, nextSortState } from '../SortableHeader';

type RosterGroupTab = 'senior' | 'youth';
type PosFilter = 'ALL' | Position;
type FormFilter = 'ALL' | 'ITA' | 'FOR';
type RosterSortKey =
  | 'jersey'
  | 'name'
  | 'position'
  | 'age'
  | 'height'
  | 'slot'
  | 'overall'
  | 'salary';

const SLOT_ORDER: Record<Player['rosterSlot'], number> = {
  starter: 0,
  bench: 1,
  reserve: 2,
};

const SLOT_LABEL: Record<Player['rosterSlot'], string> = {
  starter: 'Titolare',
  bench: 'Panchina',
  reserve: 'Riserva',
};

interface OpponentRosterTabProps {
  team: Team;
  scoutRating: number;
  scoutedSet: Set<string>;
  activeScoutSet: Set<string>;
  shortlistSet: Set<string>;
  onOpenPlayerProfile: (playerId: string) => void;
  onStartScouting: (playerId: string, fullName: string, clubName: string) => void;
  onToggleShortlist: (playerId: string) => void;
}

export const OpponentRosterTab: React.FC<OpponentRosterTabProps> = ({
  team,
  scoutRating,
  scoutedSet,
  activeScoutSet,
  shortlistSet,
  onOpenPlayerProfile,
  onStartScouting,
  onToggleShortlist,
}) => {
  const [group, setGroup] = useState<RosterGroupTab>('senior');
  const [posFilter, setPosFilter] = useState<PosFilter>('ALL');
  const [formFilter, setFormFilter] = useState<FormFilter>('ALL');
  const [sortKey, setSortKey] = useState<RosterSortKey>('overall');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sourceList = group === 'senior' ? team.roster : team.youthRoster ?? [];

  const handleSort = (key: RosterSortKey) => {
    const next = nextSortState(sortKey, sortDir, key, [
      'overall',
      'salary',
      'age',
      'height',
    ]);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const rows = useMemo(() => {
    const filtered = sourceList.filter((p) => {
      if (posFilter !== 'ALL' && p.primaryPosition !== posFilter) return false;
      if (formFilter === 'ITA' && !p.isItalianFormation) return false;
      if (formFilter === 'FOR' && p.isItalianFormation) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'jersey') cmp = a.jerseyNumber - b.jerseyNumber;
      else if (sortKey === 'name') {
        cmp = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'it');
      } else if (sortKey === 'position') {
        cmp = a.primaryPosition.localeCompare(b.primaryPosition);
      } else if (sortKey === 'age') cmp = a.age - b.age;
      else if (sortKey === 'height') cmp = a.heightCm - b.heightCm;
      else if (sortKey === 'slot') cmp = SLOT_ORDER[a.rosterSlot] - SLOT_ORDER[b.rosterSlot];
      else if (sortKey === 'overall') cmp = a.overall - b.overall;
      else if (sortKey === 'salary') cmp = a.salary - b.salary;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [sourceList, posFilter, formFilter, sortKey, sortDir]);

  const formatOvr = (p: Player) => {
    if (scoutedSet.has(p.id)) return String(p.overall);
    const est = getAttributeEstimate(p.overall, p.id, 'ovr', scoutRating);
    return `${est.min}-${est.max}`;
  };

  return (
    <div className="fm-card rounded-2xl overflow-hidden">
      {/* Filter Bar */}
      <div className="p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/60">
        <div className="flex flex-wrap items-center gap-2">
          <div className="fm-tabs">
            <button
              type="button"
              onClick={() => setGroup('senior')}
              className={`fm-tab ${group === 'senior' ? 'fm-tab-active' : 'fm-tab-idle'}`}
            >
              Prima Squadra ({team.roster.length})
            </button>
            <button
              type="button"
              onClick={() => setGroup('youth')}
              className={`fm-tab ${group === 'youth' ? 'fm-tab-active' : 'fm-tab-idle'}`}
            >
              Giovanile ({(team.youthRoster ?? []).length})
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'PG', 'SG', 'SF', 'PF', 'C'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setPosFilter(pos)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                  posFilter === pos
                    ? 'bg-orange-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {pos === 'ALL' ? 'Tutti' : pos}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(
            [
              { id: 'ALL', label: 'Tutti' },
              { id: 'ITA', label: 'Formazione ITA' },
              { id: 'FOR', label: 'Stranieri' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormFilter(f.id)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                formFilter === f.id
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="fm-table-head">
            <tr>
              <SortableTh label="#" sortKey="jersey" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-2.5" />
              <SortableTh label="Giocatore" sortKey="name" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-2.5 px-3" />
              <SortableTh label="Ruolo" sortKey="position" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-2" />
              <SortableTh label="Età" sortKey="age" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-2" />
              <SortableTh label="Altezza" sortKey="height" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-2" />
              <SortableTh label="Ruolo Rosa" sortKey="slot" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-2.5 px-2" />
              <SortableTh label="OVR" sortKey="overall" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-2.5 px-2" />
              <SortableTh label="Ingaggio & Contratto" sortKey="salary" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-2.5 px-3" />
              <th className="py-2.5 px-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  Nessun giocatore trovato con i filtri attivi.
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const isScouted = scoutedSet.has(p.id);
                const isScouting = activeScoutSet.has(p.id);
                const isShortlisted = shortlistSet.has(p.id);
                const fullName = `${p.firstName} ${p.lastName}`;
                const salEst = getSalaryEstimate(p.salary, p.id, scoutRating);

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 text-slate-200">
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-400 tabular-nums">
                      {p.jerseyNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <CountryFlag nationality={p.nationality} size="sm" />
                        <button
                          type="button"
                          onClick={() => onOpenPlayerProfile(p.id)}
                          className="font-bold text-white hover:text-orange-400 hover:underline text-left cursor-pointer"
                        >
                          {fullName}
                        </button>
                        <FormationBadge isItalianFormation={p.isItalianFormation} />
                        {p.injuryWeeks > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-[9px] font-bold text-rose-300">
                            INF ({p.injuryWeeks}s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-orange-300">
                        {p.primaryPosition}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center tabular-nums">{p.age}</td>
                    <td className="py-2.5 px-2 text-center tabular-nums text-slate-300">
                      {p.heightCm} cm
                    </td>
                    <td className="py-2.5 px-2 text-[11px] text-slate-300">
                      {group === 'youth' ? 'Giovanile' : SLOT_LABEL[p.rosterSlot]}
                    </td>
                    <td className="py-2.5 px-2 text-center font-black tabular-nums">
                      <span className={isScouted ? 'text-emerald-400' : 'text-amber-300'}>
                        {formatOvr(p)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-[11px]">
                      <div className="font-semibold text-slate-200">
                        {isScouted
                          ? formatEuro(p.salary)
                          : `${Math.round(salEst.min / 1000)}k-${Math.round(salEst.max / 1000)}k €`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.contractYears} {p.contractYears === 1 ? 'anno' : 'anni'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleShortlist(p.id)}
                          title={isShortlisted ? 'Rimuovi da Lista' : 'Aggiungi a Lista'}
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            isShortlisted
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-300'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isShortlisted ? 'fill-amber-300' : ''}`} />
                        </button>

                        {!isScouted && (
                          <button
                            type="button"
                            disabled={isScouting}
                            onClick={() => onStartScouting(p.id, fullName, team.name)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 disabled:opacity-50 border border-sky-500/40 text-sky-300 text-[10px] font-bold cursor-pointer"
                            title="Invia scout"
                          >
                            <Binoculars className="w-3 h-3" />
                            {isScouting ? 'In corso' : 'Osserva'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenPlayerProfile(p.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Profilo
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
