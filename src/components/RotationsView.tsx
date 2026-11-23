import React, { useState } from 'react';
import {
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HeartPulse,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Player, Position } from '../types';
import { PageHeader } from './PageHeader';
import { RotationsStarterGrid } from './rotations/RotationsStarterGrid';
import { RotationsBenchList } from './rotations/RotationsBenchList';
import { RotationsReservesGrid } from './rotations/RotationsReservesGrid';

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

function assignStartersToFiveSlots(starters: Player[]): { pos: Position; player: Player | null }[] {
  const remaining = [...starters];
  const assigned = new Map<Position, Player>();

  for (const pos of POSITIONS) {
    const idx = remaining.findIndex((p) => p.starterSlot === pos);
    if (idx !== -1) {
      assigned.set(pos, remaining[idx]);
      remaining.splice(idx, 1);
    }
  }
  for (const pos of POSITIONS) {
    if (assigned.has(pos)) continue;
    const idx = remaining.findIndex((p) => p.primaryPosition === pos);
    if (idx !== -1) {
      assigned.set(pos, remaining[idx]);
      remaining.splice(idx, 1);
    }
  }
  for (const pos of POSITIONS) {
    if (assigned.has(pos)) continue;
    const idx = remaining.findIndex((p) => p.secondaryPosition === pos);
    if (idx !== -1) {
      assigned.set(pos, remaining[idx]);
      remaining.splice(idx, 1);
    }
  }
  for (const pos of POSITIONS) {
    if (assigned.has(pos)) continue;
    const next = remaining.shift();
    if (next) assigned.set(pos, next);
  }

  return POSITIONS.map((pos) => ({ pos, player: assigned.get(pos) ?? null }));
}

export const RotationsView: React.FC = () => {
  const {
    career,
    swapRotationPlayers,
    assignPlayerToStarterSlot,
    moveBenchPlayerOrder,
    updatePlayerTargetMinutes,
    autoBalanceMinutes,
    autoAdjustForInjuries,
    zeroAllMinutes,
    openPlayerProfile,
    setActiveTab,
  } = useGameStore();

  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dropOverKey, setDropOverKey] = useState<string | null>(null);
  const [selectedMovePlayerId, setSelectedMovePlayerId] = useState<string | null>(null);

  if (!career) return null;
  const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;

  const starters = userTeam.roster.filter((p) => p.rosterSlot === 'starter');
  const bench = userTeam.roster
    .filter((p) => p.rosterSlot === 'bench')
    .sort((a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99) || b.overall - a.overall);
  const reserves = userTeam.roster
    .filter((p) => p.rosterSlot === 'reserve')
    .sort((a, b) => a.injuryWeeks - b.injuryWeeks || b.overall - a.overall);
  const active = [...starters, ...bench];
  const injuredInActive = active.filter((p) => p.injuryWeeks > 0);
  const selectedMovePlayer = selectedMovePlayerId
    ? userTeam.roster.find((p) => p.id === selectedMovePlayerId) ?? null
    : null;

  const handleDragStartPlayer = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData('text/plain', playerId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPlayerId(playerId);
  };

  const handleDragEnd = () => {
    setDraggedPlayerId(null);
    setDropOverKey(null);
  };

  const handleDropOnStarterSlot = (e: React.DragEvent, pos: Position) => {
    e.preventDefault();
    const sourceId = draggedPlayerId || e.dataTransfer.getData('text/plain');
    if (sourceId) assignPlayerToStarterSlot(sourceId, pos);
    handleDragEnd();
  };

  const handleDropOnPlayer = (e: React.DragEvent, targetPlayerId: string) => {
    e.preventDefault();
    const sourceId = draggedPlayerId || e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetPlayerId) {
      swapRotationPlayers(sourceId, targetPlayerId);
    }
    handleDragEnd();
  };

  const handleMoveClickStarterSlot = (pos: Position, currentOccupant: Player | null) => {
    if (!selectedMovePlayerId) return;
    if (!currentOccupant || currentOccupant.id !== selectedMovePlayerId) {
      assignPlayerToStarterSlot(selectedMovePlayerId, pos);
    }
    setSelectedMovePlayerId(null);
  };

  const handleMoveClickPlayer = (targetPlayerId: string) => {
    if (!selectedMovePlayerId) return;
    if (selectedMovePlayerId !== targetPlayerId) {
      swapRotationPlayers(selectedMovePlayerId, targetPlayerId);
    }
    setSelectedMovePlayerId(null);
  };

  const toggleSelectMove = (playerId: string) => {
    setSelectedMovePlayerId((cur) => (cur === playerId ? null : playerId));
  };

  const healthyReserves = reserves.filter((p) => p.injuryWeeks === 0);
  const healthyPromotable = [...bench, ...healthyReserves];

  const totalMinutes = active.reduce((sum, p) => sum + (p.targetMinutes ?? 0), 0);
  const starterSlots = assignStartersToFiveSlots(starters);

  const posMinutes: Record<Position, number> = { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 };
  for (const p of active) {
    const m = p.targetMinutes ?? 0;
    if (p.secondaryPosition) {
      posMinutes[p.primaryPosition] += Math.round(m * 0.75);
      posMinutes[p.secondaryPosition] += Math.round(m * 0.25);
    } else {
      posMinutes[p.primaryPosition] += m;
    }
  }

  const isExact200 = totalMinutes === 200;

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Area Tecnica"
        title="Rotazioni & Minutaggio"
        subtitle="Quintetto Base (5 titolari), ordine Panchina (6°–12° uomo) e distribuzione dei 200 minuti partita"
        right={
          <>
            {injuredInActive.length > 0 && (
              <button
                onClick={autoAdjustForInjuries}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 text-xs font-extrabold transition-colors cursor-pointer"
              >
                <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                Adatta per Infortuni ({injuredInActive.length})
              </button>
            )}
            <button
              onClick={autoBalanceMinutes}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Bilancia Automaticamente
            </button>
            <button
              onClick={zeroAllMinutes}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Azzera
            </button>
          </>
        }
      />

      {active.length !== 12 && (
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-red-200">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>
              Hai attualmente <strong>{active.length}/12</strong> giocatori convocati A Referto.
              Seleziona esattamente 12 giocatori nella scheda <strong>Roster</strong>.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('roster')}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
          >
            Vai a Roster
          </button>
        </div>
      )}

      {/* Monte Minuti 200/200 & Copertura Ruoli */}
      <div className="fm-card rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isExact200 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Clock className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <div className="text-sm font-extrabold text-white">
                Minuti Assegnati:{' '}
                <span className={isExact200 ? 'text-emerald-400' : 'text-amber-400'}>
                  {totalMinutes} / 200
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {isExact200
                  ? 'Distribuzione perfetta: 40 minuti × 5 giocatori in campo.'
                  : totalMinutes < 200
                  ? `Mancano ancora ${200 - totalMinutes} minuti da assegnare.`
                  : `Hai assegnato ${totalMinutes - 200} minuti in eccesso.`}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {POSITIONS.map((pos) => {
              const mins = posMinutes[pos];
              const low = mins < 25;
              return (
                <div
                  key={pos}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                    low
                      ? 'bg-red-500/15 border-red-500/40 text-red-300'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  {pos}: <span className={low ? 'text-red-300' : 'text-orange-400'}>{mins}m</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-200 ${
              isExact200
                ? 'bg-emerald-500'
                : totalMinutes > 200
                ? 'bg-red-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, Math.round((totalMinutes / 200) * 100))}%` }}
          />
        </div>
      </div>

      {selectedMovePlayer && (
        <div className="p-3.5 rounded-2xl bg-orange-500/15 border border-orange-500/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-orange-100">
            <ArrowLeftRight className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              <strong>Modalità Spostamento:</strong> clicca sullo slot di destinazione per spostare{' '}
              <strong className="text-white">
                {selectedMovePlayer.firstName} {selectedMovePlayer.lastName}
              </strong>{' '}
              ({selectedMovePlayer.primaryPosition} • OVR {selectedMovePlayer.overall}).
            </span>
          </div>
          <button
            onClick={() => setSelectedMovePlayerId(null)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Annulla
          </button>
        </div>
      )}

      <RotationsStarterGrid
        starterSlots={starterSlots}
        starters={starters}
        bench={bench}
        healthyReserves={healthyReserves}
        healthyPromotable={healthyPromotable}
        draggedPlayerId={draggedPlayerId}
        dropOverKey={dropOverKey}
        selectedMovePlayerId={selectedMovePlayerId}
        onDragStartPlayer={handleDragStartPlayer}
        onDragEnd={handleDragEnd}
        onSetDropOverKey={setDropOverKey}
        onDropOnStarterSlot={handleDropOnStarterSlot}
        onMoveClickStarterSlot={handleMoveClickStarterSlot}
        onToggleSelectMove={toggleSelectMove}
        onOpenProfile={openPlayerProfile}
        onUpdateMinutes={updatePlayerTargetMinutes}
        onAssignToStarterSlot={assignPlayerToStarterSlot}
        onSwapPlayers={swapRotationPlayers}
      />

      <RotationsBenchList
        bench={bench}
        starterSlots={starterSlots}
        healthyReserves={healthyReserves}
        draggedPlayerId={draggedPlayerId}
        dropOverKey={dropOverKey}
        selectedMovePlayerId={selectedMovePlayerId}
        onDragStartPlayer={handleDragStartPlayer}
        onDragEnd={handleDragEnd}
        onSetDropOverKey={setDropOverKey}
        onDropOnPlayer={handleDropOnPlayer}
        onMoveClickPlayer={handleMoveClickPlayer}
        onToggleSelectMove={toggleSelectMove}
        onMoveBenchOrder={moveBenchPlayerOrder}
        onOpenProfile={openPlayerProfile}
        onUpdateMinutes={updatePlayerTargetMinutes}
        onAssignToStarterSlot={assignPlayerToStarterSlot}
        onSwapPlayers={swapRotationPlayers}
      />

      <RotationsReservesGrid
        reserves={reserves}
        starterSlots={starterSlots}
        bench={bench}
        draggedPlayerId={draggedPlayerId}
        dropOverKey={dropOverKey}
        selectedMovePlayerId={selectedMovePlayerId}
        onDragStartPlayer={handleDragStartPlayer}
        onDragEnd={handleDragEnd}
        onSetDropOverKey={setDropOverKey}
        onDropOnPlayer={handleDropOnPlayer}
        onMoveClickPlayer={handleMoveClickPlayer}
        onToggleSelectMove={toggleSelectMove}
        onOpenProfile={openPlayerProfile}
        onAssignToStarterSlot={assignPlayerToStarterSlot}
        onSwapPlayers={swapRotationPlayers}
      />
    </div>
  );
};
