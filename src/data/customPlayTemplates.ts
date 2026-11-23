import { CustomPlay, PlayPoint, Position } from '../types';

export type PlayTemplateKey =
  | 'blank'
  | 'horns'
  | 'five_out'
  | 'floppy'
  | 'box_set'
  | 'pnr_side'
  | 'motion_flex';

export const DEFAULT_HORNS_START_POSITIONS: Record<Position, PlayPoint> = {
  PG: { x: 60, y: 50 },
  SG: { x: 91, y: 8 },
  SF: { x: 91, y: 92 },
  PF: { x: 74, y: 34 },
  C: { x: 74, y: 66 },
};

function clonePts(pos: Record<Position, PlayPoint>): Record<Position, PlayPoint> {
  return {
    PG: { ...pos.PG },
    SG: { ...pos.SG },
    SF: { ...pos.SF },
    PF: { ...pos.PF },
    C: { ...pos.C },
  };
}

export function buildRawPlayTemplate(
  templateKey: PlayTemplateKey,
  id: string,
  customName?: string
): CustomPlay {
  if (templateKey === 'blank') {
    const neutral: Record<Position, PlayPoint> = {
      PG: { x: 58, y: 50 },
      SG: { x: 66, y: 22 },
      SF: { x: 66, y: 78 },
      PF: { x: 76, y: 30 },
      C: { x: 76, y: 70 },
    };
    return {
      id,
      name: customName ?? 'Nuovo Schema',
      active: true,
      initialBallHandler: 'PG',
      positions: {
        start: clonePts(neutral),
        mid: clonePts(neutral),
        end: clonePts(neutral),
      },
      steps: [
        { id: 'step_0', positions: clonePts(neutral) },
        { id: 'step_1', positions: clonePts(neutral) },
        { id: 'step_2', positions: clonePts(neutral) },
      ],
      screeners: [],
      screens: [],
      passes: [],
      passPhase1: null,
      passPhase2: null,
      shooterRole: 'PG',
      shotStyle: 'auto',
    };
  }

  if (templateKey === 'motion_flex') {
    const step0: Record<Position, PlayPoint> = {
      PG: { x: 60, y: 50 },
      SG: { x: 89, y: 82 },
      SF: { x: 90, y: 12 },
      PF: { x: 75, y: 34 },
      C: { x: 75, y: 66 },
    };
    const step1: Record<Position, PlayPoint> = {
      PG: { x: 65, y: 34 },
      SG: { x: 86, y: 66 },
      SF: { x: 76, y: 20 },
      PF: { x: 74, y: 26 },
      C: { x: 78, y: 58 },
    };
    const step2: Record<Position, PlayPoint> = {
      PG: { x: 66, y: 24 },
      SG: { x: 88, y: 50 },
      SF: { x: 89, y: 12 },
      PF: { x: 72, y: 34 },
      C: { x: 82, y: 54 },
    };
    const step3: Record<Position, PlayPoint> = {
      PG: { x: 66, y: 22 },
      SG: { x: 73, y: 86 },
      SF: { x: 91, y: 10 },
      PF: { x: 82, y: 34 },
      C: { x: 84, y: 60 },
    };
    return {
      id,
      name: customName ?? 'Flex Motion (4 Fasi)',
      active: true,
      initialBallHandler: 'PG',
      positions: {
        start: clonePts(step0),
        mid: clonePts(step1),
        end: clonePts(step3),
      },
      steps: [
        { id: 'step_0', positions: step0 },
        { id: 'step_1', positions: step1 },
        { id: 'step_2', positions: step2 },
        { id: 'step_3', positions: step3 },
      ],
      screeners: ['PF', 'C'],
      screens: [
        { screener: 'PF', target: 'SF', type: 'off_ball', phase: 'mid', stepIndex: 1 },
        { screener: 'C', target: 'SG', type: 'off_ball', phase: 'mid', stepIndex: 2 },
      ],
      passes: [
        { from: 'PG', to: 'PF', style: 'diretto', stepIndex: 1 },
        { from: 'PF', to: 'C', style: 'schiacciato', stepIndex: 2 },
        { from: 'C', to: 'SG', style: 'scarico', stepIndex: 3 },
      ],
      shooterRole: 'SG',
      shotStyle: 'catch_and_shoot',
    };
  }

  if (templateKey === 'five_out') {
    const start: Record<Position, PlayPoint> = {
      PG: { x: 60, y: 50 },
      SG: { x: 72, y: 15 },
      SF: { x: 72, y: 85 },
      PF: { x: 91, y: 8 },
      C: { x: 91, y: 92 },
    };
    const mid: Record<Position, PlayPoint> = {
      PG: { x: 65, y: 70 },
      SG: { x: 66, y: 26 },
      SF: { x: 71, y: 84 },
      PF: { x: 84, y: 18 },
      C: { x: 83, y: 76 },
    };
    const end: Record<Position, PlayPoint> = {
      PG: { x: 66, y: 84 },
      SG: { x: 91, y: 50 },
      SF: { x: 71, y: 82 },
      PF: { x: 90, y: 10 },
      C: { x: 72, y: 18 },
    };
    return {
      id,
      name: customName ?? '5-Out Backdoor Cut',
      active: true,
      initialBallHandler: 'PG',
      positions: { start, mid, end },
      screeners: ['PF'],
      screens: [{ screener: 'PF', target: 'SG', type: 'back_screen', phase: 'mid', stepIndex: 1 }],
      passPhase1: { from: 'PG', to: 'SF', style: 'diretto', stepIndex: 1 },
      passPhase2: { from: 'SF', to: 'SG', style: 'schiacciato', stepIndex: 2 },
      shooterRole: 'SG',
      shotStyle: 'drive_rim',
    };
  }

  if (templateKey === 'floppy') {
    const start: Record<Position, PlayPoint> = {
      PG: { x: 60, y: 50 },
      SG: { x: 89, y: 50 },
      SF: { x: 91, y: 90 },
      PF: { x: 84, y: 34 },
      C: { x: 84, y: 66 },
    };
    const mid: Record<Position, PlayPoint> = {
      PG: { x: 63, y: 36 },
      SG: { x: 82, y: 22 },
      SF: { x: 86, y: 88 },
      PF: { x: 82, y: 28 },
      C: { x: 84, y: 64 },
    };
    const end: Record<Position, PlayPoint> = {
      PG: { x: 64, y: 42 },
      SG: { x: 74, y: 14 },
      SF: { x: 91, y: 90 },
      PF: { x: 87, y: 44 },
      C: { x: 88, y: 60 },
    };
    return {
      id,
      name: customName ?? 'Floppy Blocco Basso',
      active: true,
      initialBallHandler: 'PG',
      positions: { start, mid, end },
      screeners: ['PF', 'C'],
      screens: [
        { screener: 'PF', target: 'SG', type: 'off_ball', phase: 'mid', stepIndex: 1 },
        { screener: 'C', target: 'SG', type: 'off_ball', phase: 'mid', stepIndex: 1 },
      ],
      passPhase1: null,
      passPhase2: { from: 'PG', to: 'SG', style: 'scarico', stepIndex: 2 },
      shooterRole: 'SG',
      shotStyle: 'catch_and_shoot',
    };
  }

  if (templateKey === 'box_set') {
    const start: Record<Position, PlayPoint> = {
      PG: { x: 62, y: 50 },
      SG: { x: 74, y: 35 },
      SF: { x: 74, y: 65 },
      PF: { x: 87, y: 35 },
      C: { x: 87, y: 65 },
    };
    const mid: Record<Position, PlayPoint> = {
      PG: { x: 68, y: 30 },
      SG: { x: 86, y: 16 },
      SF: { x: 74, y: 68 },
      PF: { x: 85, y: 24 },
      C: { x: 80, y: 50 },
    };
    const end: Record<Position, PlayPoint> = {
      PG: { x: 70, y: 26 },
      SG: { x: 92, y: 6.5 },
      SF: { x: 73, y: 78 },
      PF: { x: 87, y: 42 },
      C: { x: 84, y: 64 },
    };
    return {
      id,
      name: customName ?? 'Box ATO Angolo 3PT',
      active: true,
      initialBallHandler: 'PG',
      positions: { start, mid, end },
      screeners: ['PF'],
      screens: [{ screener: 'PF', target: 'SG', type: 'off_ball', phase: 'mid', stepIndex: 1 }],
      passPhase1: null,
      passPhase2: { from: 'PG', to: 'SG', style: 'scarico', stepIndex: 2 },
      shooterRole: 'SG',
      shotStyle: 'catch_and_shoot',
    };
  }

  if (templateKey === 'pnr_side') {
    const start: Record<Position, PlayPoint> = {
      PG: { x: 67, y: 18 },
      SG: { x: 62, y: 62 },
      SF: { x: 91, y: 92 },
      PF: { x: 90, y: 8 },
      C: { x: 74, y: 32 },
    };
    const mid: Record<Position, PlayPoint> = {
      PG: { x: 74, y: 28 },
      SG: { x: 64, y: 72 },
      SF: { x: 91, y: 92 },
      PF: { x: 91, y: 8 },
      C: { x: 75, y: 24 },
    };
    const end: Record<Position, PlayPoint> = {
      PG: { x: 81, y: 40 },
      SG: { x: 66, y: 78 },
      SF: { x: 91, y: 92 },
      PF: { x: 91, y: 8 },
      C: { x: 90, y: 50 },
    };
    return {
      id,
      name: customName ?? 'Side Pick & Roll',
      active: true,
      initialBallHandler: 'PG',
      positions: { start, mid, end },
      screeners: ['C'],
      screens: [{ screener: 'C', target: 'PG', type: 'on_ball', phase: 'mid', stepIndex: 1 }],
      passPhase1: null,
      passPhase2: { from: 'PG', to: 'C', style: 'lob', stepIndex: 2 },
      shooterRole: 'C',
      shotStyle: 'drive_rim',
    };
  }

  // Default: Horns
  const hornsMid: Record<Position, PlayPoint> = {
    PG: { x: 72, y: 44 },
    SG: { x: 76, y: 12 },
    SF: { x: 91, y: 92 },
    PF: { x: 72, y: 44 },
    C: { x: 80, y: 62 },
  };
  const hornsEnd: Record<Position, PlayPoint> = {
    PG: { x: 79, y: 42 },
    SG: { x: 74, y: 14 },
    SF: { x: 91, y: 92 },
    PF: { x: 88, y: 56 },
    C: { x: 70, y: 76 },
  };
  return {
    id,
    name: customName ?? 'Horns & Scarico 3PT',
    active: true,
    initialBallHandler: 'PG',
    positions: {
      start: clonePts(DEFAULT_HORNS_START_POSITIONS),
      mid: hornsMid,
      end: hornsEnd,
    },
    screeners: ['PF'],
    screens: [{ screener: 'PF', target: 'PG', type: 'on_ball', phase: 'mid', stepIndex: 1 }],
    passPhase1: null,
    passPhase2: { from: 'PG', to: 'SG', style: 'scarico', stepIndex: 2 },
    shooterRole: 'SG',
    shotStyle: 'catch_and_shoot',
  };
}
