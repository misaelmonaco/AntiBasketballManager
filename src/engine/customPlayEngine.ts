import {
  CourtActionType,
  CustomPlay,
  CustomPlayStep,
  PlayPassAction,
  PlayPassStyle,
  PlayPoint,
  PlayScreenAction,
  PlayScreenType,
  PlayShotStyle,
  Position,
} from '../types';
import {
  DEFAULT_HORNS_START_POSITIONS,
  PlayTemplateKey,
  buildRawPlayTemplate,
} from '../data/customPlayTemplates';

export type { PlayTemplateKey };

export const ALL_ROLES: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export const MIN_PLAY_STEPS = 2;
export const MAX_PLAY_STEPS = 8;
export const MAX_PLAY_PASSES = 8;
export const MAX_PLAY_SCREENS = 6;
export const CUSTOM_PLAY_MOVE_END = 0.76;

export const ROLE_NUMBERS: Record<Position, string> = {
  PG: '1',
  SG: '2',
  SF: '3',
  PF: '4',
  C: '5',
};

export interface PlayOptionMeta<T extends string> {
  value: T;
  label: string;
  desc: string;
}

export const PASS_STYLE_OPTIONS: PlayOptionMeta<PlayPassStyle>[] = [
  { value: 'diretto', label: 'Diretto (Teso)', desc: 'Passaggio rapido sul perimetro.' },
  { value: 'scarico', label: 'Scarico (Kick-Out)', desc: '+% al tiro piazzato sul perimetro.' },
  { value: 'schiacciato', label: 'Schiacciato a terra', desc: 'Riduce le perse nei passaggi dentro l’area.' },
  { value: 'handoff', label: 'Consegnato (Hand-Off)', desc: 'Passaggio mano a mano sicuro con blocco dinamico.' },
  { value: 'lob', label: 'Lob / Alley-Oop', desc: '+Finalizzazione al ferro, ma rischio palla persa più alto.' },
];

export const SCREEN_TYPE_OPTIONS: PlayOptionMeta<PlayScreenType>[] = [
  { value: 'on_ball', label: 'Sulla Palla (P&R)', desc: 'Blocco sul difensore del portatore di palla.' },
  { value: 'off_ball', label: 'Lontano dalla Palla', desc: 'Blocco pin-down/floppy per liberare il tiratore.' },
  { value: 'back_screen', label: 'Blocco Cieco', desc: 'Blocco alle spalle del difensore per taglio verso il ferro.' },
];

export const SHOT_STYLE_OPTIONS: PlayOptionMeta<PlayShotStyle>[] = [
  { value: 'auto', label: 'Automatico (da zona)', desc: 'Determinato dalla posizione finale sul campo.' },
  { value: 'catch_and_shoot', label: 'Ricevi e Tira', desc: 'Tiro rapido sugli scarichi (+precisione se servito).' },
  { value: 'pull_up', label: 'Dal Palleggio (Pull-Up)', desc: 'Arresto e tiro creando separazione.' },
  { value: 'drive_rim', label: 'Penetrazione al Ferro', desc: 'Attacco aggressivo al ferro (+falli subiti).' },
  { value: 'post_up', label: 'Gioco in Post', desc: 'Conclusione spalle a canestro nel pitturato (+falli).' },
];

export function clonePositions(pos: Record<Position, PlayPoint>): Record<Position, PlayPoint> {
  return {
    PG: { ...(pos.PG ?? { x: 60, y: 50 }) },
    SG: { ...(pos.SG ?? { x: 70, y: 20 }) },
    SF: { ...(pos.SF ?? { x: 70, y: 80 }) },
    PF: { ...(pos.PF ?? { x: 78, y: 34 }) },
    C: { ...(pos.C ?? { x: 78, y: 66 }) },
  };
}

function clamp01Local(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function clampStepIdx(val: number | undefined, lastIdx: number, fallback = 1): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? Math.round(val) : fallback;
  return Math.max(1, Math.min(lastIdx, n));
}

export function getEffectiveSteps(play: CustomPlay): CustomPlayStep[] {
  if (play.steps && play.steps.length >= MIN_PLAY_STEPS) {
    return play.steps.slice(0, MAX_PLAY_STEPS).map((st, idx) => ({
      id: st.id || `step_${idx}`,
      label: st.label,
      positions: clonePositions(st.positions),
    }));
  }
  return [
    { id: 'step_0', positions: clonePositions(play.positions.start) },
    { id: 'step_1', positions: clonePositions(play.positions.mid) },
    { id: 'step_2', positions: clonePositions(play.positions.end) },
  ];
}

export function getFinalStepPositions(play: CustomPlay): Record<Position, PlayPoint> {
  const steps = getEffectiveSteps(play);
  return steps[steps.length - 1].positions;
}

export function getEffectivePasses(play: CustomPlay): (PlayPassAction & { stepIndex: number })[] {
  const lastIdx = getEffectiveSteps(play).length - 1;
  if (play.passes !== undefined) {
    const normalized = play.passes
      .filter((p) => p && p.from !== p.to)
      .slice(0, MAX_PLAY_PASSES)
      .map((p, idx) => ({
        from: p.from,
        to: p.to,
        style: p.style ?? ('diretto' as PlayPassStyle),
        stepIndex: clampStepIdx(p.stepIndex, lastIdx, 1),
        _ord: idx,
      }));
    normalized.sort((a, b) => (a.stepIndex !== b.stepIndex ? a.stepIndex - b.stepIndex : a._ord - b._ord));
    return normalized.map(({ _ord: _, ...rest }) => rest);
  }
  const legacy: (PlayPassAction & { stepIndex: number })[] = [];
  if (play.passPhase1 && play.passPhase1.from !== play.passPhase1.to) {
    legacy.push({
      from: play.passPhase1.from,
      to: play.passPhase1.to,
      style: play.passPhase1.style ?? 'diretto',
      stepIndex: clampStepIdx(play.passPhase1.stepIndex, lastIdx, 1),
    });
  }
  if (play.passPhase2 && play.passPhase2.from !== play.passPhase2.to) {
    legacy.push({
      from: play.passPhase2.from,
      to: play.passPhase2.to,
      style: play.passPhase2.style ?? 'diretto',
      stepIndex: clampStepIdx(play.passPhase2.stepIndex, lastIdx, lastIdx),
    });
  }
  return legacy;
}

export function getEffectiveScreens(play: CustomPlay): (PlayScreenAction & { stepIndex: number })[] {
  const lastIdx = getEffectiveSteps(play).length - 1;
  if (play.screens !== undefined) {
    return play.screens.slice(0, MAX_PLAY_SCREENS).map((s) => {
      const stepIndex = clampStepIdx(s.stepIndex ?? (s.phase === 'end' ? lastIdx : 1), lastIdx, 1);
      return {
        screener: s.screener,
        target: s.target,
        type: s.type,
        stepIndex,
        phase: stepIndex === lastIdx ? ('end' as const) : ('mid' as const),
      };
    });
  }
  return play.screeners.slice(0, MAX_PLAY_SCREENS).map((screener) => ({
    screener,
    target: screener !== play.shooterRole ? play.shooterRole : undefined,
    type: 'off_ball' as PlayScreenType,
    stepIndex: 1,
    phase: lastIdx === 1 ? ('end' as const) : ('mid' as const),
  }));
}

export function getBallCarrierAtStep(play: CustomPlay, stepIndex: number): Position {
  let carrier: Position = play.initialBallHandler;
  for (const p of getEffectivePasses(play)) {
    if (p.stepIndex <= stepIndex) {
      carrier = p.to;
    }
  }
  return carrier;
}

export function syncCustomPlayFields(play: CustomPlay): CustomPlay {
  const steps = getEffectiveSteps(play);
  const lastIdx = steps.length - 1;
  const midIdx = Math.floor(lastIdx / 2);
  const passes = getEffectivePasses({ ...play, steps });
  const screens = getEffectiveScreens({ ...play, steps });

  const passPhase1 = passes.find((p) => p.stepIndex < lastIdx) ?? null;
  const passPhase2 = [...passes].reverse().find((p) => p.stepIndex === lastIdx) ?? null;

  return {
    ...play,
    steps,
    passes,
    screens,
    positions: {
      start: clonePositions(steps[0].positions),
      mid: clonePositions(steps[midIdx].positions),
      end: clonePositions(steps[lastIdx].positions),
    },
    screeners: Array.from(new Set(screens.map((s) => s.screener))),
    passPhase1,
    passPhase2,
  };
}

export function evaluateCustomPlayBallAt(
  play: CustomPlay,
  normT: number,
  getPos: (role: Position) => { x: number; y: number },
  hoop: { x: number; y: number },
  opts?: { isTurnover?: boolean; moveEnd?: number }
): {
  x: number;
  y: number;
  scale: number;
  trail?: [{ x: number; y: number }, { x: number; y: number }];
  phase: 'dribble' | 'pass' | 'shot' | 'post_shot';
  activeStepIndex: number;
} {
  const moveEnd = opts?.moveEnd ?? CUSTOM_PLAY_MOVE_END;
  const steps = getEffectiveSteps(play);
  const segCount = Math.max(1, steps.length - 1);
  const passes = getEffectivePasses(play);

  if (normT < moveEnd) {
    const segDur = moveEnd / segCount;
    const segIdx = Math.min(segCount - 1, Math.max(0, Math.floor(normT / segDur)));
    const segStart = segIdx * segDur;
    const segLocal = clamp01Local((normT - segStart) / segDur);
    const activeStepIndex = segIdx + 1;

    const carrierBefore = getBallCarrierAtStep(play, segIdx);
    const stepPasses = passes.filter((p) => p.stepIndex === activeStepIndex);

    if (stepPasses.length === 0 || segLocal < 0.3) {
      const pt = getPos(carrierBefore);
      return {
        x: pt.x,
        y: pt.y,
        scale: 1 + Math.abs(Math.sin(normT * 28)) * 0.12,
        phase: 'dribble',
        activeStepIndex,
      };
    }

    const passProgress = clamp01Local((segLocal - 0.3) / 0.7);
    const scaled = passProgress * stepPasses.length;
    const slotIdx = Math.min(stepPasses.length - 1, Math.floor(scaled));
    const slotT = clamp01Local(scaled - slotIdx);
    const activePass = stepPasses[slotIdx];

    if (slotT <= 0.82) {
      const pt = clamp01Local(slotT / 0.82);
      const fromPt = getPos(activePass.from);
      const toPt = getPos(activePass.to);
      const scale =
        activePass.style === 'lob'
          ? 1 + Math.sin(pt * Math.PI) * 0.52
          : activePass.style === 'schiacciato'
          ? 1 - Math.sin(pt * Math.PI) * 0.26
          : 1.05;
      return {
        x: fromPt.x + (toPt.x - fromPt.x) * pt,
        y: fromPt.y + (toPt.y - fromPt.y) * pt,
        scale,
        trail: [fromPt, toPt],
        phase: 'pass',
        activeStepIndex,
      };
    }

    const receiverPt = getPos(activePass.to);
    return {
      x: receiverPt.x,
      y: receiverPt.y,
      scale: 1,
      phase: 'dribble',
      activeStepIndex,
    };
  }

  if (opts?.isTurnover) {
    const holder = getBallCarrierAtStep(play, segCount);
    const pt = getPos(holder);
    return {
      x: pt.x,
      y: pt.y,
      scale: 1,
      phase: 'dribble',
      activeStepIndex: segCount,
    };
  }

  if (normT < 0.94) {
    const st = clamp01Local((normT - moveEnd) / (0.94 - moveEnd));
    const shooterPt = getPos(play.shooterRole);
    return {
      x: shooterPt.x + (hoop.x - shooterPt.x) * st,
      y: shooterPt.y + (hoop.y - shooterPt.y) * st,
      scale: 1 + Math.sin(st * Math.PI) * 0.58,
      phase: 'shot',
      activeStepIndex: segCount,
    };
  }

  return {
    x: hoop.x,
    y: hoop.y,
    scale: 1,
    phase: 'post_shot',
    activeStepIndex: segCount,
  };
}

export interface CustomPlayAnalysis {
  isThree: boolean;
  isCornerThree: boolean;
  isPaintOrRim: boolean;
  actionType: CourtActionType;
  shotZoneLabel: string;
  summaryBadge: string;
  stepCount: number;
  screenCount: number;
  passCount: number;
  passerRole?: Position;
  passCueLabel: string;
  shotQualityBonus: number;
  foulDrawBonus: number;
  turnoverRiskMod: number;
  extraDurationSec: number;
  bestAgainst: string;
}

const RIGHT_HOOP_X = 94.375;
const HOOP_Y = 50;

export function analyzeCustomPlay(play: CustomPlay): CustomPlayAnalysis {
  const steps = getEffectiveSteps(play);
  const stepCount = steps.length;
  const shotPt = getFinalStepPositions(play)[play.shooterRole] ?? { x: 75, y: 50 };
  const dxM = (RIGHT_HOOP_X - shotPt.x) * 0.28;
  const dyM = (shotPt.y - HOOP_Y) * 0.15;
  const distM = Math.hypot(dxM, dyM);

  const shotStyle = play.shotStyle ?? 'auto';
  const isCornerThree = shotPt.x >= 84 && Math.abs(shotPt.y - 50) >= 41.5;
  const rawIsThree = isCornerThree || distM >= 6.6;
  const isThree =
    shotStyle === 'drive_rim' || shotStyle === 'post_up' ? false : rawIsThree;
  const isPaintOrRim =
    shotStyle === 'drive_rim' ||
    shotStyle === 'post_up' ||
    (!isThree && (distM <= 2.9 || (shotPt.x >= 80 && Math.abs(shotPt.y - 50) <= 16)));

  let shooterTotalMoveDist = 0;
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1].positions[play.shooterRole] ?? shotPt;
    const curr = steps[i].positions[play.shooterRole] ?? shotPt;
    shooterTotalMoveDist += Math.hypot(curr.x - prev.x, curr.y - prev.y);
  }

  const effectiveScreens = getEffectiveScreens(play);
  const screenCount = effectiveScreens.length;
  const passes = getEffectivePasses(play);
  const passCount = passes.length;

  let passerRole: Position | undefined;
  let finalPassStyle: PlayPassStyle = 'diretto';
  const lastToShooter = [...passes]
    .reverse()
    .find((p) => p.to === play.shooterRole && p.from !== play.shooterRole);
  if (lastToShooter) {
    passerRole = lastToShooter.from;
    finalPassStyle = lastToShooter.style ?? 'diretto';
  } else {
    const endCarrier = getBallCarrierAtStep(play, steps.length - 1);
    if (endCarrier !== play.shooterRole) {
      passerRole = endCarrier;
      finalPassStyle = passes[passes.length - 1]?.style ?? 'diretto';
    } else if (play.initialBallHandler !== play.shooterRole) {
      passerRole = play.initialBallHandler;
      finalPassStyle = passes[passes.length - 1]?.style ?? 'diretto';
    }
  }

  let passCueLabel = 'su assist di';
  if (finalPassStyle === 'lob') passCueLabel = 'su alley-oop di';
  else if (finalPassStyle === 'handoff') passCueLabel = 'su consegnato di';
  else if (finalPassStyle === 'scarico') passCueLabel = 'su scarico di';
  else if (finalPassStyle === 'schiacciato') passCueLabel = 'su passaggio schiacciato di';

  let actionType: CourtActionType;
  let shotZoneLabel: string;
  if (isThree) {
    actionType = 'three_shot';
    if (isCornerThree) {
      shotZoneLabel = shotPt.y < 50 ? 'dall’angolo sinistro' : 'dall’angolo destro';
    } else if (Math.abs(shotPt.y - 50) <= 18) {
      shotZoneLabel = 'dalla punta';
    } else {
      shotZoneLabel = shotPt.y < 50 ? 'dall’ala sinistra' : 'dall’ala destra';
    }
  } else if (shotStyle === 'drive_rim') {
    actionType = 'drive';
    shotZoneLabel = 'in penetrazione al ferro';
  } else if (shotStyle === 'post_up') {
    actionType = 'post_up';
    shotZoneLabel = 'dal post basso';
  } else if (isPaintOrRim) {
    if (screenCount > 0 && (play.shooterRole === 'C' || play.shooterRole === 'PF' || play.shooterRole === 'PG')) {
      actionType = 'pick_and_roll';
    } else if (play.shooterRole === 'C' || (play.shooterRole === 'PF' && shooterTotalMoveDist < 12)) {
      actionType = 'post_up';
    } else {
      actionType = 'drive';
    }
    shotZoneLabel = distM <= 1.8 ? 'al ferro' : 'in area';
  } else {
    actionType =
      shotStyle === 'pull_up'
        ? 'two_shot'
        : screenCount > 0
        ? 'pick_and_roll'
        : 'two_shot';
    shotZoneLabel = shotStyle === 'pull_up' ? 'in arresto e tiro' : 'dalla media distanza';
  }

  const hasShooterScreen = effectiveScreens.some(
    (s) => s.target === play.shooterRole || s.screener !== play.shooterRole
  );
  const hasBackScreen = effectiveScreens.some((s) => s.type === 'back_screen');
  const hasOnBallScreen = effectiveScreens.some((s) => s.type === 'on_ball');

  let passBonus = 0;
  let turnoverRiskMod =
    passCount === 0
      ? -0.004
      : passCount === 1
      ? 0.004
      : passCount === 2
      ? 0.012
      : 0.012 + (passCount - 2) * 0.005;

  passes.forEach((ps, idx) => {
    const style = ps.style ?? 'diretto';
    const weight = 1 / (1 + idx * 0.25);
    if (style === 'scarico') {
      passBonus += (isThree ? 0.016 : 0.01) * weight;
    } else if (style === 'schiacciato') {
      passBonus += (isPaintOrRim ? 0.014 : 0.008) * weight;
      turnoverRiskMod -= 0.008;
    } else if (style === 'handoff') {
      passBonus += 0.014 * weight;
      turnoverRiskMod -= 0.006;
    } else if (style === 'lob') {
      passBonus += (isPaintOrRim ? 0.024 : 0.006) * weight;
      turnoverRiskMod += 0.016;
    } else {
      passBonus += 0.01 * weight;
    }
  });
  passBonus = Math.min(0.045, passBonus);
  turnoverRiskMod = Math.max(-0.025, Math.min(0.065, turnoverRiskMod));

  const shotStyleBonus =
    shotStyle === 'catch_and_shoot' && passCount > 0
      ? 0.015
      : shotStyle === 'pull_up' && !isThree
      ? 0.008
      : 0;

  const rawQuality =
    (hasShooterScreen ? 0.016 : screenCount > 0 ? 0.01 : 0) +
    (hasBackScreen && isPaintOrRim ? 0.01 : 0) +
    (hasOnBallScreen ? 0.008 : 0) +
    passBonus +
    shotStyleBonus +
    (shooterTotalMoveDist >= 10 ? 0.006 : 0) +
    (stepCount >= 4 && shooterTotalMoveDist >= 22 ? 0.005 : 0) -
    (screenCount > 3 ? 0.008 : 0);
  const shotQualityBonus = Math.min(0.07, Math.max(0, Number(rawQuality.toFixed(4))));

  const foulDrawBonus =
    shotStyle === 'drive_rim'
      ? 0.028
      : shotStyle === 'post_up'
      ? 0.02
      : isPaintOrRim
      ? 0.01
      : 0;

  const extraDurationSec = Math.min(
    7.5,
    Number((screenCount * 0.75 + passCount * 0.7 + Math.max(0, stepCount - 3) * 0.85).toFixed(2))
  );

  let bestAgainst = 'Difesa a Uomo';
  if (isCornerThree) bestAgainst = 'Efficace vs Zona 2-3';
  else if (isPaintOrRim || hasBackScreen) bestAgainst = 'Efficace vs Zona 3-2 & Cambio';
  else if (isThree) bestAgainst = 'Efficace vs Proteggi Area';

  const summaryBadge = isThree
    ? isCornerThree
      ? 'Tripla d’Angolo'
      : 'Tripla Perimetrale'
    : shotStyle === 'drive_rim'
    ? 'Penetrazione al Ferro'
    : shotStyle === 'post_up' || actionType === 'post_up'
    ? 'Gioco in Post / Area'
    : isPaintOrRim
    ? 'Taglio / Ferro'
    : 'Uscita dalla Media';

  return {
    isThree,
    isCornerThree,
    isPaintOrRim,
    actionType,
    shotZoneLabel,
    summaryBadge,
    stepCount,
    screenCount,
    passCount,
    passerRole,
    passCueLabel,
    shotQualityBonus,
    foulDrawBonus,
    turnoverRiskMod: Number(turnoverRiskMod.toFixed(4)),
    extraDurationSec,
    bestAgainst,
  };
}

export function createCustomPlayFromTemplate(
  templateKey: PlayTemplateKey,
  customName?: string
): CustomPlay {
  const id = `cplay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return syncCustomPlayFields(buildRawPlayTemplate(templateKey, id, customName));
}

function isValidRole(val: unknown): val is Position {
  return val === 'PG' || val === 'SG' || val === 'SF' || val === 'PF' || val === 'C';
}

function isValidPassStyle(val: unknown): val is PlayPassStyle {
  return (
    val === 'diretto' ||
    val === 'scarico' ||
    val === 'schiacciato' ||
    val === 'handoff' ||
    val === 'lob'
  );
}

function isValidScreenType(val: unknown): val is PlayScreenType {
  return val === 'on_ball' || val === 'off_ball' || val === 'back_screen';
}

function isValidShotStyle(val: unknown): val is PlayShotStyle {
  return (
    val === 'auto' ||
    val === 'catch_and_shoot' ||
    val === 'pull_up' ||
    val === 'drive_rim' ||
    val === 'post_up'
  );
}

function normalizePlayPoint(pt: unknown, fallback: PlayPoint): PlayPoint {
  if (!pt || typeof pt !== 'object') return fallback;
  const x = Number((pt as PlayPoint).x);
  const y = Number((pt as PlayPoint).y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return fallback;
  return {
    x: Math.max(52, Math.min(96, Number(x.toFixed(1)))),
    y: Math.max(4, Math.min(96, Number(y.toFixed(1)))),
  };
}

function isPlayLikeObject(val: unknown): val is Partial<CustomPlay> {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return false;
  const obj = val as Partial<CustomPlay>;
  return (
    obj.positions !== undefined ||
    obj.steps !== undefined ||
    (typeof obj.name === 'string' && obj.name.trim().length > 0) ||
    isValidRole(obj.shooterRole)
  );
}

export function migrateCustomPlay(
  raw: Partial<CustomPlay>,
  fallbackIdx = 0,
  preserveId = false
): CustomPlay {
  const id =
    preserveId && typeof raw.id === 'string' && raw.id.trim().length > 0
      ? raw.id.trim()
      : `cplay_${Date.now()}_${fallbackIdx}_${Math.random().toString(36).slice(2, 5)}`;

  const name =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim().slice(0, 36)
      : `Schema ${fallbackIdx + 1}`;

  const steps: CustomPlayStep[] = [];
  if (Array.isArray(raw.steps) && raw.steps.length >= MIN_PLAY_STEPS) {
    const rawSlice = raw.steps.slice(0, MAX_PLAY_STEPS);
    for (let sIdx = 0; sIdx < rawSlice.length; sIdx++) {
      const rawStep = rawSlice[sIdx];
      const stepObj = (rawStep && typeof rawStep === 'object' ? rawStep : {}) as Partial<CustomPlayStep>;
      const prevFallback = sIdx > 0 ? steps[sIdx - 1].positions : DEFAULT_HORNS_START_POSITIONS;
      const stepPos = {} as Record<Position, PlayPoint>;
      for (const role of ALL_ROLES) {
        stepPos[role] = normalizePlayPoint(
          stepObj.positions?.[role],
          prevFallback[role] ?? DEFAULT_HORNS_START_POSITIONS[role]
        );
      }
      steps.push({
        id: typeof stepObj.id === 'string' && stepObj.id.trim() ? stepObj.id : `step_${sIdx}`,
        label: typeof stepObj.label === 'string' ? stepObj.label : undefined,
        positions: stepPos,
      });
    }
  } else {
    const start = {} as Record<Position, PlayPoint>;
    const mid = {} as Record<Position, PlayPoint>;
    const end = {} as Record<Position, PlayPoint>;
    for (const role of ALL_ROLES) {
      start[role] = normalizePlayPoint(
        raw.positions?.start?.[role],
        DEFAULT_HORNS_START_POSITIONS[role]
      );
      mid[role] = normalizePlayPoint(raw.positions?.mid?.[role], start[role]);
      end[role] = normalizePlayPoint(raw.positions?.end?.[role], mid[role]);
    }
    steps.push(
      { id: 'step_0', positions: start },
      { id: 'step_1', positions: mid },
      { id: 'step_2', positions: end }
    );
  }

  const lastStepIdx = steps.length - 1;

  const rawScreens: PlayScreenAction[] | undefined = Array.isArray(raw.screens)
    ? raw.screens
        .filter(
          (s): s is PlayScreenAction =>
            Boolean(s) && typeof s === 'object' && isValidRole(s.screener)
        )
        .slice(0, MAX_PLAY_SCREENS)
        .map((s) => {
          const stepIndex = clampStepIdx(
            s.stepIndex,
            lastStepIdx,
            s.phase === 'end' ? lastStepIdx : 1
          );
          return {
            screener: s.screener,
            target: isValidRole(s.target) && s.target !== s.screener ? s.target : undefined,
            type: isValidScreenType(s.type) ? s.type : 'off_ball',
            phase: stepIndex === lastStepIdx ? ('end' as const) : ('mid' as const),
            stepIndex,
          };
        })
    : undefined;

  const screeners = rawScreens
    ? Array.from(new Set(rawScreens.map((s) => s.screener)))
    : Array.isArray(raw.screeners)
    ? raw.screeners.filter(isValidRole).slice(0, MAX_PLAY_SCREENS)
    : [];

  const passPhase1 =
    raw.passPhase1 &&
    isValidRole(raw.passPhase1.from) &&
    isValidRole(raw.passPhase1.to) &&
    raw.passPhase1.from !== raw.passPhase1.to
      ? {
          from: raw.passPhase1.from,
          to: raw.passPhase1.to,
          style: isValidPassStyle(raw.passPhase1.style) ? raw.passPhase1.style : 'diretto',
          stepIndex: clampStepIdx(raw.passPhase1.stepIndex, lastStepIdx, 1),
        }
      : null;

  const passPhase2 =
    raw.passPhase2 &&
    isValidRole(raw.passPhase2.from) &&
    isValidRole(raw.passPhase2.to) &&
    raw.passPhase2.from !== raw.passPhase2.to
      ? {
          from: raw.passPhase2.from,
          to: raw.passPhase2.to,
          style: isValidPassStyle(raw.passPhase2.style) ? raw.passPhase2.style : 'diretto',
          stepIndex: clampStepIdx(raw.passPhase2.stepIndex, lastStepIdx, lastStepIdx),
        }
      : null;

  const passes: PlayPassAction[] | undefined = Array.isArray(raw.passes)
    ? raw.passes
        .filter(
          (p): p is PlayPassAction =>
            Boolean(p) &&
            typeof p === 'object' &&
            isValidRole(p.from) &&
            isValidRole(p.to) &&
            p.from !== p.to
        )
        .slice(0, MAX_PLAY_PASSES)
        .map((p) => ({
          from: p.from,
          to: p.to,
          style: isValidPassStyle(p.style) ? p.style : 'diretto',
          stepIndex: clampStepIdx(p.stepIndex, lastStepIdx, 1),
        }))
    : undefined;

  const startPt = steps[0].positions;
  const midPt = steps[Math.floor(lastStepIdx / 2)].positions;
  const endPt = steps[lastStepIdx].positions;

  return syncCustomPlayFields({
    id,
    name,
    active: raw.active !== false,
    initialBallHandler: isValidRole(raw.initialBallHandler) ? raw.initialBallHandler : 'PG',
    positions: {
      start: clonePositions(startPt),
      mid: clonePositions(midPt),
      end: clonePositions(endPt),
    },
    steps,
    screeners,
    screens: rawScreens,
    passPhase1,
    passPhase2,
    passes,
    shooterRole: isValidRole(raw.shooterRole) ? raw.shooterRole : 'SG',
    shotStyle: isValidShotStyle(raw.shotStyle) ? raw.shotStyle : 'auto',
  });
}

export function parseImportedCustomPlaysJson(rawJson: string): {
  plays: CustomPlay[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    let arr: unknown[] = [];
    if (Array.isArray(parsed)) {
      arr = parsed;
    } else if (parsed && typeof parsed === 'object') {
      const container = parsed as { customPlays?: unknown; plays?: unknown };
      if (Array.isArray(container.customPlays)) {
        arr = container.customPlays;
      } else if (Array.isArray(container.plays)) {
        arr = container.plays;
      } else {
        arr = [parsed];
      }
    }

    const plays: CustomPlay[] = [];
    for (let idx = 0; idx < arr.length; idx++) {
      const item = arr[idx];
      if (!isPlayLikeObject(item)) continue;
      plays.push(migrateCustomPlay(item, idx, false));
    }

    if (plays.length === 0) {
      return { plays: [], error: 'Nessuno schema valido trovato nel JSON.' };
    }
    return { plays };
  } catch {
    return { plays: [], error: 'Formato JSON non valido.' };
  }
}

/**
 * Disegna una mezza campo FIBA d'attacco verso destra (coordinate x: 50..100, y: 0..100)
 * e restituisce le funzioni di proiezione bidirezionale pixel <-> coordinate normalizzate.
 */
export function drawFibaHalfCourtFloor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pad: number,
  theme: 'parquet' | 'tactical'
): {
  hoopPx: { x: number; y: number };
  toPx: (pt: PlayPoint) => { px: number; py: number };
  fromPx: (px: number, py: number) => PlayPoint;
} {
  const cw = w - pad * 2;
  const ch = h - pad * 2;
  const midY = pad + ch / 2;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, h);

  if (theme === 'parquet') {
    const grad = ctx.createLinearGradient(pad, pad, pad, pad + ch);
    grad.addColorStop(0, '#b57b45');
    grad.addColorStop(0.5, '#c98e55');
    grad.addColorStop(1, '#a66d38');
    ctx.fillStyle = grad;
    ctx.fillRect(pad, pad, cw, ch);

    ctx.strokeStyle = 'rgba(0,0,0,0.065)';
    ctx.lineWidth = 1;
    for (let y = pad + 14; y < pad + ch; y += 14) {
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + cw, y);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(pad, pad, cw, ch);

    // Griglia leggera lavagna
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      const gx = pad + (cw * i) / 10;
      ctx.beginPath();
      ctx.moveTo(gx, pad);
      ctx.lineTo(gx, pad + ch);
      ctx.stroke();
      const gy = pad + (ch * i) / 10;
      ctx.beginPath();
      ctx.moveTo(pad, gy);
      ctx.lineTo(pad + cw, gy);
      ctx.stroke();
    }
  }

  const lineColor = theme === 'parquet' ? '#f8fafc' : 'rgba(226, 232, 240, 0.8)';
  const paintColor =
    theme === 'parquet' ? 'rgba(234, 88, 12, 0.28)' : 'rgba(249, 115, 22, 0.14)';

  const toPx = (pt: PlayPoint) => ({
    px: pad + ((pt.x - 50) / 50) * cw,
    py: pad + (pt.y / 100) * ch,
  });

  const fromPx = (px: number, py: number): PlayPoint => ({
    x: Math.max(52, Math.min(96, Number((50 + ((px - pad) / cw) * 50).toFixed(1)))),
    y: Math.max(4, Math.min(96, Number((((py - pad) / ch) * 100).toFixed(1)))),
  });

  // Perimetro mezza campo
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, cw, ch);

  // Semicerchio metà campo a sinistra
  ctx.beginPath();
  ctx.arc(pad, midY, ch * 0.13, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Area dei 3 secondi (5.8m su 14m)
  const keyW = cw * (5.8 / 14);
  const keyH = ch * (4.9 / 15);
  const keyX = pad + cw - keyW;
  const keyY = midY - keyH / 2;

  ctx.fillStyle = paintColor;
  ctx.fillRect(keyX, keyY, keyW, keyH);
  ctx.strokeRect(keyX, keyY, keyW, keyH);

  // Semicerchio tiro libero
  ctx.beginPath();
  ctx.arc(keyX, midY, keyH / 2, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.stroke();

  // Arco da 3 punti FIBA
  const hoopPx = {
    x: pad + cw * (1 - 1.575 / 14),
    y: midY,
  };
  const threeR = ch * (6.75 / 15);
  const threeDy = ch * (6.6 / 15);
  const cornerYTop = midY - threeDy;
  const cornerYBot = midY + threeDy;
  const threeAngle = Math.asin(threeDy / threeR);
  const threeDx = Math.sqrt(threeR * threeR - threeDy * threeDy);

  ctx.beginPath();
  ctx.moveTo(pad + cw, cornerYBot);
  ctx.lineTo(hoopPx.x - threeDx, cornerYBot);
  ctx.arc(hoopPx.x, midY, threeR, Math.PI - threeAngle, Math.PI + threeAngle, false);
  ctx.lineTo(pad + cw, cornerYTop);
  ctx.stroke();

  // Tabellone e ferro
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pad + cw * (1 - 1.2 / 14), midY - 16);
  ctx.lineTo(pad + cw * (1 - 1.2 / 14), midY + 16);
  ctx.stroke();

  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(hoopPx.x, midY, 6, 0, Math.PI * 2);
  ctx.stroke();

  return { hoopPx, toPx, fromPx };
}
