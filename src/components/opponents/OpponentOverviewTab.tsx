import React from 'react';
import { Activity, Award, Shield, TrendingUp, Users } from 'lucide-react';
import { formatEuro } from '../../engine/ratings';
import { getAttributeEstimate } from '../../engine/scoutingEngine';
import { Player, Team } from '../../types';
import { CountryFlag } from '../CountryFlag';
import { OpponentTeamMetrics } from './opponentAnalytics';

interface OpponentOverviewTabProps {
  team: Team;
  userTeam: Team;
  metrics: OpponentTeamMetrics;
  scoutRating: number;
  scoutedSet: Set<string>;
  onOpenPlayerProfile: (playerId: string) => void;
}

export const OpponentOverviewTab: React.FC<OpponentOverviewTabProps> = ({
  team,
  userTeam,
  metrics,
  scoutRating,
  scoutedSet,
  onOpenPlayerProfile,
}) => {
  const formatOvr = (p: Player) => {
    if (scoutedSet.has(p.id)) return `${p.overall}`;
    const est = getAttributeEstimate(p.overall, p.id, 'ovr', scoutRating);
    return `${est.min}-${est.max}`;
  };

  const renderStatPerGame = (p: Player, val: number) => {
    const gp = p.seasonStats.gamesPlayed;
    if (gp === 0) return '0.0';
    return (val / gp).toFixed(1);
  };

  const leaderCards: { title: string; player: Player | null; statLabel: string; accent: string }[] = [
    {
      title: 'Miglior Realizzatore',
      player: metrics.topScorer,
      statLabel: metrics.topScorer
        ? `${renderStatPerGame(metrics.topScorer, metrics.topScorer.seasonStats.points)} PPG`
        : '-',
      accent: 'text-orange-400',
    },
    {
      title: 'Miglior Rimbalzista',
      player: metrics.topRebounder,
      statLabel: metrics.topRebounder
        ? `${renderStatPerGame(metrics.topRebounder, metrics.topRebounder.seasonStats.rebounds)} RPG`
        : '-',
      accent: 'text-sky-400',
    },
    {
      title: 'Miglior Assistman',
      player: metrics.topAssister,
      statLabel: metrics.topAssister
        ? `${renderStatPerGame(metrics.topAssister, metrics.topAssister.seasonStats.assists)} APG`
        : '-',
      accent: 'text-emerald-400',
    },
    {
      title: 'Leader Valutazione (PIR)',
      player: metrics.topPir,
      statLabel: metrics.topPir
        ? `${renderStatPerGame(metrics.topPir, metrics.topPir.seasonStats.pir)} PIR`
        : '-',
      accent: 'text-amber-300',
    },
  ];

  const comparisonRows = [
    {
      label: 'OVR Medio Rosa',
      oppVal: metrics.avgOverall,
      userVal: metrics.userComparison.userAvgOverall,
      oppText: `${metrics.avgOverall}`,
      userText: `${metrics.userComparison.userAvgOverall}`,
      higherIsBetter: true,
    },
    {
      label: 'OVR Quintetto',
      oppVal: metrics.startersOverall,
      userVal: metrics.userComparison.userStartersOverall,
      oppText: `${metrics.startersOverall}`,
      userText: `${metrics.userComparison.userStartersOverall}`,
      higherIsBetter: true,
    },
    {
      label: 'Punti Fatti / Partita',
      oppVal: metrics.ppgFor,
      userVal: metrics.userComparison.userPpgFor,
      oppText: `${metrics.ppgFor}`,
      userText: `${metrics.userComparison.userPpgFor}`,
      higherIsBetter: true,
    },
    {
      label: 'Punti Subiti / Partita',
      oppVal: metrics.ppgAgainst,
      userVal: metrics.userComparison.userPpgAgainst,
      oppText: `${metrics.ppgAgainst}`,
      userText: `${metrics.userComparison.userPpgAgainst}`,
      higherIsBetter: false,
    },
    {
      label: 'Chimica di Squadra',
      oppVal: team.chemistry,
      userVal: metrics.userComparison.userChemistry,
      oppText: `${team.chemistry}%`,
      userText: `${metrics.userComparison.userChemistry}%`,
      higherIsBetter: true,
    },
    {
      label: 'Budget Monte Ingaggi',
      oppVal: team.budget,
      userVal: metrics.userComparison.userBudget,
      oppText: formatEuro(team.budget),
      userText: formatEuro(metrics.userComparison.userBudget),
      higherIsBetter: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="fm-card rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase text-slate-400">Classifica</div>
          <div className="text-lg font-black text-white mt-0.5 tabular-nums">
            #{metrics.rank}{' '}
            <span className="text-xs font-semibold text-slate-400">
              ({metrics.wins}-{metrics.losses})
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {metrics.streak > 0
              ? `Striscia: ${metrics.streak}V`
              : metrics.streak < 0
              ? `Striscia: ${Math.abs(metrics.streak)}P`
              : 'Nessuna striscia'}
          </div>
        </div>

        <div className="fm-card rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase text-slate-400">Forza Tecnica</div>
          <div className="text-lg font-black text-orange-400 mt-0.5 tabular-nums">
            {metrics.avgOverall}{' '}
            <span className="text-xs font-semibold text-slate-400">
              (Start {metrics.startersOverall})
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Età media: {metrics.avgAge} anni
          </div>
        </div>

        <div className="fm-card rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase text-slate-400">Attacco / Difesa</div>
          <div className="text-lg font-black text-emerald-400 mt-0.5 tabular-nums">
            {metrics.ppgFor}{' '}
            <span className="text-xs font-semibold text-slate-400">vs {metrics.ppgAgainst}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Diff: {metrics.pointDiffPerGame > 0 ? `+${metrics.pointDiffPerGame}` : metrics.pointDiffPerGame} pt/g
          </div>
        </div>

        <div className="fm-card rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase text-slate-400">Monte Ingaggi</div>
          <div className="text-sm font-black text-amber-300 mt-1 truncate">
            {formatEuro(metrics.wageBill)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Budget: {formatEuro(team.budget)}
          </div>
        </div>

        <div className="fm-card rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase text-slate-400">Infermeria &amp; Quota ITA</div>
          <div className="text-lg font-black text-sky-300 mt-0.5 tabular-nums">
            {metrics.italiansCount} ITA{' '}
            <span className="text-xs font-semibold text-slate-400">/ {metrics.foreignersCount} EST</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {metrics.injuredCount > 0 ? (
              <span className="text-rose-400 font-bold">{metrics.injuredCount} infortunati</span>
            ) : (
              'Nessun infortunato'
            )}
          </div>
        </div>
      </div>

      {/* 2. Probabile Quintetto Base */}
      <div className="fm-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange-400">
            <Users className="w-4 h-4" />
            Probabile Quintetto Base
          </div>
          <span className="text-[11px] text-slate-400">
            Clicca un giocatore per aprire il profilo completo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {metrics.starters.map((p) => {
            const gp = Math.max(1, p.seasonStats.gamesPlayed);
            const ppg = p.seasonStats.gamesPlayed > 0 ? (p.seasonStats.points / gp).toFixed(1) : '0.0';
            const rpg = p.seasonStats.gamesPlayed > 0 ? (p.seasonStats.rebounds / gp).toFixed(1) : '0.0';
            const apg = p.seasonStats.gamesPlayed > 0 ? (p.seasonStats.assists / gp).toFixed(1) : '0.0';

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenPlayerProfile(p.id)}
                className="text-left p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-orange-500/60 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-black">
                    {p.primaryPosition}
                  </span>
                  <span className="text-[11px] font-black text-emerald-300 tabular-nums">
                    OVR {formatOvr(p)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 min-w-0">
                  <CountryFlag nationality={p.nationality} size="sm" />
                  <span className="text-xs font-extrabold text-white truncate">
                    {p.firstName[0]}. {p.lastName}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 tabular-nums">
                  {ppg}p · {rpg}r · {apg}a
                </div>
                {p.injuryWeeks > 0 && (
                  <div className="text-[10px] font-bold text-rose-400">
                    Infortunato ({p.injuryWeeks} sett.)
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Leader Statistici + Confronto Diretto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="fm-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            <Award className="w-4 h-4" />
            Leader Statistici del Club
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {leaderCards.map((lc) => (
              <div
                key={lc.title}
                className="p-3 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1"
              >
                <div className="text-[10px] font-bold uppercase text-slate-400">{lc.title}</div>
                {lc.player ? (
                  <button
                    type="button"
                    onClick={() => onOpenPlayerProfile(lc.player!.id)}
                    className="w-full text-left flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <span className="text-xs font-extrabold text-white group-hover:text-orange-400 truncate">
                      {lc.player.firstName} {lc.player.lastName}
                    </span>
                    <span className={`text-xs font-black shrink-0 tabular-nums ${lc.accent}`}>
                      {lc.statLabel}
                    </span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">Nessun dato</span>
                )}
              </div>
            ))}
          </div>

          {/* Identità tattica rapida */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-sky-400">
              <Shield className="w-3.5 h-3.5" />
              Identità Tattica
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                Ritmo: <b>{team.tactics.pace}</b>
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                Attacco: <b>{team.tactics.offensiveFocus}</b>
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                Difesa: <b>{team.tactics.defense}</b>
              </span>
              {team.tactics.pnrCoverage && (
                <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                  P&amp;R: <b>{team.tactics.pnrCoverage}</b>
                </span>
              )}
              {team.tactics.defensiveIntensity && (
                <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                  Intensità: <b>{team.tactics.defensiveIntensity}</b>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="fm-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
              <TrendingUp className="w-4 h-4" />
              Confronto Diretto vs {userTeam.shortName}
            </div>
            <span className="text-[10px] text-slate-400">
              {team.shortName} vs {userTeam.shortName}
            </span>
          </div>

          <div className="space-y-2">
            {comparisonRows.map((row) => {
              const userBetter = row.higherIsBetter
                ? row.userVal >= row.oppVal
                : row.userVal <= row.oppVal;
              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-950/75 border border-slate-800 text-xs"
                >
                  <span className="text-slate-400 font-medium">{row.label}</span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="font-bold text-slate-200">{row.oppText}</span>
                    <span className="text-[10px] text-slate-600">vs</span>
                    <span
                      className={`font-extrabold ${
                        userBetter ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {row.userText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {metrics.h2hGames.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                Bilancio scontri diretti in stagione:
              </span>
              <span className="font-extrabold text-white">
                {userTeam.shortName} {metrics.h2hLosses} - {metrics.h2hWins} {team.shortName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
