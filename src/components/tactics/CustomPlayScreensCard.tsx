import React from 'react';
import { Plus, ShieldAlert, Trash2 } from 'lucide-react';
import {
  CustomPlay,
  CustomPlayStep,
  PlayScreenAction,
  PlayScreenType,
  Position,
} from '../../types';
import {
  ALL_ROLES,
  MAX_PLAY_SCREENS,
  SCREEN_TYPE_OPTIONS,
} from '../../engine/customPlayEngine';

interface CustomPlayScreensCardProps {
  play: CustomPlay;
  steps: CustomPlayStep[];
  safeStepIdx: number;
  effectiveScreens: (PlayScreenAction & { stepIndex: number })[];
  onCommitScreens: (nextScreens: PlayScreenAction[]) => void;
}

export const CustomPlayScreensCard: React.FC<CustomPlayScreensCardProps> = ({
  play,
  steps,
  safeStepIdx,
  effectiveScreens,
  onCommitScreens,
}) => {
  const lastStepIdx = steps.length - 1;

  const handleAddScreen = () => {
    if (effectiveScreens.length >= MAX_PLAY_SCREENS) return;
    const targetStep = Math.max(1, safeStepIdx);
    const defaultScreener =
      ALL_ROLES.find(
        (r) =>
          r !== play.shooterRole &&
          !effectiveScreens.some((s) => s.screener === r && s.stepIndex === targetStep)
      ) ??
      ALL_ROLES.find((r) => r !== play.shooterRole) ??
      'C';
    const defaultTarget =
      play.shooterRole !== defaultScreener
        ? play.shooterRole
        : play.initialBallHandler !== defaultScreener
        ? play.initialBallHandler
        : ALL_ROLES.find((r) => r !== defaultScreener) ?? 'PG';
    const newScreen: PlayScreenAction = {
      screener: defaultScreener,
      target: defaultTarget,
      type: defaultTarget === play.initialBallHandler ? 'on_ball' : 'off_ball',
      stepIndex: targetStep,
      phase: targetStep === lastStepIdx ? 'end' : 'mid',
    };
    onCommitScreens([...effectiveScreens, newScreen]);
  };

  const handleUpdateScreen = (idx: number, patch: Partial<PlayScreenAction>) => {
    const next = effectiveScreens.map((sc, i) => {
      if (i !== idx) return sc;
      const updated = { ...sc, ...patch };
      if (updated.target === updated.screener) {
        updated.target = undefined;
      }
      const nextStepIdx = Math.max(1, Math.min(lastStepIdx, updated.stepIndex ?? sc.stepIndex));
      updated.stepIndex = nextStepIdx;
      updated.phase = nextStepIdx === lastStepIdx ? 'end' : 'mid';
      return updated;
    });
    onCommitScreens(next);
  };

  const handleRemoveScreen = (idx: number) => {
    onCommitScreens(effectiveScreens.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-xl bg-slate-950/85 border border-slate-800 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>
            Blocchi ({effectiveScreens.length}/{MAX_PLAY_SCREENS})
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddScreen}
          disabled={effectiveScreens.length >= MAX_PLAY_SCREENS}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 border border-amber-500/40 text-amber-300 text-[11px] font-bold cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Aggiungi Blocco
        </button>
      </div>

      {effectiveScreens.length === 0 ? (
        <div className="text-[11px] text-slate-400 py-1">
          Nessun blocco impostato. Premi &quot;Aggiungi Blocco&quot; per scegliere chi blocca e per chi.
        </div>
      ) : (
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
          {effectiveScreens.map((sc, idx) => {
            const isInActivePhase = sc.stepIndex === safeStepIdx;
            return (
              <div
                key={`${sc.screener}_${idx}`}
                className={`p-2.5 rounded-xl border space-y-1.5 ${
                  isInActivePhase
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-amber-300">
                      Blocco #{idx + 1}
                    </span>
                    {isInActivePhase && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[9px] font-extrabold text-amber-200">
                        Fase attiva
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveScreen(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                    title="Rimuovi blocco"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={sc.screener}
                    onChange={(e) =>
                      handleUpdateScreen(idx, { screener: e.target.value as Position })
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white font-semibold"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        Blocca: {r}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sc.target ?? ''}
                    onChange={(e) =>
                      handleUpdateScreen(idx, {
                        target: (e.target.value as Position) || undefined,
                      })
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200"
                  >
                    <option value="">Per chi: Generico</option>
                    {ALL_ROLES.filter((r) => r !== sc.screener).map((r) => (
                      <option key={r} value={r}>
                        Per: {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={sc.type}
                    onChange={(e) =>
                      handleUpdateScreen(idx, { type: e.target.value as PlayScreenType })
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-amber-200"
                  >
                    {SCREEN_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sc.stepIndex}
                    onChange={(e) =>
                      handleUpdateScreen(idx, { stepIndex: Number(e.target.value) })
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-sky-200"
                  >
                    {steps.slice(1).map((_, idxMinusOne) => {
                      const s = idxMinusOne + 1;
                      return (
                        <option key={s} value={s}>
                          In Fase {s + 1} ({s === lastStepIdx ? 'Chiusura' : `Mov. ${s}`})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
