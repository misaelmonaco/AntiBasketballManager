import React from 'react';
import { Binoculars, Clock, RotateCcw, Search, Star, X } from 'lucide-react';
import { LEAGUES } from '../../data/teams';
import { LeagueId, Position, ScoutingAssignment } from '../../types';

export type SearchSourceFilter = 'ALL' | 'FREE_AGENTS' | 'CONTRACTED' | LeagueId;
export type SearchAgeFilter = 'ALL' | 'U20' | 'U22' | '23_27' | '28_32' | '33_PLUS';
export type SearchContractFilter = 'ALL' | 'EXPIRING' | 'MULTI';

interface PlayerSearchFiltersProps {
  searchQuery: string;
  sourceFilter: SearchSourceFilter;
  posFilter: 'ALL' | Position;
  natFilter: 'ALL' | 'ITA' | 'FOREIGN';
  ageFilter: SearchAgeFilter;
  contractFilter: SearchContractFilter;
  minOvr: number;
  min3pt: number;
  minDef: number;
  minPlay: number;
  minReb: number;
  maxSalary: number;
  onlyScouted: boolean;
  onlyShortlist: boolean;
  excludeUserTeam: boolean;
  shortlistCount: number;
  activeScouting: ScoutingAssignment[];
  hasActiveFilters: boolean;
  onSearchQueryChange: (v: string) => void;
  onSourceFilterChange: (v: SearchSourceFilter) => void;
  onPosFilterChange: (v: 'ALL' | Position) => void;
  onNatFilterChange: (v: 'ALL' | 'ITA' | 'FOREIGN') => void;
  onAgeFilterChange: (v: SearchAgeFilter) => void;
  onContractFilterChange: (v: SearchContractFilter) => void;
  onMinOvrChange: (v: number) => void;
  onMin3ptChange: (v: number) => void;
  onMinDefChange: (v: number) => void;
  onMinPlayChange: (v: number) => void;
  onMinRebChange: (v: number) => void;
  onMaxSalaryChange: (v: number) => void;
  onToggleOnlyScouted: () => void;
  onToggleOnlyShortlist: () => void;
  onToggleExcludeUserTeam: () => void;
  onAdvanceScouting: () => void;
  onResetFilters: () => void;
}

export const PlayerSearchFilters: React.FC<PlayerSearchFiltersProps> = ({
  searchQuery,
  sourceFilter,
  posFilter,
  natFilter,
  ageFilter,
  contractFilter,
  minOvr,
  min3pt,
  minDef,
  minPlay,
  minReb,
  maxSalary,
  onlyScouted,
  onlyShortlist,
  excludeUserTeam,
  shortlistCount,
  activeScouting,
  hasActiveFilters,
  onSearchQueryChange,
  onSourceFilterChange,
  onPosFilterChange,
  onNatFilterChange,
  onAgeFilterChange,
  onContractFilterChange,
  onMinOvrChange,
  onMin3ptChange,
  onMinDefChange,
  onMinPlayChange,
  onMinRebChange,
  onMaxSalaryChange,
  onToggleOnlyScouted,
  onToggleOnlyShortlist,
  onToggleExcludeUserTeam,
  onAdvanceScouting,
  onResetFilters,
}) => {
  return (
    <div className="space-y-4">
      {/* Compact Active Scouting Bar */}
      <div className="fm-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-sky-300">
            <Binoculars className="w-4 h-4 text-sky-400" />
            Centrale Scouting ({activeScouting.length}/5):
          </div>
          {activeScouting.length === 0 ? (
            <span className="text-xs text-slate-400">
              Nessun giocatore in osservazione. Clicca &ldquo;Osserva&rdquo; nella tabella per sbloccare i valori esatti.
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {activeScouting.map((a) => (
                <span
                  key={a.playerId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <b>{a.playerName}</b>
                  <span className="text-slate-500">({a.daysRemaining}g)</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {activeScouting.length > 0 && (
          <button
            onClick={onAdvanceScouting}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs cursor-pointer"
          >
            +3 Giorni Scouting
          </button>
        )}
      </div>

      {/* Filters Grid */}
      <div className="fm-card rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Nome giocatore o club..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-9 pr-7 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-2 top-2.5 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => onSourceFilterChange(e.target.value as SearchSourceFilter)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Tutte le Provenienze</option>
            <option value="FREE_AGENTS">Solo Svincolati (FA)</option>
            <option value="CONTRACTED">Tutti Sotto Contratto</option>
            {LEAGUES.map((lg) => (
              <option key={lg.id} value={lg.id}>
                Campionato: {lg.name}
              </option>
            ))}
          </select>

          <select
            value={posFilter}
            onChange={(e) => onPosFilterChange(e.target.value as 'ALL' | Position)}
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
            onChange={(e) => onNatFilterChange(e.target.value as 'ALL' | 'ITA' | 'FOREIGN')}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Tutte Nazionalità</option>
            <option value="ITA">Solo Formazione ITA</option>
            <option value="FOREIGN">Solo Stranieri</option>
          </select>

          <select
            value={ageFilter}
            onChange={(e) => onAgeFilterChange(e.target.value as SearchAgeFilter)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Età: Tutte</option>
            <option value="U20">Under 20 (≤20)</option>
            <option value="U22">Under 22 (≤22)</option>
            <option value="23_27">Prime (23 - 27 anni)</option>
            <option value="28_32">Esperti (28 - 32 anni)</option>
            <option value="33_PLUS">Veterani (33+ anni)</option>
          </select>

          <select
            value={contractFilter}
            onChange={(e) => onContractFilterChange(e.target.value as SearchContractFilter)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Contratto: Tutti</option>
            <option value="EXPIRING">In scadenza (1 anno / FA)</option>
            <option value="MULTI">Contratto biennale (2 anni)</option>
          </select>
        </div>

        {/* Technical & Economic Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <select
            value={minOvr}
            onChange={(e) => onMinOvrChange(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value={40}>OVR: Qualsiasi</option>
            <option value={62}>OVR ≥ 62</option>
            <option value={68}>OVR ≥ 68</option>
            <option value={72}>OVR ≥ 72</option>
            <option value={76}>OVR ≥ 76 (Stella)</option>
          </select>

          <select
            value={min3pt}
            onChange={(e) => onMin3ptChange(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value={0}>3PT: Qualsiasi</option>
            <option value={68}>3PT ≥ 68</option>
            <option value={74}>3PT ≥ 74 (Tiratore)</option>
            <option value={80}>3PT ≥ 80 (Cecchino)</option>
          </select>

          <select
            value={minDef}
            onChange={(e) => onMinDefChange(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value={0}>Difesa: Qualsiasi</option>
            <option value={68}>Difesa ≥ 68</option>
            <option value={74}>Difesa ≥ 74 (Stopper)</option>
            <option value={78}>Difesa ≥ 78 (Élite)</option>
          </select>

          <select
            value={minPlay}
            onChange={(e) => onMinPlayChange(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value={0}>Regia (Pass/Hand): Tutti</option>
            <option value={68}>Regia ≥ 68</option>
            <option value={74}>Regia ≥ 74</option>
            <option value={78}>Regia ≥ 78</option>
          </select>

          <select
            value={minReb}
            onChange={(e) => onMinRebChange(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value={0}>Rimbalzi: Qualsiasi</option>
            <option value={68}>Rimbalzi ≥ 68</option>
            <option value={74}>Rimbalzi ≥ 74</option>
            <option value={78}>Rimbalzi ≥ 78</option>
          </select>

          <select
            value={maxSalary}
            onChange={(e) => onMaxSalaryChange(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value={3000000}>Stipendio Max: Tutti</option>
            <option value={100000}>Max ~100k €</option>
            <option value={200000}>Max ~200k €</option>
            <option value={350000}>Max ~350k €</option>
            <option value={600000}>Max ~600k €</option>
          </select>
        </div>

        {/* Toggle Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onToggleOnlyScouted}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
              onlyScouted
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Solo Report Sbloccati (Osservati)
          </button>

          <button
            onClick={onToggleOnlyShortlist}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
              onlyShortlist
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            Lista Monitoraggio ({shortlistCount})
          </button>

          <button
            onClick={onToggleExcludeUserTeam}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
              excludeUserTeam
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {excludeUserTeam ? 'Escludi Mia Squadra (Attivo)' : 'Includi Mia Squadra'}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filtri
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
