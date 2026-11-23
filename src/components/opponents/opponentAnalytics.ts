import { Player, Position, ScheduledGame, Team } from '../../types';
import { getLeagueConfig } from '../../data/teams';
import { getRoundDate } from '../../engine/calendarUtils';
import { calculateWageBill } from '../../engine/ratings';
import { computeStandings } from '../../engine/seasonEngine';

export interface TeamGameEntry {
  game: ScheduledGame;
  date: string;
  isHome: boolean;
  opponentId: string;
  opponentName: string;
  opponentShort: string;
  opponentColor: string;
  teamScore?: number;
  oppScore?: number;
  won?: boolean;
  isVsUser: boolean;
}

export interface OpponentTeamMetrics {
  rank: number;
  totalInLeague: number;
  played: number;
  wins: number;
  losses: number;
  leaguePoints: number;
  streak: number;
  ppgFor: number;
  ppgAgainst: number;
  pointDiffPerGame: number;
  avgOverall: number;
  startersOverall: number;
  avgAge: number;
  wageBill: number;
  freeCap: number;
  italiansCount: number;
  foreignersCount: number;
  injuredCount: number;
  starters: Player[];
  topScorer: Player | null;
  topRebounder: Player | null;
  topAssister: Player | null;
  topPir: Player | null;
  starPlayer: Player | null;
  teamFgPct: number;
  teamThreePct: number;
  teamFtPct: number;
  teamRpg: number;
  teamApg: number;
  teamSpg: number;
  teamBpg: number;
  teamTpg: number;
  teamPirAvg: number;
  last5: ('W' | 'L')[];
  recentGames: TeamGameEntry[];
  upcomingGames: TeamGameEntry[];
  h2hGames: TeamGameEntry[];
  h2hWins: number;
  h2hLosses: number;
  userComparison: {
    userAvgOverall: number;
    userStartersOverall: number;
    userPpgFor: number;
    userPpgAgainst: number;
    userChemistry: number;
    userBudget: number;
  };
}

const POS_ORDER: Record<Position, number> = {
  PG: 0,
  SG: 1,
  SF: 2,
  PF: 3,
  C: 4,
};

function selectStarters(roster: Player[]): Player[] {
  const explicitStarters = roster
    .filter((p) => p.rosterSlot === 'starter')
    .slice()
    .sort((a, b) => {
      const pd = POS_ORDER[a.primaryPosition] - POS_ORDER[b.primaryPosition];
      return pd !== 0 ? pd : b.overall - a.overall;
    });

  if (explicitStarters.length >= 5) {
    return explicitStarters.slice(0, 5);
  }

  const chosenIds = new Set(explicitStarters.map((p) => p.id));
  const candidates = roster
    .filter((p) => !chosenIds.has(p.id))
    .slice()
    .sort((a, b) => {
      if ((a.injuryWeeks > 0) !== (b.injuryWeeks > 0)) {
        return a.injuryWeeks > 0 ? 1 : -1;
      }
      return b.overall - a.overall;
    });

  const combined = [...explicitStarters, ...candidates.slice(0, 5 - explicitStarters.length)];
  return combined.sort((a, b) => POS_ORDER[a.primaryPosition] - POS_ORDER[b.primaryPosition]);
}

function pickLeader(
  roster: Player[],
  metric: (p: Player) => number
): Player | null {
  if (roster.length === 0) return null;
  const activeWithGames = roster.filter((p) => p.seasonStats.gamesPlayed > 0);
  const pool = activeWithGames.length > 0 ? activeWithGames : roster;
  let best = pool[0];
  let bestVal = activeWithGames.length > 0 ? metric(best) : best.overall;
  for (let i = 1; i < pool.length; i++) {
    const candidate = pool[i];
    const val = activeWithGames.length > 0 ? metric(candidate) : candidate.overall;
    if (val > bestVal) {
      best = candidate;
      bestVal = val;
    }
  }
  return best;
}

export function getNextScheduledOpponentId(
  userTeamId: string,
  schedule: ScheduledGame[]
): string | null {
  const unplayed = schedule
    .filter((g) => !g.played && (g.homeTeamId === userTeamId || g.awayTeamId === userTeamId))
    .slice()
    .sort((a, b) => a.round - b.round);

  if (unplayed.length === 0) return null;
  const nextGame = unplayed[0];
  return nextGame.homeTeamId === userTeamId ? nextGame.awayTeamId : nextGame.homeTeamId;
}

export function computeTeamFormMap(
  leagueTeams: Team[],
  leagueSchedule: ScheduledGame[]
): Map<string, ('W' | 'L')[]> {
  const formMap = new Map<string, ('W' | 'L')[]>();
  for (const t of leagueTeams) {
    formMap.set(t.id, []);
  }
  const played = leagueSchedule
    .filter((g) => g.played && typeof g.homeScore === 'number' && typeof g.awayScore === 'number')
    .slice()
    .sort((a, b) => a.round - b.round);

  for (const g of played) {
    const homeWon = (g.homeScore ?? 0) > (g.awayScore ?? 0);
    const homeArr = formMap.get(g.homeTeamId);
    if (homeArr) homeArr.push(homeWon ? 'W' : 'L');
    const awayArr = formMap.get(g.awayTeamId);
    if (awayArr) awayArr.push(homeWon ? 'L' : 'W');
  }

  for (const [tid, arr] of formMap.entries()) {
    if (arr.length > 5) {
      formMap.set(tid, arr.slice(-5));
    }
  }
  return formMap;
}

export function computeTeamSeasonOverview(
  team: Team,
  userTeam: Team,
  leagueTeams: Team[],
  leagueSchedule: ScheduledGame[],
  allTeams: Team[],
  seasonYear: number,
  userLeagueSchedule?: ScheduledGame[]
): OpponentTeamMetrics {
  const leagueId = team.leagueId ?? 'ITA_LBA';
  const leagueCfg = getLeagueConfig(leagueId);
  const standings = computeStandings(leagueTeams, leagueSchedule);
  const rankIdx = standings.findIndex((r) => r.teamId === team.id);
  const row = rankIdx >= 0 ? standings[rankIdx] : undefined;

  const rank = rankIdx >= 0 ? rankIdx + 1 : Math.max(1, leagueTeams.length);
  const totalInLeague = Math.max(1, leagueTeams.length);
  const played = row?.played ?? 0;
  const wins = row?.wins ?? 0;
  const losses = row?.losses ?? 0;
  const leaguePoints = row?.leaguePoints ?? 0;
  const streak = row?.streak ?? 0;

  const ppgFor = played > 0 && row ? Number((row.pointsFor / played).toFixed(1)) : 0;
  const ppgAgainst = played > 0 && row ? Number((row.pointsAgainst / played).toFixed(1)) : 0;
  const pointDiffPerGame =
    played > 0 && row ? Number(((row.pointsFor - row.pointsAgainst) / played).toFixed(1)) : 0;

  const roster = team.roster;
  const starters = selectStarters(roster);
  const avgOverall =
    roster.length > 0
      ? Math.round(roster.reduce((s, p) => s + p.overall, 0) / roster.length)
      : 0;
  const startersOverall =
    starters.length > 0
      ? Math.round(starters.reduce((s, p) => s + p.overall, 0) / starters.length)
      : avgOverall;
  const avgAge =
    roster.length > 0
      ? Number((roster.reduce((s, p) => s + p.age, 0) / roster.length).toFixed(1))
      : 0;

  const wageBill = calculateWageBill(roster);
  const freeCap = team.budget - wageBill;
  const italiansCount = roster.filter((p) => p.isItalianFormation).length;
  const foreignersCount = roster.length - italiansCount;
  const injuredCount = roster.filter((p) => p.injuryWeeks > 0).length;

  let fgm = 0;
  let fga = 0;
  let tpm = 0;
  let tpa = 0;
  let ftm = 0;
  let fta = 0;
  let reb = 0;
  let ast = 0;
  let stl = 0;
  let blk = 0;
  let tov = 0;
  let pir = 0;

  for (const p of roster) {
    const st = p.seasonStats;
    fgm += st.fgm;
    fga += st.fga;
    tpm += st.tpm;
    tpa += st.tpa;
    ftm += st.ftm;
    fta += st.fta;
    reb += st.rebounds;
    ast += st.assists;
    stl += st.steals;
    blk += st.blocks;
    tov += st.turnovers;
    pir += st.pir;
  }

  const teamFgPct = fga > 0 ? Math.round((fgm / fga) * 1000) / 10 : 0;
  const teamThreePct = tpa > 0 ? Math.round((tpm / tpa) * 1000) / 10 : 0;
  const teamFtPct = fta > 0 ? Math.round((ftm / fta) * 1000) / 10 : 0;

  const perGameDiv = played > 0 ? played : 1;
  const teamRpg = played > 0 ? Number((reb / perGameDiv).toFixed(1)) : 0;
  const teamApg = played > 0 ? Number((ast / perGameDiv).toFixed(1)) : 0;
  const teamSpg = played > 0 ? Number((stl / perGameDiv).toFixed(1)) : 0;
  const teamBpg = played > 0 ? Number((blk / perGameDiv).toFixed(1)) : 0;
  const teamTpg = played > 0 ? Number((tov / perGameDiv).toFixed(1)) : 0;
  const teamPirAvg = played > 0 ? Number((pir / perGameDiv).toFixed(1)) : 0;

  const topScorer = pickLeader(
    roster,
    (p) => p.seasonStats.points / Math.max(1, p.seasonStats.gamesPlayed)
  );
  const topRebounder = pickLeader(
    roster,
    (p) => p.seasonStats.rebounds / Math.max(1, p.seasonStats.gamesPlayed)
  );
  const topAssister = pickLeader(
    roster,
    (p) => p.seasonStats.assists / Math.max(1, p.seasonStats.gamesPlayed)
  );
  const topPir = pickLeader(
    roster,
    (p) => p.seasonStats.pir / Math.max(1, p.seasonStats.gamesPlayed)
  );
  const starPlayer =
    roster.length > 0
      ? roster.slice().sort((a, b) => b.overall - a.overall)[0]
      : null;

  const teamMap = new Map(allTeams.map((t) => [t.id, t]));
  const teamGames = leagueSchedule
    .filter((g) => g.homeTeamId === team.id || g.awayTeamId === team.id)
    .slice()
    .sort((a, b) => a.round - b.round);

  const entries: TeamGameEntry[] = teamGames.map((g) => {
    const isHome = g.homeTeamId === team.id;
    const opponentId = isHome ? g.awayTeamId : g.homeTeamId;
    const opp = teamMap.get(opponentId);
    const hasScore = g.played && typeof g.homeScore === 'number' && typeof g.awayScore === 'number';
    const teamScore = hasScore ? (isHome ? g.homeScore : g.awayScore) : undefined;
    const oppScore = hasScore ? (isHome ? g.awayScore : g.homeScore) : undefined;
    return {
      game: g,
      date: getRoundDate(seasonYear, g.round, leagueCfg.totalRounds),
      isHome,
      opponentId,
      opponentName: opp?.name ?? opponentId,
      opponentShort: opp?.shortName ?? 'OPP',
      opponentColor: opp?.primaryColor ?? '#64748b',
      teamScore,
      oppScore,
      won:
        typeof teamScore === 'number' && typeof oppScore === 'number'
          ? teamScore > oppScore
          : undefined,
      isVsUser: opponentId === userTeam.id,
    };
  });

  const playedEntries = entries.filter((e) => e.game.played);
  const unplayedEntries = entries.filter((e) => !e.game.played);
  const last5: ('W' | 'L')[] = playedEntries
    .slice(-5)
    .map((e) => (e.won ? 'W' : 'L'));
  const recentGames = playedEntries.slice().reverse().slice(0, 8);
  const upcomingGames = unplayedEntries.slice(0, 6);
  const h2hGames = entries.filter((e) => e.isVsUser);
  const h2hWins = h2hGames.filter((e) => e.won === true).length;
  const h2hLosses = h2hGames.filter((e) => e.won === false).length;

  // User team comparison metrics
  const userRoster = userTeam.roster;
  const userStarters = selectStarters(userRoster);
  const userAvgOverall =
    userRoster.length > 0
      ? Math.round(userRoster.reduce((s, p) => s + p.overall, 0) / userRoster.length)
      : 0;
  const userStartersOverall =
    userStarters.length > 0
      ? Math.round(userStarters.reduce((s, p) => s + p.overall, 0) / userStarters.length)
      : userAvgOverall;

  const effectiveUserSchedule =
    (userTeam.leagueId ?? 'ITA_LBA') === leagueId
      ? leagueSchedule
      : userLeagueSchedule ?? [];
  const userStandingsRow =
    effectiveUserSchedule.length > 0
      ? computeStandings([userTeam, ...allTeams.filter((t) => (t.leagueId ?? 'ITA_LBA') === (userTeam.leagueId ?? 'ITA_LBA') && t.id !== userTeam.id)], effectiveUserSchedule).find(
          (r) => r.teamId === userTeam.id
        )
      : standings.find((r) => r.teamId === userTeam.id);

  let userPpgFor = 0;
  let userPpgAgainst = 0;
  if (userStandingsRow && userStandingsRow.played > 0) {
    userPpgFor = Number((userStandingsRow.pointsFor / userStandingsRow.played).toFixed(1));
    userPpgAgainst = Number((userStandingsRow.pointsAgainst / userStandingsRow.played).toFixed(1));
  } else {
    const userMaxGp = userRoster.reduce(
      (maxGp, p) => Math.max(maxGp, p.seasonStats.gamesPlayed),
      0
    );
    if (userMaxGp > 0) {
      const userTotalPts = userRoster.reduce((s, p) => s + p.seasonStats.points, 0);
      userPpgFor = Number((userTotalPts / userMaxGp).toFixed(1));
    }
  }

  return {
    rank,
    totalInLeague,
    played,
    wins,
    losses,
    leaguePoints,
    streak,
    ppgFor,
    ppgAgainst,
    pointDiffPerGame,
    avgOverall,
    startersOverall,
    avgAge,
    wageBill,
    freeCap,
    italiansCount,
    foreignersCount,
    injuredCount,
    starters,
    topScorer,
    topRebounder,
    topAssister,
    topPir,
    starPlayer,
    teamFgPct,
    teamThreePct,
    teamFtPct,
    teamRpg,
    teamApg,
    teamSpg,
    teamBpg,
    teamTpg,
    teamPirAvg,
    last5,
    recentGames,
    upcomingGames,
    h2hGames,
    h2hWins,
    h2hLosses,
    userComparison: {
      userAvgOverall,
      userStartersOverall,
      userPpgFor,
      userPpgAgainst,
      userChemistry: userTeam.chemistry,
      userBudget: userTeam.budget,
    },
  };
}
