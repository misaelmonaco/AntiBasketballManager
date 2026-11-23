import { DefenseType, MatchState, OffensivePlayId, PlayerBoxScore, Position } from '../types';
import {
  ALL_ROLES,
  CUSTOM_PLAY_MOVE_END,
  evaluateCustomPlayBallAt,
  getBallCarrierAtStep,
  getEffectiveScreens,
  getEffectiveSteps,
} from './customPlayEngine';

export interface Vec2 {
  x: number; // 0..100
  y: number; // 0..100
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function quadBezier(p0: Vec2, p1: Vec2, p2: Vec2, t: number): Vec2 {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function clampCoord(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const PLAY_LABELS: Record<OffensivePlayId, string> = {
  pick_and_roll_centrale: 'Pick & Roll Centrale',
  horns: 'Horns (Corna)',
  spain_pnr: 'Spain Pick & Roll',
  floppy: 'Floppy / Staggered',
  drive_kick_3pt: 'Drive & Kick 3PT',
  high_low: 'High-Low Post',
  transizione: 'Transizione 3 Corsie',
};

function resolveActorIndex(
  players: PlayerBoxScore[],
  targetId: string | undefined,
  fallback: number
): number {
  if (targetId) {
    const idx = players.findIndex((p) => p.playerId === targetId);
    if (idx !== -1) return idx;
  }
  return Math.min(Math.max(0, fallback), Math.max(0, players.length - 1));
}

function getSelectedVariant(match: MatchState): number {
  const v = match.visual;
  const attTeam = v.attackSide === 'home' ? match.home : match.away;
  const playbook = attTeam.tactics.playbook;
  if (playbook && playbook.length > 0) {
    const pick = playbook[match.possessionCount % playbook.length];
    if (v.actionType === 'pick_and_roll') {
      if (pick === 'horns') return 1;
      if (pick === 'spain_pnr') return 2;
      if (pick === 'pick_and_roll_centrale') return 0;
    }
    if (v.actionType === 'three_shot') {
      if (pick === 'floppy') return 1;
      if (pick === 'drive_kick_3pt') return 0;
    }
  }
  return match.possessionCount % 3;
}

export function getActiveSchemeName(match: MatchState): string {
  const v = match.visual;
  const attTeam = v.attackSide === 'home' ? match.home : match.away;
  if (v.customPlayId) {
    const custom = attTeam.tactics.customPlays?.find((p) => p.id === v.customPlayId);
    if (custom) return `★ ${custom.name}`;
  }
  const offFocus = attTeam.tactics.offensiveFocus;
  const playbook = attTeam.tactics.playbook;
  const variant = getSelectedVariant(match);
  const inCorner = v.ballY <= 15 || v.ballY >= 85;

  switch (v.actionType) {
    case 'pick_and_roll':
      if (variant === 1) return PLAY_LABELS.horns;
      if (variant === 2) return PLAY_LABELS.spain_pnr;
      if (match.possessionCount % 4 === 3) return 'Pick & Pop';
      return offFocus === 'Pick & Roll' ? PLAY_LABELS.pick_and_roll_centrale : 'Pick & Roll';
    case 'three_shot':
      if (offFocus === 'Motion' && variant === 2) return 'Motion Extrapass 3PT';
      if (inCorner && variant === 0) return 'Hammer / Angolo';
      if (variant === 1) return PLAY_LABELS.floppy;
      if (variant === 2) return 'Extra Pass Perimetrale';
      return PLAY_LABELS.drive_kick_3pt;
    case 'two_shot':
      if (offFocus === 'Motion') return 'Motion Tagli & Uscite';
      if (offFocus === 'Isolamento') return 'Isolamento Midrange';
      return variant === 1 ? 'Uscita dai Blocchi Mid' : 'Pull-Up Midrange';
    case 'drive':
      if (offFocus === 'Isolamento') return 'Isolamento 1vs1 al Ferro';
      return variant === 1 ? 'Taglio Backdoor' : 'Isolamento & Penetrazione';
    case 'post_up':
      return playbook?.includes('high_low') || variant !== 0
        ? PLAY_LABELS.high_low
        : 'Isolamento Post Basso';
    case 'fastbreak':
      return PLAY_LABELS.transizione;
    case 'steal':
      return 'Recupero Difensivo';
    case 'turnover':
      return 'Palla Persa';
    case 'freethrow':
      return 'Tiri Liberi';
    case 'timeout':
      return 'Timeout';
    default:
      return 'Circolazione Palla';
  }
}

function buildAlignment(
  templateIdx: number,
  fx: (xFromLeft: number) => number,
  fy: (y: number) => number
): Vec2[] {
  switch (templateIdx % 4) {
    case 0: // Horns (1-4 High)
      return [
        { x: fx(62), y: fy(50) },
        { x: fx(90), y: fy(11) },
        { x: fx(90), y: fy(89) },
        { x: fx(74), y: fy(34) },
        { x: fx(74), y: fy(66) },
      ];
    case 1: // 4-Out 1-In
      return [
        { x: fx(62), y: fy(42) },
        { x: fx(73), y: fy(15) },
        { x: fx(90), y: fy(87) },
        { x: fx(70), y: fy(76) },
        { x: fx(85), y: fy(58) },
      ];
    case 2: // 5-Out Motion
      return [
        { x: fx(63), y: fy(50) },
        { x: fx(72), y: fy(18) },
        { x: fx(89), y: fy(12) },
        { x: fx(72), y: fy(82) },
        { x: fx(89), y: fy(88) },
      ];
    default: // 2-1-2 Post Split
      return [
        { x: fx(64), y: fy(36) },
        { x: fx(66), y: fy(68) },
        { x: fx(89), y: fy(13) },
        { x: fx(78), y: fy(50) },
        { x: fx(87), y: fy(62) },
      ];
  }
}

function buildDefenseForScheme(
  offPos: Vec2[],
  defScheme: DefenseType,
  fx: (xFromLeft: number) => number,
  hoopX: number,
  hoopY: number,
  ballCarrierIdx: number,
  phaseProgress: number
): Vec2[] {
  if (defScheme === 'Zona 2-3') {
    const anchors: Vec2[] = [
      { x: fx(73), y: 38 },
      { x: fx(73), y: 62 },
      { x: fx(87), y: 24 },
      { x: fx(87), y: 76 },
      { x: fx(89), y: 50 },
    ];
    const focus = offPos[ballCarrierIdx] ?? { x: fx(75), y: 50 };
    return anchors.map((a, idx) => ({
      x: lerp(a.x, focus.x, idx === 4 ? 0.14 : 0.22 * phaseProgress),
      y: lerp(a.y, focus.y, idx === 4 ? 0.12 : 0.22 * phaseProgress),
    }));
  }

  if (defScheme === 'Zona 3-2') {
    const anchors: Vec2[] = [
      { x: fx(69), y: 50 },
      { x: fx(75), y: 24 },
      { x: fx(75), y: 76 },
      { x: fx(86), y: 36 },
      { x: fx(86), y: 64 },
    ];
    const focus = offPos[ballCarrierIdx] ?? { x: fx(75), y: 50 };
    return anchors.map((a) => ({
      x: lerp(a.x, focus.x, 0.2 * phaseProgress),
      y: lerp(a.y, focus.y, 0.2 * phaseProgress),
    }));
  }

  if (defScheme === 'Zona 1-3-1') {
    const anchors: Vec2[] = [
      { x: fx(66), y: 50 },
      { x: fx(74), y: 22 },
      { x: fx(77), y: 50 },
      { x: fx(74), y: 78 },
      { x: fx(89), y: 50 },
    ];
    const focus = offPos[ballCarrierIdx] ?? { x: fx(75), y: 50 };
    return anchors.map((a, idx) => ({
      x: lerp(a.x, focus.x, idx === 4 ? 0.1 : 0.22 * phaseProgress),
      y: lerp(a.y, focus.y, idx === 4 ? 0.35 : 0.22 * phaseProgress),
    }));
  }

  if (defScheme === 'Box-and-One') {
    const boxAnchors: Vec2[] = [
      { x: fx(74), y: 34 },
      { x: fx(74), y: 66 },
      { x: fx(86), y: 34 },
      { x: fx(86), y: 66 },
    ];
    const focus = offPos[ballCarrierIdx] ?? { x: fx(75), y: 50 };
    const boxPos = boxAnchors.map((a) => ({
      x: lerp(a.x, focus.x, 0.16 * phaseProgress),
      y: lerp(a.y, focus.y, 0.16 * phaseProgress),
    }));
    const dx = hoopX - focus.x;
    const dy = hoopY - focus.y;
    const chaser = {
      x: clampCoord(focus.x + dx * 0.15, 6, 94),
      y: clampCoord(focus.y + dy * 0.15, 7, 93),
    };
    return [...boxPos, chaser];
  }

  const tightFactor =
    defScheme === 'Pressing'
      ? 0.85
      : defScheme === 'Cambio Sistematico'
      ? 0.78
      : 0.72;
  return offPos.map((op, i) => {
    const gap = i === ballCarrierIdx ? 0.16 : 0.24 * (1 / tightFactor);
    const dx = hoopX - op.x;
    const dy = hoopY - op.y;
    return {
      x: clampCoord(op.x + dx * gap, 6, 94),
      y: clampCoord(op.y + dy * gap, 7, 93),
    };
  });
}

function makeMissedRimBounce(
  hoopX: number,
  hoopY: number,
  shooterPos: Vec2,
  fx: (xFromLeft: number) => number,
  rt: number
): Vec2 {
  const rebX = fx(83);
  const rebY = shooterPos.y < 50 ? 60 : 40;
  return {
    x: lerp(hoopX, rebX, rt),
    y: lerp(hoopY, rebY, rt),
  };
}

export interface PlayKeyframes {
  offStart: Vec2[];
  offMid: Vec2[];
  offEnd: Vec2[];
  defStart: Vec2[];
  defMid: Vec2[];
  defEnd: Vec2[];
  offFrames?: Vec2[][];
  defFrames?: Vec2[][];
  ballAt: (t: number, offPos: Vec2[], defPos: Vec2[]) => { x: number; y: number; scale: number; trail?: Vec2[] };
  screenMarker?: { x: number; y: number; active: boolean };
  screenMarkers?: { x: number; y: number; tStart: number; tEnd: number }[];
  rimFlash?: 'made' | 'miss' | null;
}

/**
 * Calcola le posizioni target (start -> mid -> end) per tutti i 10 giocatori in campo e la palla,
 * utilizzando i veri ID di tiratore/assistman, le coordinate reali del tiro e rotazioni difensive.
 */
export function computePlayKeyframes(match: MatchState): PlayKeyframes {
  const v = match.visual;
  const attackRight = v.attackSide === 'home';
  const fx = (xFromLeft: number) => (attackRight ? xFromLeft : 100 - xFromLeft);
  const hoopX = fx(94.5);
  const hoopY = 50;

  const attTeam = attackRight ? match.home : match.away;
  const defTeam = attackRight ? match.away : match.home;
  const defScheme = defTeam.tactics.defense;
  const attPlayers = attTeam.players.filter((p) => p.onCourt).slice(0, 5);
  const variant = getSelectedVariant(match);

  const shotSpot: Vec2 = {
    x: clampCoord(v.ballX, 5, 95),
    y: clampCoord(v.ballY, 6, 94),
  };

  const flipY = shotSpot.y === 50 ? match.possessionCount % 2 === 1 : shotSpot.y > 50;
  const fy = (y: number) => (flipY ? 100 - y : y);

  // 0. SCHEMA PERSONALIZZATO DISEGNATO DALL'UTENTE
  if (v.customPlayId) {
    const customPlay = attTeam.tactics.customPlays?.find((cp) => cp.id === v.customPlayId);
    if (customPlay) {
      // Mappa ogni ruolo PG..C ad un indice univoco [0..4] tra i 5 giocatori in campo
      const roleToIdx = {} as Record<Position, number>;
      const usedIndices = new Set<number>();
      for (const role of ALL_ROLES) {
        const matchIdx = attPlayers.findIndex(
          (p, i) => !usedIndices.has(i) && p.position === role
        );
        if (matchIdx !== -1) {
          roleToIdx[role] = matchIdx;
          usedIndices.add(matchIdx);
        }
      }
      for (const role of ALL_ROLES) {
        if (roleToIdx[role] === undefined) {
          const freeIdx = [0, 1, 2, 3, 4].find((i) => !usedIndices.has(i)) ?? 0;
          roleToIdx[role] = freeIdx;
          usedIndices.add(freeIdx);
        }
      }

      const steps = getEffectiveSteps(customPlay);
      const segCount = Math.max(1, steps.length - 1);
      const offFrames: Vec2[][] = steps.map((st) => {
        const frame: Vec2[] = Array.from({ length: 5 }, () => ({ x: fx(70), y: 50 }));
        for (const role of ALL_ROLES) {
          const idx = roleToIdx[role];
          const pt = st.positions[role];
          frame[idx] = { x: fx(pt.x), y: pt.y };
        }
        return frame;
      });

      const initIdx = roleToIdx[customPlay.initialBallHandler] ?? 0;
      const shootIdx = roleToIdx[customPlay.shooterRole] ?? initIdx;
      const defFrames: Vec2[][] = offFrames.map((offFrame, fIdx) => {
        const carrierRole = getBallCarrierAtStep(customPlay, fIdx);
        const carrierIdx = roleToIdx[carrierRole] ?? initIdx;
        return buildDefenseForScheme(
          offFrame,
          defScheme,
          fx,
          hoopX,
          hoopY,
          carrierIdx,
          fIdx / segCount
        );
      });

      const midFrameIdx = Math.floor((offFrames.length - 1) / 2);
      const offStart = offFrames[0];
      const offMid = offFrames[midFrameIdx];
      const offEnd = offFrames[offFrames.length - 1];
      const defStart = defFrames[0];
      const defMid = defFrames[midFrameIdx];
      const defEnd = defFrames[defFrames.length - 1];

      const effectiveScreens = getEffectiveScreens(customPlay);
      const segDur = CUSTOM_PLAY_MOVE_END / segCount;
      const screenMarkers = effectiveScreens.map((sc) => {
        const sIdx = roleToIdx[sc.screener] ?? 0;
        const frameIdx = Math.min(offFrames.length - 1, sc.stepIndex);
        const segIdx = Math.max(0, sc.stepIndex - 1);
        const markerPos = offFrames[frameIdx][sIdx] ?? offEnd[sIdx];
        return {
          x: markerPos.x,
          y: markerPos.y,
          tStart: segIdx * segDur + 0.12 * segDur,
          tEnd: Math.min(0.9, (segIdx + 1) * segDur + 0.12 * segDur),
        };
      });
      const firstScreenMarker = screenMarkers[0];
      const isTurn = v.actionType === 'turnover' || v.actionType === 'steal';

      return {
        offStart,
        offMid,
        offEnd,
        defStart,
        defMid,
        defEnd,
        offFrames,
        defFrames,
        screenMarkers,
        screenMarker: firstScreenMarker
          ? { x: firstScreenMarker.x, y: firstScreenMarker.y, active: true }
          : undefined,
        rimFlash: isTurn ? null : v.made ? 'made' : 'miss',
        ballAt: (t, offPos) => {
          const res = evaluateCustomPlayBallAt(
            customPlay,
            t,
            (r) => offPos[roleToIdx[r]] ?? offPos[initIdx] ?? { x: fx(70), y: 50 },
            { x: hoopX, y: hoopY },
            { isTurnover: isTurn, moveEnd: CUSTOM_PLAY_MOVE_END }
          );
          if (res.phase === 'post_shot' && !isTurn && !v.made) {
            const shooterPos = offPos[shootIdx] ?? shotSpot;
            return {
              ...makeMissedRimBounce(
                hoopX,
                hoopY,
                shooterPos,
                fx,
                clamp01((t - 0.94) / 0.06)
              ),
              scale: 1,
            };
          }
          return {
            x: res.x,
            y: res.y,
            scale: res.phase === 'post_shot' && v.made ? 0.9 : res.scale,
            trail: res.trail,
          };
        },
      };
    }
  }

  const shooterIdx = resolveActorIndex(
    attPlayers,
    v.shooterId,
    match.possessionCount % 5
  );
  let passerIdx = resolveActorIndex(
    attPlayers,
    v.passerId,
    shooterIdx === 0 ? 1 : 0
  );
  if (passerIdx === shooterIdx && attPlayers.length > 1) {
    passerIdx = shooterIdx === 0 ? 1 : 0;
  }

  const baseOff = buildAlignment(match.possessionCount + variant, fx, fy);

  // Helper per animare gli altri compagni fuori palla verso spaziature dinamiche / tagli
  const animateTeammates = (
    start: Vec2[],
    customMid: Partial<Record<number, Vec2>>,
    customEnd: Partial<Record<number, Vec2>>
  ): { mid: Vec2[]; end: Vec2[] } => {
    const mid = start.map((p, idx) => {
      if (customMid[idx]) return customMid[idx]!;
      const shiftX = idx >= 3 ? fx(lerp(attackRight ? p.x : 100 - p.x, 82, 0.25)) : p.x + (attackRight ? 3 : -3);
      const shiftY = clampCoord(p.y + (idx % 2 === 0 ? -5 : 5), 10, 90);
      return { x: clampCoord(shiftX, 8, 92), y: shiftY };
    });
    const end = mid.map((p, idx) => {
      if (customEnd[idx]) return customEnd[idx]!;
      if (idx === 4) {
        return { x: lerp(p.x, fx(86), 0.35), y: lerp(p.y, 50, 0.3) };
      }
      return {
        x: clampCoord(p.x + (idx % 2 === 0 ? (attackRight ? 2 : -2) : (attackRight ? -2 : 2)), 8, 92),
        y: clampCoord(p.y + (p.y < 50 ? -3 : 3), 8, 92),
      };
    });
    return { mid, end };
  };

  // 1. PICK & ROLL / HORNS / SPAIN P&R / PICK & POP
  if (v.actionType === 'pick_and_roll') {
    const handlerIdx = passerIdx;
    const screenerIdx = shooterIdx === handlerIdx ? (attPlayers.length > 4 ? 4 : 1) : shooterIdx;
    const backScreenerIdx =
      [0, 1, 2, 3, 4].find((i) => i !== handlerIdx && i !== screenerIdx) ?? 2;
    const offStart = baseOff.map((p) => ({ ...p }));
    const handlerStart = offStart[handlerIdx];
    const screenPt: Vec2 = {
      x: lerp(handlerStart.x, fx(72), 0.5),
      y: lerp(handlerStart.y, shotSpot.y, 0.45),
    };
    const driveMid: Vec2 = {
      x: fx(74),
      y: lerp(screenPt.y, shotSpot.y < 50 ? 62 : 38, 0.35),
    };

    const { mid: offMid, end: offEnd } = animateTeammates(
      offStart,
      {
        [handlerIdx]: driveMid,
        [screenerIdx]: screenPt,
        ...(variant === 2 ? { [backScreenerIdx]: { x: fx(80), y: 50 } } : {}),
      },
      {
        [handlerIdx]:
          shooterIdx === handlerIdx
            ? shotSpot
            : { x: fx(80), y: clampCoord(shotSpot.y < 50 ? 64 : 36, 15, 85) },
        [screenerIdx]: shooterIdx === screenerIdx ? shotSpot : { x: fx(88), y: 50 },
        ...(variant === 2 ? { [backScreenerIdx]: { x: fx(76), y: fy(22) } } : {}),
      }
    );

    const defStart = buildDefenseForScheme(offStart, defScheme, fx, hoopX, hoopY, handlerIdx, 0);
    const defMid = buildDefenseForScheme(offMid, defScheme, fx, hoopX, hoopY, handlerIdx, 0.6);
    const defEnd = buildDefenseForScheme(offEnd, defScheme, fx, hoopX, hoopY, shooterIdx, 1);

    return {
      offStart,
      offMid,
      offEnd,
      defStart,
      defMid,
      defEnd,
      screenMarker: { x: screenPt.x, y: screenPt.y, active: true },
      rimFlash: v.made ? 'made' : v.made === false ? 'miss' : null,
      ballAt: (t, offPos) => {
        if (t < 0.46) {
          const bounce = Math.abs(Math.sin(t * 20)) * 0.14;
          return { x: offPos[handlerIdx].x, y: offPos[handlerIdx].y, scale: 1 + bounce };
        }
        if (t < 0.7 && handlerIdx !== shooterIdx) {
          const pt = (t - 0.46) / 0.24;
          return {
            x: lerp(offPos[handlerIdx].x, offPos[shooterIdx].x, pt),
            y: lerp(offPos[handlerIdx].y, offPos[shooterIdx].y, pt),
            scale: 1 + Math.sin(pt * Math.PI) * 0.24,
            trail: [offPos[handlerIdx], offPos[shooterIdx]],
          };
        }
        const shotStartT = handlerIdx !== shooterIdx ? 0.7 : 0.46;
        const st = clamp01((t - shotStartT) / (1 - shotStartT));
        if (v.made === false && st > 0.72) {
          const rt = (st - 0.72) / 0.28;
          const b = makeMissedRimBounce(hoopX, hoopY, offPos[shooterIdx], fx, rt);
          return { x: b.x, y: b.y, scale: 1 + Math.sin(rt * Math.PI) * 0.25 };
        }
        return {
          x: lerp(offPos[shooterIdx].x, hoopX, st),
          y: lerp(offPos[shooterIdx].y, hoopY, st),
          scale: 1 + Math.sin(st * Math.PI) * 0.45,
          trail: [offPos[shooterIdx], { x: hoopX, y: hoopY }],
        };
      },
    };
  }

  // 2. TIRO DA 3 PUNTI (Drive & Kick / Floppy Screen / Extra Pass Swing)
  if (v.actionType === 'three_shot') {
    const offStart = baseOff.map((p) => ({ ...p }));
    const isFloppy = variant === 1;
    const isExtraPass = variant === 2;
    const relayIdx = [0, 1, 2, 3, 4].find((i) => i !== shooterIdx && i !== passerIdx) ?? 0;

    if (isFloppy) {
      // Il tiratore parte dal pitturato / blocco basso ed esce sul perimetro verso shotSpot
      offStart[shooterIdx] = { x: fx(86), y: shotSpot.y < 50 ? 60 : 40 };
    }

    const screenPt: Vec2 = {
      x: lerp(offStart[shooterIdx].x, shotSpot.x, 0.55),
      y: lerp(offStart[shooterIdx].y, shotSpot.y, 0.55),
    };

    const passerMid: Vec2 =
      variant === 0
        ? { x: fx(81), y: shotSpot.y < 50 ? 54 : 46 } // Drive & Kick dentro l'area
        : offStart[passerIdx];

    const shooterMid: Vec2 = {
      x: lerp(offStart[shooterIdx].x, shotSpot.x, 0.65),
      y: lerp(offStart[shooterIdx].y, shotSpot.y, 0.65),
    };

    const floppyScreenerIdx =
      [0, 1, 2, 3, 4].find((i) => i !== shooterIdx && i !== passerIdx) ?? 4;

    const { mid: offMid, end: offEnd } = animateTeammates(
      offStart,
      {
        [passerIdx]: passerMid,
        [shooterIdx]: shooterMid,
        ...(isFloppy ? { [floppyScreenerIdx]: screenPt } : {}),
      },
      {
        [passerIdx]:
          variant === 0 ? { x: fx(83), y: shotSpot.y < 50 ? 56 : 44 } : passerMid,
        [shooterIdx]: shotSpot,
      }
    );

    const defStart = buildDefenseForScheme(offStart, defScheme, fx, hoopX, hoopY, passerIdx, 0);
    const defMid = buildDefenseForScheme(offMid, defScheme, fx, hoopX, hoopY, passerIdx, 0.6);
    const defEnd = buildDefenseForScheme(offEnd, defScheme, fx, hoopX, hoopY, shooterIdx, 1);

    return {
      offStart,
      offMid,
      offEnd,
      defStart,
      defMid,
      defEnd,
      screenMarker: isFloppy ? { x: screenPt.x, y: screenPt.y, active: true } : undefined,
      rimFlash: v.made ? 'made' : 'miss',
      ballAt: (t, offPos) => {
        if (isExtraPass && t < 0.25) {
          const pt = clamp01(t / 0.25);
          return {
            x: lerp(offPos[passerIdx].x, offPos[relayIdx].x, pt),
            y: lerp(offPos[passerIdx].y, offPos[relayIdx].y, pt),
            scale: 1,
            trail: [offPos[passerIdx], offPos[relayIdx]],
          };
        }
        const passStartT = isExtraPass ? 0.25 : variant === 0 ? 0.22 : 0.12;
        const passOrigin = isExtraPass ? offPos[relayIdx] : offPos[passerIdx];
        if (t < passStartT) {
          return { x: offPos[passerIdx].x, y: offPos[passerIdx].y, scale: 1 };
        }
        if (t < 0.48) {
          const pt = clamp01((t - passStartT) / (0.48 - passStartT));
          return {
            x: lerp(passOrigin.x, offPos[shooterIdx].x, pt),
            y: lerp(passOrigin.y, offPos[shooterIdx].y, pt),
            scale: 1 + Math.sin(pt * Math.PI) * 0.18,
            trail: [passOrigin, offPos[shooterIdx]],
          };
        }
        if (t < 0.82) {
          const st = (t - 0.48) / 0.34;
          return {
            x: lerp(offPos[shooterIdx].x, hoopX, st),
            y: lerp(offPos[shooterIdx].y, hoopY, st),
            scale: 1 + Math.sin(st * Math.PI) * 0.78,
            trail: [offPos[shooterIdx], { x: hoopX, y: hoopY }],
          };
        }
        const rt = (t - 0.82) / 0.18;
        if (v.made) {
          return { x: hoopX, y: hoopY, scale: 1 - rt * 0.2 };
        }
        const b = makeMissedRimBounce(hoopX, hoopY, offPos[shooterIdx], fx, rt);
        return { x: b.x, y: b.y, scale: 1 + Math.sin(rt * Math.PI) * 0.28 };
      },
    };
  }

  // 3. PALLA RUBATA O CONTROPIEDE (Transizione a 3 corsie)
  if (v.actionType === 'steal' || v.actionType === 'fastbreak') {
    const wingA = shooterIdx === 0 ? 1 : 0;
    const wingB = [0, 1, 2, 3, 4].find((i) => i !== shooterIdx && i !== wingA) ?? 2;
    const trailerA = [0, 1, 2, 3, 4].find((i) => i !== shooterIdx && i !== wingA && i !== wingB) ?? 3;
    const trailerB = [0, 1, 2, 3, 4].find(
      (i) => i !== shooterIdx && i !== wingA && i !== wingB && i !== trailerA
    ) ?? 4;

    const offStart: Vec2[] = [];
    offStart[shooterIdx] = { x: fx(26), y: fy(46) };
    offStart[wingA] = { x: fx(24), y: fy(18) };
    offStart[wingB] = { x: fx(24), y: fy(80) };
    offStart[trailerA] = { x: fx(15), y: fy(54) };
    offStart[trailerB] = { x: fx(13), y: fy(38) };

    const offMid: Vec2[] = [];
    offMid[shooterIdx] = { x: lerp(fx(60), shotSpot.x, 0.45), y: lerp(fy(46), shotSpot.y, 0.5) };
    offMid[wingA] = { x: fx(68), y: fy(15) };
    offMid[wingB] = { x: fx(68), y: fy(84) };
    offMid[trailerA] = { x: fx(52), y: 50 };
    offMid[trailerB] = { x: fx(44), y: fy(42) };

    const offEnd: Vec2[] = [];
    offEnd[shooterIdx] = shotSpot;
    offEnd[wingA] = { x: fx(88), y: fy(13) };
    offEnd[wingB] = { x: fx(88), y: fy(87) };
    offEnd[trailerA] = { x: fx(74), y: 50 };
    offEnd[trailerB] = { x: fx(78), y: fy(38) };

    const defStart: Vec2[] = [
      { x: fx(32), y: fy(48) },
      { x: fx(30), y: fy(25) },
      { x: fx(31), y: fy(74) },
      { x: fx(20), y: fy(56) },
      { x: fx(18), y: fy(40) },
    ];
    const defMid = buildDefenseForScheme(offMid, 'Uomo', fx, hoopX, hoopY, shooterIdx, 0.7);
    const defEnd = buildDefenseForScheme(offEnd, 'Uomo', fx, hoopX, hoopY, shooterIdx, 1);

    return {
      offStart,
      offMid,
      offEnd,
      defStart,
      defMid,
      defEnd,
      rimFlash: v.actionType === 'fastbreak' ? (v.made ? 'made' : 'miss') : null,
      ballAt: (t, offPos) => {
        if (v.actionType === 'steal') {
          return { x: offPos[shooterIdx].x, y: offPos[shooterIdx].y, scale: 1 };
        }
        if (v.passerId && t > 0.38 && t < 0.62) {
          const pt = (t - 0.38) / 0.24;
          return {
            x: lerp(offPos[passerIdx].x, offPos[shooterIdx].x, pt),
            y: lerp(offPos[passerIdx].y, offPos[shooterIdx].y, pt),
            scale: 1 + Math.sin(pt * Math.PI) * 0.2,
            trail: [offPos[passerIdx], offPos[shooterIdx]],
          };
        }
        if (t < 0.72) {
          const bounce = Math.abs(Math.sin(t * 22)) * 0.14;
          const carrier = v.passerId && t <= 0.38 ? offPos[passerIdx] : offPos[shooterIdx];
          return { x: carrier.x, y: carrier.y, scale: 1 + bounce };
        }
        const st = (t - 0.72) / 0.28;
        if (v.made === false && st > 0.7) {
          const rt = (st - 0.7) / 0.3;
          const b = makeMissedRimBounce(hoopX, hoopY, offPos[shooterIdx], fx, rt);
          return { x: b.x, y: b.y, scale: 1 };
        }
        return {
          x: lerp(offPos[shooterIdx].x, hoopX, st),
          y: lerp(offPos[shooterIdx].y, hoopY, st),
          scale: 1 + Math.sin(st * Math.PI) * 0.35,
          trail: [offPos[shooterIdx], { x: hoopX, y: hoopY }],
        };
      },
    };
  }

  // 4. PENETRAZIONE / BACKDOOR / POST UP / MIDRANGE (2PT)
  if (v.actionType === 'drive' || v.actionType === 'post_up' || v.actionType === 'two_shot') {
    const isPost = v.actionType === 'post_up';
    const hasPasser = Boolean(v.passerId && passerIdx !== shooterIdx);
    const offStart = baseOff.map((p) => ({ ...p }));

    if (v.actionType === 'drive' && variant === 1) {
      // Taglio backdoor dal lato debole verso la zona di tiro
      offStart[shooterIdx] = { x: fx(74), y: shotSpot.y < 50 ? 15 : 85 };
    }

    const actorMid: Vec2 = isPost
      ? { x: lerp(offStart[shooterIdx].x, shotSpot.x, 0.7), y: lerp(offStart[shooterIdx].y, shotSpot.y, 0.7) }
      : {
          x: lerp(offStart[shooterIdx].x, shotSpot.x, 0.6),
          y: lerp(offStart[shooterIdx].y, shotSpot.y, 0.6),
        };

    const { mid: offMid, end: offEnd } = animateTeammates(
      offStart,
      { [shooterIdx]: actorMid },
      { [shooterIdx]: shotSpot }
    );

    const defStart = buildDefenseForScheme(offStart, defScheme, fx, hoopX, hoopY, hasPasser ? passerIdx : shooterIdx, 0);
    const defMid = buildDefenseForScheme(offMid, defScheme, fx, hoopX, hoopY, shooterIdx, 0.6);
    const defEnd = buildDefenseForScheme(offEnd, defScheme, fx, hoopX, hoopY, shooterIdx, 1);

    return {
      offStart,
      offMid,
      offEnd,
      defStart,
      defMid,
      defEnd,
      rimFlash: v.made ? 'made' : 'miss',
      ballAt: (t, offPos) => {
        if (hasPasser && t < 0.36) {
          const pt = clamp01(t / 0.36);
          return {
            x: lerp(offPos[passerIdx].x, offPos[shooterIdx].x, pt),
            y: lerp(offPos[passerIdx].y, offPos[shooterIdx].y, pt),
            scale: 1 + Math.sin(pt * Math.PI) * 0.16,
            trail: [offPos[passerIdx], offPos[shooterIdx]],
          };
        }
        if (t < 0.7) {
          const bounce = !isPost ? Math.abs(Math.sin(t * 18)) * 0.12 : 0;
          return { x: offPos[shooterIdx].x, y: offPos[shooterIdx].y, scale: 1 + bounce };
        }
        const st = (t - 0.7) / 0.3;
        if (v.blocked && st > 0.45) {
          const bt = (st - 0.45) / 0.55;
          return {
            x: lerp(shotSpot.x, fx(76), bt),
            y: lerp(shotSpot.y, shotSpot.y < 50 ? 28 : 72, bt),
            scale: 1,
          };
        }
        if (v.made === false && st > 0.72) {
          const rt = (st - 0.72) / 0.28;
          const b = makeMissedRimBounce(hoopX, hoopY, offPos[shooterIdx], fx, rt);
          return { x: b.x, y: b.y, scale: 1 };
        }
        return {
          x: lerp(offPos[shooterIdx].x, hoopX, st),
          y: lerp(offPos[shooterIdx].y, hoopY, st),
          scale: 1 + Math.sin(st * Math.PI) * 0.45,
          trail: [offPos[shooterIdx], { x: hoopX, y: hoopY }],
        };
      },
    };
  }

  // 5. TIRI LIBERI
  if (v.actionType === 'freethrow') {
    const ftLineX = fx(79.3);
    const others = [0, 1, 2, 3, 4].filter((i) => i !== shooterIdx);
    const offStart: Vec2[] = [];
    offStart[shooterIdx] = { x: ftLineX, y: 50 };
    offStart[others[0]] = { x: fx(62), y: 36 };
    offStart[others[1]] = { x: fx(62), y: 64 };
    offStart[others[2]] = { x: fx(85), y: 34 };
    offStart[others[3]] = { x: fx(85), y: 66 };

    const defStart: Vec2[] = [
      { x: fx(89), y: 34 },
      { x: fx(89), y: 66 },
      { x: fx(81), y: 34 },
      { x: fx(81), y: 66 },
      { x: fx(60), y: 50 },
    ];
    return {
      offStart,
      offMid: offStart,
      offEnd: offStart,
      defStart,
      defMid: defStart,
      defEnd: defStart,
      rimFlash: v.made ? 'made' : 'miss',
      ballAt: (t) => {
        if (t < 0.3) return { x: ftLineX, y: 50, scale: 1 };
        const st = clamp01((t - 0.3) / 0.5);
        return {
          x: lerp(ftLineX, hoopX, st),
          y: 50,
          scale: 1 + Math.sin(st * Math.PI) * 0.5,
        };
      },
    };
  }

  // Default / Timeout / Pass / Turnover
  const defStart = buildDefenseForScheme(baseOff, defScheme, fx, hoopX, hoopY, 0, 0);
  return {
    offStart: baseOff,
    offMid: baseOff,
    offEnd: baseOff,
    defStart,
    defMid: defStart,
    defEnd: defStart,
    ballAt: () => ({ x: v.ballX, y: v.ballY, scale: 1 }),
  };
}

export function drawFibaCourtFloor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pad: number,
  theme: 'parquet' | 'tactical'
): { leftHoopX: number; rightHoopX: number; midY: number } {
  const cw = w - pad * 2;
  const ch = h - pad * 2;
  const midX = pad + cw / 2;
  const midY = pad + ch / 2;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, h);

  if (theme === 'parquet') {
    const floorGrad = ctx.createLinearGradient(pad, pad, pad, pad + ch);
    floorGrad.addColorStop(0, '#b57b45');
    floorGrad.addColorStop(0.5, '#c98e55');
    floorGrad.addColorStop(1, '#a66d38');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(pad, pad, cw, ch);

    ctx.strokeStyle = 'rgba(0,0,0,0.065)';
    ctx.lineWidth = 1;
    for (let y = pad + 12; y < pad + ch; y += 12) {
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + cw, y);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(pad, pad, cw, ch);
  }

  const lineColor = theme === 'parquet' ? '#f8fafc' : 'rgba(226, 232, 240, 0.75)';
  const paintColor =
    theme === 'parquet' ? 'rgba(234, 88, 12, 0.28)' : 'rgba(249, 115, 22, 0.12)';

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, cw, ch);

  ctx.beginPath();
  ctx.moveTo(midX, pad);
  ctx.lineTo(midX, pad + ch);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(midX, midY, ch * 0.13, 0, Math.PI * 2);
  ctx.stroke();

  const keyW = cw * (5.8 / 28);
  const keyH = ch * (4.9 / 15);
  const keyY = midY - keyH / 2;

  ctx.fillStyle = paintColor;
  ctx.fillRect(pad, keyY, keyW, keyH);
  ctx.strokeRect(pad, keyY, keyW, keyH);

  ctx.fillRect(pad + cw - keyW, keyY, keyW, keyH);
  ctx.strokeRect(pad + cw - keyW, keyY, keyW, keyH);

  ctx.beginPath();
  ctx.arc(pad + keyW, midY, keyH / 2, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pad + cw - keyW, midY, keyH / 2, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.stroke();

  const leftHoopX = pad + cw * (1.575 / 28);
  const rightHoopX = pad + cw * (1 - 1.575 / 28);
  const threeR = ch * (6.75 / 15);
  const threeDy = ch * (6.6 / 15);
  const cornerYTop = midY - threeDy;
  const cornerYBot = midY + threeDy;
  const threeAngle = Math.asin(threeDy / threeR);
  const threeDx = Math.sqrt(threeR * threeR - threeDy * threeDy);

  ctx.beginPath();
  ctx.moveTo(pad, cornerYTop);
  ctx.lineTo(leftHoopX + threeDx, cornerYTop);
  ctx.arc(leftHoopX, midY, threeR, -threeAngle, threeAngle, false);
  ctx.lineTo(pad, cornerYBot);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(pad + cw, cornerYBot);
  ctx.lineTo(rightHoopX - threeDx, cornerYBot);
  ctx.arc(rightHoopX, midY, threeR, Math.PI - threeAngle, Math.PI + threeAngle, false);
  ctx.lineTo(pad + cw, cornerYTop);
  ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pad + cw * 0.042, midY - 14);
  ctx.lineTo(pad + cw * 0.042, midY + 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pad + cw * 0.958, midY - 14);
  ctx.lineTo(pad + cw * 0.958, midY + 14);
  ctx.stroke();

  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(leftHoopX, midY, 5.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rightHoopX, midY, 5.5, 0, Math.PI * 2);
  ctx.stroke();

  return { leftHoopX, rightHoopX, midY };
}
