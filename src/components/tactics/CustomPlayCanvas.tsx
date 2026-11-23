import React, { useEffect, useRef, useState } from 'react';
import { CustomPlay, PlayPoint, Position } from '../../types';
import {
  ALL_ROLES,
  drawFibaHalfCourtFloor,
  evaluateCustomPlayBallAt,
  getBallCarrierAtStep,
  getEffectivePasses,
  getEffectiveScreens,
  getEffectiveSteps,
} from '../../engine/customPlayEngine';
import { clamp01, easeInOutCubic, lerp } from '../../engine/courtPlaybook';
import {
  drawArrow,
  drawHudPill,
  drawPlayBasketball,
  drawRoleToken,
  drawScreenSymbol,
  drawStyledPass,
} from './customPlayCanvasDraw';

interface CustomPlayCanvasProps {
  play: CustomPlay;
  stepIndex: number;
  theme: 'parquet' | 'tactical';
  previewing: boolean;
  onChangePosition: (stepIndex: number, role: Position, pt: PlayPoint) => void;
}

export const CustomPlayCanvas: React.FC<CustomPlayCanvasProps> = ({
  play,
  stepIndex,
  theme,
  previewing,
  onChangePosition,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dragRole, setDragRole] = useState<Position | null>(null);
  const mapperRef = useRef<{
    toPx: (pt: PlayPoint) => { px: number; py: number };
    fromPx: (px: number, py: number) => PlayPoint;
  } | null>(null);

  const steps = getEffectiveSteps(play);
  const safeStepIdx = Math.min(Math.max(0, stepIndex), steps.length - 1);

  useEffect(() => {
    let rafId = 0;
    const startMs = performance.now();
    const effectiveSteps = getEffectiveSteps(play);
    const effectivePasses = getEffectivePasses(play);
    const effectiveScreens = getEffectiveScreens(play);
    const segCount = Math.max(1, effectiveSteps.length - 1);
    const MOVE_END = 0.78;
    const cycleDuration = Math.max(2900, 1300 + segCount * 950);

    const render = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const { hoopPx, toPx, fromPx } = drawFibaHalfCourtFloor(ctx, w, h, 20, theme);
      mapperRef.current = { toPx, fromPx };

      const getRolePos = (sIdx: number, r: Position): PlayPoint =>
        effectiveSteps[sIdx]?.positions[r] ?? { x: 75, y: 50 };

      if (previewing) {
        const rawLoop = ((now - startMs) % cycleDuration) / cycleDuration;
        const currPos = {} as Record<Position, PlayPoint>;
        const segDur = MOVE_END / segCount;
        let activeSeg = segCount;

        if (rawLoop < MOVE_END) {
          const segIdx = Math.min(segCount - 1, Math.floor(rawLoop / segDur));
          activeSeg = segIdx;
          const t = easeInOutCubic(clamp01((rawLoop - segIdx * segDur) / segDur));
          for (const r of ALL_ROLES) {
            const fromP = getRolePos(segIdx, r);
            const toP = getRolePos(segIdx + 1, r);
            currPos[r] = { x: lerp(fromP.x, toP.x, t), y: lerp(fromP.y, toP.y, t) };
          }
        } else {
          for (const r of ALL_ROLES) {
            currPos[r] = getRolePos(segCount, r);
          }
        }

        // Frecce guida leggere per tutti i segmenti
        for (let s = 0; s < segCount; s++) {
          const col = s === segCount - 1 ? 'rgba(251,146,60,0.28)' : 'rgba(255,255,255,0.20)';
          for (const r of ALL_ROLES) {
            const pA = toPx(getRolePos(s, r));
            const pB = toPx(getRolePos(s + 1, r));
            drawArrow(ctx, pA.px, pA.py, pB.px, pB.py, col);
          }
        }

        // Simboli blocco nella loro fase attiva
        for (const sc of effectiveScreens) {
          const segIdx = Math.max(0, sc.stepIndex - 1);
          const tStart = segIdx * segDur + 0.15 * segDur;
          const tEnd = Math.min(0.9, (segIdx + 1) * segDur + 0.12 * segDur);
          if (rawLoop < tStart || rawLoop > tEnd) continue;
          const sp = toPx(currPos[sc.screener]);
          const tp = sc.target ? toPx(currPos[sc.target]) : { px: hoopPx.x, py: hoopPx.y };
          drawScreenSymbol(ctx, sp.px, sp.py, tp.px, tp.py);
        }

        const ballRes = evaluateCustomPlayBallAt(
          play,
          rawLoop,
          (r) => {
            const p = toPx(currPos[r]);
            return { x: p.px, y: p.py };
          },
          { x: hoopPx.x, y: hoopPx.y },
          { moveEnd: MOVE_END }
        );

        if (ballRes.phase === 'pass' && ballRes.trail) {
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(ballRes.trail[0].x, ballRes.trail[0].y);
          ctx.lineTo(ballRes.trail[1].x, ballRes.trail[1].y);
          ctx.stroke();
          ctx.restore();
        }

        for (const r of ALL_ROLES) {
          const { px, py } = toPx(currPos[r]);
          drawRoleToken(ctx, r, px, py, {
            radius: 14,
            isShooter: r === play.shooterRole,
          });
        }

        drawPlayBasketball(ctx, ballRes.x, ballRes.y, ballRes.scale);
        drawHudPill(
          ctx,
          rawLoop >= MOVE_END
            ? 'ANTEPRIMA · TIRO!'
            : `ANTEPRIMA · FASE ${activeSeg + 1}/${effectiveSteps.length}`
        );

        rafId = requestAnimationFrame(render);
        return;
      }

      // MODALITÀ EDITING STATICO PER LA FASE CORRENTE
      if (safeStepIdx >= 1) {
        for (let s = 0; s < safeStepIdx - 1; s++) {
          for (const r of ALL_ROLES) {
            const pA = toPx(getRolePos(s, r));
            const pB = toPx(getRolePos(s + 1, r));
            drawArrow(ctx, pA.px, pA.py, pB.px, pB.py, 'rgba(148, 163, 184, 0.32)');
            ctx.beginPath();
            ctx.arc(pB.px, pB.py, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
            ctx.fill();
          }
        }

        const activeColor = safeStepIdx === effectiveSteps.length - 1 ? '#fb923c' : '#38bdf8';
        for (const r of ALL_ROLES) {
          const pPrev = toPx(getRolePos(safeStepIdx - 1, r));
          const pCurr = toPx(getRolePos(safeStepIdx, r));
          ctx.beginPath();
          ctx.arc(pPrev.px, pPrev.py, 9, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.fill();
          drawArrow(ctx, pPrev.px, pPrev.py, pCurr.px, pCurr.py, activeColor);
        }

        let stepPassLocalIdx = 0;
        effectivePasses.forEach((ps, globalIdx) => {
          if (ps.stepIndex !== safeStepIdx) return;
          stepPassLocalIdx += 1;
          const pFrom = toPx(getRolePos(safeStepIdx, ps.from));
          const pTo = toPx(getRolePos(safeStepIdx, ps.to));
          drawStyledPass(
            ctx,
            pFrom.px,
            pFrom.py,
            pTo.px,
            pTo.py,
            ps.style,
            `#${globalIdx + 1}`,
            stepPassLocalIdx % 2 === 1 ? 1 : -1
          );
        });

        for (const sc of effectiveScreens) {
          if (sc.stepIndex !== safeStepIdx) continue;
          const pt = toPx(getRolePos(safeStepIdx, sc.screener));
          const tp = sc.target ? toPx(getRolePos(safeStepIdx, sc.target)) : { px: hoopPx.x, py: hoopPx.y };
          drawScreenSymbol(ctx, pt.px, pt.py, tp.px, tp.py);
        }
      }

      const isLastStep = safeStepIdx === effectiveSteps.length - 1;
      if (isLastStep) {
        const shooterPx = toPx(getRolePos(safeStepIdx, play.shooterRole));
        drawArrow(ctx, shooterPx.px, shooterPx.py, hoopPx.x, hoopPx.y, '#10b981', true);
      }

      const activeCarrier = getBallCarrierAtStep(play, safeStepIdx);
      for (const r of ALL_ROLES) {
        const { px, py } = toPx(getRolePos(safeStepIdx, r));
        drawRoleToken(ctx, r, px, py, {
          radius: 14.5,
          isDragged: dragRole === r,
          isShooter: r === play.shooterRole && isLastStep,
          isCarrier: r === activeCarrier,
          showLabel: true,
        });
      }

      drawHudPill(ctx, `FASE ${safeStepIdx + 1} / ${effectiveSteps.length}`);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [play, safeStepIdx, theme, previewing, dragRole]);

  const getPointerCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      px: (e.clientX - rect.left) * (canvas.width / rect.width),
      py: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (previewing || !mapperRef.current) return;
    const pt = getPointerCoords(e);
    if (!pt) return;

    const currentPositions = steps[safeStepIdx]?.positions;
    if (!currentPositions) return;

    let closest: Position | null = null;
    let bestDist = 26;
    for (const r of ALL_ROLES) {
      const rp = mapperRef.current.toPx(currentPositions[r]);
      const d = Math.hypot(rp.px - pt.px, rp.py - pt.py);
      if (d < bestDist) {
        bestDist = d;
        closest = r;
      }
    }
    if (closest) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragRole(closest);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRole || previewing || !mapperRef.current) return;
    const pt = getPointerCoords(e);
    if (!pt) return;
    onChangePosition(safeStepIdx, dragRole, mapperRef.current.fromPx(pt.px, pt.py));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRole) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }
      setDragRole(null);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={540}
      height={520}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`w-full max-w-[540px] h-auto rounded-2xl border border-slate-800 shadow-inner bg-slate-950 touch-none select-none ${
        previewing ? 'cursor-default' : dragRole ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    />
  );
};
