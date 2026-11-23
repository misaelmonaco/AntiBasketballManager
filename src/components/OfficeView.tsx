import React from 'react';
import {
  Play,
  AlertTriangle,
  CheckCircle2,
  Newspaper,
  Wallet,
  Trophy,
  ArrowRight,
  MapPin,
  MessageSquare,
  Building2,
  Mic,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { ClubBadge } from './ClubBadge';
import { LEAGUES } from '../data/teams';
import {
  calculateWageBill,
  formatEuro,
  validateRoster6Plus6,
} from '../engine/ratings';
import { computeStandings, getNextPlayoffGameTeams } from '../engine/seasonEngine';
import {
  OfficeManagerConfidenceBar,
  OfficeOffseasonBanner,
  OfficeRegulationBanner,
  OfficeSeasonFinishedBanner,
} from './office/OfficeBanners';

export const OfficeView: React.FC = () => {
  const {
    career,
    startUserMatch,
    startNextSeason,
    startRegularSeasonFromOffseason,
    openRosterComplianceModal,
    openChatModal,
    dismissRegulationAlert,
    setActiveTab,
    setToast,
  } = useGameStore();
  if (!career) return null;

  const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
  const validation = validateRoster6Plus6(
    userTeam.roster,
    userTeam.leagueId,
    userTeam.lbaRosterFormat
  );
  const wageBill = calculateWageBill(userTeam.roster);
  const freeCap = userTeam.budget - wageBill;
  const userLeagueId = userTeam.leagueId ?? 'ITA_LBA';
  const standings = computeStandings(
    career.teams.filter((t) => (t.leagueId ?? 'ITA_LBA') === userLeagueId),
    career.schedule.filter((g) => (g.leagueId ?? 'ITA_LBA') === userLeagueId)
  );
  const userRank = standings.findIndex((s) => s.teamId === userTeam.id) + 1;

  let nextOpponent = null as typeof userTeam | null;
  let isHome = true;
  let matchLabel = `Giornata ${career.currentRound} • Regular Season`;

  if (career.phase === 'regular') {
    const g = career.schedule.find(
      (x) =>
        x.round === career.currentRound &&
        !x.played &&
        (x.homeTeamId === userTeam.id || x.awayTeamId === userTeam.id)
    );
    if (g) {
      isHome = g.homeTeamId === userTeam.id;
      const oppId = isHome ? g.awayTeamId : g.homeTeamId;
      nextOpponent = career.teams.find((t) => t.id === oppId) ?? null;
    }
  } else if (career.phase === 'playoffs') {
    const series = career.playoffs.find(
      (s) => !s.winnerId && (s.higherSeedId === userTeam.id || s.lowerSeedId === userTeam.id)
    );
    if (series) {
      const { homeTeamId, awayTeamId } = getNextPlayoffGameTeams(series);
      isHome = homeTeamId === userTeam.id;
      const oppId = isHome ? awayTeamId : homeTeamId;
      nextOpponent = career.teams.find((t) => t.id === oppId) ?? null;
      matchLabel = `Playoff ${series.stage} • Gara ${series.games.length + 1}`;
    }
  }

  const handlePlay = () => {
    const res = startUserMatch();
    if (!res.ok && res.error) {
      setToast(res.error);
    }
  };

  const leagueLabel =
    LEAGUES.find((l) => l.id === userTeam.leagueId)?.name ?? 'Serie A LBA';

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full tactical-grid-bg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <ClubBadge
            shortName={userTeam.shortName}
            primaryColor={userTeam.primaryColor}
            secondaryColor={userTeam.secondaryColor}
            size="md"
          />
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-400">
              {leagueLabel} • Stagione {career.seasonYear}/{String(career.seasonYear + 1).slice(-2)}
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Ufficio Tecnico — {userTeam.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openChatModal({ channel: 'player' })}
            className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/35 text-xs font-bold text-sky-300 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat Giocatori
          </button>
          <button
            type="button"
            onClick={() => openChatModal({ channel: 'board' })}
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/35 text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            Dirigenza
          </button>
          <button
            type="button"
            onClick={() => openChatModal({ channel: 'media' })}
            className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 text-xs font-bold text-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            Media
          </button>

          <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center gap-2">
            <span className="text-slate-400">Classifica:</span>
            <span className="text-base font-black text-orange-400 tabular-nums">{userRank}°</span>
          </div>

          {career.phase === 'finished' && career.championTeamId && (
            <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Campione:{' '}
              {career.teams.find((t) => t.id === career.championTeamId)?.name}
            </div>
          )}
        </div>
      </div>

      {career.regulationAlert && (
        <OfficeRegulationBanner
          regulationAlert={career.regulationAlert}
          onOpenCompliance={openRosterComplianceModal}
          onDismiss={dismissRegulationAlert}
        />
      )}

      {career.phase === 'offseason' && (
        <OfficeOffseasonBanner
          seasonYear={career.seasonYear}
          validation={validation}
          incomingOffersCount={career.incomingOffers.length}
          onOpenCompliance={openRosterComplianceModal}
          onOpenMarket={() => setActiveTab('market')}
          onStartRegularSeason={() => {
            const res = startRegularSeasonFromOffseason();
            if (!res.ok && res.error) setToast(res.error);
          }}
        />
      )}

      {career.phase === 'finished' && (
        <OfficeSeasonFinishedBanner
          career={career}
          userLeagueId={userLeagueId}
          onStartNextSeason={() => void startNextSeason()}
        />
      )}

      <OfficeManagerConfidenceBar career={career} userTeam={userTeam} />

      {/* Top Row: Broadcast Matchday Hero + Finances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Broadcast Matchday Hero Card */}
        <div className="lg:col-span-2 fm-panel rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-300 bg-orange-500/15 px-3 py-1 rounded-lg border border-orange-500/30">
                {matchLabel}
              </span>
              {validation.valid ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Referto Valido ({validation.itaCount} ITA / {validation.foreignCount} STR)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/25">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Referto non conforme
                </span>
              )}
            </div>

            {nextOpponent ? (
              (() => {
                const homeTeam = isHome ? userTeam : nextOpponent;
                const awayTeam = isHome ? nextOpponent : userTeam;
                return (
                  <div className="relative overflow-hidden bg-slate-950/90 border border-white/15 rounded-2xl p-5 my-2 shadow-2xl">
                    {/* Diagonal FM20 split between Home & Away club colors */}
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-20"
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 82% 100%, 0% 100%)',
                        background: `linear-gradient(135deg, ${homeTeam.primaryColor}, transparent)`,
                      }}
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-20"
                      style={{
                        clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)',
                        background: `linear-gradient(225deg, ${awayTeam.primaryColor}, transparent)`,
                      }}
                    />
                    <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                      {/* Home */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <ClubBadge
                          shortName={homeTeam.shortName}
                          primaryColor={homeTeam.primaryColor}
                          secondaryColor={homeTeam.secondaryColor}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <div className="text-[10px] text-orange-400 uppercase font-extrabold tracking-widest">
                            Casa
                          </div>
                          <div className="text-base sm:text-lg font-black text-white truncate">
                            {homeTeam.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {homeTeam.city}
                          </div>
                        </div>
                      </div>

                      {/* VS */}
                      <div className="text-center px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="text-xs font-black tracking-widest text-orange-400">VS</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1 max-w-[140px] truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{homeTeam.arena}</span>
                        </div>
                      </div>

                      {/* Away */}
                      <div className="flex items-center justify-end gap-3.5 min-w-0 text-right">
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest">
                            Trasferta
                          </div>
                          <div className="text-base sm:text-lg font-black text-white truncate">
                            {awayTeam.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {awayTeam.city}
                          </div>
                        </div>
                        <ClubBadge
                          shortName={awayTeam.shortName}
                          primaryColor={awayTeam.primaryColor}
                          secondaryColor={awayTeam.secondaryColor}
                          size="lg"
                        />
                      </div>
                    </div>

                    {/* Report Pre-Partita Avversario */}
                    {(() => {
                      const oppGames = career.schedule
                        .filter(
                          (g) =>
                            g.played &&
                            (g.homeTeamId === nextOpponent.id || g.awayTeamId === nextOpponent.id)
                        )
                        .slice(-5);
                      const oppTopScorer = [...nextOpponent.roster].sort(
                        (a, b) =>
                          b.seasonStats.points / Math.max(1, b.seasonStats.gamesPlayed) -
                          a.seasonStats.points / Math.max(1, a.seasonStats.gamesPlayed)
                      )[0];
                      const oppPpg =
                        oppTopScorer && oppTopScorer.seasonStats.gamesPlayed > 0
                          ? (oppTopScorer.seasonStats.points / oppTopScorer.seasonStats.gamesPlayed).toFixed(1)
                          : null;
                      return (
                        <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-semibold">
                              Forma {nextOpponent.shortName}:
                            </span>
                            {oppGames.length === 0 ? (
                              <span className="text-slate-500">Esordio</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                {oppGames.map((og) => {
                                  const won =
                                    (og.homeTeamId === nextOpponent.id &&
                                      (og.homeScore ?? 0) > (og.awayScore ?? 0)) ||
                                    (og.awayTeamId === nextOpponent.id &&
                                      (og.awayScore ?? 0) > (og.homeScore ?? 0));
                                  return (
                                    <span
                                      key={og.id}
                                      className={`w-5 h-5 rounded flex items-center justify-center font-black text-[10px] ${
                                        won
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                      }`}
                                    >
                                      {won ? 'V' : 'P'}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {oppTopScorer && (
                            <div className="text-slate-300">
                              Pericolo #1:{' '}
                              <b className="text-orange-300">
                                {oppTopScorer.firstName[0]}. {oppTopScorer.lastName}
                              </b>{' '}
                              (OVR {oppTopScorer.overall}
                              {oppPpg ? ` • ${oppPpg} PPG` : ''}) • Difesa:{' '}
                              <b className="text-sky-300">{nextOpponent.tactics.defense}</b>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm bg-slate-950/60 rounded-xl border border-slate-800">
                Nessuna partita in programma al momento. Controlla il tabellone nel Calendario.
              </div>
            )}

            {!validation.valid && (
              <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-xs text-red-200 flex items-center justify-between gap-3">
                <span>{validation.errors[0]}</span>
                <button
                  onClick={() => setActiveTab('roster')}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shrink-0 cursor-pointer"
                >
                  Sistema Roster
                </button>
              </div>
            )}
          </div>

          {nextOpponent && (
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveTab('tactics')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Rivedi Tattica
              </button>
              <button
                onClick={handlePlay}
                disabled={!validation.valid}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Gioca Partita Live
              </button>
            </div>
          )}
        </div>

        {/* Finances Card */}
        <div className="fm-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-white mb-4 uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-orange-400" />
              Stato Finanziario
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Budget Societario</span>
                <span className="font-black text-white tabular-nums">{formatEuro(userTeam.budget)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Monte Ingaggi</span>
                <span className="font-bold text-amber-400 tabular-nums">{formatEuro(wageBill)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-slate-300 font-semibold">Spazio Salariale</span>
                <span
                  className={`font-black tabular-nums ${
                    freeCap >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatEuro(freeCap)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    wageBill / userTeam.budget > 0.95 ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, (wageBill / userTeam.budget) * 100)}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 text-right tabular-nums">
                {Math.round((wageBill / userTeam.budget) * 100)}% del budget utilizzato
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('free_agents')}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 text-xs font-bold text-orange-400 cursor-pointer transition-colors"
          >
            Esplora Mercato Svincolati
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Quick Standings + News */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick Standings */}
        <div className="fm-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-400" />
              Classifica {leagueLabel} (Top 8)
            </h2>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
            >
              Completa →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <th className="py-2 text-left">#</th>
                  <th className="py-2 text-left">Squadra</th>
                  <th className="py-2 text-center">G</th>
                  <th className="py-2 text-center">V-P</th>
                  <th className="py-2 text-right">PT</th>
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 8).map((row, idx) => {
                  const isUser = row.teamId === userTeam.id;
                  return (
                    <tr
                      key={row.teamId}
                      className={`border-b border-slate-800/50 ${
                        isUser ? 'bg-orange-500/15 text-orange-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-2 tabular-nums font-bold">{idx + 1}</td>
                      <td className="py-2 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/15"
                          style={{ backgroundColor: row.primaryColor }}
                        />
                        <span className="truncate">{row.teamName}</span>
                      </td>
                      <td className="py-2 text-center tabular-nums">{row.played}</td>
                      <td className="py-2 text-center tabular-nums">
                        {row.wins}-{row.losses}
                      </td>
                      <td className="py-2 text-right font-black tabular-nums">{row.leaguePoints}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic News */}
        <div className="fm-card rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-black text-white mb-4 uppercase tracking-wider">
            <Newspaper className="w-4 h-4 text-orange-400" />
            Ultime News dalla Lega
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {career.news.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/25 text-orange-300">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">Giornata {item.round}</span>
                </div>
                <div className="text-xs font-bold text-slate-100">{item.title}</div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
