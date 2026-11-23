import React from 'react';
import { Plus, X } from 'lucide-react';
import {
  CustomPlayStep,
  PlayPassAction,
  PlayScreenAction,
  Position,
} from '../../types';
import { MAX_PLAY_STEPS, MIN_PLAY_STEPS } from '../../engine/customPlayEngine';

interface CustomPlayTimelineBarProps {
  steps: CustomPlayStep[];
  safeStepIdx: number;
  previewing: boolean;
  shooterRole: Position;
  passes: (PlayPassAction & { stepIndex: number })[];
  screens: (PlayScreenAction & { stepIndex: number })[];
  onSelectStep: (idx: number) => void;
  onAddStep: () => void;
  onDeleteStep: (idx: number) => void;
  onInsertStepAfter: (afterIdx: number) => void;
  onAlignFromPrevious: () => void;
}

export const CustomPlayTimelineBar: React.FC<CustomPlayTimelineBarProps> = ({
  steps,
  safeStepIdx,
  previewing,
  shooterRole,
  passes,
  screens,
  onSelectStep,
  onAddStep,
  onDeleteStep,
  onInsertStepAfter,
  onAlignFromPrevious,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-stretch gap-2">
        {steps.map((st, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === steps.length - 1;
          const stepPassesCount = passes.filter((p) => p.stepIndex === idx).length;
          const stepScreensCount = screens.filter((s) => s.stepIndex === idx).length;
          const isActive = safeStepIdx === idx && !previewing;

          const title = isFirst
            ? '1. Schieramento'
            : isLast
            ? `${idx + 1}. Chiusura & Tiro`
            : `${idx + 1}. Movimento ${idx}`;

          const sub = isFirst
            ? 'Posizioni iniziali'
            : isLast
            ? `Tiro: ${shooterRole} · ${stepPassesCount}p ${stepScreensCount}b`
            : `${stepPassesCount} pass · ${stepScreensCount} bl.`;

          return (
            <div
              key={st.id || idx}
              role="button"
              tabIndex={0}
              onClick={() => onSelectStep(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectStep(idx);
                }
              }}
              className={`group relative flex items-center gap-2 min-w-[132px] flex-1 basis-[140px] p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-500/15 border-orange-500 text-white'
                  : 'bg-slate-950/75 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold truncate">{title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</div>
              </div>
              {idx >= 1 && steps.length > MIN_PLAY_STEPS && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStep(idx);
                  }}
                  title="Elimina questa fase"
                  className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/15 cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddStep}
          disabled={steps.length >= MAX_PLAY_STEPS}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20 disabled:opacity-40 text-sky-300 text-xs font-extrabold cursor-pointer shrink-0"
          title="Aggiungi un nuovo movimento per i giocatori"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>
            Aggiungi Movimento ({steps.length}/{MAX_PLAY_STEPS})
          </span>
        </button>
      </div>

      {!previewing && (safeStepIdx > 0 || steps.length < MAX_PLAY_STEPS) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px]">
          <span className="text-slate-400">
            {safeStepIdx > 0
              ? `Stai modificando la Fase ${safeStepIdx + 1}: trascina i giocatori per disegnare il taglio successivo.`
              : 'Posiziona i giocatori sullo schieramento iniziale, poi passa o aggiungi fasi di movimento.'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {safeStepIdx > 0 && (
              <button
                type="button"
                onClick={onAlignFromPrevious}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold cursor-pointer"
              >
                Allinea da Fase {safeStepIdx}
              </button>
            )}
            {steps.length < MAX_PLAY_STEPS && safeStepIdx < steps.length - 1 && (
              <button
                type="button"
                onClick={() => onInsertStepAfter(safeStepIdx)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold cursor-pointer"
              >
                + Inserisci Movimento Qui
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
