import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { LeagueConfig, LeagueId, Team } from '../../types';
import { ClubBadge } from '../ClubBadge';

type TeamListSort = 'rank' | 'overall' | 'name' | 'budget';

interface OpponentTeamListSidebarProps {
  leagues: LeagueConfig[];
  selectedLeagueId: LeagueId;
  onChangeLeague: (id: LeagueId) => void;
  teams: Team[];
  selectedTeamId: string | null;
  onSelectTeam: (id: string) => void;
  nextOpponentId: string | null;
  standingsMap: Map<string, { rank: number; wins: number; losses: number }>;
  formMap: Map<string, ('W' | 'L')[]>;
}

function getAvgOvr(team: Team): number {
  if (team.roster.length === 0) return 0;
  return Math.round(team.roster.reduce((s, p) => s + p.overall, 0) / team.roster.length);
}

export const OpponentTeamListSidebar: React.FC<OpponentTeamListSidebarProps> = ({
  leagues,
  selectedLeagueId,
  onChangeLeague,
  teams,
  selectedTeamId,
  onSelectTeam,
  nextOpponentId,
  standingsMap,
  formMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TeamListSort>('rank');

  const visibleTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? teams.filter(
          (t) => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q)
        )
      : teams.slice();

    filtered.sort((a, b) => {
      if (sortBy === 'rank') {
        const ra = standingsMap.get(a.id)?.rank ?? 999;
        const rb = standingsMap.get(b.id)?.rank ?? 999;
        return ra - rb;
      }
      if (sortBy === 'overall') {
        return getAvgOvr(b) - getAvgOvr(a);
      }
      if (sortBy === 'budget') {
        return b.budget - a.budget;
      }
      return a.name.localeCompare(b.name, 'it');
    });
    return filtered;
  }, [teams, searchQuery, sortBy, standingsMap]);

  return (
    <div className="xl:col-span-4 fm-card rounded-2xl p-4 flex flex-col gap-3 max-h-[820px]">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-white">Club ({visibleTeams.length})</h3>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TeamListSort)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="rank">Classifica</option>
              <option value="overall">Forza OVR</option>
              <option value="budget">Budget</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>
        </div>

        <select
          value={selectedLeagueId}
          onChange={(e) => onChangeLeague(e.target.value as LeagueId)}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
        >
          {leagues.map((lg) => (
            <option key={lg.id} value={lg.id}>
              {lg.name} ({lg.tier})
            </option>
          ))}
        </select>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca squadra o città..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {visibleTeams.length === 0 ? (
          <div className="rounded-xl bg-slate-950/70 border border-dashed border-slate-800 p-5 text-center text-xs text-slate-400">
            Nessuna squadra corrisponde alla ricerca.
          </div>
        ) : (
          visibleTeams.map((team) => {
            const st = standingsMap.get(team.id);
            const avgOvr = getAvgOvr(team);
            const form = formMap.get(team.id) ?? [];
            const isSelected = selectedTeamId === team.id;
            const isNext = nextOpponentId === team.id;

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => onSelectTeam(team.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-orange-500/15 border-orange-500 shadow-sm'
                    : 'bg-slate-950/75 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <ClubBadge
                  shortName={team.shortName}
                  primaryColor={team.primaryColor}
                  secondaryColor={team.secondaryColor}
                  size="sm"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-white truncate">
                      {team.name}
                    </span>
                    {isNext && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-black uppercase text-amber-300 shrink-0">
                        Prossimo Avversario
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="truncate">{team.city}</span>
                    <span>•</span>
                    <span>OVR {avgOvr}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="text-[11px] font-black text-slate-200 tabular-nums">
                    {st ? `#${st.rank} · ${st.wins}-${st.losses}` : `OVR ${avgOvr}`}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    {form.length === 0 ? (
                      <span className="text-[9px] text-slate-500">-</span>
                    ) : (
                      form.map((res, idx) => (
                        <span
                          key={idx}
                          className={`w-2 h-2 rounded-full ${
                            res === 'W' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                          title={res === 'W' ? 'Vittoria' : 'Sconfitta'}
                        />
                      ))
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
