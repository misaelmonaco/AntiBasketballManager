import { describe, expect, it } from 'vitest';
import {
  PLAYER_ATTR_MAX,
  PLAYER_ATTR_MIN,
  PlayerEntity,
  generatePlayer,
} from './playerModel';

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('playerModel', () => {
  it('valida i range 1-100 sugli attributi, 1-100 su morale e 0-100 su fatigue', () => {
    const p = new PlayerEntity({
      id: 'p_clamp',
      name: 'Clamp Test',
      age: 25,
      nationality: 'ITA',
      position: 'SG',
      salary: 120000,
      contractYears: 2,
      morale: 140,
      fatigue: -15,
      offense: {
        insideScoring: 110,
        midRange: 75,
        threePoint: 0,
        freeThrow: 88,
        passing: 60,
        ballHandling: 72,
      },
      defense: {
        perimeterDefense: 80,
        interiorDefense: -10,
        steal: 65,
        block: 35,
        rebounding: 45,
      },
      physicalMental: {
        speed: 105,
        strength: 55,
        stamina: 85,
        basketballIQ: 77,
        clutch: 90,
        workEthic: 80,
        potential: 92,
        ego: 40,
      },
    });

    expect(p.morale).toBe(100);
    expect(p.fatigue).toBe(0);
    expect(p.offense.insideScoring).toBe(PLAYER_ATTR_MAX);
    expect(p.offense.threePoint).toBe(PLAYER_ATTR_MIN);
    expect(p.defense.interiorDefense).toBe(PLAYER_ATTR_MIN);
    expect(p.physicalMental.speed).toBe(PLAYER_ATTR_MAX);
  });

  it('calcola overall ponderato per ruolo senza penalizzare un Centro nel tiro da 3', () => {
    const eliteCenter = new PlayerEntity({
      id: 'c_elite',
      name: 'Centro Dominante',
      age: 27,
      nationality: 'ITA',
      position: 'C',
      salary: 500000,
      contractYears: 3,
      morale: 80,
      fatigue: 0,
      offense: {
        insideScoring: 90,
        midRange: 55,
        threePoint: 25,
        freeThrow: 65,
        passing: 45,
        ballHandling: 35,
      },
      defense: {
        perimeterDefense: 35,
        interiorDefense: 92,
        steal: 30,
        block: 90,
        rebounding: 93,
      },
      physicalMental: {
        speed: 45,
        strength: 92,
        stamina: 80,
        basketballIQ: 78,
        clutch: 70,
        workEthic: 80,
        potential: 90,
        ego: 50,
      },
    });

    const centerAsPg = new PlayerEntity({
      ...eliteCenter,
      id: 'c_as_pg',
      position: 'PG',
    });

    expect(eliteCenter.calculateOverall()).toBeGreaterThanOrEqual(80);
    expect(eliteCenter.calculateOverall()).toBeGreaterThan(centerAsPg.calculateOverall() + 20);
  });

  it('genera giocatori realistici con potential >= overall e gerarchia di tier corretta', () => {
    const rookie = generatePlayer('PG', 'PROSPECT', 'ROOKIE', { rng: seededRng(11) });
    const allStar = generatePlayer('PF', 'PRIME', 'ALL_STAR', { rng: seededRng(11) });

    expect(rookie.physicalMental.potential).toBeGreaterThanOrEqual(rookie.overall);
    expect(allStar.physicalMental.potential).toBeGreaterThanOrEqual(allStar.overall);
    expect(allStar.overall).toBeGreaterThan(rookie.overall);
    expect(allStar.salary).toBeGreaterThan(rookie.salary);
  });

  it('applica correttamente la fatica e il morale in getEffectiveAttributes()', () => {
    const p = generatePlayer('SG', 'PRIME', 'STARTER', { rng: seededRng(55) });
    p.fatigue = 0;
    p.morale = 85;
    const fresh = p.getEffectiveAttributes();

    p.fatigue = 85;
    p.morale = 30;
    const exhausted = p.getEffectiveAttributes();

    expect(exhausted.speed).toBeLessThan(fresh.speed);
    expect(exhausted.threePoint).toBeLessThan(fresh.threePoint);
    expect(exhausted.perimeterDefense).toBeLessThan(fresh.perimeterDefense);
  });

  it('fa crescere un giovane prospetto con applyTraining() usando i bonus del Coach', () => {
    const prospect = generatePlayer('SF', 'PROSPECT', 'ROOKIE', {
      age: 19,
      rng: seededRng(21),
    });
    prospect.physicalMental.workEthic = 92;
    prospect.physicalMental.potential = Math.max(prospect.overall + 16, 82);

    const res = prospect.applyTraining(
      { skillDevelopment: 18, youthDevelopment: 19 },
      seededRng(33)
    );

    expect(res.overallAfter).toBeGreaterThan(res.overallBefore);
    expect(res.overallAfter).toBeLessThanOrEqual(PLAYER_ATTR_MAX);
  });
});
