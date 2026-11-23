import React from 'react';
import { GripVertical, HeartPulse } from 'lucide-react';
import { Player, Position } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';

interface RotationsReservesGridProps {
  reserves: Player[];
  starterSlots: { pos: Position; player: Player | null }[];
  bench: Player[];
  draggedPlayerId: string | null;
  dropOverKey: string | null;
  selectedMovePlayerId: string | null;
  onDragStartPlayer: (e: React.DragEvent, playerId: string) => void;
  onDragEnd: () => void;
  onSetDropOverKey: (key: string | null) => void;
  onDropOnPlayer: (e: React.DragEvent, targetPlayerId: string) => void;
  onMoveClickPlayer: (targetPlayerId: string) => void;
  onToggleSelectMove: (playerId: string) => void;
  onOpenProfile: (playerId: string) => void;
  onAssignToStarterSlot: (playerId: string, pos: Position) => void;
  onSwapPlayers: (idA: string, idB: string) => void;
}

export const RotationsReservesGrid: React.FC<RotationsReservesGridProps> = ({
  reserves,
  starterSlots,
  bench,
  draggedPlayerId,
  dropOverKey,
  selectedMovePlayerId,
  onDragStartPlayer,
  onDragEnd,
  onSetDropOverKey,
  onDropOnPlayer,
  onMoveClickPlayer,
  onToggleSelectMove,
  onOpenProfile,
  onAssignToStarterSlot,
  onSwapPlayers,
}) => {
  if (reserves.length === 0) return null;

  return (
    <div className="fm-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
          Tribuna / Fuori Referto ({reserves.length})
        </h2>
        <span className="text-xs text-slate-500">
          Trascina, clicca &ldquo;Sposta&rdquo; o usa il menu per inserire in Quintetto o Panchina
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {reserves.map((p) => {
          const reserveKey = `reserve_${p.id}`;
          const isOverReserve = dropOverKey === reserveKey;
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
                if (draggedPlayerId && draggedPlayerId !== p.id && p.injuryWeeks === 0) {
                  e.preventDefault();
                }
              }}
              onDragEnter={() => {
                if (draggedPlayerId && draggedPlayerId !== p.id && p.injuryWeeks === 0) {
                  onSetDropOverKey(reserveKey);
                }
              }}
              onDragLeave={() => {
                if (dropOverKey === reserveKey) onSetDropOverKey(null);
              }}
              onDrop={(e) => {
                if (p.injuryWeeks === 0) onDropOnPlayer(e, p.id);
              }}
              onClick={() => {
                if (isMoveTarget) onMoveClickPlayer(p.id);
              }}
              className={`flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-slate-950/70 border transition-all ${
                isSelectedForMove
                  ? 'border-amber-400 ring-2 ring-amber-400/60 bg-amber-500/15'
                  : isOverReserve || isMoveTarget
                  ? 'border-orange-400 ring-2 ring-orange-400/40 bg-orange-500/10 cursor-pointer'
                  : 'border-slate-800'
              } ${
                p.injuryWeeks > 0
                  ? 'opacity-65 border-red-900/50'
                  : 'hover:border-orange-500/50 ' +
                    (!selectedMovePlayerId ? 'cursor-grab active:cursor-grabbing' : '')
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {p.injuryWeeks === 0 ? (
                    <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : (
                    <HeartPulse className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                  <CountryFlag nationality={p.nationality} size="sm" />
                  <div className="min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProfile(p.id);
                      }}
                      className="text-xs font-bold text-white hover:text-orange-400 truncate block text-left cursor-pointer"
                    >
                      {p.firstName[0]}. {p.lastName}
                    </button>
                    <div className="text-[10px] text-slate-400">
                      {p.primaryPosition} • OVR {p.overall}
                      {p.injuryWeeks > 0 && (
                        <span className="text-red-400 font-bold"> • Inf. {p.injuryWeeks}s</span>
                      )}
                    </div>
                  </div>
                </div>
                <FormationBadge isItalianFormation={p.isItalianFormation} />
              </div>

              {p.injuryWeeks === 0 && (
                <div
                  className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onToggleSelectMove(p.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer border ${
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
                    className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-300 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">Inserisci per...</option>
                    <optgroup label="Quintetto Base (Titolari)">
                      {starterSlots.map((s) => (
                        <option key={s.pos} value={`pos:${s.pos}`}>
                          {s.pos}: {s.player ? `${s.player.lastName} (${s.player.overall})` : '[Vuoto]'}
                        </option>
                      ))}
                    </optgroup>
                    {bench.length > 0 && (
                      <optgroup label="Panchina (6° - 12°)">
                        {bench.map((b, bIdx) => (
                          <option key={b.id} value={b.id}>
                            {bIdx + 6}° • {b.primaryPosition} • {b.lastName} ({b.overall})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
