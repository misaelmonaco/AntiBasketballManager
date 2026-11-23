import type { EuropeanCupId, LeagueConfig, LeagueId, Tactics } from '../types';

export interface TeamTemplate {
  id: string;
  name: string;
  shortName: string;
  city: string;
  arena: string;
  arenaCapacity: number;
  primaryColor: string;
  secondaryColor: string;
  leagueId: LeagueId;
  avgOverall: number;
  euroCup?: EuropeanCupId;
  budget: number;
  prestige: number;
  defaultTactics: Tactics;
}

export const LEAGUES: LeagueConfig[] = [
  {
    id: 'ITA_LBA',
    name: 'Serie A LBA',
    shortName: 'LBA',
    tier: 'ITA-1',
    avgOverall: 75,
    teamsCount: 16,
    totalRounds: 30,
    playoffTeams: 8,
    relegationSpots: 2,
    promotionSpots: 0,
  },
  {
    id: 'ITA_A2',
    name: 'Serie A2',
    shortName: 'A2',
    tier: 'ITA-2',
    avgOverall: 63,
    teamsCount: 20,
    totalRounds: 38,
    playoffStartRank: 2,
    playoffTeams: 8,
    directPromotionSpots: 1,
    relegationSpots: 3,
    promotionSpots: 2,
  },
  {
    id: 'ITA_B',
    name: 'Serie B Nazionale (Gir. A)',
    shortName: 'B-A',
    tier: 'ITA-3A',
    avgOverall: 56,
    teamsCount: 18,
    totalRounds: 34,
    playoffTeams: 8,
    relegationSpots: 2,
    promotionSpots: 1,
  },
  {
    id: 'ITA_B2',
    name: 'Serie B Nazionale (Gir. B)',
    shortName: 'B-B',
    tier: 'ITA-3B',
    avgOverall: 56,
    teamsCount: 18,
    totalRounds: 34,
    playoffTeams: 8,
    relegationSpots: 2,
    promotionSpots: 1,
  },
  {
    id: 'ITA_B_INT',
    name: 'Serie B Interregionale',
    shortName: 'B-INT',
    tier: 'ITA-B2',
    avgOverall: 52,
    teamsCount: 14,
    totalRounds: 26,
    playoffTeams: 8,
    relegationSpots: 0,
    promotionSpots: 2,
  },
];

export function getLeagueConfig(leagueId?: LeagueId): LeagueConfig {
  return LEAGUES.find((l) => l.id === leagueId) ?? LEAGUES[0];
}

interface RawTeamSeed {
  name: string;
  city: string;
  colors: [string, string];
  euro?: EuropeanCupId;
}

const RAW_LEAGUE_TEAMS: Record<LeagueId, RawTeamSeed[]> = {
  ITA_LBA: [
    { name: 'Milano Rossi', city: 'Milano', colors: ['#FFFFFF', '#D0021B'], euro: 'EL' },
    { name: 'V nera Bologna', city: 'Bologna', colors: ['#FFFFFF', '#000000'], euro: 'EL' },
    { name: 'Tortona D', city: 'Tortona', colors: ['#FFFFFF', '#000000'] },
    { name: 'Cantù basket', city: 'Cantù', colors: ['#FFFFFF', '#003DA5'] },
    { name: 'Udine bk', city: 'Udine', colors: ['#FFFFFF', '#000000'] },
    { name: 'Trento Eagles', city: 'Trento', colors: ['#FFFFFF', '#000000'], euro: 'EC' },
    { name: 'Pallacanestro Scafati', city: 'Scafati', colors: ['#FFD100', '#003DA5'] },
    { name: 'M Roma', city: 'Roma', colors: ['#FFD100', '#D0021B'] },
    { name: 'Roma Basket', city: 'Roma', colors: ['#FFFFFF', '#003DA5'] },
    { name: 'Napoli bk', city: 'Napoli', colors: ['#3EA6E0', '#FFFFFF'] },
    { name: 'Varese basket', city: 'Varese', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Reggio Basket', city: 'Reggio Emilia', colors: ['#FFFFFF', '#D0021B'], euro: 'EC' },
    { name: 'Trieste V', city: 'Trieste', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Verona Scudi', city: 'Verona', colors: ['#FFD100', '#003DA5'] },
    { name: 'Venezia Lions', city: 'Venezia', colors: ['#FFD700', '#6D2932'], euro: 'EC' },
    { name: 'Treviso UB', city: 'Treviso', colors: ['#FFFFFF', '#8ED8F8'] },
  ],
  ITA_A2: [
    { name: 'Forte Bologna', city: 'Bologna', colors: ['#FFFFFF', '#003DA5'] },
    { name: 'Stella Brindisi', city: 'Brindisi', colors: ['#FFFFFF', '#3EA6E0'] },
    { name: 'Caserta bk', city: 'Caserta', colors: ['#FFFFFF', '#000000'] },
    { name: 'Cento basket', city: 'Cento', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Friuli basket', city: 'Cividale', colors: ['#FFD100', '#003DA5'] },
    { name: 'Cremona Juve', city: 'Cremona', colors: ['#FFD700', '#8B1E3F'] },
    { name: 'Forlì F', city: 'Forlì', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Livorno bk', city: 'Livorno', colors: ['#FFFFFF', '#8B1E3F'] },
    { name: 'M Mestre', city: 'Mestre', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Wildcat Milano', city: 'Milano', colors: ['#FFFFFF', '#003DA5'] },
    { name: 'Montecatini bk', city: 'Montecatini Terme', colors: ['#D0021B', '#003DA5'] },
    { name: 'Pesaro basket', city: 'Pesaro', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Pistoia P', city: 'Pistoia', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Rieti bk', city: 'Rieti', colors: ['#8B1E3F', '#8ED8F8'] },
    { name: 'Rimini basket', city: 'Rimini', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Puglia bk', city: 'Ruvo di Puglia', colors: ['#FFFFFF', '#3EA6E0'] },
    { name: 'Torino T', city: 'Torino', colors: ['#FFD100', '#003DA5'] },
    { name: 'Basket Avellino', city: 'Avellino', colors: ['#FFFFFF', '#046A38'] },
    { name: 'Vigevano bk', city: 'Vigevano', colors: ['#FFD100', '#003DA5'] },
    { name: 'Sardegna D', city: 'Sassari', colors: ['#003DA5', '#FFFFFF'] },
  ],
  ITA_B: [
    { name: 'Agrigento bk', city: 'Agrigento', colors: ['#FFFFFF', '#3EA6E0'] },
    { name: 'Brescia basket', city: 'Brescia', colors: ['#003DA5', '#FFFFFF'] },
    { name: "Capo d'Orlando bk", city: "Capo d'Orlando", colors: ['#F58220', '#003DA5'] },
    { name: 'Desio bk', city: 'Desio', colors: ['#D0021B', '#FFFFFF'] },
    { name: 'Ferrara basket', city: 'Ferrara', colors: ['#FFFFFF', '#003DA5'] },
    { name: 'Fiorenzuola bk', city: "Fiorenzuola d'Arda", colors: ['#D0021B', '#FFFFFF'] },
    { name: 'AC Imola', city: 'Imola', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Legnano bk', city: 'Legnano', colors: ['#FFD100', '#003DA5'] },
    { name: 'Lumezzane basket', city: 'Lumezzane', colors: ['#D0021B', '#FFFFFF'] },
    { name: 'Fulgor Omegna', city: 'Omegna', colors: ['#D0021B', '#000000'] },
    { name: 'Orzinuovi bk', city: 'Orzinuovi', colors: ['#FFD100', '#000000'] },
    { name: 'Piacenza A', city: 'Piacenza', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Piazza Armerina bk', city: 'Piazza Armerina', colors: ['#046A38', '#FFFFFF'] },
    { name: 'Viola RC', city: 'Reggio Calabria', colors: ['#5A2D81', '#FFFFFF'] },
    { name: 'Sangiorgese bk', city: 'San Giorgio su Legnano', colors: ['#003DA5', '#D0021B'] },
    { name: 'San Vendemiano bk', city: 'San Vendemiano', colors: ['#F58220', '#000000'] },
    { name: 'Treviglio bk', city: 'Treviglio', colors: ['#D0021B', '#003DA5'] },
    { name: 'Vicenza basket', city: 'Vicenza', colors: ['#D0021B', '#FFFFFF'] },
  ],
  ITA_B2: [
    { name: 'Lupi Avellino', city: 'Avellino', colors: ['#046A38', '#FFFFFF'] },
    { name: 'Chiusi basket', city: 'Chiusi', colors: ['#FFFFFF', '#F58220'] },
    { name: 'Fabriano bk', city: 'Fabriano', colors: ['#FFFFFF', '#003DA5'] },
    { name: 'Faenza bk', city: 'Faenza', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Latina basket', city: 'Latina', colors: ['#003DA5', '#000000'] },
    { name: 'PL Livorno', city: 'Livorno', colors: ['#003DA5', '#FFFFFF'] },
    { name: 'Lucca bk', city: 'Lucca', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Montecatini H', city: 'Montecatini Terme', colors: ['#FFFFFF', '#D0021B'] },
    { name: 'Napoli Est bk', city: 'Napoli', colors: ['#3EA6E0', '#000000'] },
    { name: 'L Pesaro', city: 'Pesaro', colors: ['#D0021B', '#FFFFFF'] },
    { name: 'Piombino bk', city: 'Piombino', colors: ['#003DA5', '#FFD100'] },
    { name: 'Quarrata bk', city: 'Quarrata', colors: ['#FFD100', '#D0021B'] },
    { name: 'Ravenna basket', city: 'Ravenna', colors: ['#FFD100', '#D0021B'] },
    { name: 'Roma L', city: 'Roma', colors: ['#D0021B', '#FFD100'] },
    { name: 'Vir Roma 60', city: 'Roma', colors: ['#003DA5', '#FFFFFF'] },
    { name: 'Roseto bk', city: 'Roseto degli Abruzzi', colors: ['#FFFFFF', '#003DA5'] },
    { name: 'MS Siena', city: 'Siena', colors: ['#000000', '#FFFFFF'] },
    { name: 'San Severo bk', city: 'San Severo', colors: ['#FFD100', '#000000'] },
  ],
  ITA_B_INT: [
    { name: 'Robur Brianza', city: 'Monza', colors: ['#003DA5', '#FFFFFF'] },
    { name: 'Libertas Orobica', city: 'Bergamo', colors: ['#FFD100', '#000000'] },
    { name: 'Polisportiva Po', city: 'Cremona', colors: ['#D0021B', '#FFFFFF'] },
    { name: 'Basket Etruria', city: 'Arezzo', colors: ['#046A38', '#FFFFFF'] },
    { name: 'Virtus Delta', city: 'Rovigo', colors: ['#003DA5', '#FFD100'] },
    { name: 'Olimpia Campetto', city: 'Brescia', colors: ['#FFFFFF', '#003DA5'] },
    { name: 'Sporting Valdarno', city: 'Montevarchi', colors: ['#D0021B', '#FFD100'] },
    { name: 'Vis San Giorgio', city: 'San Giorgio', colors: ['#FFFFFF', '#000000'] },
    { name: 'Aurora Adriatic', city: 'Ancona', colors: ['#3EA6E0', '#FFFFFF'] },
    { name: 'Pallacanestro Sabina', city: 'Rieti', colors: ['#8B1E3F', '#FFFFFF'] },
    { name: 'Fortitudo Tirrena', city: 'Civitavecchia', colors: ['#003DA5', '#D0021B'] },
    { name: 'Unione Jonica', city: 'Taranto', colors: ['#D0021B', '#000000'] },
    { name: 'CUS Partenope', city: 'Napoli', colors: ['#3EA6E0', '#FFFFFF'] },
    { name: 'Sporting Lucania', city: 'Potenza', colors: ['#046A38', '#FFD100'] },
  ],
};

const TACTIC_PRESETS: Tactics[] = [
  { pace: 'Bilanciato', offensiveFocus: 'Pick & Roll', defense: 'Uomo' },
  { pace: 'Run & Gun', offensiveFocus: 'Tiro da 3', defense: 'Pressing' },
  { pace: 'Lento', offensiveFocus: 'Gioco interno', defense: 'Zona 2-3' },
  { pace: 'Bilanciato', offensiveFocus: 'Tiro da 3', defense: 'Uomo' },
];

function slugifyId(leagueId: LeagueId, name: string): string {
  const clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `${leagueId.toLowerCase()}_${clean}`;
}

function makeShortName(name: string, city: string, used: Set<string>): string {
  const words = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0 && w !== 'BK' && w !== 'BASKET' && w !== 'PALLACANESTRO');
  const cityClean = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

  const base =
    words.length >= 2
      ? (words[0].slice(0, 2) + words[1].slice(0, 1)).slice(0, 3)
      : (cityClean || words[0] || 'ITA').slice(0, 3);

  let code = base.padEnd(3, 'X').slice(0, 3);
  let idx = 2;
  while (used.has(code)) {
    code = `${base.slice(0, 2)}${idx % 10}`;
    idx += 1;
  }
  used.add(code);
  return code;
}

function computeBudgetAndPrestige(
  league: LeagueConfig,
  seed: RawTeamSeed,
  indexInLeague: number
): { budget: number; prestige: number; arenaCapacity: number } {
  if (league.id === 'ITA_LBA') {
    const basePrestige = seed.euro === 'EL' ? 92 : seed.euro === 'EC' ? 82 : 73 + (indexInLeague % 5);
    const baseBudget =
      seed.euro === 'EL'
        ? 7200000
        : seed.euro === 'EC'
        ? 3600000
        : 2200000 + (indexInLeague % 4) * 280000;
    const arenaCapacity = seed.euro === 'EL' ? 10500 : seed.euro === 'EC' ? 4600 : 3800 + (indexInLeague % 4) * 400;
    return { budget: baseBudget, prestige: basePrestige, arenaCapacity };
  }
  if (league.id === 'ITA_A2') {
    return {
      budget: 820000 + (indexInLeague % 5) * 140000,
      prestige: 60 + (indexInLeague % 7),
      arenaCapacity: 2800 + (indexInLeague % 4) * 450,
    };
  }
  if (league.id === 'ITA_B' || league.id === 'ITA_B2') {
    return {
      budget: 380000 + (indexInLeague % 5) * 60000,
      prestige: 51 + (indexInLeague % 7),
      arenaCapacity: 1600 + (indexInLeague % 4) * 300,
    };
  }
  // ITA_B_INT
  return {
    budget: 200000 + (indexInLeague % 4) * 35000,
    prestige: 45 + (indexInLeague % 6),
    arenaCapacity: 1000 + (indexInLeague % 3) * 250,
  };
}

const usedShortNames = new Set<string>();

export const ALL_TEAM_TEMPLATES: TeamTemplate[] = LEAGUES.flatMap((league) =>
  RAW_LEAGUE_TEAMS[league.id].map((seed, idx) => {
    const { budget, prestige, arenaCapacity } = computeBudgetAndPrestige(league, seed, idx);
    return {
      id: slugifyId(league.id, seed.name),
      name: seed.name,
      shortName: makeShortName(seed.name, seed.city, usedShortNames),
      city: seed.city,
      arena: `Pala${seed.city.split(' ')[0]}`,
      arenaCapacity,
      primaryColor: seed.colors[0],
      secondaryColor: seed.colors[1],
      leagueId: league.id,
      avgOverall: league.avgOverall,
      euroCup: seed.euro,
      budget,
      prestige,
      defaultTactics: TACTIC_PRESETS[idx % TACTIC_PRESETS.length],
    };
  })
);

export const ITALIAN_TEAM_TEMPLATES: TeamTemplate[] = ALL_TEAM_TEMPLATES.filter(
  (t) => t.leagueId === 'ITA_LBA'
);
