import React from 'react';
import { Award, MapPin, Shield, Sliders, Users } from 'lucide-react';
import { Team } from '../../types';
import { ClubBadge } from '../ClubBadge';
import { OpponentTeamMetrics } from './opponentAnalytics';

export type OpponentSubTab = 'overview' | 'roster' | 'stats' | 'club' | 'schedule';

interface OpponentClubHeaderProps {
  team: Team;
  leagueName: string;
  metrics: OpponentTeamMetrics;
  activeSubTab: OpponentSubTab;
  onChangeSubTab: (tab: OpponentSubTab) => void;
  isSameLeague: boolean;
  isNextOpponent: boolean;
  onGoToTactics: () => void;
}

const SUB_TABS: { id: OpponentSubTab; label: string }[] = [
  { id: 'overview', label: 'Panoramica' },
  { id: 'roster', label: 'Roster & Giocatori' },
  { id: 'stats', label: 'Statistiche' },
  { id: 'club', label: 'Tattica & Club' },
  { id: 'schedule', label: 'Partite' },
];

export const OpponentClubHeader: React.FC<OpponentClubHeaderProps> = ({
  team,
  leagueName,
  metrics,
  activeSubTab,
  onChangeSubTab,
  isSameLeague,
  isNextOpponent,
  onGoToTactics,
}) => {
  const euroCupLabel =
    team.euroCup === 'EL' ? 'EuroLeague' : team.euroCup === 'EC' ? 'EuroCup' : null;

  return (
    <div className="fm-card rounded-2xl overflow-hidden">
      <div
        className="p-5 border-b border-slate-800/80"
        style={{
          background: `linear-gradient(120deg, ${team.primaryColor}33 0%, rgba(15, 23, 42, 0.94) 60%)`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <ClubBadge
              shortName={team.shortName}
              primaryColor={team.primaryColor}
              secondaryColor={team.secondaryColor}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight truncate">
                  {team.name}
                </h2>
                {isNextOpponent && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    Prossimo Avversario
                  </span>
                )}
                {euroCupLabel && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/40 text-[10px] font-bold text-indigo-200">
                    {euroCupLabel}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-1">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  {team.city} — {team.arena} ({team.arenaCapacity.toLocaleString('it-IT')} posti)
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{leagueName}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSameLeague && (
              <button
                type="button"
                onClick={onGoToTactics}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-extrabold cursor-pointer shadow-sm"
                title="Prepara le istruzioni tattiche contro questa squadra"
              >
                <Sliders className="w-3.5 h-3.5" />
                Piano Gara
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 font-bold text-white tabular-nums">
            <Shield className="w-3.5 h-3.5 text-orange-400" />
            #{metrics.rank}/{metrics.totalInLeague} · {metrics.wins}V-{metrics.losses}P ({metrics.leaguePoints} pt)
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 font-semibold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Prestigio {team.prestige}
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 font-semibold">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Chimica {team.chemistry}%
          </span>

          {metrics.h2hGames.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/35 text-sky-200 font-bold tabular-nums">
              Precedenti H2H vs Te: {metrics.h2hLosses}V-{metrics.h2hWins}P
            </span>
          )}

          {metrics.last5.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 font-semibold">
              <span className="mr-1 text-slate-400">Forma:</span>
              {metrics.last5.map((res, i) => (
                <span
                  key={i}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                    res === 'W'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {res === 'W' ? 'V' : 'P'}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2">
        <div className="fm-tabs">
          {SUB_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChangeSubTab(t.id)}
              className={`fm-tab ${activeSubTab === t.id ? 'fm-tab-active' : 'fm-tab-idle'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-slate-400">
          Rosa: <b className="text-slate-200">{team.roster.length}</b> giocatori ({metrics.italiansCount} ITA / {metrics.foreignersCount} Stranieri)
        </div>
      </div>
    </div>
  );
};
