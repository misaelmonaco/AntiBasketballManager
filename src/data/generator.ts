import {
  MinutePriority,
  Nationality,
  NewsItem,
  Player,
  PlayerAttributes,
  PlayerPersonality,
  Position,
  RosterSlot,
  ScheduledGame,
  StaffMember,
  StaffRole,
  Team,
} from '../types';
import {
  adaptAttributesToOverall,
  calculateOverall,
  getForeignLimitForLeague,
} from '../engine/ratings';
import {
  computeAgeFromBirthDate,
  getSeasonAgeReferenceDate,
  parseBirthDateToItalian,
} from '../engine/calendarUtils';
import { getLeagueConfig } from './teams';
import {
  getEffectiveRosterTemplatesForTeam,
  getEffectiveTeamTemplates,
  loadEditorDatabase,
} from '../services/editorDbService';

const ITALIAN_FIRST_NAMES = [
  'Marco', 'Niccolò', 'Alessandro', 'Matteo', 'Simone', 'Lorenzo', 'Giordano', 'Davide',
  'Federico', 'Stefano', 'Riccardo', 'Gabriele', 'Tommaso', 'Luca', 'Michele', 'Andrea',
  'Amedeo', 'Diego', 'Leonardo', 'Guglielmo', 'Pietro', 'Filippo', 'Emanuele', 'Sasha',
];

const ITALIAN_LAST_NAMES = [
  'Bellini', 'Tonut', 'Melli', 'Fontecchio', 'Spissu', 'Pajola', 'Polonara', 'Ricci',
  'Mannion', 'Flaccadori', 'Bortolani', 'Tessitori', 'Della Valle', 'Petrucelli', 'Rossato',
  'Severini', 'Cappelletti', 'Zanelli', 'Casarin', 'Spagnolo', 'Procida', 'Bilian',
  'Maresca', 'Ferraro', 'Conti', 'Moretti', 'Baldasso', 'Visconti', 'Alviti', 'Caruso',
];

const FOREIGN_POOLS: Record<Exclude<Nationality, 'ITA'>, { first: string[]; last: string[] }> = {
  USA: {
    first: ['Marcus', 'Shabazz', 'Devon', 'Tornike', 'Keenan', 'Jordan', 'Jalen', 'Darius', 'Isaiah', 'Bryce', 'Kaleb', 'Tyler'],
    last: ['Shields', 'Napier', 'Hall', 'Mirotic', 'Evans', 'Loyd', 'Howard', 'Thompson', 'Cordinier', 'Taylor', 'Brooks', 'Tucker'],
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
    first: ['Rokas', 'Marius', 'Ignas', 'Donatas', 'Lukas', 'Edgaras', 'Mindaugas'],
    last: ['Jokubaitis', 'Grigonis', 'Brazdeikis', 'Motiejūnas', 'Lekavičius', 'Ulanovas', 'Kuzminskas'],
  },
  FRA: {
    first: ['Élie', 'Nando', 'Isaïa', 'Mathias', 'Guerschon', 'Evan', 'Théo', 'Sylvain'],
    last: ['Okobo', 'De Colo', 'Cordinier', 'Lessort', 'Yabusele', 'Fournier', 'Maledon', 'Francisco'],
  },
  GER: {
    first: ['Maodo', 'Andreas', 'Johannes', 'Isaac', 'Moritz', 'Niels', 'Justus'],
    last: ['Lô', 'Obst', 'Voigtmann', 'Bonga', 'Thiemann', 'Giffey', 'Hollatz'],
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
    first: ['Mario', 'Jaleen', 'Dario', 'Ivica', 'Roko', 'Toni'],
    last: ['Hezonja', 'Smith', 'Šarić', 'Nakić', 'Prkačin', 'Perković'],
  },
  LAT: {
    first: ['Artūrs', 'Rihards', 'Rolands', 'Dāvis', 'Kristers', 'Andrejs'],
    last: ['Žagars', 'Lomažs', 'Šmits', 'Bertāns', 'Zoriks', 'Gražulis'],
  },
};

const FOREIGN_NATIONALITIES: Exclude<Nationality, 'ITA'>[] = [
  'USA', 'USA', 'USA', 'USA', 'SRB', 'FRA', 'ESP', 'LTU', 'GER', 'ARG', 'GRE', 'SLO', 'CRO', 'LAT',
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampAttr(val: number): number {
  return Math.max(25, Math.min(98, Math.round(val)));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let idCounter = 1;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

function secondaryFor(pos: Position): Position | null {
  switch (pos) {
    case 'PG':
      return Math.random() < 0.65 ? 'SG' : null;
    case 'SG':
      return Math.random() < 0.5 ? 'PG' : 'SF';
    case 'SF':
      return Math.random() < 0.5 ? 'SG' : 'PF';
    case 'PF':
      return Math.random() < 0.55 ? 'C' : 'SF';
    case 'C':
      return Math.random() < 0.45 ? 'PF' : null;
  }
}

export function buildDefaultAttributesForTemplate(
  pos: Position,
  targetTier: number
): PlayerAttributes {
  const base: PlayerAttributes = {
    threePoint: clampAttr(targetTier),
    twoPoint: clampAttr(targetTier),
    freeThrow: clampAttr(targetTier + 3),
    passing: clampAttr(targetTier),
    ballHandling: clampAttr(targetTier),
    finishing: clampAttr(targetTier),
    perimeterDef: clampAttr(targetTier),
    postDef: clampAttr(targetTier),
    blocks: clampAttr(targetTier - 8),
    steals: clampAttr(targetTier - 4),
    athleticism: clampAttr(targetTier),
    rebounding: clampAttr(targetTier),
    stamina: clampAttr(targetTier + 5),
    basketballIQ: clampAttr(targetTier + 2),
  };

  if (pos === 'PG') {
    base.passing = clampAttr(targetTier + 10);
    base.ballHandling = clampAttr(targetTier + 11);
    base.threePoint = clampAttr(targetTier + 5);
    base.postDef = clampAttr(targetTier - 16);
    base.blocks = clampAttr(targetTier - 24);
    base.rebounding = clampAttr(targetTier - 18);
  } else if (pos === 'SG') {
    base.threePoint = clampAttr(targetTier + 9);
    base.twoPoint = clampAttr(targetTier + 6);
    base.perimeterDef = clampAttr(targetTier + 4);
    base.postDef = clampAttr(targetTier - 12);
    base.blocks = clampAttr(targetTier - 18);
    base.rebounding = clampAttr(targetTier - 12);
  } else if (pos === 'SF') {
    base.athleticism = clampAttr(targetTier + 6);
    base.perimeterDef = clampAttr(targetTier + 6);
    base.threePoint = clampAttr(targetTier + 4);
    base.blocks = clampAttr(targetTier - 8);
  } else if (pos === 'PF') {
    base.rebounding = clampAttr(targetTier + 8);
    base.postDef = clampAttr(targetTier + 6);
    base.finishing = clampAttr(targetTier + 6);
    base.ballHandling = clampAttr(targetTier - 14);
    base.passing = clampAttr(targetTier - 10);
  } else if (pos === 'C') {
    base.rebounding = clampAttr(targetTier + 12);
    base.postDef = clampAttr(targetTier + 11);
    base.blocks = clampAttr(targetTier + 10);
    base.finishing = clampAttr(targetTier + 8);
    base.threePoint = clampAttr(targetTier - 20);
    base.ballHandling = clampAttr(targetTier - 22);
    base.steals = clampAttr(targetTier - 12);
  }

  return adaptAttributesToOverall(base, pos, targetTier);
}

function generateAttributes(pos: Position, targetTier: number): PlayerAttributes {
  const jitter = () => randInt(-9, 9);

  const base: PlayerAttributes = {
    threePoint: clampAttr(targetTier + jitter()),
    twoPoint: clampAttr(targetTier + jitter()),
    freeThrow: clampAttr(targetTier + randInt(-6, 12)),
    passing: clampAttr(targetTier + jitter()),
    ballHandling: clampAttr(targetTier + jitter()),
    finishing: clampAttr(targetTier + jitter()),
    perimeterDef: clampAttr(targetTier + jitter()),
    postDef: clampAttr(targetTier + jitter()),
    blocks: clampAttr(targetTier - 8 + jitter()),
    steals: clampAttr(targetTier - 4 + jitter()),
    athleticism: clampAttr(targetTier + jitter()),
    rebounding: clampAttr(targetTier + jitter()),
    stamina: clampAttr(targetTier + randInt(0, 12)),
    basketballIQ: clampAttr(targetTier + randInt(-4, 10)),
  };

  if (pos === 'PG') {
    base.passing = clampAttr(targetTier + randInt(6, 15));
    base.ballHandling = clampAttr(targetTier + randInt(7, 15));
    base.threePoint = clampAttr(targetTier + randInt(1, 10));
    base.postDef = clampAttr(targetTier - 16 + randInt(-4, 4));
    base.blocks = clampAttr(targetTier - 24 + randInt(-5, 5));
    base.rebounding = clampAttr(targetTier - 18 + randInt(-5, 5));
  } else if (pos === 'SG') {
    base.threePoint = clampAttr(targetTier + randInt(5, 14));
    base.twoPoint = clampAttr(targetTier + randInt(3, 10));
    base.perimeterDef = clampAttr(targetTier + randInt(0, 9));
    base.postDef = clampAttr(targetTier - 12 + randInt(-4, 4));
    base.blocks = clampAttr(targetTier - 18 + randInt(-4, 4));
    base.rebounding = clampAttr(targetTier - 12 + randInt(-4, 4));
  } else if (pos === 'SF') {
    base.athleticism = clampAttr(targetTier + randInt(2, 10));
    base.perimeterDef = clampAttr(targetTier + randInt(2, 10));
    base.threePoint = clampAttr(targetTier + randInt(0, 8));
    base.blocks = clampAttr(targetTier - 8 + randInt(-4, 6));
  } else if (pos === 'PF') {
    base.rebounding = clampAttr(targetTier + randInt(4, 12));
    base.postDef = clampAttr(targetTier + randInt(3, 10));
    base.finishing = clampAttr(targetTier + randInt(3, 10));
    base.ballHandling = clampAttr(targetTier - 14 + randInt(-4, 4));
    base.passing = clampAttr(targetTier - 10 + randInt(-4, 4));
  } else if (pos === 'C') {
    base.rebounding = clampAttr(targetTier + randInt(8, 16));
    base.postDef = clampAttr(targetTier + randInt(7, 15));
    base.blocks = clampAttr(targetTier + randInt(6, 14));
    base.finishing = clampAttr(targetTier + randInt(5, 12));
    base.threePoint = clampAttr(targetTier - 22 + randInt(-8, 10));
    base.ballHandling = clampAttr(targetTier - 22 + randInt(-6, 4));
    base.steals = clampAttr(targetTier - 12 + randInt(-4, 4));
  }

  return adaptAttributesToOverall(base, pos, targetTier);
}

export function createPlayer(params: {
  position: Position;
  tier: number;
  isItalian: boolean;
  rosterSlot: RosterSlot;
  minutePriority: MinutePriority;
  salaryScale?: number;
  firstName?: string;
  lastName?: string;
  jerseyNumber?: number;
  nationality?: Nationality;
  isItalianFormation?: boolean;
  secondaryPosition?: Position;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  birthDate?: string;
  salary?: number;
  contractYears?: 1 | 2;
  personality?: PlayerPersonality;
  attributes?: Partial<PlayerAttributes>;
}): Player {
  const nationality: Nationality =
    params.nationality ?? (params.isItalian ? 'ITA' : pick(FOREIGN_NATIONALITIES));
  let firstName: string;
  let lastName: string;

  if (params.firstName && params.lastName) {
    firstName = params.firstName;
    lastName = params.lastName;
  } else if (nationality === 'ITA') {
    firstName = pick(ITALIAN_FIRST_NAMES);
    lastName = pick(ITALIAN_LAST_NAMES);
  } else {
    const pool = FOREIGN_POOLS[nationality];
    firstName = pick(pool.first);
    lastName = pick(pool.last);
  }

  const generatedAttrs = generateAttributes(params.position, params.tier);
  const attributes: PlayerAttributes = params.attributes
    ? {
        threePoint: clampAttr(params.attributes.threePoint ?? generatedAttrs.threePoint),
        twoPoint: clampAttr(params.attributes.twoPoint ?? generatedAttrs.twoPoint),
        freeThrow: clampAttr(params.attributes.freeThrow ?? generatedAttrs.freeThrow),
        passing: clampAttr(params.attributes.passing ?? generatedAttrs.passing),
        ballHandling: clampAttr(params.attributes.ballHandling ?? generatedAttrs.ballHandling),
        finishing: clampAttr(params.attributes.finishing ?? generatedAttrs.finishing),
        perimeterDef: clampAttr(params.attributes.perimeterDef ?? generatedAttrs.perimeterDef),
        postDef: clampAttr(params.attributes.postDef ?? generatedAttrs.postDef),
        blocks: clampAttr(params.attributes.blocks ?? generatedAttrs.blocks),
        steals: clampAttr(params.attributes.steals ?? generatedAttrs.steals),
        athleticism: clampAttr(params.attributes.athleticism ?? generatedAttrs.athleticism),
        rebounding: clampAttr(params.attributes.rebounding ?? generatedAttrs.rebounding),
        stamina: clampAttr(params.attributes.stamina ?? generatedAttrs.stamina),
        basketballIQ: clampAttr(params.attributes.basketballIQ ?? generatedAttrs.basketballIQ),
      }
    : generatedAttrs;
  const overall = calculateOverall(attributes, params.position);

  // Stipendio realistico scalato per categoria (o valore personalizzato dall'editor)
  const scale = params.salaryScale ?? 1;
  const baseSalary = Math.round(
    (Math.pow(Math.max(1, overall - 36), 2.05) * 160 + 22000) * scale
  );
  const minFloor = scale < 0.15 ? 1500 : scale < 0.35 ? 10000 : 40000;
  const step = scale < 0.15 ? 500 : 5000;
  const roundedSalary =
    params.salary && params.salary > 0
      ? Math.round(params.salary)
      : Math.max(minFloor, Math.round(baseSalary / step) * step);

  const parsedBirthDate = parseBirthDateToItalian(params.birthDate);
  const ageFromBirthDate = parsedBirthDate
    ? computeAgeFromBirthDate(parsedBirthDate, getSeasonAgeReferenceDate(2026))
    : undefined;
  const isLbaYoung =
    params.tier <= 64 && params.salaryScale !== undefined && params.salaryScale >= 0.55;
  const isA2Young =
    params.tier <= 60 && params.salaryScale !== undefined && params.salaryScale >= 0.22;
  const fallbackAge =
    (params.tier <= 64 && params.rosterSlot === 'reserve') || isLbaYoung || isA2Young
      ? randInt(18, 20)
      : randInt(20, 34);
  const age = params.age ?? ageFromBirthDate ?? fallbackAge;
  const personalityPool: PlayerPersonality[] =
    age <= 23
      ? ['Giovane ambizioso', 'Professionista', 'Egocentrico']
      : ['Leader', 'Professionista', 'Professionista', 'Egocentrico'];

  const contractYears: 1 | 2 = params.contractYears ?? (Math.random() < 0.6 ? 1 : 2);
  const promisedRole =
    params.rosterSlot === 'starter'
      ? overall >= 78
        ? 'Stella della squadra'
        : 'Titolare fisso'
      : params.minutePriority === 'Media'
      ? 'Sesto uomo'
      : 'Giocatore di rotazione';

  const birthYear = 2026 - age;
  const birthDay = randInt(1, 28).toString().padStart(2, '0');
  const birthMonth = randInt(1, 12).toString().padStart(2, '0');
  const birthDate = parsedBirthDate ?? `${birthDay}/${birthMonth}/${birthYear}`;

  const heightRanges: Record<Position, [number, number]> = {
    PG: [183, 194],
    SG: [191, 200],
    SF: [198, 205],
    PF: [202, 210],
    C: [208, 218],
  };
  const weightRanges: Record<Position, [number, number]> = {
    PG: [79, 91],
    SG: [86, 97],
    SF: [94, 105],
    PF: [102, 114],
    C: [110, 127],
  };
  const [hMin, hMax] = heightRanges[params.position];
  const [wMin, wMax] = weightRanges[params.position];

  return {
    id: nextId('ply'),
    firstName,
    lastName,
    jerseyNumber: params.jerseyNumber ?? randInt(0, 55),
    age,
    birthDate,
    heightCm: params.heightCm ?? randInt(hMin, hMax),
    weightKg: params.weightKg ?? randInt(wMin, wMax),
    nationality,
    isItalianFormation: params.isItalianFormation ?? nationality === 'ITA',
    primaryPosition: params.position,
    secondaryPosition: params.secondaryPosition ?? secondaryFor(params.position),
    salary: roundedSalary,
    contractYears,
    condition: randInt(91, 100),
    morale: randInt(72, 88),
    personality: params.personality ?? pick(personalityPool),
    injuryProneness: randInt(12, 68),
    promisedRole,
    buyoutClause: Math.round(roundedSalary * contractYears * 0.65),
    injuryWeeks: 0,
    attributes,
    overall,
    rosterSlot: params.rosterSlot,
    minutePriority: params.minutePriority,
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
    gameLog: [],
    careerHistory: [],
  };
}

const STAFF_SPECIALTIES: Record<StaffRole, string[]> = {
  assistant_coach: ['Matchup Difensivi', 'Pick & Roll Offense', 'Gestione Timeout'],
  fitness_coach: ['Prevenzione Infortuni', 'Recupero Rapido', 'Resistenza Aerobica'],
  scout_director: ['Sviluppo Giovani', 'Valutazione Talenti', 'Scouting Svincolati'],
};

export function createStaffMember(role: StaffRole, targetRating: number): StaffMember {
  const rating = Math.max(52, Math.min(95, Math.round(targetRating)));
  const salary = Math.round((25000 + Math.pow(Math.max(1, rating - 50), 1.65) * 320) / 2500) * 2500;
  return {
    id: nextId('stf'),
    firstName: pick(ITALIAN_FIRST_NAMES),
    lastName: pick(ITALIAN_LAST_NAMES),
    role,
    rating,
    salary,
    specialty: pick(STAFF_SPECIALTIES[role]),
  };
}

export function generateStaffMarket(countPerRole = 4): StaffMember[] {
  const roles: StaffRole[] = ['assistant_coach', 'fitness_coach', 'scout_director'];
  const list: StaffMember[] = [];
  for (const role of roles) {
    for (let i = 0; i < countPerRole; i++) {
      list.push(createStaffMember(role, randInt(60, 91)));
    }
  }
  return list.sort((a, b) => b.rating - a.rating);
}

export function generateYouthRoster(prestige: number): Player[] {
  const specs: { position: Position; isItalian: boolean }[] = [
    { position: 'PG', isItalian: true },
    { position: 'SG', isItalian: true },
    { position: 'SF', isItalian: true },
    { position: 'PF', isItalian: true },
    { position: 'C', isItalian: true },
    { position: pick(['PG', 'SG', 'SF', 'PF']), isItalian: true },
    { position: pick(['PG', 'SG', 'SF']), isItalian: false },
    { position: pick(['PF', 'C']), isItalian: false },
  ];

  return specs.map(({ position, isItalian }, idx) => {
    const tier = Math.round(53 + prestige * 0.1 + (idx === 0 || !isItalian ? 4 : randInt(-2, 5)));
    const p = createPlayer({
      position,
      tier,
      isItalian,
      rosterSlot: 'reserve',
      minutePriority: 'Bassa',
    });
    const age = randInt(17, 19);
    const salary = randInt(18, 28) * 1000;
    return {
      ...p,
      id: `u19_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      age,
      birthDate: `${String(randInt(1, 28)).padStart(2, '0')}/${String(randInt(1, 12)).padStart(2, '0')}/${2026 - age}`,
      salary,
      contractYears: 2,
      buyoutClause: Math.round(salary * 1.2),
      personality: idx % 2 === 0 ? 'Giovane ambizioso' : 'Professionista',
      promisedRole: 'Giocatore di rotazione',
      targetMinutes: 0,
    };
  });
}

export function generateLeagueTeams(): Team[] {
  const editorDb = loadEditorDatabase();
  const effectiveTemplates = getEffectiveTeamTemplates(editorDb);

  return effectiveTemplates.map((tpl) => {
    const salaryScale = tpl.budget / 3200000;
    const customRoster = getEffectiveRosterTemplatesForTeam(tpl.id, editorDb);
    const { maxForeign } = getForeignLimitForLeague(tpl.leagueId);

    // Se la rosa ha più di 12 giocatori (es. LBA reale), seleziona fino a 12 attivi
    // rispettando il limite stranieri (maxForeign) e mettendo gli altri in tribuna ('reserve').
    const activeIndices = new Set<number>();
    let selectedForeign = 0;
    for (let i = 0; i < customRoster.length && activeIndices.size < 12; i++) {
      if (customRoster[i].isItalianFormation) {
        activeIndices.add(i);
      } else if (selectedForeign < maxForeign) {
        activeIndices.add(i);
        selectedForeign++;
      }
    }
    for (let i = 0; i < customRoster.length && activeIndices.size < 12; i++) {
      if (!activeIndices.has(i) && (customRoster[i].isItalianFormation || selectedForeign < maxForeign)) {
        activeIndices.add(i);
        if (!customRoster[i].isItalianFormation) selectedForeign++;
      }
    }

    let activeAssigned = 0;
    const roster = customRoster.map((spec, idx) => {
      const isActive = activeIndices.has(idx);
      const slot: RosterSlot = !isActive
        ? 'reserve'
        : activeAssigned < 5
          ? 'starter'
          : 'bench';
      const prio: MinutePriority = !isActive
        ? 'Bassa'
        : activeAssigned < 5
          ? 'Alta'
          : activeAssigned < 10
            ? 'Media'
            : 'Bassa';
      if (isActive) activeAssigned++;
      return createPlayer({
        position: spec.primaryPosition,
        tier: spec.overall,
        isItalian: spec.isItalianFormation,
        rosterSlot: slot,
        minutePriority: prio,
        salaryScale: Math.max(0.02, Math.min(1.45, salaryScale)),
        firstName: spec.firstName,
        lastName: spec.lastName,
        jerseyNumber: spec.jerseyNumber,
        nationality: spec.nationality,
        isItalianFormation: spec.isItalianFormation,
        secondaryPosition: spec.secondaryPosition,
        heightCm: spec.heightCm,
        weightKg: spec.weightKg,
        age: spec.age,
        birthDate: spec.birthDate,
        salary: spec.salary,
        contractYears: spec.contractYears,
        personality: spec.personality,
        attributes: spec.attributes,
      });
    });

    // Scala leggermente gli stipendi se il totale supera l'88% del budget iniziale
    const totalWage = roster.reduce((s, p) => s + p.salary, 0);
    const maxInitialWage = tpl.budget * 0.88;
    if (totalWage > maxInitialWage) {
      const ratio = maxInitialWage / totalWage;
      const minFloor = tpl.budget < 200000 ? 1500 : tpl.budget < 600000 ? 10000 : 35000;
      const step = tpl.budget < 200000 ? 500 : 5000;
      roster.forEach((p) => {
        p.salary = Math.max(minFloor, Math.round((p.salary * ratio) / step) * step);
      });
    }

    return {
      id: tpl.id,
      name: tpl.name,
      shortName: tpl.shortName,
      city: tpl.city,
      arena: tpl.arena,
      arenaCapacity: tpl.arenaCapacity,
      primaryColor: tpl.primaryColor,
      secondaryColor: tpl.secondaryColor,
      leagueId: tpl.leagueId,
      euroCup: tpl.euroCup,
      budget: tpl.budget,
      prestige: tpl.prestige,
      tactics: { ...tpl.defaultTactics },
      roster,
      youthRoster: generateYouthRoster(tpl.prestige),
      staff: {
        assistant_coach: createStaffMember('assistant_coach', Math.round(45 + tpl.prestige * 0.4)),
        fitness_coach: createStaffMember('fitness_coach', Math.round(44 + tpl.prestige * 0.4)),
        scout_director: createStaffMember('scout_director', Math.round(44 + tpl.prestige * 0.4)),
      },
      training: {
        focus: 'Tattica Pre-Partita',
        intensity: 'Moderata',
      },
      chemistry: randInt(64, 76),
    };
  });
}

const OTHER_FOREIGN_NATS: Exclude<Nationality, 'ITA' | 'USA'>[] = [
  'SRB',
  'ESP',
  'LTU',
  'FRA',
  'GER',
  'ARG',
  'GRE',
  'SLO',
  'CRO',
  'LAT',
];

export function generateFreeAgents(count = 140): Player[] {
  const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
  const list: Player[] = [];

  for (let i = 0; i < count; i++) {
    const pos = positions[i % positions.length];
    const mod = i % 10;
    let nationality: Nationality;
    let isItalian: boolean;
    if (mod < 5) {
      // ~50% ITA
      nationality = 'ITA';
      isItalian = true;
    } else if (mod < 8) {
      // ~30% USA
      nationality = 'USA';
      isItalian = false;
    } else {
      // ~20% Resto del mondo
      nationality = OTHER_FOREIGN_NATS[i % OTHER_FOREIGN_NATS.length];
      isItalian = false;
    }

    const ratio = i / Math.max(1, count);
    // Copri tutte le fasce di OVR in proporzione al numero richiesto
    const tier =
      ratio < 0.32
        ? randInt(44, 57)
        : ratio < 0.72
        ? randInt(57, 68)
        : randInt(68, 79);
    const scale = tier < 54 ? 0.1 : tier < 65 ? 0.32 : 0.85;
    list.push(
      createPlayer({
        position: pos,
        tier,
        isItalian,
        nationality,
        isItalianFormation: isItalian,
        rosterSlot: 'bench',
        minutePriority: 'Media',
        salaryScale: scale,
      })
    );
  }

  // Aggiungi eventuali Free Agent creati dall'utente nell'Editor Database
  const db = loadEditorDatabase();
  for (const tpl of db.freeAgents ?? []) {
    const scale = tpl.overall < 54 ? 0.1 : tpl.overall < 65 ? 0.32 : 0.85;
    list.push(
      createPlayer({
        position: tpl.primaryPosition,
        tier: tpl.overall,
        isItalian: tpl.isItalianFormation,
        firstName: tpl.firstName,
        lastName: tpl.lastName,
        jerseyNumber: tpl.jerseyNumber,
        nationality: tpl.nationality,
        isItalianFormation: tpl.isItalianFormation,
        secondaryPosition: tpl.secondaryPosition,
        heightCm: tpl.heightCm,
        weightKg: tpl.weightKg,
        age: tpl.age,
        salary: tpl.salary,
        contractYears: tpl.contractYears,
        personality: tpl.personality,
        attributes: tpl.attributes,
        rosterSlot: 'bench',
        minutePriority: 'Media',
        salaryScale: scale,
      })
    );
  }

  return list.sort((a, b) => b.overall - a.overall);
}

/**
 * Genera calendario Girone all'italiana (Andata + Ritorno) per ciascun campionato
 */
export function generateSchedule(teams: Team[]): ScheduledGame[] {
  const byLeague = new Map<string, Team[]>();
  for (const t of teams) {
    const lid = t.leagueId ?? 'ITA_LBA';
    const arr = byLeague.get(lid) ?? [];
    arr.push(t);
    byLeague.set(lid, arr);
  }

  const allGames: ScheduledGame[] = [];

  for (const [leagueId, leagueTeams] of byLeague.entries()) {
    const teamIds = leagueTeams.map((t) => t.id);
    if (teamIds.length < 2) continue;
    if (teamIds.length % 2 === 1) teamIds.push('BYE');

    const n = teamIds.length;
    const half = n / 2;
    const roundsFirstHalf = n - 1;

    const rotating = teamIds.slice(1);
    const fixed = teamIds[0];
    const firstHalfGames: ScheduledGame[] = [];

    for (let r = 0; r < roundsFirstHalf; r++) {
      const roundNum = r + 1;
      const currentOrder = [fixed, ...rotating];

      for (let i = 0; i < half; i++) {
        const t1 = currentOrder[i];
        const t2 = currentOrder[n - 1 - i];
        if (t1 === 'BYE' || t2 === 'BYE') continue;
        const swap = (r + i) % 2 === 1;
        firstHalfGames.push({
          id: `g_${leagueId}_r${roundNum}_${i + 1}`,
          leagueId: leagueId as Team['leagueId'],
          round: roundNum,
          homeTeamId: swap ? t2 : t1,
          awayTeamId: swap ? t1 : t2,
          played: false,
        });
      }

      const last = rotating.pop()!;
      rotating.unshift(last);
    }

    const secondHalfGames: ScheduledGame[] = firstHalfGames.map((g, idx) => ({
      id: `g_${leagueId}_r${g.round + roundsFirstHalf}_${(idx % half) + 1}`,
      leagueId: leagueId as Team['leagueId'],
      round: g.round + roundsFirstHalf,
      homeTeamId: g.awayTeamId,
      awayTeamId: g.homeTeamId,
      played: false,
    }));

    allGames.push(...firstHalfGames, ...secondHalfGames);
  }

  return allGames;
}

export function generateInitialNews(userTeam: Team): NewsItem[] {
  const leagueCfg = getLeagueConfig(userTeam.leagueId);
  return [
    {
      id: nextId('news'),
      round: 1,
      category: 'Lega',
      title: `Al via la nuova stagione di ${leagueCfg.name}!`,
      body: `Tutto pronto per la palla a due inaugurale (${leagueCfg.tier}). ${userTeam.name} punta a stupire davanti al pubblico di ${userTeam.arena}.`,
    },
    {
      id: nextId('news'),
      round: 1,
      category: 'Lega',
      title: 'Confermata la formula 6+6 a referto',
      body: 'La Federazione ribadisce il vincolo: obbligatori almeno 6 giocatori di formazione italiana e massimo 6 stranieri tra i 12 a referto.',
    },
    {
      id: nextId('news'),
      round: 1,
      category: 'Mercato',
      title: 'Lista svincolati aperta: 60 Free Agent disponibili',
      body: 'Giocatori di ogni fascia tecnica sono senza contratto e pronti a firmare per rinforzare i roster.',
    },
  ];
}
