import { ALL_TEAM_TEMPLATES, TeamTemplate } from '../data/teams';
import { LBA_REAL_ROSTERS } from '../data/lbaRealRosters';
import { A2_REAL_ROSTERS } from '../data/a2RealRosters';
import { SERIE_B_REAL_ROSTERS } from '../data/serieBRealRosters';
import { getForeignLimitForLeague } from '../engine/ratings';
import { Nationality, PlayerAttributes, PlayerPersonality, Position } from '../types';

export interface CustomTeamOverride {
  name?: string;
  shortName?: string;
  city?: string;
  arena?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface CustomPlayerTemplate {
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  primaryPosition: Position;
  secondaryPosition?: Position;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  birthDate?: string;
  nationality: Nationality;
  isItalianFormation: boolean;
  overall: number;
  salary?: number;
  contractYears?: 1 | 2;
  personality?: PlayerPersonality;
  attributes?: Partial<PlayerAttributes>;
}

export interface CustomEditorDatabase {
  version: number;
  updatedAt: string;
  teams: Record<string, CustomTeamOverride>;
  rosters: Record<string, CustomPlayerTemplate[]>;
  freeAgents?: CustomPlayerTemplate[];
}

const STORAGE_KEY = 'bmi_custom_editor_db_v1';

export function createEmptyEditorDatabase(): CustomEditorDatabase {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    teams: {},
    rosters: {},
    freeAgents: [],
  };
}

export function loadEditorDatabase(): CustomEditorDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyEditorDatabase();
    const parsed = JSON.parse(raw) as Partial<CustomEditorDatabase>;
    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      teams: parsed.teams ?? {},
      rosters: parsed.rosters ?? {},
      freeAgents: parsed.freeAgents ?? [],
    };
  } catch {
    return createEmptyEditorDatabase();
  }
}

export function saveEditorDatabase(db: CustomEditorDatabase): void {
  const payload: CustomEditorDatabase = {
    ...db,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function resetEditorDatabase(): CustomEditorDatabase {
  localStorage.removeItem(STORAGE_KEY);
  return createEmptyEditorDatabase();
}

export function getEffectiveTeamTemplates(
  db: CustomEditorDatabase = loadEditorDatabase()
): TeamTemplate[] {
  return ALL_TEAM_TEMPLATES.map((tpl) => {
    const ov = db.teams[tpl.id];
    const roster = db.rosters[tpl.id] ?? getDefaultRosterTemplatesForTeam(tpl.id);
    const top10 = [...roster].sort((a, b) => b.overall - a.overall).slice(0, 10);
    const computedAvgOverall =
      top10.length > 0
        ? Math.round(top10.reduce((sum, p) => sum + p.overall, 0) / top10.length)
        : tpl.avgOverall;

    if (!ov) {
      return {
        ...tpl,
        avgOverall: computedAvgOverall,
      };
    }
    return {
      ...tpl,
      avgOverall: computedAvgOverall,
      name: ov.name?.trim() || tpl.name,
      shortName: ov.shortName?.trim().toUpperCase() || tpl.shortName,
      city: ov.city?.trim() || tpl.city,
      arena: ov.arena?.trim() || tpl.arena,
      primaryColor: ov.primaryColor || tpl.primaryColor,
      secondaryColor: ov.secondaryColor || tpl.secondaryColor,
    };
  });
}

// Pool deterministici per generare roster di base coerenti per l'Editor
const ITA_FIRST = [
  'Marco', 'Niccolò', 'Alessandro', 'Matteo', 'Simone', 'Lorenzo', 'Giordano', 'Davide',
  'Federico', 'Stefano', 'Riccardo', 'Gabriele', 'Tommaso', 'Luca', 'Michele', 'Andrea',
  'Amedeo', 'Diego', 'Leonardo', 'Pietro', 'Filippo', 'Emanuele', 'Giulio', 'Giacomo',
];
const ITA_LAST = [
  'Bellini', 'Tonut', 'Melli', 'Fontecchio', 'Spissu', 'Pajola', 'Polonara', 'Ricci',
  'Mannion', 'Flaccadori', 'Bortolani', 'Tessitori', 'Della Valle', 'Petrucelli', 'Rossato',
  'Severini', 'Cappelletti', 'Zanelli', 'Casarin', 'Spagnolo', 'Procida', 'Maresca',
  'Ferraro', 'Conti', 'Moretti', 'Baldasso', 'Visconti', 'Alviti', 'Caruso', 'Ruzzier',
];
const FOR_POOLS: Record<Exclude<Nationality, 'ITA'>, { first: string[]; last: string[] }> = {
  USA: {
    first: ['Marcus', 'Shabazz', 'Devon', 'Keenan', 'Jordan', 'Jalen', 'Darius', 'Isaiah', 'Bryce', 'Kaleb', 'Tyler', 'Grant'],
    last: ['Shields', 'Napier', 'Hall', 'Evans', 'Loyd', 'Howard', 'Thompson', 'Taylor', 'Brooks', 'Tucker', 'Williams', 'Jones'],
  },
  SRB: {
    first: ['Miloš', 'Nikola', 'Nemanja', 'Bogdan', 'Stefan', 'Marko', 'Aleksa', 'Ognjen'],
    last: ['Teodosić', 'Nedović', 'Gudurić', 'Jović', 'Avramović', 'Dobrić', 'Petrušev', 'Marinković'],
  },
  ESP: {
    first: ['Sergio', 'Álex', 'Darío', 'Alberto', 'Juancho', 'Jaime', 'Santi', 'Willy'],
    last: ['Llull', 'Abrines', 'Brizuela', 'Abalde', 'Fernández', 'Pradilla', 'Parra', 'Garuba'],
  },
  LTU: {
    first: ['Rokas', 'Marius', 'Ignas', 'Donatas', 'Lukas', 'Edgaras'],
    last: ['Jokubaitis', 'Grigonis', 'Brazdeikis', 'Motiejūnas', 'Lekavičius', 'Ulanovas'],
  },
  FRA: {
    first: ['Élie', 'Nando', 'Isaïa', 'Mathias', 'Guerschon', 'Evan', 'Théo'],
    last: ['Okobo', 'De Colo', 'Cordinier', 'Lessort', 'Yabusele', 'Fournier', 'Maledon'],
  },
  GER: {
    first: ['Maodo', 'Andreas', 'Johannes', 'Isaac', 'Moritz', 'Niels'],
    last: ['Lô', 'Obst', 'Voigtmann', 'Bonga', 'Thiemann', 'Giffey'],
  },
  ARG: {
    first: ['Facundo', 'Gabriel', 'Nicolás', 'Luca', 'Leandro', 'Patricio'],
    last: ['Campazzo', 'Deck', 'Laprovíttola', 'Vildoza', 'Bolmaro', 'Garino'],
  },
  GRE: {
    first: ['Kostas', 'Nick', 'Tyler', 'Georgios', 'Ioannis', 'Dinos'],
    last: ['Sloukas', 'Calathes', 'Dorsey', 'Papagiannis', 'Papapetrou', 'Mitoglou'],
  },
  SLO: {
    first: ['Klemen', 'Jaka', 'Aleksej', 'Mike', 'Zoran', 'Gregor'],
    last: ['Prepelič', 'Blažič', 'Nikolić', 'Tobey', 'Dragić', 'Hrovat'],
  },
  CRO: {
    first: ['Mario', 'Dario', 'Ivica', 'Roko', 'Toni', 'Luka'],
    last: ['Hezonja', 'Šarić', 'Zubac', 'Prkačin', 'Perković', 'Božić'],
  },
  LAT: {
    first: ['Artūrs', 'Rihards', 'Rolands', 'Dāvis', 'Kristers', 'Andrejs'],
    last: ['Žagars', 'Lomažs', 'Šmits', 'Bertāns', 'Zoriks', 'Gražulis'],
  },
};

const FOR_NATS: Exclude<Nationality, 'ITA'>[] = [
  'USA', 'USA', 'USA', 'SRB', 'FRA', 'ESP', 'LTU', 'GER', 'ARG', 'GRE', 'SLO', 'CRO', 'LAT',
];

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getDefaultRosterTemplatesForTeam(teamId: string): CustomPlayerTemplate[] {
  const realRoster =
    LBA_REAL_ROSTERS[teamId] ?? A2_REAL_ROSTERS[teamId] ?? SERIE_B_REAL_ROSTERS[teamId];
  if (realRoster && realRoster.length > 0) {
    return realRoster.map((p) => ({ ...p }));
  }

  const tpl = ALL_TEAM_TEMPLATES.find((t) => t.id === teamId) ?? ALL_TEAM_TEMPLATES[0];
  const baseSeed = hashString(tpl.id);
  const baseOvr = tpl.avgOverall + (tpl.euroCup === 'EL' ? 4 : tpl.euroCup === 'EC' ? 2 : 0);
  const { maxForeign } = getForeignLimitForLeague(tpl.leagueId);

  const foreignPriorityOrder = [0, 2, 4, 6, 8, 11];
  const foreignSlots = new Set(foreignPriorityOrder.slice(0, maxForeign));

  const specs: { pos: Position; isIta: boolean; ovrOffset: number; jersey: number }[] = [
    { pos: 'PG', isIta: !foreignSlots.has(0), ovrOffset: 4, jersey: 0 },
    { pos: 'SG', isIta: !foreignSlots.has(1), ovrOffset: 3, jersey: 7 },
    { pos: 'SF', isIta: !foreignSlots.has(2), ovrOffset: 4, jersey: 11 },
    { pos: 'PF', isIta: !foreignSlots.has(3), ovrOffset: 2, jersey: 9 },
    { pos: 'C', isIta: !foreignSlots.has(4), ovrOffset: 4, jersey: 23 },
    { pos: 'PG', isIta: !foreignSlots.has(5), ovrOffset: -2, jersey: 6 },
    { pos: 'SG', isIta: !foreignSlots.has(6), ovrOffset: -1, jersey: 14 },
    { pos: 'SF', isIta: !foreignSlots.has(7), ovrOffset: -3, jersey: 18 },
    { pos: 'PF', isIta: !foreignSlots.has(8), ovrOffset: -2, jersey: 21 },
    { pos: 'C', isIta: !foreignSlots.has(9), ovrOffset: -3, jersey: 32 },
    { pos: 'PG', isIta: !foreignSlots.has(10), ovrOffset: -5, jersey: 12 },
    { pos: 'PF', isIta: !foreignSlots.has(11), ovrOffset: -4, jersey: 44 },
  ];

  return specs.map((spec, idx) => {
    const h = hashString(`${tpl.id}_${idx}`);
    if (spec.isIta) {
      return {
        firstName: ITA_FIRST[(baseSeed + h + idx * 3) % ITA_FIRST.length],
        lastName: ITA_LAST[(baseSeed + (h >>> 4) + idx * 5) % ITA_LAST.length],
        jerseyNumber: spec.jersey,
        primaryPosition: spec.pos,
        nationality: 'ITA',
        isItalianFormation: true,
        overall: Math.max(35, Math.min(95, baseOvr + spec.ovrOffset)),
      };
    }
    const nat = tpl.leagueId === 'ITA_A2' ? 'USA' : FOR_NATS[(h + idx) % FOR_NATS.length];
    const pool = FOR_POOLS[nat];
    return {
      firstName: pool.first[(h + idx * 2) % pool.first.length],
      lastName: pool.last[((h >>> 3) + idx * 7) % pool.last.length],
      jerseyNumber: spec.jersey,
      primaryPosition: spec.pos,
      nationality: nat,
      isItalianFormation: false,
      overall: Math.max(35, Math.min(95, baseOvr + spec.ovrOffset)),
    };
  });
}

export function getEffectiveRosterTemplatesForTeam(
  teamId: string,
  db: CustomEditorDatabase = loadEditorDatabase()
): CustomPlayerTemplate[] {
  return db.rosters[teamId] ?? getDefaultRosterTemplatesForTeam(teamId);
}

const ALL_POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
const ALL_PERSONALITIES: PlayerPersonality[] = [
  'Leader',
  'Professionista',
  'Egocentrico',
  'Giovane ambizioso',
];
const HEIGHT_RANGES: Record<Position, [number, number]> = {
  PG: [181, 194],
  SG: [188, 199],
  SF: [195, 205],
  PF: [200, 210],
  C: [206, 219],
};

function randIntInclusive(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createRandomCustomPlayerTemplate(): CustomPlayerTemplate {
  const roll = Math.random();
  const nationality: Nationality =
    roll < 0.45
      ? 'ITA'
      : roll < 0.72
      ? 'USA'
      : FOR_NATS[Math.floor(Math.random() * FOR_NATS.length)];
  const isItalianFormation =
    nationality === 'ITA' ? true : Math.random() < 0.12;

  const firstName =
    nationality === 'ITA'
      ? ITA_FIRST[Math.floor(Math.random() * ITA_FIRST.length)]
      : FOR_POOLS[nationality].first[
          Math.floor(Math.random() * FOR_POOLS[nationality].first.length)
        ];
  const lastName =
    nationality === 'ITA'
      ? ITA_LAST[Math.floor(Math.random() * ITA_LAST.length)]
      : FOR_POOLS[nationality].last[
          Math.floor(Math.random() * FOR_POOLS[nationality].last.length)
        ];

  const posIdx = Math.floor(Math.random() * ALL_POSITIONS.length);
  const primaryPosition = ALL_POSITIONS[posIdx];
  const secondaryPosition =
    Math.random() < 0.45
      ? ALL_POSITIONS[(posIdx + (Math.random() < 0.5 ? 1 : 4)) % ALL_POSITIONS.length]
      : undefined;

  const [hMin, hMax] = HEIGHT_RANGES[primaryPosition];
  const heightCm = randIntInclusive(hMin, hMax);
  const weightKg = Math.round((heightCm - 100) * 0.98 + randIntInclusive(-5, 8));
  const age = randIntInclusive(18, 35);
  const overall = randIntInclusive(52, 83);
  const salary =
    Math.round(
      ((overall < 60 ? 28000 : overall < 70 ? 65000 : 140000) +
        (overall - 50) * 5500) /
        5000
    ) * 5000;

  return {
    firstName,
    lastName,
    jerseyNumber: randIntInclusive(0, 55),
    primaryPosition,
    secondaryPosition,
    heightCm,
    weightKg,
    age,
    nationality,
    isItalianFormation,
    overall,
    salary: Math.max(20000, salary),
    contractYears: Math.random() < 0.4 ? 2 : 1,
    personality: ALL_PERSONALITIES[Math.floor(Math.random() * ALL_PERSONALITIES.length)],
  };
}
