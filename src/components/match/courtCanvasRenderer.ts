import { MatchState, PlayerBoxScore } from '../../types';
import {
  PlayKeyframes,
  Vec2,
  clamp01,
  easeInOutCubic,
  lerp,
  quadBezier,
} from '../../engine/courtPlaybook';
import { CUSTOM_PLAY_MOVE_END } from '../../engine/customPlayEngine';

export interface RecordedShot {
  possession: number;
  teamId: string;
  x: number;
  y: number;
  made: boolean;
  isThree: boolean;
}

export type CourtToPxFn = (v: Vec2) => { px: number; py: number };

export function getPlayerNumber(p: PlayerBoxScore, idx: number): string {
  switch (p.position) {
    case 'PG':
      return '1';
    case 'SG':
      return '7';
    case 'SF':
      return '11';
    case 'PF':
      return '23';
    case 'C':
      return '33';
    default:
      return String((idx % 5) + 4);
  }
}

export function getSurname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ').slice(0, 9) : parts[0].slice(0, 9);
}

function interpolateSet(s: Vec2[], m: Vec2[], e: Vec2[], t: number, prevArr?: Vec2[]): Vec2[] {
  return s.map((_, i) => {
    const startPt =
      prevArr && prevArr[i]
        ? { x: lerp(prevArr[i].x, s[i].x, 0.35), y: lerp(prevArr[i].y, s[i].y, 0.35) }
        : s[i];
    const ctrlPt = {
      x: 2 * m[i].x - 0.5 * (startPt.x + e[i].x),
      y: 2 * m[i].y - 0.5 * (startPt.y + e[i].y),
    };
    return quadBezier(startPt, ctrlPt, e[i], t);
  });
}

function interpolateMultiFrames(frames: Vec2[][], t: number, prevArr?: Vec2[]): Vec2[] {
  const segCount = Math.max(1, frames.length - 1);
  if (t >= CUSTOM_PLAY_MOVE_END) {
    return frames[segCount].map((p) => ({ ...p }));
  }
  const segDur = CUSTOM_PLAY_MOVE_END / segCount;
  const segIdx = Math.min(segCount - 1, Math.floor(t / segDur));
  const segLocal = clamp01((t - segIdx * segDur) / segDur);
  const segT = easeInOutCubic(segLocal);
  return frames[segIdx].map((pt, i) => {
    const fromPt =
      segIdx === 0 && prevArr && prevArr[i]
        ? { x: lerp(prevArr[i].x, pt.x, 0.35), y: lerp(prevArr[i].y, pt.y, 0.35) }
        : pt;
    const toPt = frames[segIdx + 1][i] ?? pt;
    return {
      x: lerp(fromPt.x, toPt.x, segT),
      y: lerp(fromPt.y, toPt.y, segT),
    };
  });
}

export function interpolateKeyframes(
  keyframes: PlayKeyframes,
  t: number,
  prevPos: { off: Vec2[]; def: Vec2[] } | null
): { offPositions: Vec2[]; defPositions: Vec2[]; hasMultiFrames: boolean } {
  const hasMultiFrames = Boolean(
    keyframes.offFrames && keyframes.offFrames.length >= 2 && keyframes.defFrames
  );
  const offPositions = hasMultiFrames
    ? interpolateMultiFrames(keyframes.offFrames!, t, prevPos?.off)
    : interpolateSet(keyframes.offStart, keyframes.offMid, keyframes.offEnd, t, prevPos?.off);
  const defPositions = hasMultiFrames
    ? interpolateMultiFrames(keyframes.defFrames!, t, prevPos?.def)
    : interpolateSet(keyframes.defStart, keyframes.defMid, keyframes.defEnd, t, prevPos?.def);

  return { offPositions, defPositions, hasMultiFrames };
}

export function drawShotChartLayer(
  ctx: CanvasRenderingContext2D,
  pad: number,
  cw: number,
  ch: number,
  shots: RecordedShot[],
  toPx: CourtToPxFn
): void {
  ctx.fillStyle = 'rgba(2, 6, 23, 0.35)';
  ctx.fillRect(pad, pad, cw, ch);

  for (const s of shots) {
    const { px, py } = toPx({ x: s.x, y: s.y });
    if (s.made) {
      ctx.beginPath();
      ctx.arc(px, py, s.isThree ? 6 : 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.85)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#052e16';
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 4, py - 4);
      ctx.lineTo(px + 4, py + 4);
      ctx.moveTo(px + 4, py - 4);
      ctx.lineTo(px - 4, py + 4);
      ctx.stroke();
    }
  }
}

export function drawMovementArrows(
  ctx: CanvasRenderingContext2D,
  keyframes: PlayKeyframes,
  hasMultiFrames: boolean,
  theme: 'parquet' | 'tactical',
  toPx: CourtToPxFn
): void {
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle =
    theme === 'tactical' ? 'rgba(251, 146, 60, 0.42)' : 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.3;

  if (hasMultiFrames && keyframes.offFrames) {
    const frames = keyframes.offFrames;
    for (let i = 0; i < frames[0].length; i++) {
      let totalDist = 0;
      for (let f = 1; f < frames.length; f++) {
        totalDist += Math.hypot(
          frames[f][i].x - frames[f - 1][i].x,
          frames[f][i].y - frames[f - 1][i].y
        );
      }
      if (totalDist < 4) continue;
      const p0 = toPx(frames[0][i]);
      ctx.beginPath();
      ctx.moveTo(p0.px, p0.py);
      for (let f = 1; f < frames.length; f++) {
        const pf = toPx(frames[f][i]);
        ctx.lineTo(pf.px, pf.py);
      }
      ctx.stroke();
    }
  } else {
    keyframes.offStart.forEach((s, i) => {
      const e = keyframes.offEnd[i];
      const dist = Math.hypot(e.x - s.x, e.y - s.y);
      if (dist < 4) return;
      const m = keyframes.offMid[i];
      const p0 = toPx(s);
      const p1 = toPx({
        x: 2 * m.x - 0.5 * (s.x + e.x),
        y: 2 * m.y - 0.5 * (s.y + e.y),
      });
      const p2 = toPx(e);
      ctx.beginPath();
      ctx.moveTo(p0.px, p0.py);
      ctx.quadraticCurveTo(p1.px, p1.py, p2.px, p2.py);
      ctx.stroke();
    });
  }
  ctx.restore();
}

export function drawScreenRings(
  ctx: CanvasRenderingContext2D,
  keyframes: PlayKeyframes,
  t: number,
  toPx: CourtToPxFn
): void {
  if (keyframes.screenMarkers && keyframes.screenMarkers.length > 0) {
    for (const sm of keyframes.screenMarkers) {
      if (t >= sm.tStart && t <= sm.tEnd) {
        const { px, py } = toPx(sm);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    return;
  }

  if (keyframes.screenMarker?.active && t > 0.25 && t < 0.72) {
    const { px, py } = toPx(keyframes.screenMarker);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawBallTrail(
  ctx: CanvasRenderingContext2D,
  trail: Vec2[] | undefined,
  toPx: CourtToPxFn
): void {
  if (!trail || trail.length !== 2) return;
  const p1 = toPx(trail[0]);
  const p2 = toPx(trail[1]);
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(p1.px, p1.py);
  ctx.lineTo(p2.px, p2.py);
  ctx.stroke();
  ctx.restore();
}

export function drawRimFlash(
  ctx: CanvasRenderingContext2D,
  rimFlash: 'made' | 'miss' | null | undefined,
  attackSide: MatchState['visual']['attackSide'],
  leftHoopX: number,
  rightHoopX: number,
  midY: number,
  t: number
): void {
  if (!rimFlash || t <= 0.78) return;
  const hx = attackSide === 'home' ? rightHoopX : leftHoopX;
  const pulse = (t - 0.78) / 0.22;
  ctx.beginPath();
  ctx.arc(hx, midY, 8 + pulse * 14, 0, Math.PI * 2);
  ctx.strokeStyle =
    rimFlash === 'made' ? `rgba(34, 197, 94, ${1 - pulse})` : `rgba(239, 68, 68, ${1 - pulse})`;
  ctx.lineWidth = 3;
  ctx.stroke();
}

export function drawPlayerCircle(
  ctx: CanvasRenderingContext2D,
  player: PlayerBoxScore,
  pos: Vec2,
  bg: string,
  fg: string,
  num: string,
  isOffense: boolean,
  isBallFocus: boolean,
  showNames: boolean,
  toPx: CourtToPxFn
): void {
  const { px, py } = toPx(pos);

  if (isBallFocus) {
    ctx.beginPath();
    ctx.arc(px, py, 14.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(px + 1, py + 2, 10.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(px, py, 10.5, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = isOffense ? 2.2 : 1.8;
  ctx.strokeStyle = isOffense ? '#fbbf24' : '#0f172a';
  ctx.stroke();

  ctx.fillStyle = fg;
  ctx.font = 'bold 9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(num, px, py + 0.5);

  if (player.fouls >= 4) {
    ctx.beginPath();
    ctx.arc(px + 8.5, py - 8.5, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }

  if (showNames) {
    const stamRatio = Math.max(0, Math.min(1, player.stamina / 100));
    const barW = 20;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(px - barW / 2, py + 12, barW, 2.5);
    ctx.fillStyle =
      stamRatio >= 0.65 ? '#22c55e' : stamRatio >= 0.4 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(px - barW / 2, py + 12, barW * stamRatio, 2.5);

    const label = getSurname(player.name);
    ctx.font = '700 8.5px Inter, sans-serif';
    const tw = ctx.measureText(label).width + 6;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
    ctx.fillRect(px - tw / 2, py + 16, tw, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.textBaseline = 'top';
    ctx.fillText(label, px, py + 17);
  }
}

export function drawCourtBasketball(
  ctx: CanvasRenderingContext2D,
  ballState: { x: number; y: number; scale: number },
  toPx: CourtToPxFn
): void {
  const bpx = toPx({ x: ballState.x, y: ballState.y });
  const br = 6.2 * ballState.scale;

  ctx.beginPath();
  ctx.arc(bpx.px + 1.5, bpx.py + 2.5, br, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(bpx.px, bpx.py, br, 0, Math.PI * 2);
  ctx.fillStyle = '#f97316';
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#1e293b';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bpx.px - br * 0.7, bpx.py);
  ctx.lineTo(bpx.px + br * 0.7, bpx.py);
  ctx.moveTo(bpx.px, bpx.py - br * 0.7);
  ctx.lineTo(bpx.px, bpx.py + br * 0.7);
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.lineWidth = 1;
  ctx.stroke();
}
