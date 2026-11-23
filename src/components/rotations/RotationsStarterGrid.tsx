import React from 'react';
import { GripVertical, Minus, Plus, Users } from 'lucide-react';
import { Player, Position } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';

const POSITION_SHORT: Record<Position, string> = {
  PG: 'Playmaker',
  SG: 'Guardia',
  SF: 'Ala Piccola',
  PF: 'Ala Grande',
  C: 'Centro',
};

interface RotationsStarterGridProps {
  starterSlots: { pos: Position; player: Player | null }[];
  starters: Player[];
  bench: Player[];
  healthyReserves: Player[];
  healthyPromotable: Player[];
  draggedPlayerId: string | null;
  dropOverKey: string | null;
  selectedMovePlayerId: string | null;
  onDragStartPlayer: (e: React.DragEvent, playerId: string) => void;
  onDragEnd: () => void;
  onSetDropOverKey: (key: string | null) => void;
  onDropOnStarterSlot: (e: React.DragEvent, pos: Position) => void;
  onMoveClickStarterSlot: (pos: Position, currentOccupant: Player | null) => void;
  onToggleSelectMove: (playerId: string) => void;
  onOpenProfile: (playerId: string) => void;
  onUpdateMinutes: (playerId: string, minutes: number) => void;
  onAssignToStarterSlot: (playerId: string, pos: Position) => void;
  onSwapPlayers: (idA: string, idB: string) => void;
}

export const RotationsStarterGrid: React.FC<RotationsStarterGridProps> = ({
  starterSlots,
  starters,
  bench,
  healthyReserves,
  healthyPromotable,
  draggedPlayerId,
  dropOverKey,
  selectedMovePlayerId,
  onDragStartPlayer,
  onDragEnd,
  onSetDropOverKey,
  onDropOnStarterSlot,
  onMoveClickStarterSlot,
  onToggleSelectMove,
  onOpenProfile,
  onUpdateMinutes,
  onAssignToStarterSlot,
  onSwapPlayers,
}) => {
  return (
    <div className="fm-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Quintetto Base (5 Titolari)
          <span className="text-[11px] font-normal normal-case text-slate-400 hidden sm:inline">
            • Trascina un giocatore o clicca &ldquo;Sposta&rdquo; per scambiarlo in qualsiasi slot
          </span>
        </h2>
        <span className="text-xs text-slate-400">
          Totale Titolari:{' '}
          <strong className="text-white">
            {starters.reduce((s, p) => s + (p.targetMinutes ?? 0), 0)} min
          </strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {starterSlots.map(({ pos, player }) => {
          const slotKey = `starter_${pos}`;
          const isOver = dropOverKey === slotKey;
          const isSelectedForMove = Boolean(player && selectedMovePlayerId === player.id);
          const isMoveTarget = Boolean(
            selectedMovePlayerId && (!player || selectedMovePlayerId !== player.id)
          );
          return (
            <div
              key={pos}
              draggable={Boolean(player && player.injuryWeeks === 0)}
              onDragStart={(e) => {
                if (player) onDragStartPlayer(e, player.id);
              }}
              onDragEnd={onDragEnd}
              onDragOver={(e) => {
                if (draggedPlayerId && (!player || draggedPlayerId !== player.id)) {
                  e.preventDefault();
                }
              }}
              onDragEnter={() => {
                if (draggedPlayerId && (!player || draggedPlayerId !== player.id)) {
                  onSetDropOverKey(slotKey);
                }
              }}
              onDragLeave={() => {
                if (dropOverKey === slotKey) onSetDropOverKey(null);
              }}
              onDrop={(e) => onDropOnStarterSlot(e, pos)}
              onClick={() => {
                if (selectedMovePlayerId) {
                  onMoveClickStarterSlot(pos, player);
                }
              }}
              className={`bg-slate-950/80 border border-l-2 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all ${
                isSelectedForMove
                  ? 'border-amber-400 ring-2 ring-amber-400/60 bg-amber-500/15'
                  : isOver || isMoveTarget
                  ? 'border-orange-400 ring-2 ring-orange-400/50 bg-orange-500/15 scale-[1.01] cursor-pointer'
                  : 'border-slate-800'
              } ${
                player
                  ? player.injuryWeeks > 0
                    ? 'border-l-red-500 bg-red-950/20'
                    : player.isItalianFormation
                    ? 'border-l-emerald-500/70'
                    : 'border-l-amber-500/50'
                  : 'border-l-slate-700'
              } ${
                player && player.injuryWeeks === 0 && !selectedMovePlayerId
                  ? 'cursor-grab active:cursor-grabbing'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  {player && player.injuryWeeks === 0 && (
                    <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className="px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[10px] font-black">
                    {pos}
                  </span>
                  {player && (
                    <>
                      <CountryFlag nationality={player.nationality} size="sm" />
                      <FormationBadge isItalianFormation={player.isItalianFormation} />
                    </>
                  )}
                </div>
                {player && (
                  <span className="text-xs font-black text-amber-300">OVR {player.overall}</span>
                )}
              </div>

              {isMoveTarget && (
                <div className="text-[10px] font-bold text-orange-300 bg-orange-500/20 border border-orange-500/40 rounded px-2 py-0.5 text-center">
                  Clicca per mettere in {pos}
                </div>
              )}

              {player ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProfile(player.id);
                        }}
                        className="text-sm font-bold text-white hover:text-orange-400 text-left truncate w-full cursor-pointer"
                      >
                        {player.firstName[0]}. {player.lastName}
                      </button>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {POSITION_SHORT[player.primaryPosition]} • Cond.{' '}
                        <span
                          className={
                            player.condition >= 80
                              ? 'text-emerald-400'
                              : player.condition >= 65
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }
                        >
                          {player.condition}%
                        </span>
                      </div>
                    </div>
                    {player.injuryWeeks === 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectMove(player.id);
                        }}
                        title="Seleziona per spostare o scambiare"
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer border ${
                          isSelectedForMove
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        {isSelectedForMove ? 'Selezionato' : 'Sposta'}
                      </button>
                    )}
                  </div>

                  {/* Target Minutes Controls */}
                  <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Minuti</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdateMinutes(player.id, (player.targetMinutes ?? 0) - 1)}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono font-bold text-white">
                          {player.targetMinutes ?? 0}
                        </span>
                        <button
                          onClick={() => onUpdateMinutes(player.id, (player.targetMinutes ?? 0) + 1)}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={player.targetMinutes ?? 0}
                        onChange={(e) => onUpdateMinutes(player.id, Number(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Swap dropdown */}
                  <select
                    value=""
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      if (val.startsWith('pos:')) {
                        onAssignToStarterSlot(player.id, val.slice(4) as Position);
                      } else {
                        onSwapPlayers(player.id, val);
                      }
                    }}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-300 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">Sposta / Scambia con...</option>
                    <optgroup label="Ruoli Quintetto Base">
                      {starterSlots
                        .filter((s) => s.pos !== pos)
                        .map((s) => (
                          <option key={s.pos} value={`pos:${s.pos}`}>
                            Slot {s.pos}: {s.player ? `${s.player.lastName} (${s.player.overall})` : '[Vuoto]'}
                          </option>
                        ))}
                    </optgroup>
                    {bench.length > 0 && (
                      <optgroup label="Panchina (6° - 12°)">
                        {bench.map((x, bIdx) => (
                          <option key={x.id} value={x.id}>
                            {bIdx + 6}° • {x.primaryPosition} • {x.lastName} ({x.overall})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {healthyReserves.length > 0 && (
                      <optgroup label="Tribuna / Riserve">
                        {healthyReserves.map((x) => (
                          <option key={x.id} value={x.id}>
                            Ris. • {x.primaryPosition} • {x.lastName} ({x.overall})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </>
              ) : (
                <div className="flex flex-col items-center justify-between gap-3 py-3 flex-1">
                  <div className="text-xs text-slate-500 text-center">
                    Slot vuoto
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Trascina qui o seleziona
                    </div>
                  </div>
                  {healthyPromotable.length > 0 && (
                    <select
                      value=""
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        if (e.target.value) onAssignToStarterSlot(e.target.value, pos);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-orange-500/40 text-[11px] text-orange-200 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="">Metti titolare in {pos}...</option>
                      {healthyPromotable.map((cand) => (
                        <option key={cand.id} value={cand.id}>
                          {cand.primaryPosition} • {cand.lastName} ({cand.overall})
                          {cand.rosterSlot === 'reserve' ? ' [Ris.]' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
