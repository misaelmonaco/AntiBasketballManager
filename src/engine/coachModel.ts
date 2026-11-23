import { ManagerAttributes, ManagerPhilosophy, ManagerProfile, Nationality } from '../types';

export const COACH_ATTR_MIN = 1;
export const COACH_ATTR_MAX = 20;

export type CoachReputationTier = 'ROOKIE' | 'EXPERIENCED' | 'LEGEND';

export enum CoachingPhilosophy {
  PACE_AND_SPACE = 'PACE_AND_SPACE',
  GRIT_AND_GRIND = 'GRIT_AND_GRIND',
  MOTION_OFFENSE = 'MOTION_OFFENSE',
  PLAYER_DEVELOPER = 'PLAYER_DEVELOPER',
  PLAYERS_COACH = 'PLAYERS_COACH',
  PRAGMATIC = 'PRAGMATIC',
}

export interface CoachTechnicalAttributes {
  /** Qualità schemi offensivi e spaziature (1-20) */
  offense: number;
  /** Organizzazione difensiva e rotazioni (1-20) */
  defense: number;
  /** Lettura della partita e gestione timeout (1-20) */
  tacticalAdjustments: number;
  /** Miglioramento fondamentali in allenamento (1-20) */
  skillDevelopment: number;
  /** Gestione stamina e prevenzione infortuni (1-20) */
  conditioning: number;
}

export interface CoachMentalAttributes {
  /** Impatto sul morale e rendimento nei momenti clutch (1-20) */
  motivation: number;
  /** Gestione minutaggi, panchina ed ego delle star (1-20) */
  rotationManagement: number;
  /** Controllo su palle perse, falli e selezione tiri (1-20) */
  discipline: number;
  /** Velocità crescita giovani/rookie (1-20) */
  youthDevelopment: number;
  /** Accuratezza scouting per draft e trade (1-20) */
  talentEvaluation: number;
}

export type CoachAttributes = CoachTechnicalAttributes & CoachMentalAttributes;

export interface CoachTacticalWeights {
  paceTendency: number;
  threePointTendency: number;
  benchUsageTendency: number;
  starterFatigueMultiplier: number;
  isolationTendency: number;
  defensiveIntensity: number;
}

export interface CoachingPhilosophyConfig {
  id: CoachingPhilosophy;
  label: string;
  tagline: string;
  description: string;
  attributeModifiers: Partial<CoachAttributes>;
  tacticalWeights: CoachTacticalWeights;
}

export const COACHING_PHILOSOPHIES: Record<CoachingPhilosophy, CoachingPhilosophyConfig> = {
  [CoachingPhilosophy.PACE_AND_SPACE]: {
    id: CoachingPhilosophy.PACE_AND_SPACE,
    label: 'Pace & Space',
    tagline: 'Ritmo alto, tiro da 3 punti e transizione rapida',
    description:
      'Attacco moderno ad alto numero di possessi, spaziature ampie sul perimetro e transizione immediata.',
    attributeModifiers: {
      offense: 3,
      conditioning: 2,
      tacticalAdjustments: 1,
      defense: -1,
      discipline: -1,
    },
    tacticalWeights: {
      paceTendency: 1.14,
      threePointTendency: 1.18,
      benchUsageTendency: 1.04,
      starterFatigueMultiplier: 1.06,
      isolationTendency: 0.96,
      defensiveIntensity: 0.95,
    },
  },
  [CoachingPhilosophy.GRIT_AND_GRIND]: {
    id: CoachingPhilosophy.GRIT_AND_GRIND,
    label: 'Grit & Grind',
    tagline: 'Ritmo controllato, difesa fisica e massima intensità',
    description:
      'Pallacanestro fisica a metà campo, pressione sulla palla, controllo dei rimbalzi e disciplina ferrea.',
    attributeModifiers: {
      defense: 3,
      discipline: 2,
      conditioning: 1,
      offense: -1,
      youthDevelopment: -1,
    },
    tacticalWeights: {
      paceTendency: 0.88,
      threePointTendency: 0.86,
      benchUsageTendency: 0.96,
      starterFatigueMultiplier: 1.05,
      isolationTendency: 1.04,
      defensiveIntensity: 1.16,
    },
  },
  [CoachingPhilosophy.MOTION_OFFENSE]: {
    id: CoachingPhilosophy.MOTION_OFFENSE,
    label: 'Motion Offense',
    tagline: 'Gioco corale, circolazione di palla e tagli continui',
    description:
      'Attacco basato su letture collettive, extra-pass, blocchi lontano dalla palla e pochissimi isolamenti.',
    attributeModifiers: {
      offense: 2,
      discipline: 2,
      skillDevelopment: 2,
      rotationManagement: 1,
      motivation: -1,
    },
    tacticalWeights: {
      paceTendency: 1.03,
      threePointTendency: 1.06,
      benchUsageTendency: 1.08,
      starterFatigueMultiplier: 0.97,
      isolationTendency: 0.78,
      defensiveIntensity: 1.01,
    },
  },
  [CoachingPhilosophy.PLAYER_DEVELOPER]: {
    id: CoachingPhilosophy.PLAYER_DEVELOPER,
    label: 'Player Developer',
    tagline: 'Focus massimo su crescita giovani e role player',
    description:
      'Programma di sviluppo individuale quotidiano, minuti reali ai talenti Under 22 e scouting accurato.',
    attributeModifiers: {
      youthDevelopment: 4,
      skillDevelopment: 3,
      talentEvaluation: 2,
      tacticalAdjustments: -1,
      motivation: 0,
    },
    tacticalWeights: {
      paceTendency: 1.04,
      threePointTendency: 1.0,
      benchUsageTendency: 1.16,
      starterFatigueMultiplier: 0.91,
      isolationTendency: 0.92,
      defensiveIntensity: 0.98,
    },
  },
  [CoachingPhilosophy.PLAYERS_COACH]: {
    id: CoachingPhilosophy.PLAYERS_COACH,
    label: 'Players Coach',
    tagline: 'Gestione spogliatoio, chimica e libertà alle stelle',
    description:
      'Empatia e leadership positiva: riduce il malcontento sui minuti e massimizza il rendimento delle star.',
    attributeModifiers: {
      motivation: 3,
      rotationManagement: 3,
      offense: 1,
      discipline: -2,
    },
    tacticalWeights: {
      paceTendency: 1.02,
      threePointTendency: 1.03,
      benchUsageTendency: 0.94,
      starterFatigueMultiplier: 1.03,
      isolationTendency: 1.15,
      defensiveIntensity: 0.96,
    },
  },
  [CoachingPhilosophy.PRAGMATIC]: {
    id: CoachingPhilosophy.PRAGMATIC,
    label: 'Pragmatico',
    tagline: 'Adattabilità tattica totale in partita e serie playoff',
    description:
      'Nessun dogma: adatta quintetti, ritmo e difese ai punti deboli dell’avversario in tempo reale.',
    attributeModifiers: {
      tacticalAdjustments: 4,
      defense: 1,
      discipline: 1,
      talentEvaluation: 1,
      youthDevelopment: -1,
    },
    tacticalWeights: {
      paceTendency: 1.0,
      threePointTendency: 1.0,
      benchUsageTendency: 1.02,
      starterFatigueMultiplier: 0.96,
      isolationTendency: 1.0,
      defensiveIntensity: 1.06,
    },
  },
};

export interface Coach {
  id: string;
  name: string;
  age: number;
  nationality: Nationality;
  /** Reputazione generale 1-100 */
  reputation: number;
  contractYears: number;
  salary: number;
  philosophy: CoachingPhilosophy;
  technical: CoachTechnicalAttributes;
  mental: CoachMentalAttributes;
}

export interface NormalizedTacticalModifiers {
  /** Moltiplicatore efficienza offensiva (es. 0.90 - 1.15) */
  offensiveEfficiency: number;
  /** Moltiplicatore efficienza difensiva (es. 0.90 - 1.15) */
  defensiveEfficiency: number;
  /** Moltiplicatore ritmo possessi */
  paceFactor: number;
  /** Moltiplicatore frequenza/qualità tiro da 3 */
  threePointFactor: number;
  /** Impatto di timeout e aggiustamenti live */
  timeoutImpact: number;
  /** Impatto su morale e tiri clutch */
  clutchMoraleFactor: number;
  /** Utilizzo della panchina e protezione stamina titolari */
  benchDepthFactor: number;
  /** Moltiplicatore fatica dei titolari */
  starterFatigueFactor: number;
  /** Controllo palle perse e falli (più alto = meno errori) */
  disciplineFactor: number;
  /** Velocità crescita fondamentali e giovani */
  developmentFactor: number;
  /** Accuratezza osservazione mercato/draft */
  scoutingAccuracy: number;
  /** Tendenza all'isolamento delle star */
  isolationFactor: number;
}

export interface CoachSeasonOutcome {
  /** Percentuale vittorie 0..1 */
  winPct: number;
  /** Risultati oltre le aspettative della dirigenza */
  overachieved?: boolean;
  /** Titolo o finale raggiunta */
  reachedFinals?: boolean;
}

export function clampAttr(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return Math.max(COACH_ATTR_MIN, Math.min(COACH_ATTR_MAX, Math.round(value)));
}

export function clampReputation(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.max(1, Math.min(100, Math.round(value)));
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Converte un attributo 1..20 in un moltiplicatore centrato su 1.0 (10 => 1.00).
 * Con span=0.12: 1 => ~0.89, 10 => 1.00, 20 => 1.12.
 */
function attrToMultiplier(attr: number, span: number = 0.12): number {
  const clamped = clampAttr(attr);
  return 1 + ((clamped - 10) / 10) * span;
}

export function getCoachTacticalModifiers(coach: Coach): NormalizedTacticalModifiers {
  const phil = COACHING_PHILOSOPHIES[coach.philosophy] ?? COACHING_PHILOSOPHIES[CoachingPhilosophy.PRAGMATIC];
  const w = phil.tacticalWeights;
  const t = coach.technical;
  const m = coach.mental;

  const avgDev = (t.skillDevelopment + m.youthDevelopment) / 2;
  const staminaProtection = attrToMultiplier(t.conditioning, 0.08);

  return {
    offensiveEfficiency: round3(attrToMultiplier(t.offense, 0.11) * (0.97 + w.threePointTendency * 0.03)),
    defensiveEfficiency: round3(attrToMultiplier(t.defense, 0.11) * (0.95 + w.defensiveIntensity * 0.05)),
    paceFactor: round3(w.paceTendency),
    threePointFactor: round3(w.threePointTendency * attrToMultiplier(t.offense, 0.04)),
    timeoutImpact: round3(attrToMultiplier(t.tacticalAdjustments, 0.15)),
    clutchMoraleFactor: round3(attrToMultiplier(m.motivation, 0.12)),
    benchDepthFactor: round3(w.benchUsageTendency * attrToMultiplier(m.rotationManagement, 0.08)),
    starterFatigueFactor: round3(w.starterFatigueMultiplier / staminaProtection),
    disciplineFactor: round3(attrToMultiplier(m.discipline, 0.12)),
    developmentFactor: round3(attrToMultiplier(avgDev, 0.18)),
    scoutingAccuracy: round3(attrToMultiplier(m.talentEvaluation, 0.16)),
    isolationFactor: round3(w.isolationTendency),
  };
}

export class CoachEntity implements Coach {
  id: string;
  name: string;
  age: number;
  nationality: Nationality;
  reputation: number;
  contractYears: number;
  salary: number;
  philosophy: CoachingPhilosophy;
  technical: CoachTechnicalAttributes;
  mental: CoachMentalAttributes;

  constructor(data: Coach) {
    this.id = data.id;
    this.name = data.name;
    this.age = Math.max(26, Math.min(78, Math.round(data.age)));
    this.nationality = data.nationality;
    this.reputation = clampReputation(data.reputation);
    this.contractYears = Math.max(1, Math.min(5, Math.round(data.contractYears)));
    this.salary = Math.max(20000, Math.round(data.salary));
    this.philosophy = data.philosophy;
    this.technical = {
      offense: clampAttr(data.technical.offense),
      defense: clampAttr(data.technical.defense),
      tacticalAdjustments: clampAttr(data.technical.tacticalAdjustments),
      skillDevelopment: clampAttr(data.technical.skillDevelopment),
      conditioning: clampAttr(data.technical.conditioning),
    };
    this.mental = {
      motivation: clampAttr(data.mental.motivation),
      rotationManagement: clampAttr(data.mental.rotationManagement),
      discipline: clampAttr(data.mental.discipline),
      youthDevelopment: clampAttr(data.mental.youthDevelopment),
      talentEvaluation: clampAttr(data.mental.talentEvaluation),
    };
  }

  getTacticalModifiers(): NormalizedTacticalModifiers {
    return getCoachTacticalModifiers(this);
  }

  updateAttributes(outcome: CoachSeasonOutcome, rng: () => number = Math.random): void {
    this.age = Math.min(80, this.age + 1);

    // Base delta per prestazioni stagionali
    let performanceDelta = 0;
    if (outcome.winPct >= 0.65 || outcome.reachedFinals) performanceDelta += 1;
    if (outcome.overachieved) performanceDelta += 1;
    if (outcome.winPct < 0.32) performanceDelta -= 1;

    // Curva legata all'età: giovani crescono più facilmente, over 64 possono calare su conditioning
    const ageGrowthBias = this.age < 46 ? 0.55 : this.age <= 58 ? 0.25 : -0.25;

    const nudge = (current: number, extraBias: number = 0): number => {
      const roll = rng();
      let delta = performanceDelta;
      if (roll < 0.35 + ageGrowthBias + extraBias) delta += 1;
      else if (roll > 0.85 + ageGrowthBias) delta -= 1;
      // Mantieni progressione realistica [-1, +2] per stagione
      delta = Math.max(-1, Math.min(2, delta));
      return clampAttr(current + delta);
    };

    this.technical = {
      offense: nudge(this.technical.offense),
      defense: nudge(this.technical.defense),
      tacticalAdjustments: nudge(this.technical.tacticalAdjustments, this.age >= 50 ? 0.15 : 0),
      skillDevelopment: nudge(this.technical.skillDevelopment),
      conditioning: nudge(this.technical.conditioning, this.age >= 62 ? -0.35 : 0),
    };

    this.mental = {
      motivation: nudge(this.mental.motivation),
      rotationManagement: nudge(this.mental.rotationManagement, 0.1),
      discipline: nudge(this.mental.discipline),
      youthDevelopment: nudge(this.mental.youthDevelopment),
      talentEvaluation: nudge(this.mental.talentEvaluation, 0.1),
    };

    const repDelta =
      (outcome.winPct >= 0.6 ? 4 : outcome.winPct < 0.35 ? -4 : 1) +
      (outcome.reachedFinals ? 5 : 0) +
      (outcome.overachieved ? 3 : 0);
    this.reputation = clampReputation(this.reputation + repDelta);
  }
}

const PROCEDURAL_NAMES: Record<Nationality, { first: string[]; last: string[] }> = {
  ITA: {
    first: ['Marco', 'Ettore', 'Luca', 'Andrea', 'Simone', 'Matteo', 'Paolo', 'Stefano'],
    last: ['Banchi', 'Messina', 'Trinchieri', 'Scariolo', 'Pozzecco', 'Pianigiani', 'Repesa', 'Diana'],
  },
  SRB: {
    first: ['Željko', 'Aleksandar', 'Svetislav', 'Saša', 'Dejan'],
    last: ['Obradović', 'Đorđević', 'Pešić', 'Radonjić', 'Milojević'],
  },
  ESP: {
    first: ['Pablo', 'Chus', 'Joan', 'Pedro', 'Jaume'],
    last: ['Laso', 'Mateo', 'Peñarroya', 'Martínez', 'Ponsarnau'],
  },
  USA: {
    first: ['David', 'Mike', 'Quinn', 'Taylor', 'Chris'],
    last: ['Blatt', 'D’Antoni', 'Snyder', 'Jenkins', 'Finch'],
  },
  GRE: {
    first: ['Georgios', 'Dimitris', 'Giannis', 'Vassilis'],
    last: ['Bartzokas', 'Itoudis', 'Sfairopoulos', 'Spanoulis'],
  },
  LTU: {
    first: ['Šarūnas', 'Kazys', 'Rimas', 'Dainius'],
    last: ['Jasikevičius', 'Maksvytis', 'Kurtinaitis', 'Adomaitis'],
  },
  FRA: {
    first: ['Vincent', 'Laurent', 'Frédéric', 'TJ'],
    last: ['Collet', 'Foirest', 'Fauthoux', 'Parker'],
  },
  GER: {
    first: ['Gordon', 'Henrik', 'Álex', 'Israel'],
    last: ['Herbert', 'Rödl', 'Mumbrú', 'González'],
  },
  ARG: {
    first: ['Sergio', 'Pablo', 'Néstor', 'Julio'],
    last: ['Hernández', 'Prigioni', 'García', 'Lamas'],
  },
  SLO: {
    first: ['Aleksander', 'Jaka', 'Igor', 'Memi'],
    last: ['Sekulić', 'Lakovič', 'Kokoškov', 'Bečirovič'],
  },
  CRO: {
    first: ['Neven', 'Veljko', 'Damir', 'Josip'],
    last: ['Spahija', 'Mršić', 'Mulaomerović', 'Sesar'],
  },
  LAT: {
    first: ['Ainars', 'Roberts', 'Artūrs', 'Jānis'],
    last: ['Bagatskis', 'Štelmahers', 'Visockis', 'Gailītis'],
  },
};

export interface GenerateCoachOptions {
  id?: string;
  name?: string;
  nationality?: Nationality;
  age?: number;
  rng?: () => number;
}

export function generateCoach(
  tier: CoachReputationTier,
  philosophy: CoachingPhilosophy,
  options: GenerateCoachOptions = {}
): CoachEntity {
  const rng = options.rng ?? Math.random;
  const nationality: Nationality = options.nationality ?? 'ITA';
  const pool = PROCEDURAL_NAMES[nationality] ?? PROCEDURAL_NAMES.ITA;
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  const name = options.name?.trim() || `${pick(pool.first)} ${pick(pool.last)}`;
  const id = options.id ?? `coach_${Math.random().toString(36).slice(2, 10)}`;

  const tierCfg =
    tier === 'LEGEND'
      ? { baseAttr: 14, spread: 3, repMin: 80, repMax: 96, ageMin: 48, ageMax: 65, salaryBase: 450000 }
      : tier === 'EXPERIENCED'
      ? { baseAttr: 11, spread: 3, repMin: 56, repMax: 76, ageMin: 40, ageMax: 58, salaryBase: 180000 }
      : { baseAttr: 8, spread: 3, repMin: 32, repMax: 52, ageMin: 31, ageMax: 44, salaryBase: 65000 };

  const age =
    options.age ?? Math.round(tierCfg.ageMin + rng() * (tierCfg.ageMax - tierCfg.ageMin));
  const reputation = Math.round(tierCfg.repMin + rng() * (tierCfg.repMax - tierCfg.repMin));
  const salary = Math.round((tierCfg.salaryBase * (0.85 + rng() * 0.4)) / 5000) * 5000;
  const contractYears = Math.max(1, Math.min(4, Math.floor(1 + rng() * 3)));

  const rollBase = () => tierCfg.baseAttr + Math.round((rng() - 0.5) * 2 * tierCfg.spread);
  const mods = COACHING_PHILOSOPHIES[philosophy].attributeModifiers;

  return new CoachEntity({
    id,
    name,
    age,
    nationality,
    reputation,
    contractYears,
    salary,
    philosophy,
    technical: {
      offense: clampAttr(rollBase() + (mods.offense ?? 0)),
      defense: clampAttr(rollBase() + (mods.defense ?? 0)),
      tacticalAdjustments: clampAttr(rollBase() + (mods.tacticalAdjustments ?? 0)),
      skillDevelopment: clampAttr(rollBase() + (mods.skillDevelopment ?? 0)),
      conditioning: clampAttr(rollBase() + (mods.conditioning ?? 0)),
    },
    mental: {
      motivation: clampAttr(rollBase() + (mods.motivation ?? 0)),
      rotationManagement: clampAttr(rollBase() + (mods.rotationManagement ?? 0)),
      discipline: clampAttr(rollBase() + (mods.discipline ?? 0)),
      youthDevelopment: clampAttr(rollBase() + (mods.youthDevelopment ?? 0)),
      talentEvaluation: clampAttr(rollBase() + (mods.talentEvaluation ?? 0)),
    },
  });
}

export function mapManagerPhilosophyToCoaching(phil: ManagerPhilosophy): CoachingPhilosophy {
  switch (phil) {
    case 'pace_and_space':
      return CoachingPhilosophy.PACE_AND_SPACE;
    case 'balkan_sergeant':
      return CoachingPhilosophy.GRIT_AND_GRIND;
    case 'pick_and_roll_master':
      return CoachingPhilosophy.MOTION_OFFENSE;
    case 'player_motivator':
      return CoachingPhilosophy.PLAYERS_COACH;
    default:
      return CoachingPhilosophy.PRAGMATIC;
  }
}

/**
 * Converte il profilo Manager salvato in un'istanza `CoachEntity` interrogabile dal motore.
 */
export function coachFromManagerProfile(profile: ManagerProfile, id: string = 'user_coach'): CoachEntity {
  const a: ManagerAttributes = profile.attributes;
  return new CoachEntity({
    id,
    name: `${profile.firstName} ${profile.lastName}`.trim(),
    age: profile.age,
    nationality: profile.nationality,
    reputation: profile.reputation,
    contractYears: 2,
    salary: 120000,
    philosophy: mapManagerPhilosophyToCoaching(profile.philosophy),
    technical: {
      offense: a.offenseSpacing,
      defense: a.defenseOrg,
      tacticalAdjustments: a.liveTactics,
      skillDevelopment: Math.round((a.youthDev + a.offenseSpacing) / 2),
      conditioning: Math.round((a.defenseOrg + a.liveTactics) / 2),
    },
    mental: {
      motivation: a.lockerRoom,
      rotationManagement: a.lockerRoom,
      discipline: Math.round((a.defenseOrg + a.liveTactics) / 2),
      youthDevelopment: a.youthDev,
      talentEvaluation: a.scoutingMarket,
    },
  });
}
