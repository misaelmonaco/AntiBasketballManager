import type {
  LbaRosterFormat,
  LeagueId,
  Player,
  PlayerAttributes,
  PlayerBoxScore,
  Position,
} from '../types';

export function calculateOverall(attr: PlayerAttributes, pos: Position): number {
  const offenseBase =
    attr.twoPoint * 0.16 +
    attr.threePoint * 0.16 +
    attr.freeThrow * 0.08 +
    attr.finishing * 0.16;

  const playmaking = attr.passing * 0.5 + attr.ballHandling * 0.5;
  const defense =
    attr.perimeterDef * 0.32 +
    attr.postDef * 0.28 +
    attr.steals * 0.2 +
    attr.blocks * 0.2;
  const physical =
    attr.athleticism * 0.35 +
    attr.rebounding * 0.3 +
    attr.stamina * 0.2 +
    attr.basketballIQ * 0.15;

  let score = 0;
  switch (pos) {
    case 'PG':
      score =
        attr.threePoint * 0.15 +
        attr.twoPoint * 0.12 +
        attr.finishing * 0.1 +
        attr.freeThrow * 0.07 +
        playmaking * 0.28 +
        attr.perimeterDef * 0.1 +
        attr.steals * 0.05 +
        attr.basketballIQ * 0.07 +
        attr.stamina * 0.03 +
        attr.athleticism * 0.03;
      break;
    case 'SG':
      score =
        attr.threePoint * 0.24 +
        attr.twoPoint * 0.18 +
        attr.finishing * 0.15 +
        attr.freeThrow * 0.07 +
        playmaking * 0.12 +
        attr.perimeterDef * 0.12 +
        attr.athleticism * 0.07 +
        attr.basketballIQ * 0.05;
      break;
    case 'SF':
      score =
        offenseBase * 0.65 +
        defense * 0.24 +
        physical * 0.22 +
        playmaking * 0.1 +
        attr.rebounding * 0.08;
      break;
    case 'PF':
      score =
        attr.twoPoint * 0.16 +
        attr.finishing * 0.18 +
        attr.threePoint * 0.1 +
        attr.postDef * 0.16 +
        attr.rebounding * 0.18 +
        attr.blocks * 0.08 +
        attr.athleticism * 0.08 +
        attr.basketballIQ * 0.06;
      break;
    case 'C':
      score =
        attr.finishing * 0.22 +
        attr.twoPoint * 0.14 +
        attr.postDef * 0.2 +
        attr.rebounding * 0.22 +
        attr.blocks * 0.12 +
        attr.athleticism * 0.05 +
        attr.basketballIQ * 0.05;
      break;
  }

  return Math.max(30, Math.min(99, Math.round(score)));
}

const ATTRIBUTE_KEYS: (keyof PlayerAttributes)[] = [
  'threePoint',
  'twoPoint',
  'freeThrow',
  'passing',
  'ballHandling',
  'finishing',
  'perimeterDef',
  'postDef',
  'blocks',
  'steals',
  'athleticism',
  'rebounding',
  'stamina',
  'basketballIQ',
];

function clampSkill(val: number): number {
  return Math.max(30, Math.min(99, Math.round(val)));
}

/**
 * Adatta proporzionalmente tutti gli attributi di un giocatore per raggiungere
 * esattamente l'overall target desiderato (mantenendo il profilo tecnico relativo).
 */
export function adaptAttributesToOverall(
  attr: PlayerAttributes,
  pos: Position,
  targetOvr: number
): PlayerAttributes {
  const target = clampSkill(targetOvr);

  const shiftAttrs = (delta: number): PlayerAttributes => {
    const next = { ...attr };
    for (const k of ATTRIBUTE_KEYS) {
      next[k] = clampSkill(attr[k] + delta);
    }
    return next;
  };

  let lo = -70;
  let hi = 70;
  let best = shiftAttrs(0);
  let bestDiff = Math.abs(calculateOverall(best, pos) - target);

  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const candidate = shiftAttrs(mid);
    const ovr = calculateOverall(candidate, pos);
    const diff = Math.abs(ovr - target);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
    if (ovr === target) {
      return candidate;
    }
    if (ovr < target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  // Rifinitura fine +/-1 su singoli attributi se l'arrotondamento lascia uno scarto di 1 punto
  let current = { ...best };
  for (let pass = 0; pass < 3; pass++) {
    const curOvr = calculateOverall(current, pos);
    if (curOvr === target) break;
    const step = curOvr < target ? 1 : -1;
    for (const k of ATTRIBUTE_KEYS) {
      if ((step > 0 && current[k] < 99) || (step < 0 && current[k] > 30)) {
        current[k] = clampSkill(current[k] + step);
        if (calculateOverall(current, pos) === target) {
          return current;
        }
      }
    }
  }

  return current;
}

export function getForeignLimitForLeague(
  leagueId?: LeagueId,
  lbaFormat: LbaRosterFormat = '6+6'
): {
  maxForeign: number;
  minIta: number;
  minActive: number;
  maxActive: number;
  ruleLabel: string;
} {
  if (leagueId === 'ITA_A2') {
    return {
      maxForeign: 2,
      minIta: 5,
      minActive: 7,
      maxActive: 12,
      ruleLabel: 'Regola Serie A2 (7-12 a referto, max 2 stranieri)',
    };
  }
  if (leagueId === 'ITA_B' || leagueId === 'ITA_B2' || leagueId === 'ITA_B_INT') {
    return {
      maxForeign: 1,
      minIta: 6,
      minActive: 7,
      maxActive: 12,
      ruleLabel: 'Regola Serie B (7-12 a referto, max 1 straniero)',
    };
  }
  if (lbaFormat === '5+5') {
    return {
      maxForeign: 5,
      minIta: 5,
      minActive: 10,
      maxActive: 10,
      ruleLabel: 'Regola LBA 5+5',
    };
  }
  return {
    maxForeign: 6,
    minIta: 6,
    minActive: 10,
    maxActive: 12,
    ruleLabel: 'Regola LBA 6+6',
  };
}

export interface RosterValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  injuryExemption: boolean;
  activeCount: number;
  startersCount: number;
  benchCount: number;
  itaCount: number;
  foreignCount: number;
  minIta: number;
  maxForeign: number;
  ruleLabel: string;
}

export function validateRoster6Plus6(
  roster: Player[],
  leagueId?: LeagueId,
  lbaFormat: LbaRosterFormat = '6+6'
): RosterValidationResult {
  const { maxForeign, minIta, minActive, maxActive, ruleLabel } = getForeignLimitForLeague(
    leagueId,
    lbaFormat
  );
  const starters = roster.filter((p) => p.rosterSlot === 'starter');
  const bench = roster.filter((p) => p.rosterSlot === 'bench');
  const active = [...starters, ...bench];

  const itaCount = active.filter((p) => p.isItalianFormation).length;
  const foreignCount = active.filter((p) => !p.isItalianFormation).length;

  const healthyInClub = roster.filter((p) => p.injuryWeeks === 0);
  const healthyItaInClub = healthyInClub.filter((p) => p.isItalianFormation).length;
  const injuredItaInClub = roster.filter(
    (p) => p.isItalianFormation && p.injuryWeeks > 0
  ).length;
  const healthyItaActive = active.filter(
    (p) => p.isItalianFormation && p.injuryWeeks === 0
  ).length;

  const injuryExemption = healthyItaInClub < minIta && injuredItaInClub > 0;
  const minRequiredActive =
    leagueId === 'ITA_LBA' || !leagueId
      ? Math.max(minActive, Math.min(maxActive, healthyInClub.length))
      : Math.min(minActive, healthyInClub.length);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (starters.length !== 5) {
    errors.push(`Servono esattamente 5 titolari in quintetto (attuali: ${starters.length}).`);
  }

  const injuredStarters = starters.filter((p) => p.injuryWeeks > 0);
  if (injuredStarters.length > 0) {
    errors.push(
      `Titolare infortunato in quintetto (${injuredStarters
        .map((p) => p.lastName)
        .join(', ')}): spostalo in panchina o fuori referto.`
    );
  }

  if (foreignCount > maxForeign) {
    errors.push(
      `${ruleLabel} violata: massimo ${maxForeign} ${
        maxForeign === 1 ? 'giocatore straniero' : 'giocatori stranieri'
      } a referto (attuali: ${foreignCount}).`
    );
  }

  if (injuryExemption) {
    // Deroga infortuni: il club ha meno italiani sani del minimo richiesto
    if (healthyItaActive < healthyItaInClub) {
      errors.push(
        `Con infortuni agli italiani devi convocare tutti i ${healthyItaInClub} giocatori ITA disponibili (attuali: ${healthyItaActive}).`
      );
    }
    if (active.length < minRequiredActive || active.length > maxActive) {
      errors.push(
        `A referto devono esserci tra ${minRequiredActive} e ${maxActive} giocatori (attuali: ${active.length}).`
      );
    }
    const injuredForeignBench = bench.filter(
      (p) => !p.isItalianFormation && p.injuryWeeks > 0
    );
    if (injuredForeignBench.length > 0) {
      errors.push(
        `${injuredForeignBench.map((p) => p.lastName).join(', ')} è infortunato e non può andare a referto.`
      );
    }
    warnings.push(
      `Deroga Infortuni attiva (${ruleLabel}): ${healthyItaInClub}/${minIta} ITA sani (${injuredItaInClub} infortunato/i). Puoi comunque giocare o convocare un giovane U19 ITA.`
    );
  } else {
    if (active.length < minRequiredActive || active.length > maxActive) {
      errors.push(
        `A referto devono esserci ${
          minRequiredActive === maxActive ? `${maxActive}` : `${minRequiredActive}-${maxActive}`
        } giocatori (attuali: ${active.length}).`
      );
    }
    const effectiveMinIta =
      leagueId === 'ITA_A2' || leagueId === 'ITA_B' || leagueId === 'ITA_B2' || leagueId === 'ITA_B_INT'
        ? Math.max(0, active.length - maxForeign)
        : minIta;
    if (itaCount < effectiveMinIta) {
      errors.push(
        `${ruleLabel} violata: servono almeno ${effectiveMinIta} giocatori di formazione italiana a referto (attuali: ${itaCount}).`
      );
    }
    const injuredBench = bench.filter((p) => p.injuryWeeks > 0);
    if (injuredBench.length > 0) {
      errors.push(
        `${injuredBench.map((p) => p.lastName).join(', ')} è infortunato e non può andare a referto.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    injuryExemption,
    activeCount: active.length,
    startersCount: starters.length,
    benchCount: bench.length,
    itaCount,
    foreignCount,
    minIta,
    maxForeign,
    ruleLabel,
  };
}

export function calculateWageBill(roster: Player[]): number {
  return roster.reduce((sum, p) => sum + p.salary, 0);
}

export function calculateBuyout(player: Player): number {
  // Buonuscita pari al 45% del valore residuo del contratto
  return Math.round(player.salary * player.contractYears * 0.45);
}

export function calculatePIR(box: Pick<
  PlayerBoxScore,
  'points' | 'rebounds' | 'assists' | 'steals' | 'blocks' | 'fga' | 'fgm' | 'fta' | 'ftm' | 'turnovers' | 'fouls'
>): number {
  const positives = box.points + box.rebounds + box.assists + box.steals + box.blocks;
  const negatives =
    (box.fga - box.fgm) + (box.fta - box.ftm) + box.turnovers + Math.floor(box.fouls * 0.5);
  return positives - negatives;
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatClock(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function autoBalanceRotationMinutes(roster: Player[]): Player[] {
  const starters = roster.filter((p) => p.rosterSlot === 'starter');
  const bench = roster
    .filter((p) => p.rosterSlot === 'bench')
    .sort((a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99) || b.overall - a.overall);
  const active = [...starters, ...bench];

  if (active.length === 0) {
    return roster.map((p) => ({ ...p, targetMinutes: 0 }));
  }

  const benchOrderMap = new Map<string, number>();
  bench.forEach((p, idx) => benchOrderMap.set(p.id, idx));

  const weights = new Map<string, number>();
  let totalWeight = 0;
  for (const p of active) {
    const isStarter = p.rosterSlot === 'starter';
    const orderIdx = benchOrderMap.get(p.id) ?? 0;
    const base = isStarter ? 28 : Math.max(3, 14 - orderIdx * 1.8);
    const ovrFactor = 0.75 + Math.max(0, p.overall - 55) * 0.012;
    const condFactor = 0.8 + (p.condition / 100) * 0.25;
    const w = Math.max(1, base * ovrFactor * condFactor);
    weights.set(p.id, w);
    totalWeight += w;
  }

  const minutesMap = new Map<string, number>();
  let sum = 0;
  for (const p of active) {
    const raw = Math.round(((weights.get(p.id) ?? 1) / totalWeight) * 200);
    const clamped = Math.max(0, Math.min(40, raw));
    minutesMap.set(p.id, clamped);
    sum += clamped;
  }

  // Aggiusta il resto per arrivare esattamente a 200 minuti
  const orderedForAdjust = [...starters, ...bench].sort(
    (a, b) => (weights.get(b.id) ?? 0) - (weights.get(a.id) ?? 0)
  );
  let guard = 0;
  while (sum !== 200 && guard < 300) {
    guard += 1;
    let changed = false;
    for (const p of orderedForAdjust) {
      if (sum === 200) break;
      const cur = minutesMap.get(p.id) ?? 0;
      if (sum < 200 && cur < 40) {
        minutesMap.set(p.id, cur + 1);
        sum += 1;
        changed = true;
      } else if (sum > 200 && cur > 0) {
        minutesMap.set(p.id, cur - 1);
        sum -= 1;
        changed = true;
      }
    }
    if (!changed) break;
  }

  return roster.map((p) => {
    if (p.rosterSlot === 'reserve') {
      return { ...p, targetMinutes: 0 };
    }
    return {
      ...p,
      targetMinutes: minutesMap.get(p.id) ?? 0,
      benchOrder: p.rosterSlot === 'bench' ? benchOrderMap.get(p.id) ?? 0 : undefined,
    };
  });
}

export function autoFixRosterLineup(
  roster: Player[],
  leagueId?: LeagueId,
  lbaFormat: LbaRosterFormat = '6+6'
): Player[] {
  const { minIta, maxForeign, maxActive } = getForeignLimitForLeague(leagueId, lbaFormat);
  const healthy = roster.filter((p) => p.injuryWeeks === 0);
  const injured = roster.filter((p) => p.injuryWeeks > 0);
  const sorted = [...healthy].sort((a, b) => b.overall - a.overall);
  const itaHealthy = sorted.filter((p) => p.isItalianFormation);

  const selectedIds = new Set<string>();
  const activeList: Player[] = [];

  for (const p of itaHealthy.slice(0, Math.min(minIta, maxActive))) {
    activeList.push(p);
    selectedIds.add(p.id);
  }
  let currentForeign = 0;
  for (const p of sorted) {
    if (activeList.length >= maxActive) break;
    if (selectedIds.has(p.id)) continue;
    if (!p.isItalianFormation) {
      if (currentForeign >= maxForeign) continue;
      currentForeign += 1;
    }
    activeList.push(p);
    selectedIds.add(p.id);
  }

  const starterIds = new Set(activeList.slice(0, 5).map((p) => p.id));
  const benchIds = new Set(activeList.slice(5, maxActive).map((p) => p.id));

  const mapped = [...healthy, ...injured].map((p) => ({
    ...p,
    rosterSlot: starterIds.has(p.id)
      ? ('starter' as const)
      : benchIds.has(p.id)
      ? ('bench' as const)
      : ('reserve' as const),
  }));

  return normalizeTeamRotationSlots(mapped);
}

/**
 * Adatta automaticamente le rotazioni quando uno o più giocatori risultano infortunati:
 * sposta gli infortunati in tribuna (0 minuti), promuove i migliori sostituti sani
 * rispettando i limiti ITA/STR della lega e ribilancia i 200 minuti.
 */
export function autoAdjustRotationsForInjuries(
  roster: Player[],
  leagueId?: LeagueId,
  lbaFormat: LbaRosterFormat = '6+6'
): { roster: Player[]; changed: boolean; replacedNames: string[] } {
  const injuredActive = roster.filter(
    (p) => p.injuryWeeks > 0 && (p.rosterSlot !== 'reserve' || (p.targetMinutes ?? 0) > 0)
  );
  const healthyStarters = roster.filter(
    (p) => p.rosterSlot === 'starter' && p.injuryWeeks === 0
  );

  if (injuredActive.length === 0 && healthyStarters.length >= 5) {
    return { roster, changed: false, replacedNames: [] };
  }

  const replacedNames = injuredActive.map((p) => `${p.firstName[0]}. ${p.lastName}`);
  const { minIta, maxForeign, maxActive } = getForeignLimitForLeague(leagueId, lbaFormat);

  // 1. Sposta tutti gli infortunati in reserve con 0 minuti
  let nextRoster = roster.map((p) =>
    p.injuryWeeks > 0
      ? { ...p, rosterSlot: 'reserve' as const, targetMinutes: 0, benchOrder: undefined }
      : p
  );

  // 2. Se mancano titolari sani (< 5), promuovi dalla panchina (o dalle riserve sane conformi)
  const injuredStarterPositions = injuredActive
    .filter((p) => p.rosterSlot === 'starter')
    .map((p) => p.primaryPosition);

  let currentStarters = nextRoster.filter((p) => p.rosterSlot === 'starter' && p.injuryWeeks === 0);
  while (currentStarters.length < 5) {
    const neededPos = injuredStarterPositions.shift();
    const benchCandidates = nextRoster
      .filter((p) => p.rosterSlot === 'bench' && p.injuryWeeks === 0)
      .sort((a, b) => {
        const aMatch = neededPos && a.primaryPosition === neededPos ? 1 : 0;
        const bMatch = neededPos && b.primaryPosition === neededPos ? 1 : 0;
        if (bMatch !== aMatch) return bMatch - aMatch;
        return b.overall - a.overall;
      });

    const activeNow = nextRoster.filter((p) => p.rosterSlot !== 'reserve');
    const activeForeignNow = activeNow.filter((p) => !p.isItalianFormation).length;
    const activeItaNow = activeNow.filter((p) => p.isItalianFormation).length;
    const reserveCandidates = nextRoster
      .filter(
        (p) =>
          p.rosterSlot === 'reserve' &&
          p.injuryWeeks === 0 &&
          (p.isItalianFormation || activeForeignNow < maxForeign)
      )
      .sort((a, b) => {
        if (activeItaNow < minIta && a.isItalianFormation !== b.isItalianFormation) {
          return a.isItalianFormation ? -1 : 1;
        }
        return b.overall - a.overall;
      });

    const chosen = benchCandidates[0] ?? reserveCandidates[0];
    if (!chosen) break;
    nextRoster = nextRoster.map((p) =>
      p.id === chosen.id ? { ...p, rosterSlot: 'starter' as const, benchOrder: undefined } : p
    );
    currentStarters = nextRoster.filter((p) => p.rosterSlot === 'starter' && p.injuryWeeks === 0);
  }

  // 3. Riempi eventuali posti vuoti in panchina (fino a maxActive attivi) rispettando il limite ITA/STR
  let activePlayers = nextRoster.filter((p) => p.rosterSlot !== 'reserve');
  if (activePlayers.length < maxActive) {
    let foreignCount = activePlayers.filter((x) => !x.isItalianFormation).length;
    let itaCount = activePlayers.filter((x) => x.isItalianFormation).length;
    const reserveHealthy = nextRoster
      .filter((p) => p.rosterSlot === 'reserve' && p.injuryWeeks === 0)
      .sort((a, b) => {
        if (itaCount < minIta && a.isItalianFormation !== b.isItalianFormation) {
          return a.isItalianFormation ? -1 : 1;
        }
        return b.overall - a.overall;
      });
    for (const candidate of reserveHealthy) {
      if (activePlayers.length >= maxActive) break;
      if (
        !candidate.isItalianFormation &&
        (foreignCount >= maxForeign || (itaCount < minIta && maxActive - activePlayers.length <= minIta - itaCount))
      ) {
        continue;
      }
      nextRoster = nextRoster.map((p) =>
        p.id === candidate.id ? { ...p, rosterSlot: 'bench' as const } : p
      );
      if (candidate.isItalianFormation) itaCount += 1;
      else foreignCount += 1;
      activePlayers = nextRoster.filter((p) => p.rosterSlot !== 'reserve');
    }
  } else if (activePlayers.length > maxActive) {
    let toRemove = activePlayers.length - maxActive;
    let excessForeign = Math.max(
      0,
      activePlayers.filter((x) => !x.isItalianFormation).length - maxForeign
    );
    const demoteOrder = nextRoster
      .filter((p) => p.rosterSlot === 'bench')
      .sort((a, b) => {
        if (excessForeign > 0 && a.isItalianFormation !== b.isItalianFormation) {
          return a.isItalianFormation ? 1 : -1;
        }
        return a.overall - b.overall;
      });
    const demoteIds = new Set<string>();
    for (const cand of demoteOrder) {
      if (toRemove <= 0) break;
      demoteIds.add(cand.id);
      toRemove -= 1;
      if (!cand.isItalianFormation && excessForeign > 0) excessForeign -= 1;
    }
    nextRoster = nextRoster.map((p) =>
      demoteIds.has(p.id)
        ? { ...p, rosterSlot: 'reserve' as const, targetMinutes: 0, benchOrder: undefined }
        : p
    );
  }

  // 4. Normalizza slot e ribilancia i 200 minuti tra i giocatori sani attivi
  const balanced = normalizeTeamRotationSlots(autoBalanceRotationMinutes(nextRoster));
  return { roster: balanced, changed: true, replacedNames };
}

const ROTATION_POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export function normalizeTeamRotationSlots(roster: Player[]): Player[] {
  const starters = roster.filter((p) => p.rosterSlot === 'starter');
  const starterSlotById = new Map<string, Position>();
  const usedPos = new Set<Position>();

  for (const p of starters) {
    if (p.starterSlot && !usedPos.has(p.starterSlot)) {
      usedPos.add(p.starterSlot);
      starterSlotById.set(p.id, p.starterSlot);
    }
  }
  for (const p of starters) {
    if (starterSlotById.has(p.id)) continue;
    if (!usedPos.has(p.primaryPosition)) {
      usedPos.add(p.primaryPosition);
      starterSlotById.set(p.id, p.primaryPosition);
    }
  }
  for (const p of starters) {
    if (starterSlotById.has(p.id)) continue;
    if (p.secondaryPosition && !usedPos.has(p.secondaryPosition)) {
      usedPos.add(p.secondaryPosition);
      starterSlotById.set(p.id, p.secondaryPosition);
    }
  }
  for (const p of starters) {
    if (starterSlotById.has(p.id)) continue;
    const freePos = ROTATION_POSITIONS.find((pos) => !usedPos.has(pos));
    if (freePos) {
      usedPos.add(freePos);
      starterSlotById.set(p.id, freePos);
    }
  }

  const benchSorted = roster
    .filter((p) => p.rosterSlot === 'bench')
    .sort((a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99) || b.overall - a.overall);
  const benchOrderById = new Map(benchSorted.map((p, i) => [p.id, i]));

  return roster.map((p) => {
    if (p.rosterSlot === 'starter') {
      return {
        ...p,
        starterSlot: starterSlotById.get(p.id),
        benchOrder: undefined,
      };
    }
    if (p.rosterSlot === 'bench') {
      return {
        ...p,
        starterSlot: undefined,
        benchOrder: benchOrderById.get(p.id) ?? 0,
      };
    }
    return {
      ...p,
      starterSlot: undefined,
      benchOrder: undefined,
    };
  });
}
