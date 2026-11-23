import React from 'react';
import { ArrowDown, ArrowUp, GripVertical, Minus, Plus } from 'lucide-react';
import { Player, Position } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';

interface RotationsBenchListProps {
  bench: Player[];
  starterSlots: { pos: Position; player: Player | null }[];
  healthyReserves: Player[];
  draggedPlayerId: string | null;
  dropOverKey: string | null;
  selectedMovePlayerId: string | null;
  onDragStartPlayer: (e: React.DragEvent, playerId: string) => void;
  onDragEnd: () => void;
  onSetDropOverKey: (key: string | null) => void;
  onDropOnPlayer: (e: React.DragEvent, targetPlayerId: string) => void;
  onMoveClickPlayer: (targetPlayerId: string) => void;
  onToggleSelectMove: (playerId: string) => void;
  onMoveBenchOrder: (playerId: string, dir: 'up' | 'down') => void;
  onOpenProfile: (playerId: string) => void;
  onUpdateMinutes: (playerId: string, minutes: number) => void;
  onAssignToStarterSlot: (playerId: string, pos: Position) => void;
  onSwapPlayers: (idA: string, idB: string) => void;
}

export const RotationsBenchList: React.FC<RotationsBenchListProps> = ({
  bench,
  starterSlots,
  healthyReserves,
  draggedPlayerId,
  dropOverKey,
  selectedMovePlayerId,
  onDragStartPlayer,
  onDragEnd,
  onSetDropOverKey,
  onDropOnPlayer,
  onMoveClickPlayer,
  onToggleSelectMove,
  onMoveBenchOrder,
  onOpenProfile,
  onUpdateMinutes,
  onAssignToStarterSlot,
  onSwapPlayers,
}) => {
  return (
    <div className="fm-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-sky-400">
          Panchina (6° – 12° Uomo)
        </h2>
        <span className="text-xs text-slate-400">
          Totale Panchina:{' '}
          <strong className="text-white">
            {bench.reduce((s, p) => s + (p.targetMinutes ?? 0), 0)} min
          </strong>
        </span>
      </div>

      {bench.length === 0 ? (
        <div className="text-xs text-slate-500 p-6 text-center bg-slate-950/50 rounded-xl border border-slate-800">
          Nessuna riserva in panchina.
        </div>
      ) : (
        <div className="space-y-2">
          {bench.map((p, idx) => {
            const benchKey = `bench_${p.id}`;
            const isOverBench = dropOverKey === benchKey;
            const isSelectedForMove = selectedMovePlayerId === p.id;
            const isMoveTarget = Boolean(
              selectedMovePlayerId && selectedMovePlayerId !== p.id && p.injuryWeeks === 0
            );
            return (
              <div
                key={p.id}
                draggable={p.injuryWeeks === 0}
                onDragStart={(e) => onDragStartPlayer(e, p.id)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => {
                  if (draggedPlayerId && draggedPlayerId !== p.id) {
                    e.preventDefault();
                  }
                }}
                onDragEnter={() => {
                  if (draggedPlayerId && draggedPlayerId !== p.id) {
                    onSetDropOverKey(benchKey);
                  }
                }}
                onDragLeave={() => {
                  if (dropOverKey === benchKey) onSetDropOverKey(null);
                }}
                onDrop={(e) => onDropOnPlayer(e, p.id)}
                onClick={() => {
                  if (isMoveTarget) onMoveClickPlayer(p.id);
                }}
                className={`flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-xl bg-slate-950/75 border border-l-2 transition-all ${
                  isSelectedForMove
                    ? 'border-amber-400 ring-2 ring-amber-400/60 bg-amber-500/15'
                    : isOverBench || isMoveTarget
                    ? 'border-sky-400 ring-2 ring-sky-400/40 bg-sky-500/10 cursor-pointer'
                    : 'border-slate-800'
                } ${
                  p.injuryWeeks > 0
                    ? 'border-l-red-500'
                    : p.isItalianFormation
                    ? 'border-l-emerald-500/70'
                    : 'border-l-amber-500/50'
                } ${
                  p.injuryWeeks === 0 && !selectedMovePlayerId
                    ? 'cursor-grab active:cursor-grabbing'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-[200px]">
                  {p.injuryWeeks === 0 && (
                    <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className="w-8 h-7 rounded-lg bg-slate-800 text-sky-300 font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 6}°
                  </span>
                  <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onMoveBenchOrder(p.id, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-25 text-slate-400 cursor-pointer"
                      title="Sposta prima nelle rotazioni"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onMoveBenchOrder(p.id, 'down')}
                      disabled={idx === bench.length - 1}
                      className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-25 text-slate-400 cursor-pointer"
                      title="Sposta dopo nelle rotazioni"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <CountryFlag nationality={p.nationality} size="sm" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProfile(p.id);
                        }}
                        className="text-sm font-bold text-white hover:text-orange-400 cursor-pointer text-left"
                      >
                        {p.firstName} {p.lastName}
                      </button>
                      <FormationBadge isItalianFormation={p.isItalianFormation} />
                      {isMoveTarget && (
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-bold">
                          Clicca per scambiare
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="font-semibold text-slate-300">{p.primaryPosition}</span>
                      <span>• OVR {p.overall}</span>
                      <span>• Cond. {p.condition}%</span>
                      {p.injuryWeeks > 0 && (
                        <span className="text-red-400 font-bold">
                          • Infortunato ({p.injuryWeeks} sett.)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slider + +/- + Sposta + Swap dropdown */}
                <div
                  className="flex flex-wrap items-center gap-3 flex-1 max-w-xl justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-[220px]">
                    <button
                      onClick={() => onUpdateMinutes(p.id, (p.targetMinutes ?? 0) - 1)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="flex-1 flex items-center"
                    >
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={p.targetMinutes ?? 0}
                        onChange={(e) => onUpdateMinutes(p.id, Number(e.target.value))}
                        className="w-full accent-sky-400 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={() => onUpdateMinutes(p.id, (p.targetMinutes ?? 0) + 1)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="w-10 text-right font-mono text-xs font-bold text-white">
                      {p.targetMinutes ?? 0}m
                    </span>
                  </div>

                  {p.injuryWeeks === 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => onToggleSelectMove(p.id)}
                        title="Seleziona per spostare o scambiare"
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border ${
                          isSelectedForMove
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        {isSelectedForMove ? 'Selezionato' : 'Sposta'}
                      </button>

                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          if (val.startsWith('pos:')) {
                            onAssignToStarterSlot(p.id, val.slice(4) as Position);
                          } else {
                            onSwapPlayers(p.id, val);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-300 focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value="">Sposta in...</option>
                        <optgroup label="Quintetto Base (Titolari)">
                          {starterSlots.map((s) => (
                            <option key={s.pos} value={`pos:${s.pos}`}>
                              Titolare {s.pos}: {s.player ? `${s.player.lastName} (${s.player.overall})` : '[Vuoto]'}
                            </option>
                          ))}
                        </optgroup>
                        {bench.length > 1 && (
                          <optgroup label="Scambia ordine Panchina">
                            {bench
                              .filter((b) => b.id !== p.id)
                              .map((b, bIdx) => (
                                <option key={b.id} value={b.id}>
                                  {bench.indexOf(b) + 6}° ({bIdx + 1}) • {b.primaryPosition} • {b.lastName}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {healthyReserves.length > 0 && (
                          <optgroup label="Manda in Tribuna per...">
                            {healthyReserves.map((r) => (
                              <option key={r.id} value={r.id}>
                                Ris. • {r.primaryPosition} • {r.lastName} ({r.overall})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
