import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  Award,
  CheckCircle2,
  LogOut,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { getLeagueConfig, LEAGUES } from '../data/teams';
import { formatItalianDate } from '../engine/calendarUtils';
import { getTeamBoardObjective } from '../engine/managerEngine';
import { formatEuro } from '../engine/ratings';
import { computeStandings } from '../engine/seasonEngine';
import { useGameStore } from '../store/gameStore';
import { LeagueId, Team } from '../types';
import { ClubBadge } from './ClubBadge';

interface TeamStandingMeta {
  rank: number;
  wins: number;
  losses: number;
}

interface ClubOfferCardProps {
  team: Team;
  meta: TeamStandingMeta;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function getTeamTopAvgOvr(team: Team): number {
  if (team.roster.length === 0) return 0;
  const top = [...team.roster]
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 10);
  return Math.round(top.reduce((s, p) => s + p.overall, 0) / top.length);
}

const ClubOfferCard: React.FC<ClubOfferCardProps> = ({
  team,
  meta,
  isRecommended,
  isSelected,
  onSelect,
}) => {
  const leagueCfg = getLeagueConfig(team.leagueId);
  const objective = getTeamBoardObjective(team.prestige);
  const avgOvr = getTeamTopAvgOvr(team);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 ${
        isSelected
          ? 'bg-orange-500/12 border-orange-500 shadow-[0_0_24px_rgba(249,115,22,0.18)]'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ClubBadge
            shortName={team.shortName}
            primaryColor={team.primaryColor}
            secondaryColor={team.secondaryColor}
            size="sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-white truncate">
                {team.name}
              </span>
              {isRecommended && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-[10px] font-extrabold text-orange-300 uppercase tracking-wide">
                  <Sparkles className="w-2.5 h-2.5" />
                  Offerta
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {team.city} •{' '}
              <span className="text-slate-200 font-semibold">{leagueCfg.name}</span>
            </div>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 border ${
            isSelected
              ? 'bg-orange-500 text-slate-950 border-orange-400'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          #{meta.rank} ({meta.wins}-{meta.losses})
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5">
        <div>
          <div className="text-[10px] uppercase text-slate-500 font-bold">OVR Rosa</div>
          <div className="font-mono font-extrabold text-white">{avgOvr}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500 font-bold">Prestigio</div>
          <div className="font-mono font-extrabold text-amber-300">{team.prestige}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1">
            <Wallet className="w-3 h-3 text-emerald-400" />
            Budget
          </div>
          <div className="font-mono font-extrabold text-emerald-300 truncate">
            {formatEuro(team.budget)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-400 flex items-center gap-1.5 truncate">
          <Award className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          Obiettivo: <strong className="text-slate-200 truncate">{objective}</strong>
        </span>
        {isSelected && (
          <span className="inline-flex items-center gap-1 text-orange-300 font-extrabold shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Selezionata
          </span>
        )}
      </div>
    </button>
  );
};

export const CoachFiredModal: React.FC = () => {
  const {
    career,
    firingContext,
    acceptCoachingJobAfterFiring,
    exitToMenu,
  } = useGameStore();

  const [tab, setTab] = useState<'recommended' | 'all'>('recommended');
  const [leagueFilter, setLeagueFilter] = useState<'ALL' | LeagueId>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const standingsMap = useMemo(() => {
    const map = new Map<string, TeamStandingMeta>();
    if (!career) return map;
    for (const lg of LEAGUES) {
      const lgTeams = career.teams.filter((t) => (t.leagueId ?? 'ITA_LBA') === lg.id);
      const lgSchedule = career.schedule.filter((g) => (g.leagueId ?? 'ITA_LBA') === lg.id);
      const table = computeStandings(lgTeams, lgSchedule);
      table.forEach((row, idx) => {
        map.set(row.teamId, { rank: idx + 1, wins: row.wins, losses: row.losses });
      });
    }
    return map;
  }, [career]);

  const allOtherTeams = useMemo(() => {
    if (!career || !firingContext) return [];
    return career.teams.filter((t) => t.id !== firingContext.oldClubId);
  }, [career, firingContext]);

  const recommendedTeams = useMemo(() => {
    if (!career || !firingContext) return [];
    const byId = new Map(allOtherTeams.map((t) => [t.id, t]));
    return firingContext.recommendedTeamIds
      .map((id) => byId.get(id))
      .filter((t): t is Team => Boolean(t));
  }, [career, firingContext, allOtherTeams]);

  const recommendedIdSet = useMemo(
    () => new Set(recommendedTeams.map((t) => t.id)),
    [recommendedTeams]
  );

  useEffect(() => {
    if (!firingContext) {
      setSelectedTeamId(null);
      return;
    }
    setTab('recommended');
    setLeagueFilter('ALL');
    setSearchQuery('');
    setSelectedTeamId(recommendedTeams[0]?.id ?? allOtherTeams[0]?.id ?? null);
  }, [firingContext?.oldClubId, firingContext?.dateStr, recommendedTeams, allOtherTeams]);

  const filteredAllTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allOtherTeams
      .filter((t) => {
        if (leagueFilter !== 'ALL' && (t.leagueId ?? 'ITA_LBA') !== leagueFilter) {
          return false;
        }
        if (q) {
          const hay = `${t.name} ${t.shortName} ${t.city}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.prestige - a.prestige || b.budget - a.budget);
  }, [allOtherTeams, leagueFilter, searchQuery]);

  if (!career || !firingContext) return null;

  const selectedTeam = allOtherTeams.find((t) => t.id === selectedTeamId) ?? null;
  const oldLeagueCfg = getLeagueConfig(firingContext.oldLeagueId);

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fm-modal rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-red-500/40 shadow-2xl">
        {/* Header Esonero */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-950/60 via-slate-950 to-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-400">
                Esonero Ufficiale • {formatItalianDate(firingContext.dateStr)} • Giornata{' '}
                {firingContext.round}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Sollevato dall’incarico a {firingContext.oldClubName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                La dirigenza ({oldLeagueCfg.name}) ha interrotto il rapporto con fiducia scesa al{' '}
                <span className="font-bold text-red-300">
                  {firingContext.finalConfidence}%
                </span>
                . Scegli in quale altra squadra vuoi allenare per proseguire la carriera.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Filters */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
          <div className="fm-tabs">
            <button
              type="button"
              onClick={() => setTab('recommended')}
              className={`fm-tab ${tab === 'recommended' ? 'fm-tab-active' : ''}`}
            >
              Offerte Consigliate ({recommendedTeams.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('all')}
              className={`fm-tab ${tab === 'all' ? 'fm-tab-active' : ''}`}
            >
              Tutte le Squadre ({allOtherTeams.length})
            </button>
          </div>

          {tab === 'all' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca club o città..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 w-44"
                />
              </div>

              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value as 'ALL' | LeagueId)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Tutti i campionati</option>
                {LEAGUES.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    {lg.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Grid Squadre */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'recommended' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {recommendedTeams.map((team) => (
                <ClubOfferCard
                  key={team.id}
                  team={team}
                  meta={standingsMap.get(team.id) ?? { rank: 1, wins: 0, losses: 0 }}
                  isRecommended
                  isSelected={selectedTeamId === team.id}
                  onSelect={() => setSelectedTeamId(team.id)}
                />
              ))}
            </div>
          ) : filteredAllTeams.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Nessuna squadra trovata con i filtri selezionati.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredAllTeams.map((team) => (
                <ClubOfferCard
                  key={team.id}
                  team={team}
                  meta={standingsMap.get(team.id) ?? { rank: 1, wins: 0, losses: 0 }}
                  isRecommended={recommendedIdSet.has(team.id)}
                  isSelected={selectedTeamId === team.id}
                  onSelect={() => setSelectedTeamId(team.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Azioni */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={exitToMenu}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Torna al Menu Principale
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {selectedTeam && (
              <div className="hidden sm:block text-right text-xs">
                <div className="text-slate-400">Nuova squadra scelta:</div>
                <div className="font-black text-white">
                  {selectedTeam.name} ({getLeagueConfig(selectedTeam.leagueId).shortName})
                </div>
              </div>
            )}
            <button
              type="button"
              disabled={!selectedTeam}
              onClick={() => {
                if (selectedTeam) {
                  acceptCoachingJobAfterFiring(selectedTeam.id);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-lg shadow-orange-500/20 cursor-pointer transition-colors"
            >
              Accetta Panchina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
