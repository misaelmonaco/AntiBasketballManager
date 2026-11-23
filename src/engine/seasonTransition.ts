import { generateFreeAgents, generateSchedule } from '../data/generator';
import { getLeagueConfig } from '../data/teams';
import { CareerSave, LeagueId, Player, SeasonAwardRecord, Team } from '../types';
import { getOffseasonStartDate } from './calendarUtils';
import {
  createInitialCoppaItalia,
  createInitialEuroCompetitions,
} from './competitionsEngine';
import { getTeamBoardObjective } from './managerEngine';
import {
  generateEndOfSeasonUnhappyOffers,
  getLeagueRegulationNotice,
  runCpuSummerMarket,
} from './cpuMarketEngine';
import {
  buildCareerHistoryEntry,
  filterRealCareerHistory,
} from './careerStatsUtils';
import { createSeasonTransitionMessages } from './messagesEngine';
import {
  autoBalanceRotationMinutes,
  autoFixRosterLineup,
  getForeignLimitForLeague,
} from './ratings';
import { computeStandings } from './seasonEngine';

function computeNextSeasonBudget(
  team: Team,
  nextLeagueId: LeagueId,
  isPromoted: boolean,
  isRelegated: boolean
): number {
  if (isPromoted) {
    if (nextLeagueId === 'ITA_LBA') {
      return Math.round(Math.max(team.budget * 1.9, 2_100_000));
    }
    if (nextLeagueId === 'ITA_A2') {
      return Math.round(Math.max(team.budget * 1.75, 860_000));
    }
    return Math.round(
      Math.max(team.budget * 1.35, getLeagueConfig(nextLeagueId).avgOverall * 14000)
    );
  }
  if (isRelegated) {
    if (nextLeagueId === 'ITA_A2') {
      return Math.round(Math.max(950_000, Math.min(1_550_000, team.budget * 0.62)));
    }
    if (nextLeagueId === 'ITA_B' || nextLeagueId === 'ITA_B2') {
      return Math.round(Math.max(420_000, Math.min(680_000, team.budget * 0.62)));
    }
    if (nextLeagueId === 'ITA_B_INT') {
      return Math.round(Math.max(240_000, Math.min(380_000, team.budget * 0.55)));
    }
    return Math.round(team.budget * 0.78);
  }
  return team.budget;
}

export interface SeasonMovementSummary {
  leagueChanges: Map<string, LeagueId>;
  promotedToLba: Team[];
  relegatedFromLba: Team[];
  promotedToA2: Team[];
  relegatedFromA2: Team[];
}

/**
 * Calcola tutte le promozioni e retrocessioni al termine della stagione:
 * - LBA: ultime 2 retrocedono in Serie A2
 * - Serie A2: 1ª sale diretta in LBA + vincente Playoff (posti 2–9) sale in LBA; ultime 3 scendono in Serie B
 * - Serie B (Gir. A, Gir. B, Interregionale): le prime classificate salgono in Serie A2
 */
export function computeSeasonMovements(
  teams: Team[],
  schedule: CareerSave['schedule'],
  userLeagueId: LeagueId,
  championTeamId?: string
): SeasonMovementSummary {
  const byLeague = (lid: LeagueId) => {
    const lTeams = teams.filter((t) => (t.leagueId ?? 'ITA_LBA') === lid);
    const lSched = schedule.filter((g) => (g.leagueId ?? 'ITA_LBA') === lid);
    return computeStandings(lTeams, lSched);
  };

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const leagueChanges = new Map<string, LeagueId>();

  const lbaStandings = byLeague('ITA_LBA');
  const a2Standings = byLeague('ITA_A2');
  const b1Standings = byLeague('ITA_B');
  const b2Standings = byLeague('ITA_B2');
  const b3Standings = byLeague('ITA_B_INT');

  // 1. LBA -> Serie A2 (ultime 2 classificate)
  const relegatedFromLba: Team[] = [];
  for (const row of lbaStandings.slice(-2)) {
    const t = teamMap.get(row.teamId);
    if (t) {
      leagueChanges.set(t.id, 'ITA_A2');
      relegatedFromLba.push(t);
    }
  }

  // 2. Serie A2 -> LBA (1ª diretta + vincente playoff 2-9)
  const promotedToLba: Team[] = [];
  const a2First = a2Standings[0] ? teamMap.get(a2Standings[0].teamId) : undefined;
  if (a2First) {
    leagueChanges.set(a2First.id, 'ITA_LBA');
    promotedToLba.push(a2First);
  }

  let a2PlayoffWinner: Team | undefined;
  if (userLeagueId === 'ITA_A2' && championTeamId && championTeamId !== a2First?.id) {
    a2PlayoffWinner = teamMap.get(championTeamId);
  }
  if (!a2PlayoffWinner) {
    // Per AI (o fallback): sceglie tra i posti 2–9 pesando classifica
    const poPool = a2Standings.slice(1, 9);
    const chosenRow = poPool[0] ?? a2Standings[1];
    if (chosenRow) a2PlayoffWinner = teamMap.get(chosenRow.teamId);
  }
  if (a2PlayoffWinner && a2PlayoffWinner.id !== a2First?.id) {
    leagueChanges.set(a2PlayoffWinner.id, 'ITA_LBA');
    promotedToLba.push(a2PlayoffWinner);
  }

  // 3. Serie A2 -> Serie B (ultime 3 classificate, 1 per girone)
  const relegatedFromA2: Team[] = [];
  const bTargets: LeagueId[] = ['ITA_B', 'ITA_B2', 'ITA_B_INT'];
  a2Standings.slice(-3).forEach((row, idx) => {
    const t = teamMap.get(row.teamId);
    if (t && !leagueChanges.has(t.id)) {
      leagueChanges.set(t.id, bTargets[idx % bTargets.length]);
      relegatedFromA2.push(t);
    }
  });

  // 4. Serie B -> Serie A2 (1ª di ciascun girone)
  const promotedToA2: Team[] = [];
  for (const bStandings of [b1Standings, b2Standings, b3Standings]) {
    const first = bStandings[0] ? teamMap.get(bStandings[0].teamId) : undefined;
    if (first && !leagueChanges.has(first.id)) {
      leagueChanges.set(first.id, 'ITA_A2');
      promotedToA2.push(first);
    }
  }

  return {
    leagueChanges,
    promotedToLba,
    relegatedFromLba,
    promotedToA2,
    relegatedFromA2,
  };
}

function resetPlayerForNewSeason(
  p: Player,
  nextContractYears: 1 | 2,
  archiveMeta: { seasonLabel: string; teamName: string; league: string }
): Player {
  const cleanedHistory = filterRealCareerHistory(p.careerHistory);
  const newHistory =
    p.seasonStats.gamesPlayed > 0
      ? [
          buildCareerHistoryEntry(p.seasonStats, archiveMeta),
          ...cleanedHistory,
        ].slice(0, 25)
      : cleanedHistory;

  return {
    ...p,
    age: p.age + 1,
    contractYears: nextContractYears,
    condition: 96,
    injuryWeeks: 0,
    injuryDescription: undefined,
    gameLog: [],
    careerHistory: newHistory,
    seasonStats: {
      gamesPlayed: 0,
      gamesStarted: 0,
      minutes: 0,
      points: 0,
      rebounds: 0,
      oreb: 0,
      dreb: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      pir: 0,
    },
  };
}

/**
 * Esegue il passaggio alla stagione successiva:
 * - applica promozioni e retrocessioni tra LBA, A2 e Serie B
 * - invecchia i giocatori, azzera statistiche stagionali e aggiorna contratti in scadenza
 * - rigenera calendario (inizio terza settimana di settembre), Coppa Italia e Coppe Europee
 */
export function advanceCareerToNextSeason(career: CareerSave): {
  nextCareer: CareerSave;
  movements: SeasonMovementSummary;
  releasedUserPlayers: string[];
} {
  const finishedSeasonLabel = `${career.seasonYear}/${String(career.seasonYear + 1).slice(-2)}`;
  const userTeam = career.teams.find((t) => t.id === career.userTeamId) ?? career.teams[0];
  const userLeagueId: LeagueId = userTeam?.leagueId ?? 'ITA_LBA';
  const movements = computeSeasonMovements(
    career.teams,
    career.schedule,
    userLeagueId,
    career.championTeamId
  );

  const promotedIds = new Set([
    ...movements.promotedToLba.map((t) => t.id),
    ...movements.promotedToA2.map((t) => t.id),
  ]);
  const relegatedIds = new Set([
    ...movements.relegatedFromLba.map((t) => t.id),
    ...movements.relegatedFromA2.map((t) => t.id),
  ]);

  const newlyFreeAgents: Player[] = [];
  const releasedUserPlayers: string[] = [];
  const returningLoansByTeam = new Map<string, Player[]>();
  const returnedUserLoans: string[] = [];
  const userMultiYearIds = new Set(
    (userTeam?.roster ?? []).filter((p) => p.contractYears >= 2).map((p) => p.id)
  );

  // Raccogli tutti i giocatori in prestito che rientrano al club proprietario a fine stagione
  for (const team of career.teams) {
    const isUser = team.id === career.userTeamId;
    const teamLeagueName = getLeagueConfig(team.leagueId).name;
    for (const p of team.roster) {
      if (p.loanedFromTeamId) {
        const restored: Player = resetPlayerForNewSeason(
          {
            ...p,
            salary: p.loanOriginalSalary ?? p.salary,
            loanedFromTeamId: undefined,
            loanedFromTeamName: undefined,
            loanOriginalSalary: undefined,
            rosterSlot: 'bench',
          },
          1,
          {
            seasonLabel: finishedSeasonLabel,
            teamName: team.name,
            league: teamLeagueName,
          }
        );
        const list = returningLoansByTeam.get(p.loanedFromTeamId) ?? [];
        list.push(restored);
        returningLoansByTeam.set(p.loanedFromTeamId, list);
        if (isUser) {
          returnedUserLoans.push(`${p.firstName[0]}. ${p.lastName}`);
        }
      }
    }
  }

  const nextTeams: Team[] = career.teams.map((team) => {
    const nextLeagueId = movements.leagueChanges.get(team.id) ?? team.leagueId ?? 'ITA_LBA';
    const isPromoted = promotedIds.has(team.id);
    const isRelegated = relegatedIds.has(team.id);
    const isUser = team.id === career.userTeamId;

    const nextLbaFormat =
      nextLeagueId === 'ITA_LBA' ? (team.lbaRosterFormat ?? '6+6') : undefined;
    const leagueCfg = getLeagueConfig(nextLeagueId);
    const prevLeagueName = getLeagueConfig(team.leagueId).name;
    const archiveMeta = {
      seasonLabel: finishedSeasonLabel,
      teamName: team.name,
      league: prevLeagueName,
    };
    const nextPrestige = Math.max(
      35,
      Math.min(98, team.prestige + (isPromoted ? 5 : isRelegated ? -4 : 0))
    );
    const nextBudget = computeNextSeasonBudget(team, nextLeagueId, isPromoted, isRelegated);

    // Gestione contratti: i giocatori con 2 anni scendono a 1; quelli a 1 anno in scadenza
    // possono svincolarsi rispettando però le quote ITA/STR della nuova categoria per le CPU
    let keepIds: Set<string>;
    if (isUser) {
      const sortedByOvr = [...team.roster].sort((a, b) => b.overall - a.overall);
      keepIds = new Set(sortedByOvr.slice(0, 9).map((p) => p.id));
    } else {
      const { maxForeign, minIta } = getForeignLimitForLeague(
        nextLeagueId,
        nextLbaFormat ?? '6+6'
      );
      const eligible = team.roster.filter((p) => !p.loanedFromTeamId && p.age < 38);
      const foreignSorted = eligible
        .filter((p) => !p.isItalianFormation)
        .sort((a, b) => b.overall - a.overall);
      const itaSorted = eligible
        .filter((p) => p.isItalianFormation)
        .sort((a, b) => b.overall - a.overall);

      keepIds = new Set<string>();
      const keepForeignCap = isPromoted
        ? foreignSorted.filter((p) => p.overall >= leagueCfg.avgOverall - 7).slice(0, maxForeign)
        : foreignSorted.slice(0, maxForeign);
      for (const p of keepForeignCap) {
        keepIds.add(p.id);
      }

      if (isPromoted) {
        const minCoreIta = Math.min(itaSorted.length, Math.max(minIta, 6));
        for (const p of itaSorted.slice(0, minCoreIta)) {
          keepIds.add(p.id);
        }
        for (const p of itaSorted.slice(minCoreIta)) {
          if (keepIds.size >= 8) break;
          if (p.overall >= leagueCfg.avgOverall - 7) {
            keepIds.add(p.id);
          }
        }
      } else {
        const itaCoreTarget = Math.min(
          itaSorted.length,
          Math.max(minIta, 12 - maxForeign)
        );
        for (const p of itaSorted.slice(0, itaCoreTarget)) {
          keepIds.add(p.id);
        }
        for (const p of itaSorted.slice(itaCoreTarget)) {
          if (keepIds.size >= 10) break;
          keepIds.add(p.id);
        }
      }
    }

    const keptPlayers: Player[] = [];
    for (const p of team.roster) {
      if (p.loanedFromTeamId) continue; // Rientra al club proprietario
      if (p.age >= 38) continue; // Ritiro a fine carriera
      if (p.contractYears <= 1 && !keepIds.has(p.id)) {
        const released = resetPlayerForNewSeason(p, 1, archiveMeta);
        newlyFreeAgents.push({
          ...released,
          individualFocus: 'Nessuno',
          trainingProgram: null,
          rosterSlot: 'reserve',
          targetMinutes: 0,
        });
        if (isUser) releasedUserPlayers.push(`${p.firstName[0]}. ${p.lastName}`);
      } else {
        const nextYears: 1 | 2 = p.contractYears > 1 ? 1 : 1;
        const resetP = resetPlayerForNewSeason(p, nextYears, archiveMeta);
        keptPlayers.push({
          ...resetP,
          buyoutClause: Math.round(resetP.salary * nextYears * 0.65),
        });
      }
    }

    const returningLoans = returningLoansByTeam.get(team.id) ?? [];
    const mergedRoster = [...keptPlayers, ...returningLoans];
    const fixedRoster = autoBalanceRotationMinutes(
      autoFixRosterLineup(mergedRoster, nextLeagueId, nextLbaFormat ?? '6+6')
    );

    const agedYouth = (team.youthRoster ?? []).map((yp) =>
      resetPlayerForNewSeason(yp, 2, archiveMeta)
    );

    return {
      ...team,
      leagueId: nextLeagueId,
      lbaRosterFormat: nextLbaFormat,
      prestige: nextPrestige,
      budget: nextBudget,
      roster: fixedRoster,
      youthRoster: agedYouth,
      chemistry: Math.round(70 + (team.chemistry - 70) * 0.4),
    };
  });

  const agedFA = career.freeAgents
    .filter((p) => p.age < 38)
    .map((p) =>
      resetPlayerForNewSeason(p, 1, {
        seasonLabel: finishedSeasonLabel,
        teamName: 'Free Agent',
        league: '-',
      })
    );
  const currentFaCount = agedFA.length + newlyFreeAgents.length;
  const extraFA =
    currentFaCount < 150 ? generateFreeAgents(Math.max(40, 170 - currentFaCount)) : [];
  const nextFreeAgents = [...newlyFreeAgents, ...agedFA, ...extraFA].slice(0, 240);

  const nextSeasonYear = career.seasonYear + 1;
  const summerMarket = runCpuSummerMarket({
    teams: nextTeams,
    freeAgents: nextFreeAgents,
    userTeamId: career.userTeamId,
    promotedIds,
    relegatedIds,
    seasonYear: nextSeasonYear,
  });

  const finalTeams = summerMarket.teams;
  const finalFreeAgents = summerMarket.freeAgents;
  const nextSchedule = generateSchedule(finalTeams);
  const nextUserTeam = finalTeams.find((t) => t.id === career.userTeamId)!;
  const nextUserLeagueId: LeagueId = nextUserTeam.leagueId ?? 'ITA_LBA';
  const userChangedLeague =
    promotedIds.has(career.userTeamId) || relegatedIds.has(career.userTeamId);
  const regulationNotice = userChangedLeague
    ? getLeagueRegulationNotice(nextUserLeagueId)
    : undefined;
  const endOfSeasonOffers = generateEndOfSeasonUnhappyOffers({
    teams: finalTeams,
    userTeam: nextUserTeam,
    multiYearPlayerIds: userMultiYearIds,
    userRelegated: relegatedIds.has(career.userTeamId),
    seasonYear: nextSeasonYear,
  });
  const nextStartDate = getOffseasonStartDate(nextSeasonYear);

  const promoLbaText =
    movements.promotedToLba.map((t) => t.shortName).join(', ') || 'nessuna';
  const relLbaText =
    movements.relegatedFromLba.map((t) => t.shortName).join(', ') || 'nessuna';

  const regulationNews = regulationNotice
    ? [
        {
          id: `news_reg_change_${nextSeasonYear}_${Date.now()}`,
          round: 1,
          category: 'Lega' as const,
          title: `Adeguamento Roster — ${getLeagueConfig(nextUserLeagueId).name}`,
          body: regulationNotice,
        },
      ]
    : [];

  const transitionMessages = createSeasonTransitionMessages({
    team: nextUserTeam,
    seasonYear: nextSeasonYear,
    date: nextStartDate,
    promoted: promotedIds.has(career.userTeamId),
    relegated: relegatedIds.has(career.userTeamId),
    regulationNotice,
    endOfSeasonOffers: endOfSeasonOffers.offers,
  });

  // Calcola i Premi Stagionali & Albo d'Oro della lega dell'utente
  const userLeagueCfg = getLeagueConfig(userLeagueId);
  const userLeagueTeams = career.teams.filter((t) => (t.leagueId ?? 'ITA_LBA') === userLeagueId);
  const userLeagueStandings = computeStandings(
    userLeagueTeams,
    career.schedule.filter((g) => (g.leagueId ?? 'ITA_LBA') === userLeagueId)
  );
  const allLeaguePlayers = userLeagueTeams.flatMap((t) =>
    t.roster
      .filter((p) => p.seasonStats.gamesPlayed >= 5)
      .map((p) => ({
        player: p,
        team: t,
        pirAvg: p.seasonStats.pir / Math.max(1, p.seasonStats.gamesPlayed),
      }))
  );
  allLeaguePlayers.sort((a, b) => b.pirAvg - a.pirAvg);
  const mvpEntry = allLeaguePlayers[0];
  const youngEntry = allLeaguePlayers.find((e) => e.player.age <= 22);
  const sixthEntry = allLeaguePlayers.find((e) => e.player.rosterSlot !== 'starter');
  const champTeam =
    career.teams.find((t) => t.id === career.championTeamId) ??
    career.teams.find((t) => t.id === userLeagueStandings[0]?.teamId);
  const coachTeam = career.teams.find((t) => t.id === userLeagueStandings[0]?.teamId);

  const seasonAward: SeasonAwardRecord = {
    seasonLabel: `${career.seasonYear}/${String(career.seasonYear + 1).slice(-2)}`,
    leagueName: userLeagueCfg.name,
    championTeamName: champTeam?.name ?? '-',
    mvpName: mvpEntry ? `${mvpEntry.player.firstName[0]}. ${mvpEntry.player.lastName} (${mvpEntry.team.shortName})` : '-',
    bestYoungName: youngEntry ? `${youngEntry.player.firstName[0]}. ${youngEntry.player.lastName} (${youngEntry.team.shortName})` : '-',
    sixthManName: sixthEntry ? `${sixthEntry.player.firstName[0]}. ${sixthEntry.player.lastName} (${sixthEntry.team.shortName})` : '-',
    coachOfTheYearName:
      coachTeam?.id === career.userTeamId
        ? `${career.managerName} (${coachTeam.shortName})`
        : coachTeam
        ? `Coach ${coachTeam.shortName}`
        : '-',
  };

  // Offerta di panchina da un club di categoria superiore se la fiducia è alta (>= 80)
  const jobOfferMsgs = [];
  if ((career.boardConfidence ?? 75) >= 80 && userLeagueId !== 'ITA_LBA') {
    const higherLeague: LeagueId = userLeagueId === 'ITA_A2' ? 'ITA_LBA' : 'ITA_A2';
    const higherCandidates = finalTeams.filter(
      (t) => t.leagueId === higherLeague && t.id !== career.userTeamId
    );
    if (higherCandidates.length > 0) {
      const suitor = higherCandidates[Math.floor(Math.random() * higherCandidates.length)];
      jobOfferMsgs.push({
        id: `msg_job_offer_${nextSeasonYear}_${suitor.id}`,
        category: 'dirigenza' as const,
        senderName: `Presidenza ${suitor.name}`,
        senderRole: 'Offerta Panchina',
        subject: `Proposta di Contratto: ${suitor.name} (${getLeagueConfig(higherLeague).shortName})`,
        body: `Gentile Coach ${career.managerName},\n\nabbiamo apprezzato molto la tua stagione alla guida di ${userTeam?.name}. Ti offriamo la panchina di ${suitor.name} per la stagione ${nextSeasonYear}/${String(nextSeasonYear + 1).slice(-2)} (Budget ${Math.round(suitor.budget / 1000)}k €).\n\nVuoi accettare la nuova sfida o restare nel tuo club attuale?`,
        date: nextStartDate,
        round: 1,
        read: false,
        urgent: true,
        jobOfferTeamId: suitor.id,
        choices: [
          {
            id: 'accept_job',
            label: `Accetta la panchina di ${suitor.shortName}`,
            effectHint: `Diventi il nuovo Coach di ${suitor.name}`,
          },
          {
            id: 'decline_job',
            label: 'Rifiuta e resta al tuo club',
            effectHint: '+5 Fiducia Dirigenza attuale',
          },
        ],
      });
    }
  }

  const nextCareer: CareerSave = {
    ...career,
    seasonYear: nextSeasonYear,
    currentRound: 1,
    currentDate: nextStartDate,
    phase: 'offseason',
    championTeamId: undefined,
    regulationAlert: regulationNotice,
    teams: finalTeams,
    freeAgents: finalFreeAgents,
    schedule: nextSchedule,
    playoffs: [],
    coppaItalia: createInitialCoppaItalia(nextSeasonYear),
    euroLeagues: createInitialEuroCompetitions(finalTeams),
    boardObjective: getTeamBoardObjective(nextUserTeam.prestige),
    boardConfidence: Math.max(60, Math.min(88, career.boardConfidence ?? 75)),
    incomingOffers: endOfSeasonOffers.offers,
    messages: [...jobOfferMsgs, ...transitionMessages, ...(career.messages ?? [])].slice(0, 60),
    awardsHistory: [seasonAward, ...(career.awardsHistory ?? [])],
    news: [
      ...regulationNews,
      ...endOfSeasonOffers.news,
      ...summerMarket.news,
      {
        id: `news_new_season_${nextSeasonYear}_${Date.now()}`,
        round: 1,
        category: 'Lega' as const,
        title: `Al via la Stagione ${nextSeasonYear}/${String(nextSeasonYear + 1).slice(-2)}!`,
        body: `Promosse in LBA: ${promoLbaText}. Retrocesse in A2: ${relLbaText}. Inizio Regular Season nella 3ª settimana di settembre (${nextStartDate}).${
          releasedUserPlayers.length > 0
            ? ` Svincolati a fine contratto: ${releasedUserPlayers.join(', ')}.`
            : ''
        }`,
      },
      ...career.news,
    ].slice(0, 40),
  };

  return { nextCareer, movements, releasedUserPlayers };
}
