import React, { useEffect, useRef, useState } from 'react';
import { MatchState } from '../types';
import {
  Vec2,
  clamp01,
  computePlayKeyframes,
  drawFibaCourtFloor,
  easeInOutCubic,
  getActiveSchemeName,
} from '../engine/courtPlaybook';
import {
  RecordedShot,
  drawBallTrail,
  drawCourtBasketball,
  drawMovementArrows,
  drawPlayerCircle,
  drawRimFlash,
  drawScreenRings,
  drawShotChartLayer,
  getPlayerNumber,
  interpolateKeyframes,
} from './match/courtCanvasRenderer';

interface Props {
  match: MatchState;
  speed: 1 | 2 | 5;
  playing: boolean;
}

type CourtTheme = 'parquet' | 'tactical';
type CourtViewMode = 'live' | 'shotchart';

const SHOT_ACTIONS = new Set([
  'three_shot',
  'two_shot',
  'drive',
  'post_up',
  'fastbreak',
  'pick_and_roll',
]);

export const BasketballCourtCanvas: React.FC<Props> = ({ match, speed, playing }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [theme, setTheme] = useState<CourtTheme>('parquet');
  const [viewMode, setViewMode] = useState<CourtViewMode>('live');
  const [showArrows, setShowArrows] = useState<boolean>(true);
  const [showNames, setShowNames] = useState<boolean>(true);

  const shotsRef = useRef<RecordedShot[]>([]);
  const lastGameIdRef = useRef<string>(match.gameId);
  const prevPositionsRef = useRef<{
    attackSide: 'home' | 'away';
    off: Vec2[];
    def: Vec2[];
  } | null>(null);
  const latestRenderedRef = useRef<{ off: Vec2[]; def: Vec2[] } | null>(null);
  const animRef = useRef<{ startTime: number; duration: number }>({
    startTime: performance.now(),
    duration: 920,
  });

  useEffect(() => {
    if (lastGameIdRef.current !== match.gameId) {
      lastGameIdRef.current = match.gameId;
      shotsRef.current = [];
    }
    const v = match.visual;
    if (
      SHOT_ACTIONS.has(v.actionType) &&
      typeof v.made === 'boolean' &&
      !shotsRef.current.some((s) => s.possession === match.possessionCount)
    ) {
      const jitter = ((match.possessionCount * 7) % 5) - 2;
      shotsRef.current.push({
        possession: match.possessionCount,
        teamId: v.possessionTeamId,
        x: Math.max(5, Math.min(95, v.ballX)),
        y: Math.max(8, Math.min(92, v.ballY + jitter)),
        made: v.made,
        isThree: v.actionType === 'three_shot',
      });
    }
  }, [match.gameId, match.possessionCount, match.visual]);

  useEffect(() => {
    if (latestRenderedRef.current) {
      prevPositionsRef.current = {
        attackSide: match.visual.attackSide,
        off: latestRenderedRef.current.off.map((p) => ({ ...p })),
        def: latestRenderedRef.current.def.map((p) => ({ ...p })),
      };
    }
    const duration = speed === 1 ? 940 : speed === 2 ? 440 : 140;
    animRef.current = {
      startTime: performance.now(),
      duration,
    };
  }, [match.possessionCount, match.visual, speed]);

  useEffect(() => {
    let rafId = 0;

    const renderFrame = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const pad = 18;
      const cw = w - pad * 2;
      const ch = h - pad * 2;

      const elapsed = now - animRef.current.startTime;
      const rawT = playing ? clamp01(elapsed / animRef.current.duration) : 1;
      const t = easeInOutCubic(rawT);

      const { leftHoopX, rightHoopX, midY } = drawFibaCourtFloor(ctx, w, h, pad, theme);
      const toPx = (v: Vec2) => ({
        px: pad + (v.x / 100) * cw,
        py: pad + (v.y / 100) * ch,
      });

      if (viewMode === 'shotchart') {
        drawShotChartLayer(ctx, pad, cw, ch, shotsRef.current, toPx);
        return;
      }

      const keyframes = computePlayKeyframes(match);
      const { offPositions, defPositions, hasMultiFrames } = interpolateKeyframes(
        keyframes,
        t,
        prevPositionsRef.current
      );
      latestRenderedRef.current = { off: offPositions, def: defPositions };

      if (showArrows) {
        drawMovementArrows(ctx, keyframes, hasMultiFrames, theme, toPx);
      }

      drawScreenRings(ctx, keyframes, t, toPx);

      const ballState = keyframes.ballAt(t, offPositions, defPositions);
      drawBallTrail(ctx, ballState.trail, toPx);
      drawRimFlash(ctx, keyframes.rimFlash, match.visual.attackSide, leftHoopX, rightHoopX, midY, t);

      const attackIsHome = match.visual.attackSide === 'home';
      const homeActive = match.home.players.filter((p) => p.onCourt).slice(0, 5);
      const awayActive = match.away.players.filter((p) => p.onCourt).slice(0, 5);
      const activeShooterId = match.visual.shooterId;

      homeActive.forEach((p, i) => {
        const pos = (attackIsHome ? offPositions : defPositions)[i] ?? { x: 50, y: 50 };
        drawPlayerCircle(
          ctx,
          p,
          pos,
          match.home.primaryColor,
          match.home.secondaryColor,
          getPlayerNumber(p, i),
          attackIsHome,
          Boolean(activeShooterId && p.playerId === activeShooterId),
          showNames,
          toPx
        );
      });

      awayActive.forEach((p, i) => {
        const pos = (attackIsHome ? defPositions : offPositions)[i] ?? { x: 50, y: 50 };
        drawPlayerCircle(
          ctx,
          p,
          pos,
          match.away.primaryColor,
          match.away.secondaryColor,
          getPlayerNumber(p, i),
          !attackIsHome,
          Boolean(activeShooterId && p.playerId === activeShooterId),
          showNames,
          toPx
        );
      });

      drawCourtBasketball(ctx, ballState, toPx);

      if (rawT < 1 && playing) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [match, theme, viewMode, showArrows, showNames, playing, speed]);

  const activeScheme = getActiveSchemeName(match);
  const possessionTeam = match.visual.attackSide === 'home' ? match.home : match.away;

  return (
    <div className="fm-card rounded-2xl p-2.5 space-y-2 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: possessionTeam.primaryColor }}
          />
          <span className="font-bold text-slate-200">{possessionTeam.shortName}</span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 font-bold">
            {activeScheme}
          </span>
          {viewMode === 'shotchart' && (
            <div className="flex items-center gap-2 ml-1 text-[10px] font-bold">
              <span className="text-emerald-400">● Segnato</span>
              <span className="text-rose-400">✕ Sbagliato</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'live' ? 'shotchart' : 'live'))}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
              viewMode === 'shotchart'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {viewMode === 'shotchart' ? 'Live 2D' : 'Mappa Tiri'}
          </button>
          <button
            type="button"
            onClick={() => setShowNames((v) => !v)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
              showNames
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            Nomi
          </button>
          <button
            type="button"
            onClick={() => setShowArrows((v) => !v)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
              showArrows
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            Frecce
          </button>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setTheme('parquet')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                theme === 'parquet' ? 'bg-orange-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Parquet
            </button>
            <button
              type="button"
              onClick={() => setTheme('tactical')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                theme === 'tactical' ? 'bg-orange-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Lavagna
            </button>
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={640}
        height={340}
        className="w-full h-auto rounded-xl border border-slate-800 shadow-inner bg-slate-950"
      />
    </div>
  );
};
