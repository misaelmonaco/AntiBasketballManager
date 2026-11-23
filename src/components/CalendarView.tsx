import React, { useEffect, useState } from 'react';
import { BarChart3, Trophy, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { computeStandings } from '../engine/seasonEngine';
import { getIsoYearMonth, getRoundDate } from '../engine/calendarUtils';
import { getLeagueConfig, LEAGUES } from '../data/teams';
import { LeagueId } from '../types';
import {
  CalendarGameBadge,
  MonthScheduledGame,
  MonthlyCalendarPanel,
} from './calendar/MonthlyCalendarPanel';
import { LeaderCategory, LeagueLeadersPanel } from './calendar/LeagueLeadersPanel';
import { CompetitionsPanel } from './calendar/CompetitionsPanel';
import { MatchBoxScoreModal } from './calendar/MatchBoxScoreModal';
import { PageHeader } from './PageHeader';

interface CalendarViewProps {
  defaultTab?: 'monthly' | 'standings';
}

export const CalendarView: React.FC<CalendarViewProps> = ({ defaultTab = 'monthly' }) => {
  const { career, requestFastSim, openPlayerProfile, openTeamProfile } = useGameStore();
  const [subTab, setSubTab] = useState<
    'standings' | 'schedule' | 'monthly' | 'leaders' | 'playoffs' | 'cups'
  >(defaultTab);
  const [leaderCat, setLeaderCat] = useState<LeaderCategory>('ppg');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    setSubTab(defaultTab);
  }, [defaultTab]);

  const userTeam = career?.teams.find((t) => t.id === career.userTeamId);
  const userLeagueId: LeagueId = userTeam?.leagueId ?? 'ITA_LBA';
  const [selectedLeagueId, setSelectedLeagueId] = useState<LeagueId>(userLeagueId);

  const selectedLeagueCfg = getLeagueConfig(selectedLeagueId);
  const userLeagueCfg = getLeagueConfig(userLeagueId);

  const [viewRound, setViewRound] = useState<number>(
    career ? Math.min(selectedLeagueCfg.totalRounds, career.currentRound) : 1
  );

  const initialDate = career
    ? career.currentDate ??
      getRoundDate(career.seasonYear, career.currentRound, userLeagueCfg.totalRounds)
    : '2026-10-04';
  const initialYM = getIsoYearMonth(initialDate);
  const [calYear, setCalYear] = useState(initialYM.year);
  const [calMonth, setCalMonth] = useState(initialYM.monthIndex0);

  if (!career) return null;

  const currentDate =
    career.currentDate ??
    getRoundDate(career.seasonYear, career.currentRound, userLeagueCfg.totalRounds);

  const leagueTeams = career.teams.filter(
    (t) => (t.leagueId ?? 'ITA_LBA') === selectedLeagueId
  );
  const leagueSchedule = career.schedule.filter(
    (g) => (g.leagueId ?? 'ITA_LBA') === selectedLeagueId
  );

  const standings = computeStandings(leagueTeams, leagueSchedule);
  const teamMap = new Map(career.teams.map((t) => [t.id, t]));
  const clampedViewRound = Math.min(selectedLeagueCfg.totalRounds, Math.max(1, viewRound));
  const roundGames = leagueSchedule.filter((g) => g.round === clampedViewRound);

  // Mappa data -> tutte le partite schedulate del campionato selezionato
  const gamesByDate = new Map<string, MonthScheduledGame[]>();
  for (const g of leagueSchedule) {
    const d = getRoundDate(career.seasonYear, g.round, selectedLeagueCfg.totalRounds);
    const home = teamMap.get(g.homeTeamId);
    const away = teamMap.get(g.awayTeamId);
    const list = gamesByDate.get(d) ?? [];
    list.push({
      id: g.id,
      date: d,
      round: g.round,
      homeName: home?.name ?? g.homeTeamId,
      awayName: away?.name ?? g.awayTeamId,
      homeShort: home?.shortName ?? 'HOM',
      awayShort: away?.shortName ?? 'AWY',
      isUserGame: g.homeTeamId === career.userTeamId || g.awayTeamId === career.userTeamId,
      played: g.played,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
    });
    gamesByDate.set(d, list);
  }

  // Mappa data -> partita della nostra squadra in Regular Season
  const userGameByDate = new Map<string, CalendarGameBadge>();
  for (const g of career.schedule) {
    if (g.homeTeamId === career.userTeamId || g.awayTeamId === career.userTeamId) {
      const isHome = g.homeTeamId === career.userTeamId;
      const oppId = isHome ? g.awayTeamId : g.homeTeamId;
      const d = getRoundDate(career.seasonYear, g.round, userLeagueCfg.totalRounds);
      userGameByDate.set(d, {
        gameId: g.id,
        round: g.round,
        oppShort: teamMap.get(oppId)?.shortName ?? 'OPP',
        isHome,
        played: g.played,
        score: g.played ? `${g.homeScore}-${g.awayScore}` : undefined,
      });
    }
  }

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Stagione & Risultati"
        title="Calendario & Competizioni"
        subtitle={`${selectedLeagueCfg.name} (${selectedLeagueCfg.totalRounds} giornate) • Playoff Top 8 al meglio delle 5 gare`}
        right={
          <>
            {(subTab === 'standings' ||
              subTab === 'schedule' ||
              subTab === 'monthly' ||
              subTab === 'leaders') && (
              <select
                value={selectedLeagueId}
                onChange={(e) => {
                  const nextLid = e.target.value as LeagueId;
                  setSelectedLeagueId(nextLid);
                  const nextCfg = getLeagueConfig(nextLid);
                  setViewRound((r) => Math.min(r, nextCfg.totalRounds));
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-xs font-bold text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {LEAGUES.map((lg) => (
                  <option key={lg.id} value={lg.id}>
                    {lg.name} ({lg.tier})
                  </option>
                ))}
              </select>
            )}

            <div className="fm-tabs">
              {(
                [
                  ['standings', 'Classifica'],
                  ['schedule', 'Giornate'],
                  ['monthly', 'Mensile'],
                  ['leaders', 'Leader'],
                  ['playoffs', 'Playoff'],
                  ['cups', 'Coppe & Europa'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setSubTab(id)}
                  className={`fm-tab ${subTab === id ? 'fm-tab-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        }
      />

      {subTab === 'standings' && (
        <div className="fm-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="fm-table-head">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-3">Squadra</th>
                  <th className="py-3 px-2 text-center">G</th>
                  <th className="py-3 px-2 text-center">V</th>
                  <th className="py-3 px-2 text-center">P</th>
                  <th className="py-3 px-2 text-center font-bold text-white">PT</th>
                  <th className="py-3 px-2 text-center">PF</th>
                  <th className="py-3 px-2 text-center">PS</th>
                  <th className="py-3 px-2 text-center">Diff</th>
                  <th className="py-3 px-3 text-center">Striscia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {standings.map((row, idx) => {
                  const diff = row.pointsFor - row.pointsAgainst;
                  const isUser = row.teamId === career.userTeamId;
                  const directPromoCount = selectedLeagueCfg.directPromotionSpots ?? 0;
                  const playoffStartIdx = (selectedLeagueCfg.playoffStartRank ?? 1) - 1;
                  const isDirectPromotion = idx < directPromoCount;
                  const isPlayoffZone =
                    idx >= playoffStartIdx &&
                    idx < playoffStartIdx + selectedLeagueCfg.playoffTeams;
                  const isRelegation =
                    selectedLeagueCfg.relegationSpots > 0 &&
                    idx >= standings.length - selectedLeagueCfg.relegationSpots;
                  return (
                    <tr
                      key={row.teamId}
                      className={`${
                        isUser
                          ? 'bg-orange-500/10 text-orange-200 font-bold'
                          : 'hover:bg-slate-800/40 text-slate-200'
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block w-6 text-center py-0.5 rounded font-bold ${
                            isDirectPromotion
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : isPlayoffZone
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : isRelegation
                              ? 'bg-red-500/15 text-red-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.primaryColor }}
                        />
                        {isUser ? (
                          <span>{row.teamName}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openTeamProfile(row.teamId)}
                            className="text-left hover:text-orange-400 hover:underline cursor-pointer"
                            title="Ispeziona squadra avversaria"
                          >
                            {row.teamName}
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">{row.played}</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400">{row.wins}</td>
                      <td className="py-2.5 px-2 text-center text-red-400">{row.losses}</td>
                      <td className="py-2.5 px-2 text-center font-extrabold text-white">
                        {row.leaguePoints}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-400">{row.pointsFor}</td>
                      <td className="py-2.5 px-2 text-center text-slate-400">{row.pointsAgainst}</td>
                      <td
                        className={`py-2.5 px-2 text-center font-semibold ${
                          diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.streak !== 0 ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.streak > 0
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-red-500/15 text-red-300'
                            }`}
                          >
                            {row.streak > 0 ? `V${row.streak}` : `P${Math.abs(row.streak)}`}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 bg-slate-950/70 border-t border-slate-800 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            {(selectedLeagueCfg.directPromotionSpots ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-sky-500/40 border border-sky-400" />
                Promozione diretta in LBA (1°)
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/40" />
              Playoff ({selectedLeagueCfg.playoffStartRank ?? 1}°–
              {(selectedLeagueCfg.playoffStartRank ?? 1) + selectedLeagueCfg.playoffTeams - 1}°)
              {selectedLeagueCfg.id === 'ITA_A2' ? ' • Vincente sale in LBA' : ''}
            </span>
            {selectedLeagueCfg.relegationSpots > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-500/40" />
                Retrocessione (ultime {selectedLeagueCfg.relegationSpots}
                {selectedLeagueCfg.id === 'ITA_LBA' ? ' in Serie A2' : ''})
              </span>
            )}
          </div>
        </div>
      )}

      {subTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between fm-card rounded-2xl p-3.5">
            <button
              onClick={() => setViewRound((r) => Math.max(1, r - 1))}
              disabled={viewRound <= 1}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Calendar className="w-4 h-4 text-orange-400" />
              Giornata {clampedViewRound} / {selectedLeagueCfg.totalRounds}
            </div>
            <button
              onClick={() => setViewRound((r) => Math.min(selectedLeagueCfg.totalRounds, r + 1))}
              disabled={clampedViewRound >= selectedLeagueCfg.totalRounds}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roundGames.map((g) => {
              const home = teamMap.get(g.homeTeamId)!;
              const away = teamMap.get(g.awayTeamId)!;
              const isUserGame =
                home.id === career.userTeamId || away.id === career.userTeamId;
              return (
                <div
                  key={g.id}
                  className={`p-4 rounded-xl border ${
                    isUserGame
                      ? 'bg-orange-500/10 border-orange-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-white w-2/5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: home.primaryColor }}
                      />
                      <span className="truncate">{home.name}</span>
                    </div>

                    <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 font-extrabold text-sm text-orange-400">
                      {g.played ? `${g.homeScore} - ${g.awayScore}` : 'VS'}
                    </div>

                    <div className="flex items-center justify-end gap-2 font-bold text-white w-2/5 truncate">
                      <span className="truncate">{away.name}</span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: away.primaryColor }}
                      />
                    </div>
                  </div>
                  {g.played && g.summary && (
                    <div className="mt-2 pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="truncate">
                        {g.summary.homeTopScorer.name} ({g.summary.homeTopScorer.points} pt)
                      </span>
                      <button
                        onClick={() => setSelectedGameId(g.id)}
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
                      >
                        <BarChart3 className="w-3 h-3 text-orange-400" />
                        Tabellino
                      </button>
                      <span className="truncate text-right">
                        {g.summary.awayTopScorer.name} ({g.summary.awayTopScorer.points} pt)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'monthly' && (
        <MonthlyCalendarPanel
          calYear={calYear}
          calMonth={calMonth}
          currentDate={currentDate}
          phase={career.phase}
          userGameByDate={userGameByDate}
          gamesByDate={gamesByDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onRequestFastSim={requestFastSim}
          onSelectPlayedGame={setSelectedGameId}
        />
      )}

      {subTab === 'leaders' && (
        <LeagueLeadersPanel
          teams={leagueTeams}
          userTeamId={career.userTeamId}
          leaderCat={leaderCat}
          onSelectCategory={setLeaderCat}
          onOpenPlayerProfile={openPlayerProfile}
        />
      )}

      {subTab === 'cups' && (
        <CompetitionsPanel
          coppaItalia={career.coppaItalia}
          euroLeagues={career.euroLeagues}
          userTeamId={career.userTeamId}
        />
      )}

      {subTab === 'playoffs' && (
        <div className="space-y-4">
          {career.playoffs.length === 0 ? (
            <div className="fm-card rounded-2xl p-10 text-center text-slate-400 text-sm">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              I Playoff di {userLeagueCfg.name} inizieranno automaticamente al termine delle{' '}
              {userLeagueCfg.totalRounds} giornate di Regular Season.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {career.playoffs.map((s) => {
                const hi = teamMap.get(s.higherSeedId)!;
                const lo = teamMap.get(s.lowerSeedId)!;
                return (
                  <div
                    key={s.id}
                    className="fm-card rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] uppercase font-bold text-orange-400">
                      <span>{s.stage}</span>
                      <span>Al meglio delle {s.bestOf}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-white">
                      <span>{hi.name}</span>
                      <span className="text-orange-400">{s.higherSeedWins}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-white">
                      <span>{lo.name}</span>
                      <span className="text-orange-400">{s.lowerSeedWins}</span>
                    </div>
                    {s.winnerId && (
                      <div className="text-xs text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                        Qualificata: {teamMap.get(s.winnerId)?.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedGameId && (() => {
        const selectedGame = career.schedule.find((g) => g.id === selectedGameId);
        if (!selectedGame || !selectedGame.played) return null;
        const home = teamMap.get(selectedGame.homeTeamId);
        const away = teamMap.get(selectedGame.awayTeamId);
        if (!home || !away) return null;
        const gameLeagueCfg = getLeagueConfig(selectedGame.leagueId ?? 'ITA_LBA');
        const date = getRoundDate(career.seasonYear, selectedGame.round, gameLeagueCfg.totalRounds);
        return (
          <MatchBoxScoreModal
            game={selectedGame}
            date={date}
            homeTeam={home}
            awayTeam={away}
            onClose={() => setSelectedGameId(null)}
            onOpenPlayerProfile={(playerId) => {
              setSelectedGameId(null);
              openPlayerProfile(playerId);
            }}
          />
        );
      })()}
    </div>
  );
};
