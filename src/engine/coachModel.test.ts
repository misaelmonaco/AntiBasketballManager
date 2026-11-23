import { describe, expect, it } from 'vitest';
import {
  COACH_ATTR_MAX,
  COACH_ATTR_MIN,
  COACHING_PHILOSOPHIES,
  CoachEntity,
  CoachingPhilosophy,
  generateCoach,
} from './coachModel';

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('coachModel', () => {
  it('valida e forza i range 1-20 su tutti gli attributi e 1-100 sulla reputazione', () => {
    const coach = new CoachEntity({
      id: 'c_test',
      name: 'Test Coach',
      age: 45,
      nationality: 'ITA',
      reputation: 150,
      contractYears: 2,
      salary: 100000,
      philosophy: CoachingPhilosophy.PRAGMATIC,
      technical: {
        offense: 99,
        defense: -5,
        tacticalAdjustments: 14,
        skillDevelopment: 0,
        conditioning: 25,
      },
      mental: {
        motivation: 12,
        rotationManagement: 22,
        discipline: -10,
        youthDevelopment: 18,
        talentEvaluation: 1,
      },
    });

    expect(coach.reputation).toBe(100);
    expect(coach.technical.offense).toBe(COACH_ATTR_MAX);
    expect(coach.technical.defense).toBe(COACH_ATTR_MIN);
    expect(coach.technical.skillDevelopment).toBe(COACH_ATTR_MIN);
    expect(coach.technical.conditioning).toBe(COACH_ATTR_MAX);
    expect(coach.mental.rotationManagement).toBe(COACH_ATTR_MAX);
    expect(coach.mental.discipline).toBe(COACH_ATTR_MIN);
  });

  it('espone tutte e 6 le filosofie con modificatori attributi e pesi tattici', () => {
    const keys = Object.values(CoachingPhilosophy);
    expect(keys).toHaveLength(6);

    for (const phil of keys) {
      const cfg = COACHING_PHILOSOPHIES[phil];
      expect(cfg).toBeDefined();
      expect(cfg.tacticalWeights.paceTendency).toBeGreaterThan(0.5);
      expect(cfg.tacticalWeights.threePointTendency).toBeGreaterThan(0.5);
      expect(cfg.tacticalWeights.benchUsageTendency).toBeGreaterThan(0.5);
      expect(cfg.tacticalWeights.starterFatigueMultiplier).toBeGreaterThan(0.5);
    }
  });

  it('genera coach procedurali coerenti per Rookie, Experienced e Legend', () => {
    const rookie = generateCoach('ROOKIE', CoachingPhilosophy.PLAYER_DEVELOPER, {
      rng: seededRng(101),
    });
    const legend = generateCoach('LEGEND', CoachingPhilosophy.PACE_AND_SPACE, {
      rng: seededRng(101),
    });

    expect(rookie.reputation).toBeLessThan(legend.reputation);
    expect(legend.salary).toBeGreaterThan(rookie.salary);
    expect(legend.technical.offense).toBeGreaterThanOrEqual(COACH_ATTR_MIN);
    expect(legend.technical.offense).toBeLessThanOrEqual(COACH_ATTR_MAX);
  });

  it('restituisce modificatori tattici float normalizzati tramite getTacticalModifiers()', () => {
    const coach = generateCoach('LEGEND', CoachingPhilosophy.GRIT_AND_GRIND, {
      rng: seededRng(42),
    });
    const mods = coach.getTacticalModifiers();

    expect(mods.defensiveEfficiency).toBeGreaterThan(1);
    expect(mods.paceFactor).toBeLessThan(1);
    expect(mods.timeoutImpact).toBeGreaterThan(0.8);
    expect(mods.timeoutImpact).toBeLessThan(1.3);
    expect(mods.developmentFactor).toBeGreaterThan(0.75);
  });

  it('evolve gli attributi a fine stagione con updateAttributes() restando nei limiti 1-20', () => {
    const youngCoach = generateCoach('ROOKIE', CoachingPhilosophy.MOTION_OFFENSE, {
      age: 34,
      rng: seededRng(7),
    });
    const initialRep = youngCoach.reputation;

    youngCoach.updateAttributes(
      { winPct: 0.72, overachieved: true, reachedFinals: true },
      seededRng(99)
    );

    expect(youngCoach.age).toBe(35);
    expect(youngCoach.reputation).toBeGreaterThan(initialRep);

    const allAttrs = [
      ...Object.values(youngCoach.technical),
      ...Object.values(youngCoach.mental),
    ];
    for (const val of allAttrs) {
      expect(val).toBeGreaterThanOrEqual(COACH_ATTR_MIN);
      expect(val).toBeLessThanOrEqual(COACH_ATTR_MAX);
    }
  });
});
