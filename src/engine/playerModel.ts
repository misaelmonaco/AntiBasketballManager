import { Nationality, Position } from '../types';
import { Coach } from './coachModel';

export const PLAYER_ATTR_MIN = 1;
export const PLAYER_ATTR_MAX = 100;

export type PlayerTier = 'ROOKIE' | 'ROLE_PLAYER' | 'STARTER' | 'ALL_STAR';
export type PlayerAgeGroup = 'PROSPECT' | 'PRIME' | 'VETERAN';

export interface PlayerOffensiveAttributes {
  /** Tiro da sotto, layup, schiacciate, contatti nel pitturato (1-100) */
  insideScoring: number;
  /** Tiro da 2 / dalla media distanza (1-100) */
  midRange: number;
  /** Tiro da 3 punti (1-100) */
  threePoint: number;
  /** Tiri liberi (1-100) */
  freeThrow: number;
  /** Visione di gioco e qualità dei passaggi/assist (1-100) */
  passing: number;
  /** Palleggio, controllo palla e creazione 1vs1 (1-100) */
  ballHandling: number;
}

export interface PlayerDefensiveAttributes {
  /** Difesa sul palleggiatore e contestazione tiri da fuori (1-100) */
  perimeterDefense: number;
  /** Protezione del ferro e difesa in post basso (1-100) */
  interiorDefense: number;
  /** Rubate e lettura linee di passaggio (1-100) */
  steal: number;
  /** Tempismo nelle stoppate (1-100) */
  block: number;
  /** Tagliafuori e presa del rimbalzo (1-100) */
  rebounding: number;
}

export interface PlayerPhysicalMentalAttributes {
  /** Velocità, agilità e transizione (1-100) */
  speed: number;
  /** Forza fisica e tenuta nei contatti (1-100) */
  strength: number;
  /** Resistenza alla fatica durante la partita (1-100) */
  stamina: number;
  /** Selezione dei tiri, riduzione palle perse, letture tattiche (1-100) */
  basketballIQ: number;
  /** Rendimento nei momenti decisivi / ultimi 2 minuti (1-100) */
  clutch: number;
  /** Dedizione in allenamento, moltiplicatore di crescita (1-100) */
  workEthic: number;
  /** Tetto massimo raggiungibile dal giocatore (1-100) */
  potential: number;
  /** Impatto sulle richieste di minutaggio e chimica di spogliatoio (1-100) */
  ego: number;
}

export type PlayerRatedAttributes = PlayerOffensiveAttributes &
  PlayerDefensiveAttributes &
  Pick<
    PlayerPhysicalMentalAttributes,
    'speed' | 'strength' | 'stamina' | 'basketballIQ' | 'clutch'
  >;

export type PlayerAllAttributes = PlayerOffensiveAttributes &
  PlayerDefensiveAttributes &
  PlayerPhysicalMentalAttributes;

export interface PlayerModel {
  id: string;
  name: string;
  age: number;
  nationality: Nationality;
  position: Position;
  secondaryPosition?: Position;
  salary: number;
  contractYears: number;
  /** Morale corrente (1-100) */
  morale: number;
  /** Fatica accumulata (0-100) */
  fatigue: number;
  offense: PlayerOffensiveAttributes;
  defense: PlayerDefensiveAttributes;
  physicalMental: PlayerPhysicalMentalAttributes;
}

export interface CoachTrainingInput {
  skillDevelopment: number; // 1-20
  youthDevelopment: number; // 1-20
}

export const POSITION_OVERALL_WEIGHTS: Record<Position, Record<keyof PlayerRatedAttributes, number>> = {
  PG: {
    insideScoring: 0.05,
    midRange: 0.07,
    threePoint: 0.13,
    freeThrow: 0.04,
    passing: 0.18,
    ballHandling: 0.16,
    perimeterDefense: 0.10,
    interiorDefense: 0.01,
    steal: 0.05,
    block: 0.01,
    rebounding: 0.02,
    speed: 0.10,
    strength: 0.02,
    stamina: 0.03,
    basketballIQ: 0.10,
    clutch: 0.03,
  },
  SG: {
    insideScoring: 0.07,
    midRange: 0.12,
    threePoint: 0.17,
    freeThrow: 0.05,
    passing: 0.07,
    ballHandling: 0.11,
    perimeterDefense: 0.12,
    interiorDefense: 0.02,
    steal: 0.05,
    block: 0.01,
    rebounding: 0.03,
    speed: 0.09,
    strength: 0.02,
    stamina: 0.03,
    basketballIQ: 0.06,
    clutch: 0.04,
  },
  SF: {
    insideScoring: 0.10,
    midRange: 0.10,
    threePoint: 0.11,
    freeThrow: 0.04,
    passing: 0.06,
    ballHandling: 0.07,
    perimeterDefense: 0.12,
    interiorDefense: 0.06,
    steal: 0.04,
    block: 0.03,
    rebounding: 0.09,
    speed: 0.07,
    strength: 0.05,
    stamina: 0.03,
    basketballIQ: 0.06,
    clutch: 0.03,
  },
  PF: {
    insideScoring: 0.15,
    midRange: 0.09,
    threePoint: 0.06,
    freeThrow: 0.03,
    passing: 0.04,
    ballHandling: 0.03,
    perimeterDefense: 0.05,
    interiorDefense: 0.14,
    steal: 0.02,
    block: 0.07,
    rebounding: 0.15,
    speed: 0.04,
    strength: 0.10,
    stamina: 0.03,
    basketballIQ: 0.05,
    clutch: 0.02,
  },
  C: {
    insideScoring: 0.17,
    midRange: 0.04,
    threePoint: 0.02,
    freeThrow: 0.03,
    passing: 0.03,
    ballHandling: 0.02,
    perimeterDefense: 0.02,
    interiorDefense: 0.17,
    steal: 0.01,
    block: 0.14,
    rebounding: 0.19,
    speed: 0.02,
    strength: 0.12,
    stamina: 0.03,
    basketballIQ: 0.05,
    clutch: 0.02,
  },
};

export function clampPlayerAttr(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.max(PLAYER_ATTR_MIN, Math.min(PLAYER_ATTR_MAX, Math.round(value)));
}

export function clampMorale(value: number): number {
  if (!Number.isFinite(value)) return 70;
  return Math.max(1, Math.min(100, Math.round(value)));
}

export function clampFatigue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculatePlayerOverall(
  position: Position,
  offense: PlayerOffensiveAttributes,
  defense: PlayerDefensiveAttributes,
  physicalMental: PlayerPhysicalMentalAttributes
): number {
  const weights = POSITION_OVERALL_WEIGHTS[position];
  const combined: PlayerRatedAttributes = {
    ...offense,
    ...defense,
    speed: physicalMental.speed,
    strength: physicalMental.strength,
    stamina: physicalMental.stamina,
    basketballIQ: physicalMental.basketballIQ,
    clutch: physicalMental.clutch,
  };

  let weightedSum = 0;
  let totalWeight = 0;
  for (const key of Object.keys(weights) as (keyof PlayerRatedAttributes)[]) {
    const w = weights[key];
    weightedSum += clampPlayerAttr(combined[key]) * w;
    totalWeight += w;
  }

  return clampPlayerAttr(weightedSum / (totalWeight || 1));
}

export class PlayerEntity implements PlayerModel {
  id: string;
  name: string;
  age: number;
  nationality: Nationality;
  position: Position;
  secondaryPosition?: Position;
  salary: number;
  contractYears: number;
  morale: number;
  fatigue: number;
  offense: PlayerOffensiveAttributes;
  defense: PlayerDefensiveAttributes;
  physicalMental: PlayerPhysicalMentalAttributes;

  constructor(data: PlayerModel) {
    this.id = data.id;
    this.name = data.name;
    this.age = Math.max(16, Math.min(44, Math.round(data.age)));
    this.nationality = data.nationality;
    this.position = data.position;
    this.secondaryPosition = data.secondaryPosition;
    this.salary = Math.max(10000, Math.round(data.salary));
    this.contractYears = Math.max(1, Math.min(5, Math.round(data.contractYears)));
    this.morale = clampMorale(data.morale);
    this.fatigue = clampFatigue(data.fatigue);

    this.offense = {
      insideScoring: clampPlayerAttr(data.offense.insideScoring),
      midRange: clampPlayerAttr(data.offense.midRange),
      threePoint: clampPlayerAttr(data.offense.threePoint),
      freeThrow: clampPlayerAttr(data.offense.freeThrow),
      passing: clampPlayerAttr(data.offense.passing),
      ballHandling: clampPlayerAttr(data.offense.ballHandling),
    };

    this.defense = {
      perimeterDefense: clampPlayerAttr(data.defense.perimeterDefense),
      interiorDefense: clampPlayerAttr(data.defense.interiorDefense),
      steal: clampPlayerAttr(data.defense.steal),
      block: clampPlayerAttr(data.defense.block),
      rebounding: clampPlayerAttr(data.defense.rebounding),
    };

    this.physicalMental = {
      speed: clampPlayerAttr(data.physicalMental.speed),
      strength: clampPlayerAttr(data.physicalMental.strength),
      stamina: clampPlayerAttr(data.physicalMental.stamina),
      basketballIQ: clampPlayerAttr(data.physicalMental.basketballIQ),
      clutch: clampPlayerAttr(data.physicalMental.clutch),
      workEthic: clampPlayerAttr(data.physicalMental.workEthic),
      potential: clampPlayerAttr(data.physicalMental.potential),
      ego: clampPlayerAttr(data.physicalMental.ego),
    };
  }

  get overall(): number {
    return this.calculateOverall();
  }

  calculateOverall(): number {
    return calculatePlayerOverall(this.position, this.offense, this.defense, this.physicalMental);
  }

  /**
   * Snapshot dinamico per il motore di partita:
   * riduce gli attributi fisici/tecnici in base alla fatica e applica un leggero modificatore morale.
   */
  getEffectiveAttributes(): PlayerAllAttributes {
    // Stamina alta mitiga l'impatto della fatica (es. stamina 90 riduce la penalità del ~35%)
    const staminaMitigation = 1 - ((this.physicalMental.stamina - 50) / 100) * 0.35;
    const effectiveFatigue = Math.max(0, (this.fatigue / 100) * staminaMitigation);

    // Con fatigue=80 e stamina=50 => penalty ~20-26% su speed/defense/shot
    const heavyPenalty = 1 - effectiveFatigue * 0.28;
    const mediumPenalty = 1 - effectiveFatigue * 0.20;

    // Morale: 50 => 1.00, 100 => 1.06, 1 => 0.93
    const moraleFactor = 1 + ((this.morale - 50) / 50) * 0.06;

    return {
      insideScoring: clampPlayerAttr(this.offense.insideScoring * mediumPenalty * moraleFactor),
      midRange: clampPlayerAttr(this.offense.midRange * mediumPenalty * moraleFactor),
      threePoint: clampPlayerAttr(this.offense.threePoint * heavyPenalty * moraleFactor),
      freeThrow: clampPlayerAttr(this.offense.freeThrow * (1 - effectiveFatigue * 0.12) * moraleFactor),
      passing: clampPlayerAttr(this.offense.passing * (1 - effectiveFatigue * 0.14) * moraleFactor),
      ballHandling: clampPlayerAttr(this.offense.ballHandling * mediumPenalty * moraleFactor),
      perimeterDefense: clampPlayerAttr(this.defense.perimeterDefense * heavyPenalty * moraleFactor),
      interiorDefense: clampPlayerAttr(this.defense.interiorDefense * mediumPenalty * moraleFactor),
      steal: clampPlayerAttr(this.defense.steal * heavyPenalty),
      block: clampPlayerAttr(this.defense.block * heavyPenalty),
      rebounding: clampPlayerAttr(this.defense.rebounding * mediumPenalty),
      speed: clampPlayerAttr(this.physicalMental.speed * heavyPenalty),
      strength: clampPlayerAttr(this.physicalMental.strength * (1 - effectiveFatigue * 0.10)),
      stamina: this.physicalMental.stamina,
      basketballIQ: clampPlayerAttr(this.physicalMental.basketballIQ * (1 + ((this.morale - 50) / 50) * 0.04)),
      clutch: clampPlayerAttr(this.physicalMental.clutch * moraleFactor),
      workEthic: this.physicalMental.workEthic,
      potential: this.physicalMental.potential,
      ego: this.physicalMental.ego,
    };
  }

  /**
   * Applica un ciclo di allenamento o progressione stagionale usando i bonus del Coach.
   */
  applyTraining(
    coachInput: CoachTrainingInput | Coach,
    rng: () => number = Math.random
  ): { overallBefore: number; overallAfter: number } {
    const overallBefore = this.calculateOverall();
    const skillDev = 'technical' in coachInput ? coachInput.technical.skillDevelopment : coachInput.skillDevelopment;
    const youthDev = 'mental' in coachInput ? coachInput.mental.youthDevelopment : coachInput.youthDevelopment;

    const coachSkillFactor = 0.75 + (skillDev / 20) * 0.55; // ~0.78..1.30
    const coachYouthFactor = this.age <= 23 ? 0.8 + (youthDev / 20) * 0.6 : 1.0;
    const workEthicMult = 0.7 + (this.physicalMental.workEthic / 100) * 0.65; // ~0.70..1.35
    const headroom = Math.max(0, this.physicalMental.potential - overallBefore);

    const isYoungGrowth = this.age <= 24 && headroom > 0;
    const isVeteranDecline = this.age >= 32;

    const growStat = (val: number, maxCap: number, weight: number = 1): number => {
      if (isVeteranDecline) {
        const declineChance = Math.min(0.65, (this.age - 31) * 0.11);
        if (rng() < declineChance) {
          return clampPlayerAttr(val - (rng() < 0.35 ? 2 : 1));
        }
        return val;
      }
      if (!isYoungGrowth && this.age > 29) return val;

      const potFactor = headroom > 10 ? 1.35 : headroom > 4 ? 1.0 : headroom > 0 ? 0.55 : 0.15;
      const expectedGain = potFactor * coachSkillFactor * coachYouthFactor * workEthicMult * weight;
      const gain = Math.max(0, Math.round(expectedGain * (0.6 + rng() * 0.9)));
      return clampPlayerAttr(Math.min(maxCap, val + gain));
    };

    const softCap = Math.max(overallBefore, this.physicalMental.potential);

    this.offense = {
      insideScoring: growStat(this.offense.insideScoring, softCap + 6),
      midRange: growStat(this.offense.midRange, softCap + 6),
      threePoint: growStat(this.offense.threePoint, softCap + 6),
      freeThrow: isVeteranDecline ? this.offense.freeThrow : growStat(this.offense.freeThrow, 97, 0.8),
      passing: growStat(this.offense.passing, softCap + 6),
      ballHandling: growStat(this.offense.ballHandling, softCap + 6),
    };

    this.defense = {
      perimeterDefense: growStat(this.defense.perimeterDefense, softCap + 5),
      interiorDefense: growStat(this.defense.interiorDefense, softCap + 5),
      steal: growStat(this.defense.steal, softCap + 5, 0.8),
      block: growStat(this.defense.block, softCap + 5, 0.8),
      rebounding: growStat(this.defense.rebounding, softCap + 5),
    };

    this.physicalMental = {
      ...this.physicalMental,
      speed: growStat(this.physicalMental.speed, softCap + 4, isVeteranDecline ? 1.3 : 0.7),
      strength: this.age < 26 ? growStat(this.physicalMental.strength, softCap + 6, 1.1) : this.physicalMental.strength,
      stamina: growStat(this.physicalMental.stamina, 98, isVeteranDecline ? 1.1 : 0.8),
      basketballIQ: isVeteranDecline
        ? clampPlayerAttr(this.physicalMental.basketballIQ + (rng() < 0.5 ? 1 : 0))
        : growStat(this.physicalMental.basketballIQ, 96, 1.0),
    };

    return {
      overallBefore,
      overallAfter: this.calculateOverall(),
    };
  }

  seasonalProgression(coachInput: CoachTrainingInput | Coach, rng: () => number = Math.random): {
    overallBefore: number;
    overallAfter: number;
  } {
    this.age = Math.min(44, this.age + 1);
    this.contractYears = Math.max(0, this.contractYears - 1);
    this.fatigue = 0;
    return this.applyTraining(coachInput, rng);
  }
}

const ROLE_ATTRIBUTE_BIAS: Record<Position, Partial<Record<keyof PlayerAllAttributes, number>>> = {
  PG: {
    passing: 14,
    ballHandling: 14,
    threePoint: 8,
    speed: 12,
    perimeterDefense: 6,
    basketballIQ: 8,
    steal: 6,
    interiorDefense: -22,
    block: -28,
    rebounding: -18,
    strength: -14,
  },
  SG: {
    threePoint: 12,
    midRange: 10,
    ballHandling: 6,
    speed: 8,
    perimeterDefense: 8,
    freeThrow: 8,
    interiorDefense: -16,
    block: -22,
    rebounding: -12,
    strength: -8,
  },
  SF: {
    insideScoring: 6,
    midRange: 5,
    threePoint: 5,
    perimeterDefense: 6,
    rebounding: 4,
    speed: 4,
    strength: 2,
    block: -6,
  },
  PF: {
    insideScoring: 10,
    rebounding: 12,
    interiorDefense: 10,
    strength: 12,
    block: 6,
    midRange: 2,
    ballHandling: -14,
    passing: -10,
    threePoint: -8,
    speed: -8,
  },
  C: {
    insideScoring: 14,
    rebounding: 16,
    interiorDefense: 15,
    block: 14,
    strength: 16,
    ballHandling: -22,
    passing: -14,
    threePoint: -22,
    speed: -16,
    perimeterDefense: -16,
  },
};

const SECONDARY_POS_MAP: Record<Position, Position> = {
  PG: 'SG',
  SG: 'PG',
  SF: 'PF',
  PF: 'C',
  C: 'PF',
};

export interface GeneratePlayerOptions {
  id?: string;
  name?: string;
  age?: number;
  nationality?: Nationality;
  rng?: () => number;
}

export function generatePlayer(
  position: Position,
  ageGroup: PlayerAgeGroup,
  tier: PlayerTier,
  options: GeneratePlayerOptions = {}
): PlayerEntity {
  const rng = options.rng ?? Math.random;
  const nationality: Nationality = options.nationality ?? 'ITA';

  const age =
    options.age ??
    (ageGroup === 'PROSPECT'
      ? Math.round(18 + rng() * 4)
      : ageGroup === 'PRIME'
      ? Math.round(24 + rng() * 6)
      : Math.round(31 + rng() * 6));

  const baseOvr =
    tier === 'ALL_STAR'
      ? 83
      : tier === 'STARTER'
      ? 74
      : tier === 'ROLE_PLAYER'
      ? 65
      : 57;

  const spread = 5;
  const bias = ROLE_ATTRIBUTE_BIAS[position];
  const roll = (key: keyof PlayerAllAttributes) =>
    clampPlayerAttr(baseOvr + (bias[key] ?? 0) + (rng() - 0.5) * 2 * spread);

  const offense: PlayerOffensiveAttributes = {
    insideScoring: roll('insideScoring'),
    midRange: roll('midRange'),
    threePoint: roll('threePoint'),
    freeThrow: roll('freeThrow'),
    passing: roll('passing'),
    ballHandling: roll('ballHandling'),
  };

  const defense: PlayerDefensiveAttributes = {
    perimeterDefense: roll('perimeterDefense'),
    interiorDefense: roll('interiorDefense'),
    steal: roll('steal'),
    block: roll('block'),
    rebounding: roll('rebounding'),
  };

  const speed = roll('speed');
  const strength = roll('strength');
  const stamina = roll('stamina');
  const basketballIQ = clampPlayerAttr(roll('basketballIQ') + (ageGroup === 'VETERAN' ? 6 : ageGroup === 'PROSPECT' ? -6 : 0));
  const clutch = roll('clutch');
  const workEthic = clampPlayerAttr(55 + rng() * 40);
  const ego = clampPlayerAttr(tier === 'ALL_STAR' ? 60 + rng() * 35 : 25 + rng() * 50);

  const provisionalOvr = calculatePlayerOverall(position, offense, defense, {
    speed,
    strength,
    stamina,
    basketballIQ,
    clutch,
    workEthic,
    potential: 99,
    ego,
  });

  const potRoom =
    ageGroup === 'PROSPECT'
      ? Math.round(8 + rng() * 14)
      : ageGroup === 'PRIME'
      ? Math.round(1 + rng() * 5)
      : 0;
  const potential = clampPlayerAttr(Math.max(provisionalOvr, provisionalOvr + potRoom));

  const salaryBase =
    tier === 'ALL_STAR'
      ? 650000
      : tier === 'STARTER'
      ? 280000
      : tier === 'ROLE_PLAYER'
      ? 110000
      : 45000;
  const salary = Math.round((salaryBase * (0.85 + rng() * 0.35)) / 5000) * 5000;

  return new PlayerEntity({
    id: options.id ?? `pl_${Math.random().toString(36).slice(2, 10)}`,
    name: options.name?.trim() || `Giocatore ${position}`,
    age,
    nationality,
    position,
    secondaryPosition: rng() < 0.65 ? SECONDARY_POS_MAP[position] : undefined,
    salary,
    contractYears: Math.max(1, Math.min(4, Math.floor(1 + rng() * 3))),
    morale: Math.round(68 + rng() * 22),
    fatigue: 0,
    offense,
    defense,
    physicalMental: {
      speed,
      strength,
      stamina,
      basketballIQ,
      clutch,
      workEthic,
      potential,
      ego,
    },
  });
}
