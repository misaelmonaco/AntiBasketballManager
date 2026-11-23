import React from 'react';
import { Search } from 'lucide-react';
import { LEAGUES, TeamTemplate } from '../../data/teams';
import { CustomEditorDatabase } from '../../services/editorDbService';
import { LeagueId } from '../../types';
import { ClubBadge } from '../ClubBadge';

interface DatabaseTeamsSidebarProps {
  activeLeague: LeagueId;
  search: string;
  selectedTeamId: string;
  filteredTeams: TeamTemplate[];
  db: CustomEditorDatabase;
  onSelectLeague: (leagueId: LeagueId) => void;
  onChangeSearch: (query: string) => void;
  onSelectTeam: (teamId: string) => void;
}

export const DatabaseTeamsSidebar: React.FC<DatabaseTeamsSidebarProps> = ({
  activeLeague,
  search,
  selectedTeamId,
  filteredTeams,
  db,
  onSelectLeague,
  onChangeSearch,
  onSelectTeam,
}) => {
  return (
    <aside className="lg:col-span-4 bg-slate-950/70 border-r border-slate-800 flex flex-col overflow-hidden">
      <div className="p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="flex flex-wrap gap-1">
          {LEAGUES.map((lg) => (
            <button
              key={lg.id}
              onClick={() => onSelectLeague(lg.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                activeLeague === lg.id
                  ? 'bg-orange-500 text-slate-950 border-orange-400'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {lg.shortName}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Cerca squadra o città..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredTeams.map((t) => {
          const ov = db.teams[t.id];
          const name = ov?.name ?? t.name;
          const short = ov?.shortName ?? t.shortName;
          const city = ov?.city ?? t.city;
          const pColor = ov?.primaryColor ?? t.primaryColor;
          const sColor = ov?.secondaryColor ?? t.secondaryColor;
          const isModified = Boolean(db.teams[t.id] || db.rosters[t.id]);
          const isSelected = t.id === selectedTeamId;

          return (
            <button
              key={t.id}
              onClick={() => onSelectTeam(t.id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-orange-500/15 border-orange-500/60 text-white'
                  : 'bg-transparent border-transparent hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ClubBadge
                  shortName={short}
                  primaryColor={pColor}
                  secondaryColor={sColor}
                  size="xs"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{city}</div>
                </div>
              </div>
              {isModified && (
                <span
                  title="Modificato"
                  className="w-2 h-2 rounded-full bg-orange-400 shrink-0"
                />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
