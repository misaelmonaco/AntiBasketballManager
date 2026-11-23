import {
  BoardObjective,
  CareerSave,
  CompactPlayerBoxScore,
  CompactScoringPlay,
  FiringOfferContext,
  GameSummaryBox,
  InboxMessage,
  LeagueId,
  MatchState,
  NewsItem,
  PlayerBoxScore,
  ScheduledGame,
  Team,
} from '../types';
import { getTeamBoardObjective, updateBoardConfidence } from '../engine/managerEngine';
import { calculateWageBill } from '../engine/ratings';
import { computeStandings } from '../engine/seasonEngine';

export function buildRecommendedTeamsAfterFiring(teams: Team[], firedClub: Team): string[] {
  const others = teams.filter((t) => t.id !== firedClub.id);
  const leagueId = firedClub.leagueId ?? 'ITA_LBA';

  const sameLeaguePool = others
    .filter(
      (t) =>
        (t.leagueId ?? 'ITA_LBA') === leagueId &&
        t.prestige <= firedClub.prestige + 4
    )
    .sort(
      (a, b) =>
        Math.abs(a.prestige - (firedClub.prestige - 6)) -
        Math.abs(b.prestige - (firedClub.prestige - 6))
    );

  const lowerLeagues: LeagueId[] =
    leagueId === 'ITA_LBA'
      ? ['ITA_A2']
      : leagueId === 'ITA_A2'
      ? ['ITA_B', 'ITA_B2']
      : ['ITA_B_INT', 'ITA_B', 'ITA_B2'];

  const adjacentPool = others
    .filter(
      (t) =>
        lowerLeagues.includes(t.leagueId ?? 'ITA_LBA') &&
        (t.leagueId ?? 'ITA_LBA') !== leagueId
    )
    .sort((a, b) => b.prestige - a.prestige);

  const pickedIds: string[] = [];
  const seen = new Set<string>();
  for (const cand of [...sameLeaguePool.slice(0, 3), ...adjacentPool.slice(0, 3)]) {
    if (!seen.has(cand.id)) {
      seen.add(cand.id);
      pickedIds.push(cand.id);
    }
  }

  if (pickedIds.length < 6) {
    const fallback = [...others].sort(
      (a, b) =>
        Math.abs(a.prestige - (firedClub.prestige - 6)) -
        Math.abs(b.prestige - (firedClub.prestige - 6))
    );
    for (const cand of fallback) {
      if (pickedIds.length >= 6) break;
      if (!seen.has(cand.id)) {
        seen.add(cand.id);
        pickedIds.push(cand.id);
      }
    }
  }

  return pickedIds;
}

export function evaluateUserConfidenceAndFiring(params: {
  career: CareerSave;
  teams: Team[];
  schedule: ScheduledGame[];
  userWonLastGame: boolean;
  dateStr: string;
  round: number;
}): {
  fired: boolean;
  nextUserTeamId: string;
  nextBoardObjective: BoardObjective;
  nextConfidence: number;
  oldClubName: string;
  firingContext?: FiringOfferContext;
  firingMessage?: InboxMessage;
  firingNews?: NewsItem;
} {
  const { career, teams, schedule, userWonLastGame, dateStr, round } = params;
  const userTeam = teams.find((t) => t.id === career.userTeamId)!;
  const allowFiring = career.allowFiring ?? career.managerProfile?.allowFiring ?? true;
  const objective = career.boardObjective ?? getTeamBoardObjective(userTeam.prestige);
  const leagueId = userTeam.leagueId ?? 'ITA_LBA';
  const leagueTeams = teams.filter((t) => (t.leagueId ?? 'ITA_LBA') === leagueId);
  const leagueSchedule = schedule.filter((g) => (g.leagueId ?? 'ITA_LBA') === leagueId);

  const computedConfidence = updateBoardConfidence({
    currentConfidence: career.boardConfidence ?? 75,
    objective,
    standings: computeStandings(leagueTeams, leagueSchedule),
    userTeamId: userTeam.id,
    userWonLastGame,
    wageBill: calculateWageBill(userTeam.roster),
    budget: userTeam.budget,
    allowFiring,
  });

  if (allowFiring && computedConfidence <= 18) {
    const recommendedTeamIds = buildRecommendedTeamsAfterFiring(teams, userTeam);
    const firingContext: FiringOfferContext = {
      oldClubId: userTeam.id,
      oldClubName: userTeam.name,
      oldLeagueId: leagueId,
      finalConfidence: computedConfidence,
      dateStr,
      round,
      recommendedTeamIds,
    };

    const firingMessage: InboxMessage = {
      id: `msg_fired_${Date.now()}`,
      category: 'dirigenza',
      senderName: `Direzione ${userTeam.name}`,
      senderRole: 'Comunicato Ufficiale',
      subject: `ESONERO: Risoluzione contratto con ${userTeam.name}`,
      body: `Dopo gli ultimi risultati negativi la società ${userTeam.name} ha deciso per il cambio di guida tecnica (fiducia scesa al ${computedConfidence}%).\n\nSeleziona la prossima panchina dalla schermata delle offerte ricevute per proseguire la tua carriera.`,
      date: dateStr,
      round,
      read: false,
      urgent: true,
    };
    const firingNews: NewsItem = {
      id: `news_fired_${Date.now()}`,
      round,
      category: 'Lega',
      title: `CLAMOROSO ESONERO: ${userTeam.shortName} saluta Coach ${career.managerName}`,
      body: `La società ${userTeam.name} ha sollevato dall'incarico Coach ${career.managerName}. Il tecnico sta ora valutando le offerte per una nuova panchina.`,
    };

    return {
      fired: true,
      nextUserTeamId: userTeam.id,
      nextBoardObjective: objective,
      nextConfidence: computedConfidence,
      oldClubName: userTeam.name,
      firingContext,
      firingMessage,
      firingNews,
    };
  }

  return {
    fired: false,
    nextUserTeamId: userTeam.id,
    nextBoardObjective: objective,
    nextConfidence: computedConfidence,
    oldClubName: userTeam.name,
  };
}

export function toCompactBoxScore(p: PlayerBoxScore): CompactPlayerBoxScore {
  return {
    playerId: p.playerId,
    name: p.name,
    position: p.position,
    isStarter: p.isStarter,
    minutes: Math.round(p.secondsPlayed / 60),
    points: p.points,
    rebounds: p.rebounds,
    assists: p.assists,
    steals: p.steals,
    blocks: p.blocks,
    turnovers: p.turnovers,
    fouls: p.fouls,
    fgm: p.fgm,
    fga: p.fga,
    tpm: p.tpm,
    tpa: p.tpa,
    ftm: p.ftm,
    fta: p.fta,
    pir: p.pir,
  };
}

export function buildGameSummaryBox(res: MatchState): GameSummaryBox {
  const homeTop = [...res.home.players].sort((a, b) => b.points - a.points)[0];
  const awayTop = [...res.away.players].sort((a, b) => b.points - a.points)[0];
  const scoringPlays: CompactScoringPlay[] = res.playByPlay
    .filter((ev) => ev.pointsScored !== undefined && ev.scorerName)
    .map((ev) => ({
      q: ev.quarter,
      clock: ev.clockRemaining,
      side: ev.teamId === res.home.teamId ? ('home' as const) : ('away' as const),
      pts: ev.pointsScored!,
      scorer: ev.scorerName!,
      hs: ev.homeScore,
      as: ev.awayScore,
    }));
  return {
    homeTopScorer: { name: homeTop?.name ?? '-', points: homeTop?.points ?? 0 },
    awayTopScorer: { name: awayTop?.name ?? '-', points: awayTop?.points ?? 0 },
    homeQuarterScores: [...res.home.quarterScores],
    awayQuarterScores: [...res.away.quarterScores],
    homePlayers: res.home.players.map(toCompactBoxScore),
    awayPlayers: res.away.players.map(toCompactBoxScore),
    scoringPlays,
  };
}
