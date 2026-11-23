import { MatchState } from '../../types';
import { addDays, getRoundDate } from '../../engine/calendarUtils';
import { computeAssistantTactics } from '../../engine/assistantCoachTactics';
import { getTeamBoardObjective } from '../../engine/managerEngine';
import { generateIncomingTransferOffer } from '../../engine/scoutingEngine';
import {
  applyWeeklyTrainingAndRecovery,
  updateMoraleAndChemistryAfterMatch,
} from '../../engine/clubEngine';
import { advanceDailyIndividualTrainingPrograms } from '../../engine/trainingProgramEngine';
import { validateRoster6Plus6 } from '../../engine/ratings';
import {
  advanceCoppaItaliaIfReady,
  getUserLeagueTotalRounds,
  simulateEuroRound,
} from '../../engine/competitionsEngine';
import { advanceCareerToNextSeason } from '../../engine/seasonTransition';
import { runCpuInSeasonMarket } from '../../engine/cpuMarketEngine';
import {
  applyTimeoutTactics,
  callTimeout,
  initMatchState,
  simulateFullMatch,
  simulateNextPossession,
  substitutePlayer,
} from '../../engine/matchSimulator';
import {
  applyMatchStatsToTeams,
  checkAndAdvancePlayoffs,
  computeStandings,
  createPlayoffQuarterfinals,
  generateRoundNews,
  getNextPlayoffGameTeams,
} from '../../engine/seasonEngine';
import { saveCareerToSlot } from '../../services/saveService';
import {
  buildGameSummaryBox,
  evaluateUserConfidenceAndFiring,
} from '../storeHelpers';
import { GameStore, StoreGet, StoreSet } from '../storeTypes';

type LiveMatchSliceKeys =
  | 'startUserMatch'
  | 'stepLiveMatch'
  | 'simulateLiveMatchToEnd'
  | 'userCallTimeout'
  | 'userApplyTimeoutTactics'
  | 'userSubstitute'
  | 'startNextSeason'
  | 'dismissRegulationAlert'
  | 'markMessageRead'
  | 'markAllMessagesRead'
  | 'deleteMessage'
  | 'resolveMessageChoice'
  | 'completeLiveMatchAndAdvance';

export function createLiveMatchSlice(
  set: StoreSet,
  get: StoreGet
): Pick<GameStore, LiveMatchSliceKeys> {
  return {
    startUserMatch: () => {
      const { career } = get();
      if (!career) return { ok: false, error: 'Nessuna carriera attiva.' };
      if (career.phase === 'offseason') {
        set({ rosterComplianceModalOpen: true });
        return {
          ok: false,
          error:
            'Sei in Offseason: completa il mercato e avvia la Regular Season prima di giocare.',
        };
      }
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return { ok: false, error: 'Squadra utente non trovata.' };

      const validation = validateRoster6Plus6(
        userTeam.roster,
        userTeam.leagueId,
        userTeam.lbaRosterFormat
      );
      if (!validation.valid) {
        set({ rosterComplianceModalOpen: true });
        return {
          ok: false,
          error: validation.errors[0],
        };
      }

      if (career.phase === 'regular') {
        const game = career.schedule.find(
          (g) =>
            g.round === career.currentRound &&
            !g.played &&
            (g.homeTeamId === userTeam.id || g.awayTeamId === userTeam.id)
        );
        if (!game) {
          return { ok: false, error: 'Nessuna partita trovata per questa giornata.' };
        }
        let homeTeam = career.teams.find((t) => t.id === game.homeTeamId)!;
        let awayTeam = career.teams.find((t) => t.id === game.awayTeamId)!;
        let nextTeams = career.teams;
        let delegateMsg: string | undefined;
        if (userTeam.tactics.delegateToAssistant) {
          const opp = homeTeam.id === userTeam.id ? awayTeam : homeTeam;
          const { tactics, summary } = computeAssistantTactics(userTeam, opp);
          delegateMsg = summary;
          nextTeams = career.teams.map((t) =>
            t.id === userTeam.id ? { ...t, tactics } : t
          );
          homeTeam = nextTeams.find((t) => t.id === game.homeTeamId)!;
          awayTeam = nextTeams.find((t) => t.id === game.awayTeamId)!;
        }
        const match = initMatchState(game.id, game.round, homeTeam, awayTeam, false);
        set({
          career:
            nextTeams !== career.teams ? { ...career, teams: nextTeams } : career,
          liveMatch: match,
          screen: 'match',
          ...(delegateMsg ? { toast: delegateMsg } : {}),
        });
        return { ok: true };
      }

      if (career.phase === 'playoffs') {
        const activeSeries = career.playoffs.find(
          (s) =>
            !s.winnerId &&
            (s.higherSeedId === userTeam.id || s.lowerSeedId === userTeam.id)
        );
        if (!activeSeries) {
          return { ok: false, error: 'La tua squadra non ha serie playoff attive.' };
        }
        const { homeTeamId, awayTeamId } = getNextPlayoffGameTeams(activeSeries);
        let homeTeam = career.teams.find((t) => t.id === homeTeamId)!;
        let awayTeam = career.teams.find((t) => t.id === awayTeamId)!;
        let nextTeams = career.teams;
        let delegateMsg: string | undefined;
        if (userTeam.tactics.delegateToAssistant) {
          const opp = homeTeam.id === userTeam.id ? awayTeam : homeTeam;
          const { tactics, summary } = computeAssistantTactics(userTeam, opp);
          delegateMsg = summary;
          nextTeams = career.teams.map((t) =>
            t.id === userTeam.id ? { ...t, tactics } : t
          );
          homeTeam = nextTeams.find((t) => t.id === homeTeamId)!;
          awayTeam = nextTeams.find((t) => t.id === awayTeamId)!;
        }
        const match = initMatchState(
          `${activeSeries.id}_g${activeSeries.games.length + 1}`,
          career.currentRound,
          homeTeam,
          awayTeam,
          true,
          activeSeries.id
        );
        set({
          career:
            nextTeams !== career.teams ? { ...career, teams: nextTeams } : career,
          liveMatch: match,
          screen: 'match',
          ...(delegateMsg ? { toast: delegateMsg } : {}),
        });
        return { ok: true };
      }

      return { ok: false, error: 'La stagione è conclusa.' };
    },

    stepLiveMatch: () => {
      const { liveMatch, career, autoSubUser } = get();
      if (!liveMatch || !career || liveMatch.finished) return;
      const homeTeam = career.teams.find((t) => t.id === liveMatch.home.teamId)!;
      const awayTeam = career.teams.find((t) => t.id === liveMatch.away.teamId)!;
      const userIsHome = homeTeam.id === career.userTeamId;
      const updated = simulateNextPossession(
        liveMatch,
        homeTeam,
        awayTeam,
        userIsHome ? autoSubUser : true
      );
      set({ liveMatch: { ...updated } });
    },

    simulateLiveMatchToEnd: () => {
      const { liveMatch, career } = get();
      if (!liveMatch || !career || liveMatch.finished) return;
      const homeTeam = career.teams.find((t) => t.id === liveMatch.home.teamId)!;
      const awayTeam = career.teams.find((t) => t.id === liveMatch.away.teamId)!;
      let safety = 0;
      while (!liveMatch.finished && safety < 500) {
        simulateNextPossession(liveMatch, homeTeam, awayTeam, true);
        safety += 1;
      }
      set({ liveMatch: { ...liveMatch } });
    },

    userCallTimeout: () => {
      const { liveMatch, career } = get();
      if (!liveMatch || !career || liveMatch.finished) return;
      const side = liveMatch.home.teamId === career.userTeamId ? 'home' : 'away';
      const updated = callTimeout(liveMatch, side);
      set({ liveMatch: { ...updated } });
    },

    userApplyTimeoutTactics: (plan) => {
      const { liveMatch, career } = get();
      if (!liveMatch || !career || liveMatch.finished) return;
      const side = liveMatch.home.teamId === career.userTeamId ? 'home' : 'away';
      const updated = applyTimeoutTactics(liveMatch, side, plan);
      set({ liveMatch: { ...updated } });
    },

    userSubstitute: (outPlayerId, inPlayerId) => {
      const { liveMatch, career } = get();
      if (!liveMatch || !career) return;
      const side = liveMatch.home.teamId === career.userTeamId ? 'home' : 'away';
      const updated = substitutePlayer(liveMatch, side, outPlayerId, inPlayerId);
      set({ liveMatch: { ...updated } });
    },

    startNextSeason: async () => {
      const { career } = get();
      if (!career) return;
      const { nextCareer } = advanceCareerToNextSeason(career);
      try {
        await saveCareerToSlot(nextCareer);
      } catch (err) {
        console.error('Errore salvataggio nuova stagione:', err);
      }
      set({
        career: nextCareer,
        activeTab: 'office',
        firingContext: null,
        rosterComplianceModalOpen: true,
        toast: `Offseason & Mercato Estivo ${nextCareer.seasonYear}/${String(
          nextCareer.seasonYear + 1
        ).slice(-2)} avviati!`,
      });
    },

    dismissRegulationAlert: () => {
      const { career } = get();
      if (!career) return;
      set({ career: { ...career, regulationAlert: undefined } });
    },

    markMessageRead: (messageId) => {
      const { career } = get();
      if (!career) return;
      const msgs = (career.messages ?? []).map((m) =>
        m.id === messageId ? { ...m, read: true } : m
      );
      set({ career: { ...career, messages: msgs } });
    },

    markAllMessagesRead: () => {
      const { career } = get();
      if (!career) return;
      const msgs = (career.messages ?? []).map((m) => ({ ...m, read: true }));
      set({
        career: { ...career, messages: msgs },
        toast: 'Tutte le mail segnate come lette.',
      });
    },

    deleteMessage: (messageId) => {
      const { career } = get();
      if (!career) return;
      const msgs = (career.messages ?? []).filter((m) => m.id !== messageId);
      set({ career: { ...career, messages: msgs } });
    },

    resolveMessageChoice: (messageId, choiceId) => {
      const { career } = get();
      if (!career) return;
      const msg = (career.messages ?? []).find((m) => m.id === messageId);
      if (!msg || msg.resolvedChoiceId) return;

      let updatedTeams = career.teams;
      let nextUserTeamId = career.userTeamId;
      let nextBoardObjective = career.boardObjective;
      let nextConfidence = career.boardConfidence ?? 75;
      let resolutionNote = 'Decisione registrata.';

      if (msg.jobOfferTeamId) {
        const targetTeam = career.teams.find((t) => t.id === msg.jobOfferTeamId);
        if (choiceId === 'accept_job' && targetTeam) {
          nextUserTeamId = targetTeam.id;
          nextBoardObjective = getTeamBoardObjective(targetTeam.prestige);
          nextConfidence = 75;
          resolutionNote = `Hai firmato per ${targetTeam.name}! Ora sei alla guida del nuovo club.`;
        } else {
          nextConfidence = Math.min(99, nextConfidence + 5);
          resolutionNote =
            'Hai rifiutato l’offerta per restare fedele al tuo club (+5 Fiducia Dirigenza).';
        }
      } else if (msg.playerId) {
        const moraleDelta = choiceId === 'promise_minutes' ? 10 : -4;
        updatedTeams = career.teams.map((t) =>
          t.id !== career.userTeamId
            ? t
            : {
                ...t,
                roster: t.roster.map((p) =>
                  p.id === msg.playerId
                    ? {
                        ...p,
                        morale: Math.max(20, Math.min(99, p.morale + moraleDelta)),
                        minutePriority:
                          choiceId === 'promise_minutes'
                            ? ('Alta' as const)
                            : p.minutePriority,
                      }
                    : p
                ),
              }
        );
        resolutionNote =
          choiceId === 'promise_minutes'
            ? 'Hai promesso più minutaggio: il morale del giocatore è salito (+10).'
            : 'Hai difeso le tue scelte tecniche (-4 morale al giocatore).';
      }

      const updatedMsgs = (career.messages ?? []).map((m) =>
        m.id === messageId
          ? { ...m, read: true, resolvedChoiceId: choiceId, resolutionNote }
          : m
      );

      set({
        career: {
          ...career,
          userTeamId: nextUserTeamId,
          boardObjective: nextBoardObjective,
          boardConfidence: nextConfidence,
          teams: updatedTeams,
          messages: updatedMsgs,
        },
        toast: resolutionNote,
      });
    },

    completeLiveMatchAndAdvance: () => {
      const { liveMatch, career } = get();
      if (!liveMatch || !career || !liveMatch.finished) return;

      let updatedTeams = applyMatchStatsToTeams(career.teams, liveMatch);
      const teamMap = new Map(updatedTeams.map((t) => [t.id, t]));

      if (!liveMatch.isPlayoff) {
        const round = liveMatch.round;
        const otherGames = career.schedule.filter(
          (g) => g.round === round && !g.played && g.id !== liveMatch.gameId
        );

        const simResults = new Map<string, MatchState>();
        simResults.set(liveMatch.gameId, liveMatch);

        for (const g of otherGames) {
          const ht = teamMap.get(g.homeTeamId)!;
          const at = teamMap.get(g.awayTeamId)!;
          const res = simulateFullMatch(g.id, round, ht, at, false);
          simResults.set(g.id, res);
          updatedTeams = applyMatchStatsToTeams(updatedTeams, res);
          updatedTeams = updateMoraleAndChemistryAfterMatch(updatedTeams, res);
        }
        updatedTeams = updateMoraleAndChemistryAfterMatch(
          updatedTeams,
          liveMatch,
          career.userTeamId,
          career.managerProfile?.attributes.lockerRoom ?? 10,
          career.managerProfile?.reputation ?? 60
        );

        const trainingOutcome = applyWeeklyTrainingAndRecovery(
          updatedTeams,
          round,
          career.userTeamId,
          career.managerProfile?.attributes.youthDev ?? 10
        );
        updatedTeams = trainingOutcome.teams;

        const updatedSchedule = career.schedule.map((g) => {
          const res = simResults.get(g.id);
          if (!res) return g;
          return {
            ...g,
            played: true,
            homeScore: res.home.score,
            awayScore: res.away.score,
            summary: buildGameSummaryBox(res),
          };
        });

        const roundGames = updatedSchedule.filter((g) => g.round === round);
        const newNews = [
          ...trainingOutcome.news,
          ...generateRoundNews(round, updatedTeams, roundGames),
        ];

        let nextPhase = career.phase;
        let nextRound = round + 1;
        let playoffs = career.playoffs;
        const totalRounds = getUserLeagueTotalRounds(updatedTeams, career.userTeamId);
        const userLeagueId =
          updatedTeams.find((t) => t.id === career.userTeamId)?.leagueId ?? 'ITA_LBA';

        const nextEuroLeagues = career.euroLeagues
          ? simulateEuroRound(career.euroLeagues, updatedTeams)
          : undefined;
        const coppaRes = career.coppaItalia
          ? advanceCoppaItaliaIfReady(
              career.coppaItalia,
              updatedTeams,
              updatedSchedule,
              round
            )
          : { coppaItalia: undefined, news: undefined };
        if (coppaRes.news) newNews.unshift(coppaRes.news);

        if (round >= totalRounds) {
          nextPhase = 'playoffs';
          nextRound = totalRounds + 1;
          const leagueTeams = updatedTeams.filter(
            (t) => (t.leagueId ?? 'ITA_LBA') === userLeagueId
          );
          const leagueSchedule = updatedSchedule.filter(
            (g) => (g.leagueId ?? 'ITA_LBA') === userLeagueId
          );
          const standings = computeStandings(leagueTeams, leagueSchedule);
          playoffs = createPlayoffQuarterfinals(standings, userLeagueId);
          newNews.unshift({
            id: `news_po_start_${Date.now()}`,
            round: nextRound,
            category: 'Lega',
            title: 'Iniziano i Playoff!',
            body:
              userLeagueId === 'ITA_A2'
                ? `Conclusa la Regular Season: ${
                    standings[0]?.teamName ?? 'la 1ª classificata'
                  } è promossa direttamente in Serie A LBA! I posti dal 2° al 9° si sfidano ai Playoff per la seconda promozione.`
                : userLeagueId === 'ITA_LBA'
                ? 'Conclusa la Regular Season: le prime 8 squadre si sfidano ai Playoff al meglio delle 5 gare. Le ultime 2 classificate retrocedono in Serie A2.'
                : 'Conclusa la Regular Season: le prime 8 squadre si sfidano al meglio delle 5 gare.',
          });
        }

        const unlockedIds = career.activeScouting.map((s) => s.playerId);
        const nextScouted = Array.from(
          new Set([...career.scoutedPlayerIds, ...unlockedIds])
        );

        const cpuMarket = runCpuInSeasonMarket(
          updatedTeams,
          career.freeAgents,
          career.userTeamId,
          round
        );
        updatedTeams = cpuMarket.teams;
        if (cpuMarket.news.length > 0) {
          newNews.unshift(...cpuMarket.news);
        }

        const updatedUserTeam = updatedTeams.find((t) => t.id === career.userTeamId)!;
        const incoming = generateIncomingTransferOffer(
          updatedTeams,
          updatedUserTeam,
          round,
          career.incomingOffers
        );
        const nextIncomingOffers = incoming
          ? [incoming, ...career.incomingOffers].slice(0, 10)
          : career.incomingOffers;

        if (incoming) {
          newNews.unshift({
            id: `news_offer_${Date.now()}`,
            round: nextRound,
            category: 'Mercato',
            title: `Offerta di Buyout per ${incoming.playerName}`,
            body: `${
              incoming.fromTeamName
            } offre €${incoming.buyoutAmount.toLocaleString(
              'it-IT'
            )} per attivare la clausola di ${incoming.playerName}. Controlla il Mercato.`,
          });
        }

        const nextDate = addDays(
          career.currentDate ?? getRoundDate(career.seasonYear, career.currentRound),
          1
        );
        const dailyTrain = advanceDailyIndividualTrainingPrograms({
          teams: updatedTeams,
          userTeamId: career.userTeamId,
          currentDate: nextDate,
          round: nextRound,
          managerYouthDev: career.managerProfile?.attributes.youthDev ?? 10,
        });
        updatedTeams = dailyTrain.teams;
        if (dailyTrain.news.length > 0) newNews.unshift(...dailyTrain.news);

        const userWonLive =
          liveMatch.home.teamId === career.userTeamId
            ? liveMatch.home.score > liveMatch.away.score
            : liveMatch.away.score > liveMatch.home.score;
        const confEval = evaluateUserConfidenceAndFiring({
          career,
          teams: updatedTeams,
          schedule: updatedSchedule,
          userWonLastGame: userWonLive,
          dateStr: nextDate,
          round: nextRound,
        });
        if (confEval.firingNews) newNews.unshift(confEval.firingNews);

        const liveMessages = [
          ...(confEval.firingMessage ? [confEval.firingMessage] : []),
          ...dailyTrain.messages,
          ...(career.messages ?? []),
        ].slice(0, 60);

        set({
          career: {
            ...career,
            userTeamId: confEval.nextUserTeamId,
            boardObjective: confEval.nextBoardObjective,
            boardConfidence: confEval.nextConfidence,
            teams: updatedTeams,
            freeAgents: cpuMarket.freeAgents,
            schedule: updatedSchedule,
            currentRound: nextRound,
            currentDate: nextDate,
            phase: nextPhase,
            playoffs,
            coppaItalia: coppaRes.coppaItalia ?? career.coppaItalia,
            euroLeagues: nextEuroLeagues ?? career.euroLeagues,
            scoutedPlayerIds: nextScouted,
            activeScouting: [],
            incomingOffers: nextIncomingOffers,
            news: [...newNews, ...career.news].slice(0, 40),
            messages: liveMessages,
          },
          liveMatch: null,
          screen: 'dashboard',
          activeTab: 'office',
          ...(confEval.fired && confEval.firingContext
            ? {
                firingContext: confEval.firingContext,
                fastSimTarget: null,
                toast: `Esonerato da ${confEval.oldClubName}! Scegli una nuova squadra da allenare.`,
              }
            : {}),
        });
      } else {
        const seriesId = liveMatch.playoffSeriesId!;
        const standings = computeStandings(updatedTeams, career.schedule);

        let updatedPlayoffs = career.playoffs.map((s) => {
          if (s.id === seriesId) {
            const homeWon = liveMatch.home.score > liveMatch.away.score;
            const winnerTeamId = homeWon
              ? liveMatch.home.teamId
              : liveMatch.away.teamId;
            const hiWins =
              s.higherSeedWins + (winnerTeamId === s.higherSeedId ? 1 : 0);
            const loWins = s.lowerSeedWins + (winnerTeamId === s.lowerSeedId ? 1 : 0);
            const needed = Math.ceil(s.bestOf / 2);
            return {
              ...s,
              higherSeedWins: hiWins,
              lowerSeedWins: loWins,
              winnerId:
                hiWins >= needed
                  ? s.higherSeedId
                  : loWins >= needed
                  ? s.lowerSeedId
                  : undefined,
              games: [
                ...s.games,
                {
                  homeTeamId: liveMatch.home.teamId,
                  awayTeamId: liveMatch.away.teamId,
                  homeScore: liveMatch.home.score,
                  awayScore: liveMatch.away.score,
                },
              ],
            };
          }

          if (!s.winnerId) {
            const { homeTeamId, awayTeamId } = getNextPlayoffGameTeams(s);
            const ht = teamMap.get(homeTeamId)!;
            const at = teamMap.get(awayTeamId)!;
            const res = simulateFullMatch(
              `${s.id}_g${s.games.length + 1}`,
              career.currentRound,
              ht,
              at,
              true,
              s.id
            );
            const homeWon = res.home.score > res.away.score;
            const winnerTeamId = homeWon ? res.home.teamId : res.away.teamId;
            const hiWins =
              s.higherSeedWins + (winnerTeamId === s.higherSeedId ? 1 : 0);
            const loWins = s.lowerSeedWins + (winnerTeamId === s.lowerSeedId ? 1 : 0);
            const needed = Math.ceil(s.bestOf / 2);
            return {
              ...s,
              higherSeedWins: hiWins,
              lowerSeedWins: loWins,
              winnerId:
                hiWins >= needed
                  ? s.higherSeedId
                  : loWins >= needed
                  ? s.lowerSeedId
                  : undefined,
              games: [
                ...s.games,
                {
                  homeTeamId: res.home.teamId,
                  awayTeamId: res.away.teamId,
                  homeScore: res.home.score,
                  awayScore: res.away.score,
                },
              ],
            };
          }

          return s;
        });

        const advanced = checkAndAdvancePlayoffs(updatedPlayoffs, standings);
        updatedPlayoffs = advanced.playoffs;

        const nextPlayoffDate = addDays(
          career.currentDate ?? getRoundDate(career.seasonYear, career.currentRound),
          1
        );
        const dailyTrainPo = advanceDailyIndividualTrainingPrograms({
          teams: updatedTeams,
          userTeamId: career.userTeamId,
          currentDate: nextPlayoffDate,
          round: career.currentRound + 1,
          managerYouthDev: career.managerProfile?.attributes.youthDev ?? 10,
        });
        updatedTeams = dailyTrainPo.teams;

        set({
          career: {
            ...career,
            teams: updatedTeams,
            playoffs: updatedPlayoffs,
            phase: advanced.championTeamId ? 'finished' : 'playoffs',
            championTeamId: advanced.championTeamId,
            currentRound: career.currentRound + 1,
            currentDate: nextPlayoffDate,
            news: [...dailyTrainPo.news, ...career.news].slice(0, 40),
            messages: [...dailyTrainPo.messages, ...(career.messages ?? [])].slice(
              0,
              60
            ),
          },
          liveMatch: null,
          screen: 'dashboard',
          activeTab: 'calendar',
        });
      }
    },
  };
}
