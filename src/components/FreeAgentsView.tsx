import React, { useMemo, useState } from 'react';
import {
  Search,
  Handshake,
  Binoculars,
  Eye,
  Star,
  RotateCcw,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { formatItalianDate, getMarketOpenDate } from '../engine/calendarUtils';
import { calculateWageBill, formatEuro } from '../engine/ratings';
import { getAttributeEstimate, getSalaryEstimate } from '../engine/scoutingEngine';
import { Player, Position } from '../types';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { CountryFlag, FormationBadge } from './CountryFlag';
import { PageHeader } from './PageHeader';
import { nextSortState, SortableTh, SortDir } from './SortableHeader';

type AgeFilter = 'ALL' | 'U22' | '23_27' | '28_32' | '33_PLUS';
type FASortKey =
  | 'name'
  | 'nationality'
  | 'position'
  | 'age'
  | 'overall'
  | 'threePoint'
  | 'defense'
  | 'salary';

const POS_ORDER: Record<Position, number> = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 };
const DEFAULT_DESC_KEYS: readonly FASortKey[] = ['overall', 'threePoint', 'defense', 'salary'];

export const FreeAgentsView: React.FC = () => {
  const {
    career,
    negotiateFreeAgent,
    toggleShortlistPlayer,
    startScoutingPlayer,
    openPlayerProfile,
    setActiveTab,
  } = useGameStore();

  const [posFilter, setPosFilter] = useState<'ALL' | Position>('ALL');
  const [natFilter, setNatFilter] = useState<'ALL' | 'ITA' | 'FOREIGN'>('ALL');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('ALL');
  const [minOvr, setMinOvr] = useState<number>(55);
  const [maxSalary, setMaxSalary] = useState<number>(1500000);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyShortlist, setOnlyShortlist] = useState(false);

  const [sortKey, setSortKey] = useState<FASortKey>('overall');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [negotiationPlayer, setNegotiationPlayer] = useState<Player | null>(null);

  const handleSort = (clicked: FASortKey) => {
    const next = nextSortState(sortKey, sortDir, clicked, DEFAULT_DESC_KEYS);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const hasActiveFilters =
    posFilter !== 'ALL' ||
    natFilter !== 'ALL' ||
    ageFilter !== 'ALL' ||
    minOvr !== 55 ||
    maxSalary !== 1500000 ||
    searchQuery.trim() !== '' ||
    onlyShortlist;

  const resetFilters = () => {
    setPosFilter('ALL');
    setNatFilter('ALL');
    setAgeFilter('ALL');
    setMinOvr(55);
    setMaxSalary(1500000);
    setSearchQuery('');
    setOnlyShortlist(false);
  };

  const userTeam = career?.teams.find((t) => t.id === career.userTeamId);
  const freeAgents = career?.freeAgents ?? [];
  const shortlistIds = career?.shortlistPlayerIds ?? [];

  const filteredAndSortedFA = useMemo(() => {
    const filtered = freeAgents.filter((p) => {
      if (onlyShortlist && !shortlistIds.includes(p.id)) return false;
      if (posFilter !== 'ALL' && p.primaryPosition !== posFilter) return false;
      if (natFilter === 'ITA' && !p.isItalianFormation) return false;
      if (natFilter === 'FOREIGN' && p.isItalianFormation) return false;
      if (ageFilter === 'U22' && p.age > 22) return false;
      if (ageFilter === '23_27' && (p.age < 23 || p.age > 27)) return false;
      if (ageFilter === '28_32' && (p.age < 28 || p.age > 32)) return false;
      if (ageFilter === '33_PLUS' && p.age < 33) return false;
      if (p.overall < minOvr) return false;
      if (p.salary > maxSalary) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!`${p.firstName} ${p.lastName}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
          break;
        case 'nationality':
          cmp =
            Number(b.isItalianFormation) - Number(a.isItalianFormation) ||
            a.nationality.localeCompare(b.nationality);
          break;
        case 'position':
          cmp = POS_ORDER[a.primaryPosition] - POS_ORDER[b.primaryPosition];
          break;
        case 'age':
          cmp = a.age - b.age;
          break;
        case 'overall':
          cmp = a.overall - b.overall;
          break;
        case 'threePoint':
          cmp = a.attributes.threePoint - b.attributes.threePoint;
          break;
        case 'defense': {
          const defA = (a.attributes.perimeterDef + a.attributes.postDef) / 2;
          const defB = (b.attributes.perimeterDef + b.attributes.postDef) / 2;
          cmp = defA - defB;
          break;
        }
        case 'salary':
          cmp = a.salary - b.salary;
          break;
      }
      if (cmp !== 0) return cmp * dir;
      return b.overall - a.overall;
    });
  }, [
    freeAgents,
    onlyShortlist,
    shortlistIds,
    posFilter,
    natFilter,
    ageFilter,
    minOvr,
    maxSalary,
    searchQuery,
    sortKey,
    sortDir,
  ]);

  if (!career || !userTeam) return null;

  const freeCap = userTeam.budget - calculateWageBill(userTeam.roster);
  const scoutRating = userTeam.staff?.scout_director?.rating ?? 60;
  const scoutedSet = new Set(career.scoutedPlayerIds);
  const activeScoutSet = new Set(career.activeScouting.map((s) => s.playerId));

  const formatEst = (val: number, pid: string, key: string, isScouted: boolean) => {
    if (isScouted) return String(val);
    const est = getAttributeEstimate(val, pid, key, scoutRating);
    return `${est.min}-${est.max}`;
  };

  const formatSalaryCell = (p: Player, isScouted: boolean) => {
    if (isScouted) return formatEuro(p.salary);
    const est = getSalaryEstimate(p.salary, p.id, scoutRating);
    return `${Math.round(est.min / 1000)}k - ${Math.round(est.max / 1000)}k €`;
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Svincolati"
        title={`Free Agent (${filteredAndSortedFA.length}/${career.freeAgents.length})`}
        subtitle={
          <>
            Resp. Scouting: <b className="text-amber-400">VAL {scoutRating}</b> • Spazio salariale:{' '}
            <span className={freeCap >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {formatEuro(freeCap)}
            </span>{' '}
            • Mercato estivo:{' '}
            <span className="text-sky-400 font-semibold">
              apertura {formatItalianDate(getMarketOpenDate(career.seasonYear))}
            </span>
          </>
        }
        right={
          <button
            onClick={() => setActiveTab('market')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
          >
            Vai a Mercato & Offerte →
          </button>
        }
      />

      {/* FILTERS */}
      <div className="fm-card rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cerca nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value as 'ALL' | Position)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Tutti i Ruoli</option>
            <option value="PG">Playmaker (PG)</option>
            <option value="SG">Guardia (SG)</option>
            <option value="SF">Ala Piccola (SF)</option>
            <option value="PF">Ala Grande (PF)</option>
            <option value="C">Centro (C)</option>
          </select>

          <select
            value={natFilter}
            onChange={(e) => setNatFilter(e.target.value as 'ALL' | 'ITA' | 'FOREIGN')}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Tutte le Nazionalità</option>
            <option value="ITA">Solo Formazione ITA</option>
            <option value="FOREIGN">Solo Stranieri</option>
          </select>

          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value as AgeFilter)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Età: Tutte</option>
            <option value="U22">Under 22 (≤22 anni)</option>
            <option value="23_27">23 - 27 anni</option>
            <option value="28_32">28 - 32 anni</option>
            <option value="33_PLUS">Over 33 (33+ anni)</option>
          </select>

          <select
            value={minOvr}
            onChange={(e) => setMinOvr(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value={55}>Overall: Tutti</option>
            <option value={65}>Stima: ~65+</option>
            <option value={70}>Stima: ~70+</option>
            <option value={74}>Stima: ~74+</option>
          </select>

          <select
            value={maxSalary}
            onChange={(e) => setMaxSalary(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value={1500000}>Richiesta: Qualsiasi</option>
            <option value={150000}>Max ~150k €</option>
            <option value={250000}>Max ~250k €</option>
            <option value={400000}>Max ~400k €</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setOnlyShortlist((v) => !v)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
              onlyShortlist
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            {onlyShortlist
              ? `Mostrando solo Lista di Monitoraggio (${shortlistIds.length})`
              : `Filtra Lista di Monitoraggio (${shortlistIds.length})`}
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filtri
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="fm-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="fm-table-head">
              <tr>
                <SortableTh
                  label="Giocatore"
                  sortKey="name"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="py-3 px-4"
                />
                <SortableTh
                  label="Naz"
                  sortKey="nationality"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="py-3 px-2"
                />
                <SortableTh
                  label="Ruolo"
                  sortKey="position"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="py-3 px-2"
                />
                <SortableTh
                  label="Età"
                  sortKey="age"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  align="center"
                  className="py-3 px-2"
                />
                <SortableTh
                  label="OVR"
                  sortKey="overall"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  align="center"
                  className="py-3 px-2"
                />
                <SortableTh
                  label="3PT"
                  sortKey="threePoint"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  align="center"
                  className="py-3 px-2"
                />
                <SortableTh
                  label="DIF"
                  sortKey="defense"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  align="center"
                  className="py-3 px-2"
                />
                <SortableTh
                  label="Richiesta (Stima)"
                  sortKey="salary"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="py-3 px-3"
                />
                <th className="py-3 px-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAndSortedFA.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Nessun Free Agent corrisponde ai filtri selezionati.
                  </td>
                </tr>
              ) : (
                filteredAndSortedFA.map((p) => {
                  const isScouted = scoutedSet.has(p.id);
                  const isScouting = activeScoutSet.has(p.id);
                  const avgDef = Math.round(
                    (p.attributes.perimeterDef + p.attributes.postDef) / 2
                  );
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <button
                            onClick={() => openPlayerProfile(p.id)}
                            className="hover:text-orange-400 hover:underline text-left cursor-pointer"
                          >
                            {p.firstName} {p.lastName}
                          </button>
                          {isScouted && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">
                              Osservato
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{p.personality}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <CountryFlag nationality={p.nationality} size="sm" />
                          <FormationBadge isItalianFormation={p.isItalianFormation} />
                        </div>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-200">
                        {p.primaryPosition}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300 font-semibold">
                        {p.age}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-extrabold ${
                            isScouted
                              ? 'bg-slate-800 text-orange-400'
                              : 'bg-slate-950 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {formatEst(p.overall, p.id, 'ovr', isScouted)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300">
                        {formatEst(p.attributes.threePoint, p.id, '3pt', isScouted)}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300">
                        {formatEst(avgDef, p.id, 'def', isScouted)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-400">
                        {formatSalaryCell(p, isScouted)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleShortlistPlayer(p.id)}
                            title="Aggiungi/Rimuovi dalla Lista di Monitoraggio"
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              shortlistIds.includes(p.id)
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openPlayerProfile(p.id)}
                            title="Report Scout"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!isScouted && (
                            <button
                              onClick={() =>
                                startScoutingPlayer(
                                  p.id,
                                  `${p.firstName} ${p.lastName}`,
                                  'Free Agent'
                                )
                              }
                              disabled={isScouting}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sky-300 font-semibold cursor-pointer"
                            >
                              <Binoculars className="w-3.5 h-3.5" />
                              {isScouting ? 'In corso' : 'Osserva'}
                            </button>
                          )}
                          <button
                            onClick={() => setNegotiationPlayer(p)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold cursor-pointer"
                          >
                            <Handshake className="w-3.5 h-3.5" />
                            Offri
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

      {negotiationPlayer && (
        <ContractNegotiationModal
          player={negotiationPlayer}
          mode="free_agent"
          freeCap={freeCap}
          isScouted={scoutedSet.has(negotiationPlayer.id)}
          onClose={() => setNegotiationPlayer(null)}
          onSubmit={(salary, years, role) =>
            negotiateFreeAgent(negotiationPlayer.id, salary, years, role)
          }
        />
      )}
    </div>
  );
};
