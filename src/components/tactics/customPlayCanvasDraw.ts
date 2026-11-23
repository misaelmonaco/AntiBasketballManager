import { PlayPassStyle, Position } from '../../types';
import { ROLE_NUMBERS } from '../../engine/customPlayEngine';

export const ROLE_COLORS: Record<Position, string> = {
  PG: '#f97316',
  SG: '#eab308',
  SF: '#10b981',
  PF: '#0ea5e9',
  C: '#8b5cf6',
};

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false
): void {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  if (dist < 10) return;

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const shorten = 14;
  const ex = x2 - Math.cos(angle) * shorten;
  const ey = y2 - Math.sin(angle) * shorten;

  ctx.save();
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = color;
  const head = 7;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - head * Math.cos(angle - Math.PI / 6), ey - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(ex - head * Math.cos(angle + Math.PI / 6), ey - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawScreenSymbol(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  targetPx: number,
  targetPy: number
): void {
  const angle = Math.atan2(targetPy - py, targetPx - px);
  const perp = angle + Math.PI / 2;
  const tx = px + Math.cos(angle) * 15;
  const ty = py + Math.sin(angle) * 15;

  ctx.save();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(tx, ty);
  ctx.moveTo(tx - Math.cos(perp) * 11, ty - Math.sin(perp) * 11);
  ctx.lineTo(tx + Math.cos(perp) * 11, ty + Math.sin(perp) * 11);
  ctx.stroke();
  ctx.restore();
}

export function drawStyledPass(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: PlayPassStyle = 'diretto',
  orderBadge?: string,
  curveSign = 1
): void {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  if (dist < 10) return;

  let badgeX = (x1 + x2) / 2;
  let badgeY = (y1 + y2) / 2;

  if (style === 'lob') {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const ex = x2 - Math.cos(angle) * 14;
    const ey = y2 - Math.sin(angle) * 14;
    const mx = (x1 + ex) / 2;
    const my = (y1 + ey) / 2 - Math.min(34, dist * 0.28) * curveSign;
    badgeX = mx;
    badgeY = my;

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOB', mx, my - 10);

    const endAng = Math.atan2(ey - my, ex - mx);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 7 * Math.cos(endAng - Math.PI / 6), ey - 7 * Math.sin(endAng - Math.PI / 6));
    ctx.lineTo(ex - 7 * Math.cos(endAng + Math.PI / 6), ey - 7 * Math.sin(endAng + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else {
    const color = style === 'scarico' ? '#4ade80' : style === 'handoff' ? '#fbbf24' : '#fde047';
    drawArrow(ctx, x1, y1, x2, y2, color, style !== 'handoff');

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const perp = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
    badgeX = mx + Math.cos(perp) * 12 * curveSign;
    badgeY = my + Math.sin(perp) * 12 * curveSign;

    ctx.save();
    if (style === 'schiacciato') {
      ctx.beginPath();
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (style === 'handoff') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(mx - Math.cos(perp) * 7, my - Math.sin(perp) * 7);
      ctx.lineTo(mx + Math.cos(perp) * 7, my + Math.sin(perp) * 7);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (orderBadge) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.font = '800 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(orderBadge, badgeX, badgeY + 0.5);
    ctx.restore();
  }
}

export function drawHudPill(ctx: CanvasRenderingContext2D, text: string): void {
  ctx.save();
  ctx.font = '800 10px Inter, sans-serif';
  const tw = ctx.measureText(text).width;
  const bw = tw + 16;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(26, 26, bw, 20, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 34, 36.5);
  ctx.restore();
}

export function drawRoleToken(
  ctx: CanvasRenderingContext2D,
  role: Position,
  px: number,
  py: number,
  opts: {
    radius?: number;
    isShooter?: boolean;
    isDragged?: boolean;
    isCarrier?: boolean;
    showLabel?: boolean;
  } = {}
): void {
  const baseR = opts.radius ?? 14.5;
  const r = opts.isDragged ? baseR + 1.5 : baseR;

  if (opts.isShooter) {
    ctx.beginPath();
    ctx.arc(px, py, baseR + 5.5, 0, Math.PI * 2);
    ctx.strokeStyle = opts.showLabel ? '#10b981' : 'rgba(16, 185, 129, 0.8)';
    ctx.lineWidth = opts.showLabel ? 2.4 : 2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(px + 1, py + 2, baseR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fillStyle = ROLE_COLORS[role];
  ctx.fill();
  ctx.lineWidth = opts.isDragged ? 3 : 2.1;
  ctx.strokeStyle = opts.isDragged ? '#ffffff' : '#0f172a';
  ctx.stroke();

  ctx.fillStyle = '#020617';
  ctx.font = '800 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ROLE_NUMBERS[role], px, py + 0.5);

  if (opts.showLabel) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
    ctx.fillRect(px - 13, py + 17, 26, 12);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 9px Inter, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(role, px, py + 18);
  }

  if (opts.isCarrier) {
    ctx.beginPath();
    ctx.arc(px + 11, py - 11, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f97316';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
  }
}

export function drawPlayBasketball(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1
): void {
  const br = 7 * scale;
  ctx.beginPath();
  ctx.arc(x + 1.5, y + 2, br, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, br, 0, Math.PI * 2);
  ctx.fillStyle = '#f97316';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#0f172a';
  ctx.stroke();
}
