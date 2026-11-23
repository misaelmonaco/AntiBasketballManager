import { getLeagueConfig } from '../data/teams';
import {
  CoppaItaliaState,
  CupMatch,
  EuroCompetitionState,
  EuropeanCupId,
  EuroStandingRow,
  NewsItem,
  ScheduledGame,
  Team,
} from '../types';
import { computeStandings } from './seasonEngine';

export function getUserLeagueTotalRounds(teams: Team[], userTeamId: string): number {
  const userTeam = teams.find((t) => t.id === userTeamId);
  return getLeagueConfig(userTeam?.leagueId ?? 'ITA_LBA').totalRounds;
}

const EUROLEAGUE_FOREIGN_CLUBS: { id: string; name: string; shortName: string; country: string; rating: number }[] = [
  { id: 'el_real', name: 'Real Madrid', shortName: 'RMB', country: 'ESP', rating: 86 },
  { id: 'el_oly', name: 'Olympiacos Piraeus', shortName: 'OLY', country: 'GRE', rating: 85 },
  { id: 'el_pao', name: 'Panathinaikos', shortName: 'PAO', country: 'GRE', rating: 85 },
  { id: 'el_fen', name: 'Fenerbahçe Beko', shortName: 'FEN', country: 'TUR', rating: 84 },
  { id: 'el_bar', name: 'FC Barcelona', shortName: 'BAR', country: 'ESP', rating: 83 },
  { id: 'el_mon', name: 'AS Monaco', shortName: 'MON', country: 'FRA', rating: 83 },
  { id: 'el_efe', name: 'Anadolu Efes', shortName: 'EFE', country: 'TUR', rating: 82 },
  { id: 'el_par', name: 'Partizan Mozzart Bet', shortName: 'PAR', country: 'SRB', rating: 81 },
  { id: 'el_czv', name: 'Crvena Zvezda', shortName: 'CZV', country: 'SRB', rating: 80 },
  { id: 'el_zal', name: 'Žalgiris Kaunas', shortName: 'ZAL', country: 'LTU', rating: 79 },
  { id: 'el_bay', name: 'FC Bayern Munich', shortName: 'BAY', country: 'GER', rating: 79 },
  { id: 'el_mac', name: 'Maccabi Tel Aviv', shortName: 'MAC', country: 'ISR', rating: 80 },
  { id: 'el_bkn', name: 'Baskonia Vitoria', shortName: 'BKN', country: 'ESP', rating: 78 },
  { id: 'el_asv', name: 'LDLC ASVEL', shortName: 'ASV', country: 'FRA', rating: 76 },
];

const EUROCUP_FOREIGN_CLUBS: { id: string; name: string; shortName: string; country: string; rating: number }[] = [
  { id: 'ec_val', name: 'Valencia Basket', shortName: 'VAL', country: 'ESP', rating: 78 },
  { id: 'ec_hta', name: 'Hapoel Tel Aviv', shortName: 'HTA', country: 'ISR', rating: 78 },
  { id: 'ec_gcb', name: 'Gran Canaria', shortName: 'GCB', country: 'ESP', rating: 76 },
  { id: 'ec_bah', name: 'Bahçeşehir Koleji', shortName: 'BAH', country: 'TUR', rating: 76 },
  { id: 'ec_bes', name: 'Beşiktaş Fibabanka', shortName: 'BES', country: 'TUR', rating: 75 },
  { id: 'ec_bou', name: 'JL Bourg', shortName: 'BOU', country: 'FRA', rating: 75 },
  { id: 'ec_ulm', name: 'Ratiopharm Ulm', shortName: 'ULM', country: 'GER', rating: 74 },
  { id: 'ec_ced', name: 'Cedevita Olimpija', shortName: 'CED', country: 'SLO', rating: 74 },
  { id: 'ec_bud', name: 'Budućnost VOLI', shortName: 'BUD', country: 'MNE', rating: 74 },
  { id: 'ec_clu', name: 'U-BT Cluj-Napoca', shortName: 'CLU', country: 'ROU', rating: 73 },
  { id: 'ec_jov', name: 'Joventut Badalona', shortName: 'JOV', country: 'ESP', rating: 75 },
  { id: 'ec_tur', name: 'Türk Telekom', shortName: 'TTK', country: 'TUR', rating: 74 },
  { id: 'ec_ari', name: 'Aris Midea', shortName: 'ARI', country: 'GRE', rating: 72 },
];

function teamAvgOverall(team: Team): number {
  if (!team.roster.length) return 75;
  const top10 = [...team.roster].sort((a, b) => b.overall - a.overall).slice(0, 10);
  return Math.round(top10.reduce((s, p) => s + p.overall, 0) / top10.length);
}

export function createInitialEuroCompetitions(
  teams: Team[]
): Record<EuropeanCupId, EuroCompetitionState> {
  const elItalian: EuroStandingRow[] = teams
    .filter((t) => t.euroCup === 'EL')
    .map((t) => ({
      teamId: t.id,
      teamName: t.name,
      shortName: t.shortName,
      country: 'ITA',
      isItalian: true,
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      rating: teamAvgOverall(t),
    }));

  const ecItalian: EuroStandingRow[] = teams
    .filter((t) => t.euroCup === 'EC')
    .map((t) => ({
      teamId: t.id,
      teamName: t.name,
      shortName: t.shortName,
      country: 'ITA',
      isItalian: true,
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      rating: teamAvgOverall(t),
    }));

  const toForeignRow = (c: (typeof EUROLEAGUE_FOREIGN_CLUBS)[number]): EuroStandingRow => ({
    teamId: c.id,
    teamName: c.name,
    shortName: c.shortName,
    country: c.country,
    isItalian: false,
    played: 0,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    rating: c.rating,
  });

  return {
    EL: {
      id: 'EL',
      name: 'EuroLega',
      roundsPlayed: 0,
      totalRounds: 30,
      standings: [...elItalian, ...EUROLEAGUE_FOREIGN_CLUBS.map(toForeignRow)],
    },
    EC: {
      id: 'EC',
      name: 'EuroCup',
      roundsPlayed: 0,
      totalRounds: 18,
      standings: [...ecItalian, ...EUROCUP_FOREIGN_CLUBS.map(toForeignRow)],
    },
  };
}

function sortEuroStandings(rows: EuroStandingRow[]): EuroStandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.pointsFor - a.pointsFor;
  });
}

export function simulateEuroRound(
  euroLeagues: Record<EuropeanCupId, EuroCompetitionState>,
  teams: Team[]
): Record<EuropeanCupId, EuroCompetitionState> {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const result = { ...euroLeagues };

  for (const key of ['EL', 'EC'] as EuropeanCupId[]) {
    const comp = euroLeagues[key];
    if (!comp || comp.roundsPlayed >= comp.totalRounds) continue;

    // Aggiorna rating delle squadre italiane reali
    const rows = comp.standings.map((r) => {
      const real = teamMap.get(r.teamId);
      return real ? { ...r, rating: teamAvgOverall(real) } : { ...r };
    });

    // Abbina casualmente le squadre per questo turno
    const shuffled = [...rows].sort(() => Math.random() - 0.5);
    const updatedMap = new Map(rows.map((r) => [r.teamId, r]));

    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      const home = updatedMap.get(shuffled[i].teamId)!;
      const away = updatedMap.get(shuffled[i + 1].teamId)!;

      const diff = home.rating + 2.5 - away.rating;
      const homeWinProb = Math.max(0.15, Math.min(0.85, 0.5 + diff * 0.032));
      const homeWon = Math.random() < homeWinProb;

      const base = 78 + Math.floor(Math.random() * 14);
      const margin = 2 + Math.floor(Math.random() * 14);
      const homeScore = homeWon ? base + Math.ceil(margin / 2) : base - Math.floor(margin / 2);
      const awayScore = homeWon ? base - Math.floor(margin / 2) : base + Math.ceil(margin / 2);

      home.played += 1;
      away.played += 1;
      home.pointsFor += homeScore;
      home.pointsAgainst += awayScore;
      away.pointsFor += awayScore;
      away.pointsAgainst += homeScore;

      if (homeWon) {
        home.wins += 1;
        away.losses += 1;
      } else {
        away.wins += 1;
        home.losses += 1;
      }
    }

    const sorted = sortEuroStandings(Array.from(updatedMap.values()));
    const nextRound = comp.roundsPlayed + 1;
    result[key] = {
      ...comp,
      roundsPlayed: nextRound,
      standings: sorted,
      championName: nextRound >= comp.totalRounds ? sorted[0]?.teamName : comp.championName,
    };
  }

  return result;
}

export function createInitialCoppaItalia(seasonYear: number): CoppaItaliaState {
  return {
    seasonYear,
    started: false,
    finished: false,
    matches: [],
  };
}

function simSingleCupMatch(
  match: CupMatch,
  teamMap: Map<string, Team>
): CupMatch {
  const h = teamMap.get(match.homeTeamId);
  const a = teamMap.get(match.awayTeamId);
  const rH = h ? teamAvgOverall(h) : 75;
  const rA = a ? teamAvgOverall(a) : 75;
  const prob = Math.max(0.2, Math.min(0.8, 0.5 + (rH - rA) * 0.03));
  const homeWon = Math.random() < prob;
  const base = 76 + Math.floor(Math.random() * 15);
  const margin = 2 + Math.floor(Math.random() * 13);
  const homeScore = homeWon ? base + Math.ceil(margin / 2) : base - Math.floor(margin / 2);
  const awayScore = homeWon ? base - Math.floor(margin / 2) : base + Math.ceil(margin / 2);

  return {
    ...match,
    played: true,
    homeScore,
    awayScore,
    winnerId: homeWon ? match.homeTeamId : match.awayTeamId,
  };
}

export function advanceCoppaItaliaIfReady(
  coppaItalia: CoppaItaliaState,
  teams: Team[],
  schedule: ScheduledGame[],
  currentRound: number
): { coppaItalia: CoppaItaliaState; news?: NewsItem } {
  if (coppaItalia.finished || currentRound < 16) {
    return { coppaItalia };
  }

  const lbaTeams = teams.filter((t) => (t.leagueId ?? 'ITA_LBA') === 'ITA_LBA');
  const lbaSchedule = schedule.filter((g) => (g.leagueId ?? 'ITA_LBA') === 'ITA_LBA');
  const standings = computeStandings(lbaTeams, lbaSchedule);
  const top8 = standings.slice(0, 8);
  if (top8.length < 8) return { coppaItalia };

  const teamMap = new Map(lbaTeams.map((t) => [t.id, t]));
  const pairs: [number, number][] = [
    [0, 7],
    [3, 4],
    [1, 6],
    [2, 5],
  ];

  const qfMatches: CupMatch[] = pairs.map(([hi, lo], idx) =>
    simSingleCupMatch(
      {
        id: `ci_qf_${idx + 1}`,
        stage: 'Quarti',
        homeTeamId: top8[hi].teamId,
        homeTeamName: top8[hi].teamName,
        homeShort: top8[hi].shortName,
        awayTeamId: top8[lo].teamId,
        awayTeamName: top8[lo].teamName,
        awayShort: top8[lo].shortName,
        played: false,
      },
      teamMap
    )
  );

  const getWinnerInfo = (id: string) => {
    const t = teamMap.get(id);
    return {
      id,
      name: t?.name ?? 'Club',
      short: t?.shortName ?? 'CLB',
    };
  };

  const sf1A = getWinnerInfo(qfMatches[0].winnerId!);
  const sf1B = getWinnerInfo(qfMatches[1].winnerId!);
  const sf2A = getWinnerInfo(qfMatches[2].winnerId!);
  const sf2B = getWinnerInfo(qfMatches[3].winnerId!);

  const sfMatches: CupMatch[] = [
    simSingleCupMatch(
      {
        id: 'ci_sf_1',
        stage: 'Semifinali',
        homeTeamId: sf1A.id,
        homeTeamName: sf1A.name,
        homeShort: sf1A.short,
        awayTeamId: sf1B.id,
        awayTeamName: sf1B.name,
        awayShort: sf1B.short,
        played: false,
      },
      teamMap
    ),
    simSingleCupMatch(
      {
        id: 'ci_sf_2',
        stage: 'Semifinali',
        homeTeamId: sf2A.id,
        homeTeamName: sf2A.name,
        homeShort: sf2A.short,
        awayTeamId: sf2B.id,
        awayTeamName: sf2B.name,
        awayShort: sf2B.short,
        played: false,
      },
      teamMap
    ),
  ];

  const fA = getWinnerInfo(sfMatches[0].winnerId!);
  const fB = getWinnerInfo(sfMatches[1].winnerId!);
  const finalMatch = simSingleCupMatch(
    {
      id: 'ci_final',
      stage: 'Finale',
      homeTeamId: fA.id,
      homeTeamName: fA.name,
      homeShort: fA.short,
      awayTeamId: fB.id,
      awayTeamName: fB.name,
      awayShort: fB.short,
      played: false,
    },
    teamMap
  );

  const champ = getWinnerInfo(finalMatch.winnerId!);

  return {
    coppaItalia: {
      ...coppaItalia,
      started: true,
      finished: true,
      matches: [...qfMatches, ...sfMatches, finalMatch],
      winnerId: champ.id,
      winnerName: champ.name,
    },
    news: {
      id: `news_ci_${Date.now()}`,
      round: currentRound,
      category: 'Lega',
      title: `${champ.name} vince la Coppa Italia LBA!`,
      body: `Conclusa la Final Eight di Coppa Italia: in finale ${finalMatch.homeTeamName} vs ${finalMatch.awayTeamName} (${finalMatch.homeScore}-${finalMatch.awayScore}).`,
    },
  };
}
