import React, { useMemo, useState } from 'react';
import { Play, RotateCcw, Square } from 'lucide-react';
import { CustomPlay, PlayPoint, Position, Tactics } from '../../types';
import {
  MAX_PLAY_STEPS,
  MIN_PLAY_STEPS,
  PlayTemplateKey,
  analyzeCustomPlay,
  clonePositions,
  createCustomPlayFromTemplate,
  getEffectivePasses,
  getEffectiveScreens,
  getEffectiveSteps,
  syncCustomPlayFields,
} from '../../engine/customPlayEngine';
import { CustomPlayCanvas } from './CustomPlayCanvas';
import { CustomPlayActionsPanel } from './CustomPlayActionsPanel';
import { CustomPlayLibrarySidebar } from './CustomPlayLibrarySidebar';
import { CustomPlayTimelineBar } from './CustomPlayTimelineBar';

interface CustomPlayDesignerProps {
  customPlays: CustomPlay[];
  onUpdateTactics: (patch: Partial<Tactics>) => void;
}

export const CustomPlayDesigner: React.FC<CustomPlayDesignerProps> = ({
  customPlays,
  onUpdateTactics,
}) => {
  const [selectedId, setSelectedId] = useState<string>(customPlays[0]?.id ?? '');
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [theme, setTheme] = useState<'parquet' | 'tactical'>('parquet');
  const [previewing, setPreviewing] = useState<boolean>(false);

  const activePlay =
    customPlays.find((p) => p.id === selectedId) ?? customPlays[0] ?? null;

  const activeSteps = useMemo(
    () => (activePlay ? getEffectiveSteps(activePlay) : []),
    [activePlay]
  );
  const safeStepIdx = Math.min(activeStepIdx, Math.max(0, activeSteps.length - 1));

  const activePasses = useMemo(
    () => (activePlay ? getEffectivePasses(activePlay) : []),
    [activePlay]
  );
  const activeScreens = useMemo(
    () => (activePlay ? getEffectiveScreens(activePlay) : []),
    [activePlay]
  );

  const analysis = useMemo(
    () => (activePlay ? analyzeCustomPlay(activePlay) : null),
    [activePlay]
  );

  const updatePlay = (updated: CustomPlay) => {
    onUpdateTactics({
      customPlays: customPlays.map((p) => (p.id === updated.id ? updated : p)),
    });
  };

  const handleAddTemplate = (key: PlayTemplateKey) => {
    const newPlay = createCustomPlayFromTemplate(key);
    onUpdateTactics({ customPlays: [...customPlays, newPlay] });
    setSelectedId(newPlay.id);
    setActiveStepIdx(0);
    setPreviewing(false);
  };

  const handleDuplicate = (play: CustomPlay) => {
    const copy: CustomPlay = {
      ...JSON.parse(JSON.stringify(play)),
      id: `cplay_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: `${play.name} (Copia)`.slice(0, 36),
    };
    onUpdateTactics({ customPlays: [...customPlays, copy] });
    setSelectedId(copy.id);
    setActiveStepIdx(0);
    setPreviewing(false);
  };

  const handleDelete = (id: string) => {
    const next = customPlays.filter((p) => p.id !== id);
    onUpdateTactics({ customPlays: next });
    if (selectedId === id) {
      setSelectedId(next[0]?.id ?? '');
      setActiveStepIdx(0);
    }
  };

  const handleImportPlays = (imported: CustomPlay[]) => {
    const merged = [...customPlays, ...imported];
    onUpdateTactics({ customPlays: merged });
    setSelectedId(imported[0].id);
    setActiveStepIdx(0);
    setPreviewing(false);
  };

  const handlePositionChange = (
    targetStepIdx: number,
    role: Position,
    pt: PlayPoint
  ) => {
    if (!activePlay) return;
    const currentSteps = getEffectiveSteps(activePlay);
    if (!currentSteps[targetStepIdx]) return;
    const samePt = (a: PlayPoint, b: PlayPoint) => a.x === b.x && a.y === b.y;
    const oldPt = currentSteps[targetStepIdx].positions[role];

    const nextSteps = currentSteps.map((st) => ({
      ...st,
      positions: clonePositions(st.positions),
    }));
    nextSteps[targetStepIdx].positions[role] = pt;

    for (let k = targetStepIdx + 1; k < nextSteps.length; k++) {
      if (samePt(nextSteps[k].positions[role], oldPt)) {
        nextSteps[k].positions[role] = { ...pt };
      } else {
        break;
      }
    }

    updatePlay(
      syncCustomPlayFields({
        ...activePlay,
        steps: nextSteps,
      })
    );
  };

  const handleAddStep = () => {
    if (!activePlay) return;
    const currentSteps = getEffectiveSteps(activePlay);
    if (currentSteps.length >= MAX_PLAY_STEPS) return;
    const nextSteps = [
      ...currentSteps.map((s) => ({ ...s, positions: clonePositions(s.positions) })),
      {
        id: `step_${Date.now()}_${currentSteps.length}`,
        positions: clonePositions(currentSteps[currentSteps.length - 1].positions),
      },
    ];
    updatePlay(
      syncCustomPlayFields({
        ...activePlay,
        steps: nextSteps,
      })
    );
    setActiveStepIdx(nextSteps.length - 1);
    setPreviewing(false);
  };

  const handleInsertStepAfter = (afterIdx: number) => {
    if (!activePlay) return;
    const currentSteps = getEffectiveSteps(activePlay);
    if (currentSteps.length >= MAX_PLAY_STEPS) return;
    const insertAt = Math.min(currentSteps.length, afterIdx + 1);
    const clonedSteps = currentSteps.map((s) => ({
      ...s,
      positions: clonePositions(s.positions),
    }));
    const newStep = {
      id: `step_${Date.now()}_${insertAt}`,
      positions: clonePositions(clonedSteps[afterIdx].positions),
    };
    const nextSteps = [
      ...clonedSteps.slice(0, insertAt),
      newStep,
      ...clonedSteps.slice(insertAt),
    ];

    const shiftedPasses = getEffectivePasses(activePlay).map((p) => ({
      ...p,
      stepIndex: p.stepIndex >= insertAt ? p.stepIndex + 1 : p.stepIndex,
    }));
    const shiftedScreens = getEffectiveScreens(activePlay).map((s) => ({
      ...s,
      stepIndex: s.stepIndex >= insertAt ? s.stepIndex + 1 : s.stepIndex,
    }));

    updatePlay(
      syncCustomPlayFields({
        ...activePlay,
        steps: nextSteps,
        passes: shiftedPasses,
        screens: shiftedScreens,
      })
    );
    setActiveStepIdx(insertAt);
    setPreviewing(false);
  };

  const handleDeleteStep = (deleteIdx: number) => {
    if (!activePlay) return;
    const currentSteps = getEffectiveSteps(activePlay);
    if (deleteIdx < 1 || currentSteps.length <= MIN_PLAY_STEPS) return;

    const nextSteps = currentSteps
      .filter((_, idx) => idx !== deleteIdx)
      .map((s) => ({ ...s, positions: clonePositions(s.positions) }));

    const nextPasses = getEffectivePasses(activePlay)
      .filter((p) => p.stepIndex !== deleteIdx)
      .map((p) => ({
        ...p,
        stepIndex: p.stepIndex > deleteIdx ? p.stepIndex - 1 : p.stepIndex,
      }));
    const nextScreens = getEffectiveScreens(activePlay)
      .filter((s) => s.stepIndex !== deleteIdx)
      .map((s) => ({
        ...s,
        stepIndex: s.stepIndex > deleteIdx ? s.stepIndex - 1 : s.stepIndex,
      }));

    updatePlay(
      syncCustomPlayFields({
        ...activePlay,
        steps: nextSteps,
        passes: nextPasses,
        screens: nextScreens,
      })
    );
    const nextSafe = Math.min(
      nextSteps.length - 1,
      safeStepIdx >= deleteIdx ? Math.max(0, safeStepIdx - 1) : safeStepIdx
    );
    setActiveStepIdx(nextSafe);
    setPreviewing(false);
  };

  const handleAlignFromPrevious = () => {
    if (!activePlay || safeStepIdx <= 0) return;
    const currentSteps = getEffectiveSteps(activePlay);
    const nextSteps = currentSteps.map((s) => ({
      ...s,
      positions: clonePositions(s.positions),
    }));
    nextSteps[safeStepIdx].positions = clonePositions(nextSteps[safeStepIdx - 1].positions);
    updatePlay(
      syncCustomPlayFields({
        ...activePlay,
        steps: nextSteps,
      })
    );
  };

  const handleResetPlayToBlank = () => {
    if (!activePlay) return;
    const blank = createCustomPlayFromTemplate('blank', activePlay.name);
    updatePlay({
      ...blank,
      id: activePlay.id,
      active: activePlay.active,
    });
    setActiveStepIdx(0);
    setPreviewing(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <CustomPlayLibrarySidebar
        customPlays={customPlays}
        selectedPlayId={activePlay?.id ?? null}
        onSelectPlay={(id) => {
          setSelectedId(id);
          setActiveStepIdx(0);
          setPreviewing(false);
        }}
        onAddTemplate={handleAddTemplate}
        onDuplicatePlay={handleDuplicate}
        onDeletePlay={handleDelete}
        onTogglePlayActive={(cp) => updatePlay({ ...cp, active: !cp.active })}
        onImportPlays={handleImportPlays}
      />

      {/* Colonna Destra: Lavagna Interattiva */}
      <div className="xl:col-span-8 fm-card rounded-2xl p-5 space-y-4">
        {!activePlay || !analysis ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
            <p className="text-sm text-slate-300 font-semibold">
              Seleziona uno schema esistente o creane uno nuovo da zero o da modello base.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => handleAddTemplate('blank')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                + Disegna Schema da Zero
              </button>
              <button
                type="button"
                onClick={() => handleAddTemplate('horns')}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                Parti da Modello Horns
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Barra Nome + Anteprima + Tema */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <input
                  type="text"
                  value={activePlay.name}
                  maxLength={36}
                  onChange={(e) =>
                    updatePlay({ ...activePlay, name: e.target.value })
                  }
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-extrabold text-white focus:outline-none focus:border-orange-500 flex-1 max-w-xs"
                />
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activePlay.active}
                    onChange={(e) =>
                      updatePlay({ ...activePlay, active: e.target.checked })
                    }
                    className="accent-emerald-500"
                  />
                  Attivo nel Playbook
                </label>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTheme('parquet')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      theme === 'parquet' ? 'bg-orange-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Parquet
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('tactical')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      theme === 'tactical' ? 'bg-orange-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Lavagna
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetPlayToBlank}
                  title="Azzera posizioni, blocchi e passaggi"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Azzera
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewing((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                    previewing
                      ? 'bg-rose-500 text-white hover:bg-rose-400'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  {previewing ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      Ferma Anteprima
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Anteprima Animata
                    </>
                  )}
                </button>
              </div>
            </div>

            <CustomPlayTimelineBar
              steps={activeSteps}
              safeStepIdx={safeStepIdx}
              previewing={previewing}
              shooterRole={activePlay.shooterRole}
              passes={activePasses}
              screens={activeScreens}
              onSelectStep={(idx) => {
                setActiveStepIdx(idx);
                setPreviewing(false);
              }}
              onAddStep={handleAddStep}
              onDeleteStep={handleDeleteStep}
              onInsertStepAfter={handleInsertStepAfter}
              onAlignFromPrevious={handleAlignFromPrevious}
            />

            {/* Area Disegno: Canvas + Controlli della Fase */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7 flex flex-col items-center gap-2">
                <CustomPlayCanvas
                  play={activePlay}
                  stepIndex={safeStepIdx}
                  theme={theme}
                  previewing={previewing}
                  onChangePosition={handlePositionChange}
                />
                <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-400">
                  <span>Trascina i ruoli (1–5) sul campo</span>
                  <span>•</span>
                  <span className="text-amber-300 font-bold">T = Blocco</span>
                  <span>•</span>
                  <span className="text-yellow-300 font-bold">---▶ Passaggio (#1, #2...)</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">◯ Tiro finale</span>
                </div>
              </div>

              <div className="lg:col-span-5">
                <CustomPlayActionsPanel
                  play={activePlay}
                  analysis={analysis}
                  stepIndex={safeStepIdx}
                  onUpdatePlay={updatePlay}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
