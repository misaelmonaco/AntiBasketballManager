import React from 'react';
import { Plus, Repeat, Trash2 } from 'lucide-react';
import {
  CustomPlay,
  CustomPlayStep,
  PlayPassAction,
  PlayPassStyle,
  Position,
} from '../../types';
import {
  ALL_ROLES,
  MAX_PLAY_PASSES,
  PASS_STYLE_OPTIONS,
  getBallCarrierAtStep,
} from '../../engine/customPlayEngine';

interface CustomPlayPassesCardProps {
  play: CustomPlay;
  steps: CustomPlayStep[];
  safeStepIdx: number;
  effectivePasses: (PlayPassAction & { stepIndex: number })[];
  onCommitPasses: (nextPasses: PlayPassAction[]) => void;
}

export const CustomPlayPassesCard: React.FC<CustomPlayPassesCardProps> = ({
  play,
  steps,
  safeStepIdx,
  effectivePasses,
  onCommitPasses,
}) => {
  const lastStepIdx = steps.length - 1;

  const handleAddPass = () => {
    if (effectivePasses.length >= MAX_PLAY_PASSES) return;
    const targetStep = Math.max(1, safeStepIdx);
    const defaultFrom = getBallCarrierAtStep(play, targetStep);
    const defaultTo =
      targetStep === lastStepIdx && play.shooterRole !== defaultFrom
        ? play.shooterRole
        : ALL_ROLES.find((r) => r !== defaultFrom && r === 'SG') ??
          ALL_ROLES.find((r) => r !== defaultFrom)!;
    const newPass: PlayPassAction = {
      from: defaultFrom,
      to: defaultTo,
      style: 'diretto',
      stepIndex: targetStep,
    };
    onCommitPasses([...effectivePasses, newPass]);
  };

  const handleUpdatePass = (idx: number, patch: Partial<PlayPassAction>) => {
    const next = effectivePasses.map((ps, i) => {
      if (i !== idx) return ps;
      const merged = { ...ps, ...patch };
      if (merged.from === merged.to) {
        merged.to = ALL_ROLES.find((r) => r !== merged.from) ?? merged.to;
      }
      merged.stepIndex = Math.max(1, Math.min(lastStepIdx, merged.stepIndex ?? ps.stepIndex));
      return merged;
    });
    onCommitPasses(next);
  };

  const handleRemovePass = (idx: number) => {
    onCommitPasses(effectivePasses.filter((_, i) => i !== idx));
  };

  const endCarrier = getBallCarrierAtStep(play, lastStepIdx);
  const ballFlowRoles: Position[] = [
    play.initialBallHandler,
    ...effectivePasses.map((p) => p.to),
  ];

  return (
    <div className="rounded-xl bg-slate-950/85 border border-slate-800 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-sky-400">
          <Repeat className="w-3.5 h-3.5" />
          <span>
            Passaggi ({effectivePasses.length}/{MAX_PLAY_PASSES})
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddPass}
          disabled={effectivePasses.length >= MAX_PLAY_PASSES}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 border border-sky-500/40 text-sky-300 text-[11px] font-bold cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Aggiungi Passaggio
        </button>
      </div>

      {effectivePasses.length === 0 ? (
        <div className="text-[11px] text-slate-400 py-1">
          Nessun passaggio impostato (azione in palleggio). Premi &quot;Aggiungi Passaggio&quot; per costruire la circolazione di palla.
        </div>
      ) : (
        <div className="space-y-2 max-h-[290px] overflow-y-auto pr-0.5">
          {effectivePasses.map((ps, idx) => {
            const activeStyle = PASS_STYLE_OPTIONS.find(
              (o) => o.value === (ps.style ?? 'diretto')
            );
            const isInActivePhase = ps.stepIndex === safeStepIdx;
            return (
              <div
                key={`${ps.from}_${ps.to}_${idx}`}
                className={`p-2.5 rounded-xl border space-y-1.5 ${
                  isInActivePhase
                    ? 'bg-sky-500/10 border-sky-500/50'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-yellow-300">
                      Passaggio #{idx + 1}
                    </span>
                    {isInActivePhase && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-[9px] font-extrabold text-sky-200">
                        Fase attiva
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePass(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                    title="Rimuovi passaggio"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={ps.from}
                    onChange={(e) =>
                      handleUpdatePass(idx, { from: e.target.value as Position })
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white font-semibold"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        Da: {r}
                      </option>
                    ))}
                  </select>

                  <select
                    value={ps.to}
                    onChange={(e) =>
                      handleUpdatePass(idx, { to: e.target.value as Position })
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white font-semibold"
                  >
                    {ALL_ROLES.filter((r) => r !== ps.from).map((r) => (
                      <option key={r} value={r}>
                        A: {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={ps.style ?? 'diretto'}
                    onChange={(e) =>
                      handleUpdatePass(idx, { style: e.target.value as PlayPassStyle })
                    }
                    className="bg-slate-950 border border-yellow-500/40 rounded-lg px-2 py-1 text-[11px] font-semibold text-yellow-200"
                  >
                    {PASS_STYLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={ps.stepIndex}
                    onChange={(e) =>
                      handleUpdatePass(idx, { stepIndex: Number(e.target.value) })
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

                {activeStyle && (
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {activeStyle.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {effectivePasses.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-slate-800/80">
          <div className="text-[10px] text-slate-300">
            Catena palla:{' '}
            <span className="font-bold text-yellow-300">
              {ballFlowRoles.join(' → ')}
            </span>
          </div>
          {endCarrier !== play.shooterRole && (
            <div className="text-[10px] text-amber-300/90 leading-tight">
              Nota: l&apos;ultimo passaggio termina a <b>{endCarrier}</b>, ma il tiro finale è assegnato a <b>{play.shooterRole}</b>.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
