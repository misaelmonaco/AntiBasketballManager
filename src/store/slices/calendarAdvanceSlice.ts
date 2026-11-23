import {
  FastSimAlert,
  FastSimMatchSummary,
  FiringOfferContext,
  InboxMessage,
  MatchState,
  NewsItem,
  SeasonPhase,
  Team,
} from '../../types';
import { getLeagueConfig } from '../../data/teams';
import {
  addDays,
  getRoundDate,
  getSeasonStartDate,
  isWeekendDate,
} from '../../engine/calendarUtils';
import { computeAssistantTactics } from '../../engine/assistantCoachTactics';
import {
  createIncomingOfferMessage,
  createInjuryAlertMessage,
  createPlayerUnhappyMessage,
  createScoutingCompletedMessage,
} from '../../engine/messagesEngine';
import { getTeamBoardObjective } from '../../engine/managerEngine';
import { generateIncomingTransferOffer } from '../../engine/scoutingEngine';
import {
  applyWeeklyTrainingAndRecovery,
  updateMoraleAndChemistryAfterMatch,
} from '../../engine/clubEngine';
import { advanceDailyIndividualTrainingPrograms } from '../../engine/trainingProgramEngine';
import { autoFixRosterLineup, validateRoster6Plus6 } from '../../engine/ratings';
import {
  advanceCoppaItaliaIfReady,
  getUserLeagueTotalRounds,
  simulateEuroRound,
} from '../../engine/competitionsEngine';
import { runCpuInSeasonMarket } from '../../engine/cpuMarketEngine';
import { simulateFullMatch } from '../../engine/matchSimulator';
import {
  applyMatchStatsToTeams,
  checkAndAdvancePlayoffs,
  computeStandings,
  createPlayoffQuarterfinals,
  generateRoundNews,
  getNextPlayoffGameTeams,
} from '../../engine/seasonEngine';
import {
  buildGameSummaryBox,
  evaluateUserConfidenceAndFiring,
} from '../storeHelpers';
import { GameStore, StoreGet, StoreSet } from '../storeTypes';

type CalendarAdvanceSliceKeys =
  | 'acceptCoachingJobAfterFiring'
  | 'startRegularSeasonFromOffseason'
  | 'advanceOneDay';

export function createCalendarAdvanceSlice(
  set: StoreSet,
  get: StoreGet
): Pick<GameStore, CalendarAdvanceSliceKeys> {
  return {
    acceptCoachingJobAfterFiring: (newTeamId) => {
      const { career, firingContext } = get();
      if (!career) return;
      if (firingContext && newTeamId === firingContext.oldClubId) return;
      const newClub = career.teams.find((t) => t.id === newTeamId);
      if (!newClub) return;

      const newObjective = getTeamBoardObjective(newClub.prestige);
      const leagueCfg = getLeagueConfig(newClub.leagueId);
      const dateStr =
        firingContext?.dateStr ??
        career.currentDate ??
        getRoundDate(career.seasonYear, career.currentRound);
      const round = firingContext?.round ?? career.currentRound;

      const welcomeMsg: InboxMessage = {
        id: `msg_hire_${Date.now()}`,
        category: 'dirigenza',
        senderName: `Direzione ${newClub.name}`,
        senderRole: 'Benvenuto nel Club',
        subject: `Nuovo incarico: Benvenuto a ${newClub.name} (${leagueCfg.shortName})`,
        body: `Gentile Coach ${career.managerName},\n\nla società ${newClub.name} ti dà il benvenuto sulla nostra panchina!\nIl nostro obiettivo stagionale è "${newObjective}" con un budget complessivo di €${newClub.budget.toLocaleString(
          'it-IT'
        )}.\nBuon lavoro in palestra e sul mercato.`,
        date: dateStr,
        round,
        read: false,
        urgent: true,
        actionTab: 'office',
        actionLabel: 'Vai all’Ufficio',
      };

      const hireNews: NewsItem = {
        id: `news_hire_${Date.now()}`,
        round,
        category: 'Lega',
        title: `UFFICIALE: ${newClub.shortName} affida la panchina a Coach ${career.managerName}`,
        body: `Dopo la fine della precedente esperienza, Coach ${career.managerName} riparte subito da ${newClub.name} in ${leagueCfg.name}. Obiettivo dichiarato: "${newObjective}".`,
      };

      set({
        career: {
          ...career,
          userTeamId: newClub.id,
          boardObjective: newObjective,
          boardConfidence: 70,
          regulationAlert: undefined,
          incomingOffers: [],
          messages: [welcomeMsg, ...(career.messages ?? [])].slice(0, 60),
          news: [hireNews, ...career.news].slice(0, 40),
        },
        firingContext: null,
        activeChatModal: null,
        fastSimTarget: null,
        rosterComplianceModalOpen: false,
        inspectedTeamId: null,
        screen: 'dashboard',
        activeTab: 'office',
        toast: `Nuova avventura sulla panchina di ${newClub.name}!`,
      });
    },

    startRegularSeasonFromOffseason: () => {
      const { career } = get();
      if (!career) return { ok: false, error: 'Nessuna carriera attiva.' };
      if (career.phase !== 'offseason') {
        return { ok: false, error: 'Non sei in Offseason.' };
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
        return { ok: false, error: validation.errors[0] };
      }

      const seasonStart = getSeasonStartDate(career.seasonYear);
      const currentDate = career.currentDate ?? seasonStart;
      const nextDate = currentDate < seasonStart ? seasonStart : currentDate;

      set({
        career: {
          ...career,
          phase: 'regular',
          currentRound: 1,
          currentDate: nextDate,
        },
        rosterComplianceModalOpen: false,
        toast: `Regular Season ${career.seasonYear}/${String(
          career.seasonYear + 1
        ).slice(-2)} avviata!`,
      });
      return { ok: true };
    },

    advanceOneDay: (isFastSim = false) => {
      const { career, firingContext } = get();
      if (!career) {
        return { advanced: false, newDate: '' };
      }
      const currentDate =
        career.currentDate ?? getRoundDate(career.seasonYear, career.currentRound);

      if (firingContext) {
        return {
          advanced: false,
          newDate: currentDate,
          alert: {
            reason: 'coach_fired',
            title: `Esonero da ${firingContext.oldClubName}`,
            message:
              'Scegli una nuova panchina tra le squadre disponibili per continuare la carriera.',
            date: currentDate,
          },
        };
      }

      if (career.phase === 'finished') {
        return {
          advanced: false,
          newDate: currentDate,
          alert: {
            reason: 'season_finished',
            title: 'Stagione Conclusa',
            message:
              'La stagione è terminata. Consulta il tabellone finale o inizia una nuova carriera.',
            date: currentDate,
          },
        };
      }

      const ignoreAlerts = Boolean(career.ignoreFastSimAlerts);
      let updatedTeams = career.teams;
      let updatedFreeAgents = career.freeAgents;
      let updatedSchedule = career.schedule;
      let updatedPlayoffs = career.playoffs;
      let nextRound = career.currentRound;
      let nextPhase: SeasonPhase = career.phase;
      let championTeamId = career.championTeamId;
      let newNews = [...career.news];
      let nextIncomingOffers = [...career.incomingOffers];
      let userMatchPlayed: FastSimMatchSummary | undefined;
      let newStarterBuyoutOffer = false;

      const prevUserTeam = updatedTeams.find((t) => t.id === career.userTeamId)!;
      const prevInjuredIds = new Set(
        prevUserTeam.roster.filter((p) => p.injuryWeeks > 0).map((p) => p.id)
      );

      const remainingScouting: typeof career.activeScouting = [];
      const unlockedIds: string[] = [];
      for (const item of career.activeScouting) {
        const rem = item.daysRemaining - 1;
        if (rem <= 0) {
          unlockedIds.push(item.playerId);
        } else {
          remainingScouting.push({ ...item, daysRemaining: rem });
        }
      }
      const nextScouted = Array.from(
        new Set([...career.scoutedPlayerIds, ...unlockedIds])
      );

      let nextEuroLeagues = career.euroLeagues;
      let nextCoppaItalia = career.coppaItalia;
      const totalRounds = getUserLeagueTotalRounds(updatedTeams, career.userTeamId);
      const userLeagueId = prevUserTeam.leagueId ?? 'ITA_LBA';

      if (career.phase === 'offseason') {
        const nextDate = addDays(currentDate, 1);
        const seasonStart = getSeasonStartDate(career.seasonYear);
        if (nextDate >= seasonStart) {
          const userTeamNow = updatedTeams.find((t) => t.id === career.userTeamId)!;
          let validation = validateRoster6Plus6(
            userTeamNow.roster,
            userTeamNow.leagueId,
            userTeamNow.lbaRosterFormat
          );
          if (!validation.valid && isFastSim && ignoreAlerts) {
            updatedTeams = updatedTeams.map((t) =>
              t.id === career.userTeamId
                ? {
                    ...t,
                    roster: autoFixRosterLineup(
                      t.roster,
                      t.leagueId,
                      t.lbaRosterFormat ?? '6+6'
                    ),
                  }
                : t
            );
            const fixedUserTeam = updatedTeams.find(
              (t) => t.id === career.userTeamId
            )!;
            validation = validateRoster6Plus6(
              fixedUserTeam.roster,
              fixedUserTeam.leagueId,
              fixedUserTeam.lbaRosterFormat
            );
          }
          if (!validation.valid) {
            set({ rosterComplianceModalOpen: true });
            return {
              advanced: false,
              newDate: currentDate,
              alert: {
                reason: 'rule_6_6',
                title: `Roster Non Conforme (${validation.ruleLabel})`,
                message: `${validation.errors[0]} Adegua la squadra alle regole del campionato per iniziare la Regular Season.`,
                date: currentDate,
              },
            };
          }
          const dailyTrain = advanceDailyIndividualTrainingPrograms({
            teams: updatedTeams,
            userTeamId: career.userTeamId,
            currentDate: seasonStart,
            round: 1,
            managerYouthDev: career.managerProfile?.attributes.youthDev ?? 10,
          });
          updatedTeams = dailyTrain.teams;

          set({
            career: {
              ...career,
              teams: updatedTeams,
              activeScouting: remainingScouting,
              scoutedPlayerIds: nextScouted,
              phase: 'regular',
              currentRound: 1,
              currentDate: seasonStart,
              news: [...dailyTrain.news, ...career.news].slice(0, 40),
              messages: [...dailyTrain.messages, ...(career.messages ?? [])].slice(
                0,
                60
              ),
            },
            rosterComplianceModalOpen: false,
          });
          return {
            advanced: true,
            newDate: seasonStart,
            phaseChangedTo: 'regular',
          };
        }

        const dailyTrain = advanceDailyIndividualTrainingPrograms({
          teams: updatedTeams,
          userTeamId: career.userTeamId,
          currentDate: nextDate,
          round: career.currentRound,
          managerYouthDev: career.managerProfile?.attributes.youthDev ?? 10,
        });
        updatedTeams = dailyTrain.teams;

        set({
          career: {
            ...career,
            teams: updatedTeams,
            activeScouting: remainingScouting,
            scoutedPlayerIds: nextScouted,
            currentDate: nextDate,
            news: [...dailyTrain.news, ...career.news].slice(0, 40),
            messages: [...dailyTrain.messages, ...(career.messages ?? [])].slice(0, 60),
          },
        });
        return { advanced: true, newDate: nextDate };
      }

      const roundDate = getRoundDate(career.seasonYear, career.currentRound, totalRounds);
      const isMatchDay = currentDate >= roundDate && isWeekendDate(currentDate);

      if (isMatchDay) {
        let userTeamBeforeMatch = updatedTeams.find(
          (t) => t.id === career.userTeamId
        )!;
        if (userTeamBeforeMatch.tactics.delegateToAssistant) {
          let oppTeam: Team | undefined;
          if (career.phase === 'regular') {
            const userGame = updatedSchedule.find(
              (g) =>
                g.round === career.currentRound &&
                !g.played &&
                (g.homeTeamId === userTeamBeforeMatch.id ||
                  g.awayTeamId === userTeamBeforeMatch.id)
            );
            if (userGame) {
              const oppId =
                userGame.homeTeamId === userTeamBeforeMatch.id
                  ? userGame.awayTeamId
                  : userGame.homeTeamId;
              oppTeam = updatedTeams.find((t) => t.id === oppId);
            }
          } else if (career.phase === 'playoffs') {
            const series = career.playoffs.find(
              (s) =>
                !s.winnerId &&
                (s.higherSeedId === userTeamBeforeMatch.id ||
                  s.lowerSeedId === userTeamBeforeMatch.id)
            );
            if (series) {
              const oppId =
                series.higherSeedId === userTeamBeforeMatch.id
                  ? series.lowerSeedId
                  : series.higherSeedId;
              oppTeam = updatedTeams.find((t) => t.id === oppId);
            }
          }
          const { tactics } = computeAssistantTactics(userTeamBeforeMatch, oppTeam);
          updatedTeams = updatedTeams.map((t) =>
            t.id === career.userTeamId ? { ...t, tactics } : t
          );
          userTeamBeforeMatch = updatedTeams.find((t) => t.id === career.userTeamId)!;
        }
        let validation = validateRoster6Plus6(
          userTeamBeforeMatch.roster,
          userTeamBeforeMatch.leagueId,
          userTeamBeforeMatch.lbaRosterFormat
        );

        if (!validation.valid) {
          if (isFastSim && ignoreAlerts) {
            updatedTeams = updatedTeams.map((t) =>
              t.id === career.userTeamId
                ? {
                    ...t,
                    roster: autoFixRosterLineup(
                      t.roster,
                      t.leagueId,
                      t.lbaRosterFormat ?? '6+6'
                    ),
                  }
                : t
            );
            const recheckedTeam = updatedTeams.find(
              (t) => t.id === career.userTeamId
            )!;
            validation = validateRoster6Plus6(
              recheckedTeam.roster,
              recheckedTeam.leagueId,
              recheckedTeam.lbaRosterFormat
            );
          }

          if (!validation.valid) {
            set({ rosterComplianceModalOpen: true });
            return {
              advanced: false,
              newDate: currentDate,
              alert: {
                reason: 'rule_6_6',
                title: `Violazione ${validation.ruleLabel}`,
                message: `${validation.errors[0]} Adegua il roster alle regole del campionato prima della partita.`,
                date: currentDate,
              },
            };
          }
        }

        if (career.phase === 'regular') {
          const round = career.currentRound;
          const roundGames = updatedSchedule.filter(
            (g) => g.round === round && !g.played
          );
          const teamMap = new Map(updatedTeams.map((t) => [t.id, t]));
          const simResults = new Map<string, MatchState>();

          for (const g of roundGames) {
            const ht = teamMap.get(g.homeTeamId)!;
            const at = teamMap.get(g.awayTeamId)!;
            const res = simulateFullMatch(g.id, round, ht, at, false);
            simResults.set(g.id, res);
            updatedTeams = applyMatchStatsToTeams(updatedTeams, res);
            updatedTeams = updateMoraleAndChemistryAfterMatch(
              updatedTeams,
              res,
              career.userTeamId,
              career.managerProfile?.attributes.lockerRoom ?? 10,
              career.managerProfile?.reputation ?? 60
            );

            if (ht.id === career.userTeamId || at.id === career.userTeamId) {
              const userIsHome = ht.id === career.userTeamId;
              const userWon = userIsHome
                ? res.home.score > res.away.score
                : res.away.score > res.home.score;
              userMatchPlayed = {
                date: currentDate,
                roundLabel: `Giornata ${round}`,
                homeName: ht.shortName,
                awayName: at.shortName,
                homeScore: res.home.score,
                awayScore: res.away.score,
                userWon,
                userIsHome,
              };
            }
          }

          const trainingOutcome = applyWeeklyTrainingAndRecovery(
            updatedTeams,
            round,
            career.userTeamId,
            career.managerProfile?.attributes.youthDev ?? 10
          );
          updatedTeams = trainingOutcome.teams;

          updatedSchedule = updatedSchedule.map((g) => {
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

          const playedRoundGames = updatedSchedule.filter((g) => g.round === round);
          newNews = [
            ...trainingOutcome.news,
            ...generateRoundNews(round, updatedTeams, playedRoundGames),
            ...newNews,
          ].slice(0, 40);

          if (nextEuroLeagues) {
            nextEuroLeagues = simulateEuroRound(nextEuroLeagues, updatedTeams);
          }
          if (nextCoppaItalia) {
            const coppaRes = advanceCoppaItaliaIfReady(
              nextCoppaItalia,
              updatedTeams,
              updatedSchedule,
              round
            );
            nextCoppaItalia = coppaRes.coppaItalia;
            if (coppaRes.news) {
              newNews = [coppaRes.news, ...newNews].slice(0, 40);
            }
          }

          nextRound = round + 1;
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
            updatedPlayoffs = createPlayoffQuarterfinals(standings, userLeagueId);
            newNews = [
              {
                id: `news_po_start_${Date.now()}`,
                round: nextRound,
                category: 'Lega' as const,
                title: 'Iniziano i Playoff!',
                body:
                  userLeagueId === 'ITA_A2'
                    ? `Conclusa la Regular Season: ${
                        standings[0]?.teamName ?? 'la 1ª classificata'
                      } è promossa direttamente in Serie A LBA! I posti dal 2° al 9° si sfidano ai Playoff per la seconda promozione.`
                    : userLeagueId === 'ITA_LBA'
                    ? 'Conclusa la Regular Season: le prime 8 squadre si sfidano ai Playoff al meglio delle 5 gare. Le ultime 2 classificate retrocedono in Serie A2.'
                    : 'Conclusa la Regular Season: le prime 8 squadre si sfidano al meglio delle 5 gare.',
              },
              ...newNews,
            ].slice(0, 40);
          }

          const cpuMarket = runCpuInSeasonMarket(
            updatedTeams,
            updatedFreeAgents,
            career.userTeamId,
            round
          );
          updatedTeams = cpuMarket.teams;
          updatedFreeAgents = cpuMarket.freeAgents;
          if (cpuMarket.news.length > 0) {
            newNews = [...cpuMarket.news, ...newNews].slice(0, 40);
          }

          const updatedUserTeam = updatedTeams.find((t) => t.id === career.userTeamId)!;
          const incoming = generateIncomingTransferOffer(
            updatedTeams,
            updatedUserTeam,
            round,
            nextIncomingOffers
          );
          if (incoming) {
            nextIncomingOffers = [incoming, ...nextIncomingOffers].slice(0, 10);
            const offeredPlayer = updatedUserTeam.roster.find(
              (p) => p.id === incoming.playerId
            );
            if (offeredPlayer?.rosterSlot === 'starter') {
              newStarterBuyoutOffer = true;
            }
            newNews = [
              {
                id: `news_offer_${Date.now()}`,
                round: nextRound,
                category: 'Mercato' as const,
                title: `Offerta di Buyout per ${incoming.playerName}`,
                body: `${
                  incoming.fromTeamName
                } offre €${incoming.buyoutAmount.toLocaleString(
                  'it-IT'
                )} per attivare la clausola di ${incoming.playerName}.`,
              },
              ...newNews,
            ].slice(0, 40);
          }
        } else if (career.phase === 'playoffs') {
          const teamMap = new Map(updatedTeams.map((t) => [t.id, t]));
          const leagueTeams = updatedTeams.filter(
            (t) => (t.leagueId ?? 'ITA_LBA') === userLeagueId
          );
          const leagueSchedule = updatedSchedule.filter(
            (g) => (g.leagueId ?? 'ITA_LBA') === userLeagueId
          );
          const standings = computeStandings(leagueTeams, leagueSchedule);

          updatedPlayoffs = updatedPlayoffs.map((s) => {
            if (s.winnerId) return s;
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
            updatedTeams = applyMatchStatsToTeams(updatedTeams, res);
            updatedTeams = updateMoraleAndChemistryAfterMatch(
              updatedTeams,
              res,
              career.userTeamId,
              career.managerProfile?.attributes.lockerRoom ?? 10,
              career.managerProfile?.reputation ?? 60
            );

            if (ht.id === career.userTeamId || at.id === career.userTeamId) {
              const userIsHome = ht.id === career.userTeamId;
              const userWon = userIsHome
                ? res.home.score > res.away.score
                : res.away.score > res.home.score;
              userMatchPlayed = {
                date: currentDate,
                roundLabel: `Playoff ${s.stage} G${s.games.length + 1}`,
                homeName: ht.shortName,
                awayName: at.shortName,
                homeScore: res.home.score,
                awayScore: res.away.score,
                userWon,
                userIsHome,
              };
            }

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
          });

          const advanced = checkAndAdvancePlayoffs(updatedPlayoffs, standings);
          updatedPlayoffs = advanced.playoffs;
          if (advanced.championTeamId) {
            nextPhase = 'finished';
            championTeamId = advanced.championTeamId;
          }
          nextRound = career.currentRound + 1;
        }
      }

      const nextDate = addDays(currentDate, 1);
      let nextConfidence = career.boardConfidence ?? 75;
      let nextUserTeamId = career.userTeamId;
      let nextBoardObjective = career.boardObjective;
      let firedContext: FiringOfferContext | undefined;
      const generatedMessages: InboxMessage[] = [];

      if (userMatchPlayed && career.phase === 'regular') {
        const confEval = evaluateUserConfidenceAndFiring({
          career,
          teams: updatedTeams,
          schedule: updatedSchedule,
          userWonLastGame: userMatchPlayed.userWon,
          dateStr: nextDate,
          round: nextRound,
        });
        nextConfidence = confEval.nextConfidence;
        nextUserTeamId = confEval.nextUserTeamId;
        nextBoardObjective = confEval.nextBoardObjective;
        if (confEval.firingMessage) generatedMessages.push(confEval.firingMessage);
        if (confEval.firingNews) {
          newNews = [confEval.firingNews, ...newNews].slice(0, 40);
        }
        if (confEval.fired && confEval.firingContext) {
          firedContext = confEval.firingContext;
        }
      }
      const dailyTrain = advanceDailyIndividualTrainingPrograms({
        teams: updatedTeams,
        userTeamId: nextUserTeamId,
        currentDate: nextDate,
        round: nextRound,
        managerYouthDev: career.managerProfile?.attributes.youthDev ?? 10,
      });
      updatedTeams = dailyTrain.teams;
      if (dailyTrain.messages.length > 0) {
        generatedMessages.push(...dailyTrain.messages);
      }
      if (dailyTrain.news.length > 0) {
        newNews = [...dailyTrain.news, ...newNews].slice(0, 40);
      }

      const userTeamFinal = updatedTeams.find((t) => t.id === nextUserTeamId)!;

      if (unlockedIds.length > 0) {
        const allKnownPlayers = [
          ...updatedFreeAgents,
          ...updatedTeams.flatMap((t) => t.roster),
        ];
        for (const uid of unlockedIds) {
          const scoutedP = allKnownPlayers.find((p) => p.id === uid);
          if (scoutedP) {
            generatedMessages.push(
              createScoutingCompletedMessage({
                player: scoutedP,
                date: nextDate,
                round: nextRound,
              })
            );
          }
        }
      }

      for (const p of userTeamFinal.roster) {
        if (!prevInjuredIds.has(p.id) && p.injuryWeeks > 0) {
          generatedMessages.push(
            createInjuryAlertMessage({
              player: p,
              date: nextDate,
              round: nextRound,
              isStarter: p.rosterSlot === 'starter',
            })
          );
        }
      }

      if (nextIncomingOffers.length > career.incomingOffers.length) {
        const existingOfferIds = new Set(career.incomingOffers.map((o) => o.id));
        for (const off of nextIncomingOffers) {
          if (!existingOfferIds.has(off.id)) {
            generatedMessages.push(
              createIncomingOfferMessage({
                offer: off,
                date: nextDate,
                round: nextRound,
              })
            );
          }
        }
      }

      if (isMatchDay) {
        const existingMsgs = career.messages ?? [];
        const unhappy = userTeamFinal.roster.find(
          (p) =>
            (p.rosterSlot === 'starter' ||
              p.promisedRole === 'Stella della squadra') &&
            p.morale < 45 &&
            !existingMsgs.some(
              (m) => m.playerId === p.id && m.choices && !m.resolvedChoiceId
            )
        );
        if (unhappy) {
          generatedMessages.push(
            createPlayerUnhappyMessage({
              player: unhappy,
              date: nextDate,
              round: nextRound,
            })
          );
        }
      }

      set({
        career: {
          ...career,
          userTeamId: nextUserTeamId,
          boardObjective: nextBoardObjective,
          teams: updatedTeams,
          freeAgents: updatedFreeAgents,
          schedule: updatedSchedule,
          playoffs: updatedPlayoffs,
          coppaItalia: nextCoppaItalia,
          euroLeagues: nextEuroLeagues,
          currentRound: nextRound,
          currentDate: nextDate,
          phase: nextPhase,
          championTeamId,
          boardConfidence: nextConfidence,
          scoutedPlayerIds: nextScouted,
          activeScouting: remainingScouting,
          incomingOffers: nextIncomingOffers,
          news: newNews,
          messages: [...generatedMessages, ...(career.messages ?? [])].slice(0, 60),
        },
        ...(firedContext
          ? { firingContext: firedContext, fastSimTarget: null }
          : {}),
      });

      let alert: FastSimAlert | undefined;
      if (firedContext) {
        alert = {
          reason: 'coach_fired',
          title: `Esonero da ${firedContext.oldClubName}`,
          message:
            'La dirigenza ti ha esonerato per i risultati sotto le attese. Scegli la tua prossima squadra per continuare la carriera.',
          date: nextDate,
        };
      } else if (nextPhase === 'finished') {
        const champName =
          updatedTeams.find((t) => t.id === championTeamId)?.name ?? 'Campione';
        alert = {
          reason: 'season_finished',
          title: 'Stagione Conclusa!',
          message: `I Playoff Scudetto sono terminati. Campione d'Italia: ${champName}.`,
          date: nextDate,
        };
      } else if (isFastSim && !ignoreAlerts) {
        if (career.phase === 'regular' && nextPhase === 'playoffs') {
          alert = {
            reason: 'playoffs_start',
            title: 'Iniziano i Playoff Scudetto!',
            message:
              'La Regular Season è conclusa. Controlla il tabellone dei Playoff e prepara la squadra.',
            date: nextDate,
          };
        } else {
          const userTeamAfter = updatedTeams.find(
            (t) => t.id === career.userTeamId
          )!;
          const severeNewInjury = userTeamAfter.roster.find(
            (p) =>
              !prevInjuredIds.has(p.id) &&
              p.injuryWeeks >= 2 &&
              (p.rosterSlot === 'starter' || p.minutePriority !== 'Bassa')
          );
          if (severeNewInjury) {
            alert = {
              reason: 'injury',
              title: 'Infortunio Grave in Rotazione',
              message: `${severeNewInjury.firstName} ${
                severeNewInjury.lastName
              } ha subito un infortunio (${
                severeNewInjury.injuryWeeks * 7
              } giorni di stop).`,
              date: nextDate,
            };
          } else if (newStarterBuyoutOffer) {
            const latestOffer = nextIncomingOffers[0];
            alert = {
              reason: 'buyout_offer',
              title: 'Offerta di Buyout per un Titolare',
              message: `${
                latestOffer.fromTeamName
              } ha presentato un'offerta di buyout (€${latestOffer.buyoutAmount.toLocaleString(
                'it-IT'
              )}) per ${latestOffer.playerName}.`,
              date: nextDate,
            };
          } else if (isMatchDay) {
            const unhappyStarter = userTeamAfter.roster.find(
              (p) =>
                (p.rosterSlot === 'starter' ||
                  p.promisedRole === 'Stella della squadra') &&
                p.morale < 45
            );
            if (unhappyStarter) {
              alert = {
                reason: 'morale_warning',
                title: 'Richiesta Chiarimento sul Minutaggio',
                message: `${unhappyStarter.firstName} ${unhappyStarter.lastName} ha il morale molto basso (${unhappyStarter.morale}/100) e chiede garanzie sul ruolo/minutaggio.`,
                date: nextDate,
              };
            }
          }
        }
      }

      return {
        advanced: true,
        newDate: nextDate,
        userMatchPlayed,
        alert,
        phaseChangedTo: nextPhase !== career.phase ? nextPhase : undefined,
      };
    },
  };
}
