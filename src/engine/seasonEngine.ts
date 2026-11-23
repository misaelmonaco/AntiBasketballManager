import {
  LeagueId,
  MatchState,
  NewsItem,
  PlayoffSeries,
  ScheduledGame,
  StandingRow,
  Team,
} from '../types';

export function computeStandings(teams: Team[], schedule: ScheduledGame[]): StandingRow[] {
  const map = new Map<string, StandingRow>();
  for (const t of teams) {
    map.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      shortName: t.shortName,
      primaryColor: t.primaryColor,
      played: 0,
      wins: 0,
      losses: 0,
      leaguePoints: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      streak: 0,
    });
  }

  const playedGames = schedule
    .filter((g) => g.played && g.homeScore !== undefined && g.awayScore !== undefined)
    .sort((a, b) => a.round - b.round);

  for (const g of playedGames) {
    const home = map.get(g.homeTeamId);
    const away = map.get(g.awayTeamId);
    if (!home || !away) continue;

    const hs = g.homeScore!;
    const as = g.awayScore!;

    home.played += 1;
    away.played += 1;
    home.pointsFor += hs;
    home.pointsAgainst += as;
    away.pointsFor += as;
    away.pointsAgainst += hs;

    if (hs > as) {
      home.wins += 1;
      home.leaguePoints += 2;
      home.streak = home.streak > 0 ? home.streak + 1 : 1;

      away.losses += 1;
      away.streak = away.streak < 0 ? away.streak - 1 : -1;
    } else {
      away.wins += 1;
      away.leaguePoints += 2;
      away.streak = away.streak > 0 ? away.streak + 1 : 1;

      home.losses += 1;
      home.streak = home.streak < 0 ? home.streak - 1 : -1;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.pointsFor - a.pointsFor;
  });
}

export function applyMatchStatsToTeams(teams: Team[], match: MatchState): Team[] {
  const boxMap = new Map<string, MatchState['home']['players'][number]>();
  for (const p of match.home.players) boxMap.set(p.playerId, p);
  for (const p of match.away.players) boxMap.set(p.playerId, p);

  return teams.map((team) => {
    if (team.id !== match.home.teamId && team.id !== match.away.teamId) {
      return team;
    }
    const isHome = team.id === match.home.teamId;
    const teamScore = isHome ? match.home.score : match.away.score;
    const oppScore = isHome ? match.away.score : match.home.score;
    const opponentShort = isHome ? match.away.shortName : match.home.shortName;
    const won = teamScore > oppScore;

    return {
      ...team,
      roster: team.roster.map((player) => {
        const box = boxMap.get(player.id);
        if (!box || box.secondsPlayed === 0) {
          // Recupero condizione per chi ha riposato
          return {
            ...player,
            condition: Math.min(100, player.condition + 4),
          };
        }
        const s = player.seasonStats;
        const mins = Math.round(box.secondsPlayed / 60);
        const oreb = box.oreb ?? 0;
        const dreb = box.dreb ?? Math.max(0, box.rebounds - oreb);
        const logEntry = {
          gameId: match.gameId,
          round: match.round,
          opponentShort,
          isHome,
          teamScore,
          oppScore,
          won,
          starter: box.isStarter,
          minutes: mins,
          points: box.points,
          rebounds: box.rebounds,
          oreb,
          dreb,
          assists: box.assists,
          steals: box.steals,
          blocks: box.blocks,
          turnovers: box.turnovers,
          fgm: box.fgm,
          fga: box.fga,
          tpm: box.tpm,
          tpa: box.tpa,
          ftm: box.ftm,
          fta: box.fta,
          pir: box.pir,
        };

        return {
          ...player,
          condition: Math.max(76, Math.min(100, Math.round(box.stamina + 18))),
          seasonStats: {
            gamesPlayed: s.gamesPlayed + 1,
            gamesStarted: (s.gamesStarted ?? 0) + (box.isStarter ? 1 : 0),
            minutes: s.minutes + mins,
            points: s.points + box.points,
            rebounds: s.rebounds + box.rebounds,
            oreb: (s.oreb ?? 0) + oreb,
            dreb: (s.dreb ?? 0) + dreb,
            assists: s.assists + box.assists,
            steals: s.steals + box.steals,
            blocks: s.blocks + box.blocks,
            turnovers: s.turnovers + box.turnovers,
            fgm: s.fgm + box.fgm,
            fga: s.fga + box.fga,
            tpm: s.tpm + box.tpm,
            tpa: s.tpa + box.tpa,
            ftm: s.ftm + box.ftm,
            fta: s.fta + box.fta,
            pir: s.pir + box.pir,
          },
          gameLog: [logEntry, ...(player.gameLog ?? [])].slice(0, 60),
        };
      }),
    };
  });
}

export function createPlayoffQuarterfinals(
  standings: StandingRow[],
  leagueId?: LeagueId
): PlayoffSeries[] {
  // In Serie A2 la 1ª sale direttamente in LBA e i playoff coinvolgono i posti 2–9.
  const startIdx = leagueId === 'ITA_A2' ? 1 : 0;
  const top8 = standings.slice(startIdx, startIdx + 8);
  const pairs: [number, number][] = [
    [0, 7], // 1 vs 8 (oppure 2 vs 9 in A2)
    [3, 4], // 4 vs 5 (oppure 5 vs 6 in A2)
    [1, 6], // 2 vs 7 (oppure 3 vs 8 in A2)
    [2, 5], // 3 vs 6 (oppure 4 vs 7 in A2)
  ];

  return pairs.map(([hi, lo], idx) => ({
    id: `po_qf_${idx + 1}`,
    stage: 'Quarti',
    bestOf: 5,
    higherSeedId: top8[hi].teamId,
    lowerSeedId: top8[lo].teamId,
    higherSeedWins: 0,
    lowerSeedWins: 0,
    games: [],
  }));
}

export function getNextPlayoffGameTeams(series: PlayoffSeries): {
  homeTeamId: string;
  awayTeamId: string;
} {
  // Formato 2-2-1: G1, G2, G5 in casa della testa di serie più alta; G3, G4 in casa della più bassa
  const gameNum = series.games.length + 1;
  const higherIsHome = gameNum === 1 || gameNum === 2 || gameNum === 5;
  return {
    homeTeamId: higherIsHome ? series.higherSeedId : series.lowerSeedId,
    awayTeamId: higherIsHome ? series.lowerSeedId : series.higherSeedId,
  };
}

export function checkAndAdvancePlayoffs(
  playoffs: PlayoffSeries[],
  standings: StandingRow[]
): { playoffs: PlayoffSeries[]; championTeamId?: string } {
  const rankMap = new Map<string, number>();
  standings.forEach((row, idx) => rankMap.set(row.teamId, idx));

  const qfs = playoffs.filter((s) => s.stage === 'Quarti');
  const sfs = playoffs.filter((s) => s.stage === 'Semifinali');
  const finals = playoffs.filter((s) => s.stage === 'Finale');

  if (finals.length > 0 && finals[0].winnerId) {
    return { playoffs, championTeamId: finals[0].winnerId };
  }

  if (sfs.length === 2 && sfs.every((s) => s.winnerId) && finals.length === 0) {
    const w1 = sfs[0].winnerId!;
    const w2 = sfs[1].winnerId!;
    const higher = (rankMap.get(w1) ?? 99) < (rankMap.get(w2) ?? 99) ? w1 : w2;
    const lower = higher === w1 ? w2 : w1;
    return {
      playoffs: [
        ...playoffs,
        {
          id: 'po_fin_1',
          stage: 'Finale',
          bestOf: 5,
          higherSeedId: higher,
          lowerSeedId: lower,
          higherSeedWins: 0,
          lowerSeedWins: 0,
          games: [],
        },
      ],
    };
  }

  if (qfs.length === 4 && qfs.every((s) => s.winnerId) && sfs.length === 0) {
    const makeSf = (id: string, a: string, b: string): PlayoffSeries => {
      const higher = (rankMap.get(a) ?? 99) < (rankMap.get(b) ?? 99) ? a : b;
      const lower = higher === a ? b : a;
      return {
        id,
        stage: 'Semifinali',
        bestOf: 5,
        higherSeedId: higher,
        lowerSeedId: lower,
        higherSeedWins: 0,
        lowerSeedWins: 0,
        games: [],
      };
    };

    return {
      playoffs: [
        ...playoffs,
        makeSf('po_sf_1', qfs[0].winnerId!, qfs[1].winnerId!),
        makeSf('po_sf_2', qfs[2].winnerId!, qfs[3].winnerId!),
      ],
    };
  }

  return { playoffs };
}

export function generateRoundNews(
  round: number,
  teams: Team[],
  gamesInRound: ScheduledGame[]
): NewsItem[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const items: NewsItem[] = [];

  // Trova la partita con lo scarto più ampio o punteggio più alto
  let bestGame: ScheduledGame | null = null;
  let maxTotal = 0;
  for (const g of gamesInRound) {
    if (g.homeScore !== undefined && g.awayScore !== undefined) {
      const tot = g.homeScore + g.awayScore;
      if (tot > maxTotal) {
        maxTotal = tot;
        bestGame = g;
      }
    }
  }

  if (bestGame) {
    const h = teamMap.get(bestGame.homeTeamId);
    const a = teamMap.get(bestGame.awayTeamId);
    if (h && a) {
      items.push({
        id: `news_r${round}_${Date.now()}`,
        round,
        category: 'Risultati',
        title: `Spettacolo alla ${round}ª giornata: ${h.shortName} vs ${a.shortName}`,
        body: `Partita ad alto punteggio tra ${h.name} (${bestGame.homeScore}) e ${a.name} (${bestGame.awayScore})${
          bestGame.summary
            ? `. Top scorer: ${bestGame.summary.homeTopScorer.name} (${bestGame.summary.homeTopScorer.points} pt) e ${bestGame.summary.awayTopScorer.name} (${bestGame.summary.awayTopScorer.points} pt).`
            : '.'
        }`,
      });
    }
  }

  return items;
}
