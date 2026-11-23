import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, CheckCircle2, GripVertical } from 'lucide-react';
import { PlayerBoxScore, Position } from '../../types';
import { ROLE_COLORS } from '../tactics/customPlayCanvasDraw';

interface TimeoutSubstitutionsCardProps {
  userTeamShortName: string;
  teamFoulsThisQuarter: number;
  userActivePlayers: PlayerBoxScore[];
  userBenchPlayers: PlayerBoxScore[];
  userFouledOutPlayers: PlayerBoxScore[];
  goToPlayerId: string | null;
  secondaryOptionPlayerId: string | null;
  subOutId: string;
  onSelectSubOut: (playerId: string) => void;
  onSubstitute: (outPlayerId: string, inPlayerId: string) => void;
}

const POSITION_ORDER: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

const COURT_SLOTS: Array<{ pos: Position; x: number; y: number }> = [
  { pos: 'PF', x: 31, y: 26 },
  { pos: 'C', x: 69, y: 26 },
  { pos: 'SG', x: 16, y: 56 },
  { pos: 'SF', x: 84, y: 56 },
  { pos: 'PG', x: 50, y: 79 },
];

/**
 * Assegna fino a 5 giocatori attivi ai 5 spot canonici a metà campo
 * privilegiando il ruolo naturale e ripiegando sullo spot libero più vicino.
 */
export function assignPlayersToCourtSlots(
  players: PlayerBoxScore[]
): Record<Position, PlayerBoxScore | null> {
  const slots: Record<Position, PlayerBoxScore | null> = {
    PG: null,
    SG: null,
    SF: null,
    PF: null,
    C: null,
  };
  const remaining: PlayerBoxScore[] = [];

  for (const player of players.slice(0, 5)) {
    if (!slots[player.position]) {
      slots[player.position] = player;
    } else {
      remaining.push(player);
    }
  }

  for (const player of remaining) {
    const targetIdx = POSITION_ORDER.indexOf(player.position);
    let bestPos: Position | null = null;
    let bestDist = Infinity;

    for (const candidate of POSITION_ORDER) {
      if (slots[candidate]) continue;
      const dist = Math.abs(POSITION_ORDER.indexOf(candidate) - targetIdx);
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = candidate;
      }
    }

    if (bestPos) {
      slots[bestPos] = player;
    }
  }

  return slots;
}

function getCompactSurname(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : fullName;
}

function getStaminaBarClass(staminaPct: number): string {
  if (staminaPct >= 65) return 'bg-emerald-500';
  if (staminaPct >= 40) return 'bg-amber-400';
  return 'bg-red-500';
}

function getStaminaTextClass(staminaPct: number): string {
  if (staminaPct >= 65) return 'text-emerald-300';
  if (staminaPct >= 40) return 'text-amber-300';
  return 'text-red-400';
}

function mapSlotsToIds(
  slots: Record<Position, PlayerBoxScore | null>
): Partial<Record<Position, string>> {
  const next: Partial<Record<Position, string>> = {};
  for (const pos of POSITION_ORDER) {
    const p = slots[pos];
    if (p) next[pos] = p.playerId;
  }
  return next;
}

/**
 * Lavagnetta tattica interattiva a metà campo per visualizzare il quintetto
 * ed effettuare sostituzioni via click bidirezionale o drag & drop dalla panchina.
 */
export const TimeoutSubstitutionsCard: React.FC<TimeoutSubstitutionsCardProps> = ({
  userTeamShortName,
  teamFoulsThisQuarter,
  userActivePlayers,
  userBenchPlayers,
  userFouledOutPlayers,
  goToPlayerId,
  secondaryOptionPlayerId,
  subOutId,
  onSelectSubOut,
  onSubstitute,
}) => {
  const [subInId, setSubInId] = useState<string>('');
  const [dragBenchId, setDragBenchId] = useState<string | null>(null);
  const [dragOverCourtId, setDragOverCourtId] = useState<string | null>(null);
  const [justSubbedInId, setJustSubbedInId] = useState<string | null>(null);
  const [lastSwap, setLastSwap] = useState<{
    outPlayer: PlayerBoxScore;
    inPlayer: PlayerBoxScore;
  } | null>(null);
  const [swapCount, setSwapCount] = useState<number>(0);
  const [slotIds, setSlotIds] = useState<Partial<Record<Position, string>>>(() =>
    mapSlotsToIds(assignPlayersToCourtSlots(userActivePlayers))
  );

  const pendingSwapRef = useRef<{ outId: string; inId: string } | null>(null);

  useEffect(() => {
    const activeIds = new Set(userActivePlayers.map((p) => p.playerId));
    setSlotIds((prev) => {
      const pending = pendingSwapRef.current;
      if (pending && activeIds.has(pending.inId) && !activeIds.has(pending.outId)) {
        const replaced: Partial<Record<Position, string>> = {};
        let foundOutSlot = false;
        for (const pos of POSITION_ORDER) {
          const existing = prev[pos];
          if (existing === pending.outId) {
            replaced[pos] = pending.inId;
            foundOutSlot = true;
          } else if (existing && activeIds.has(existing)) {
            replaced[pos] = existing;
          }
        }
        pendingSwapRef.current = null;
        const placedCount = Object.values(replaced).filter(Boolean).length;
        if (foundOutSlot && placedCount === Math.min(5, userActivePlayers.length)) {
          return replaced;
        }
      }

      const assignedIds = POSITION_ORDER.map((pos) => prev[pos]).filter(
        (id): id is string => Boolean(id && activeIds.has(id))
      );
      const uniqueValid = new Set(assignedIds);
      if (
        uniqueValid.size === assignedIds.length &&
        assignedIds.length === Math.min(5, userActivePlayers.length)
      ) {
        return prev;
      }

      return mapSlotsToIds(assignPlayersToCourtSlots(userActivePlayers));
    });
  }, [userActivePlayers]);

  useEffect(() => {
    if (!justSubbedInId) return;
    const timer = window.setTimeout(() => setJustSubbedInId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [justSubbedInId]);

  const activeById = useMemo(
    () => new Map(userActivePlayers.map((p) => [p.playerId, p])),
    [userActivePlayers]
  );

  const benchById = useMemo(
    () => new Map(userBenchPlayers.map((p) => [p.playerId, p])),
    [userBenchPlayers]
  );

  const avgStamina = useMemo(() => {
    if (userActivePlayers.length === 0) return 0;
    const sum = userActivePlayers.reduce((acc, p) => acc + p.stamina, 0);
    return Math.round(sum / userActivePlayers.length);
  }, [userActivePlayers]);

  const executeSwap = (outPlayerId: string, inPlayerId: string) => {
    const outPlayer = activeById.get(outPlayerId);
    const inPlayer = benchById.get(inPlayerId);
    if (!outPlayer || !inPlayer || outPlayer.playerId === inPlayer.playerId) return;

    pendingSwapRef.current = { outId: outPlayerId, inId: inPlayerId };
    onSubstitute(outPlayerId, inPlayerId);
    setLastSwap({ outPlayer, inPlayer });
    setSwapCount((c) => c + 1);
    setJustSubbedInId(inPlayerId);
    onSelectSubOut('');
    setSubInId('');
    setDragBenchId(null);
    setDragOverCourtId(null);
  };

  const selectedOutPlayer = subOutId ? activeById.get(subOutId) ?? null : null;
  const selectedInPlayer = subInId ? benchById.get(subInId) ?? null : null;

  return (
    <div className="fm-card rounded-2xl p-4 space-y-3">
      {/* Header card con metriche quintetto */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/35 flex items-center justify-center">
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Lavagnetta Quintetto &amp; Cambi
            </h3>
            <p className="text-[10px] text-slate-400">
              Clicca due giocatori (campo ↔ panchina) o trascina dalla panchina
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <span
            className={`px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 tabular-nums ${getStaminaTextClass(
              avgStamina
            )}`}
          >
            Stamina {avgStamina}%
          </span>
          <span
            className={`px-2 py-0.5 rounded-md border tabular-nums ${
              teamFoulsThisQuarter >= 4
                ? 'bg-red-500/15 border-red-500/40 text-red-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-300'
            }`}
          >
            Falli {userTeamShortName} {Math.min(teamFoulsThisQuarter, 5)}/4
            {teamFoulsThisQuarter >= 4 ? ' BONUS' : ''}
          </span>
        </div>
      </div>

      {/* Lavagnetta metà campo SVG + 5 token interattivi */}
      <div className="relative w-full aspect-[16/10] min-h-[255px] rounded-xl overflow-hidden border border-slate-700/70 shadow-inner bg-slate-950 select-none">
        <svg
          viewBox="0 0 400 250"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="timeoutCourtBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f1b30" />
              <stop offset="100%" stopColor="#070c18" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="400" height="250" fill="url(#timeoutCourtBg)" />

          {/* Area pitturata calda */}
          <rect
            x="145"
            y="10"
            width="110"
            height="108"
            fill="rgba(245, 158, 11, 0.08)"
            stroke="rgba(148, 163, 184, 0.35)"
            strokeWidth="1.5"
          />

          {/* Perimetro campo */}
          <rect
            x="12"
            y="10"
            width="376"
            height="232"
            rx="4"
            fill="none"
            stroke="rgba(148, 163, 184, 0.4)"
            strokeWidth="1.75"
          />

          {/* Arco da 3 punti */}
          <line
            x1="46"
            y1="10"
            x2="46"
            y2="66"
            stroke="rgba(148, 163, 184, 0.34)"
            strokeWidth="1.5"
          />
          <line
            x1="354"
            y1="10"
            x2="354"
            y2="66"
            stroke="rgba(148, 163, 184, 0.34)"
            strokeWidth="1.5"
          />
          <path
            d="M 46 66 A 154 132 0 0 0 354 66"
            fill="none"
            stroke="rgba(148, 163, 184, 0.34)"
            strokeWidth="1.5"
          />

          {/* Lunetta tiro libero */}
          <path
            d="M 164 118 A 36 36 0 0 0 236 118"
            fill="none"
            stroke="rgba(148, 163, 184, 0.35)"
            strokeWidth="1.4"
          />
          <path
            d="M 164 118 A 36 36 0 0 1 236 118"
            fill="none"
            stroke="rgba(148, 163, 184, 0.22)"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />

          {/* Tabellone, area ristretta e canestro */}
          <line
            x1="178"
            y1="24"
            x2="222"
            y2="24"
            stroke="rgba(226, 232, 240, 0.65)"
            strokeWidth="2.5"
          />
          <path
            d="M 176 33 A 24 24 0 0 0 224 33"
            fill="none"
            stroke="rgba(148, 163, 184, 0.32)"
            strokeWidth="1.2"
          />
          <circle
            cx="200"
            cy="33"
            r="5.5"
            fill="none"
            stroke="#f97316"
            strokeWidth="2.2"
          />

          {/* Semicerchio metà campo in basso */}
          <path
            d="M 162 242 A 38 38 0 0 1 238 242"
            fill="none"
            stroke="rgba(148, 163, 184, 0.28)"
            strokeWidth="1.4"
          />
        </svg>

        {COURT_SLOTS.map(({ pos, x, y }) => {
          const playerId = slotIds[pos];
          const player = playerId ? activeById.get(playerId) : undefined;
          if (!player) return null;

          const isSelectedOut = subOutId === player.playerId;
          const isDragTarget = dragOverCourtId === player.playerId;
          const isSubInReady = Boolean(subInId);
          const isJustSubbed = justSubbedInId === player.playerId;
          const isPrimaryOpt = goToPlayerId === player.playerId;
          const isSecondaryOpt = secondaryOptionPlayerId === player.playerId;
          const stamPct = Math.round(player.stamina);
          const roleColor = ROLE_COLORS[player.position];

          return (
            <button
              key={pos}
              type="button"
              onClick={() => {
                if (subInId) {
                  executeSwap(player.playerId, subInId);
                  return;
                }
                onSelectSubOut(isSelectedOut ? '' : player.playerId);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverCourtId !== player.playerId) {
                  setDragOverCourtId(player.playerId);
                }
              }}
              onDragLeave={() => {
                if (dragOverCourtId === player.playerId) {
                  setDragOverCourtId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const droppedId = e.dataTransfer.getData('text/plain') || dragBenchId;
                setDragOverCourtId(null);
                if (droppedId) {
                  executeSwap(player.playerId, droppedId);
                }
              }}
              title={`${player.name} (${player.position}${
                player.position !== pos ? ` in spot ${pos}` : ''
              }) • ${player.points} PT • Stamina ${stamPct}% • Falli ${player.fouls}/5`}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-[82px] sm:w-[92px] rounded-xl px-2 py-1.5 text-left transition-all cursor-pointer border backdrop-blur-sm ${
                isDragTarget
                  ? 'bg-emerald-950/95 border-emerald-400 ring-2 ring-emerald-400/60 scale-105 z-20 shadow-lg shadow-emerald-500/25'
                  : isSelectedOut
                  ? 'bg-orange-950/95 border-orange-400 ring-2 ring-orange-500/55 scale-105 z-20 shadow-lg shadow-orange-500/25'
                  : isJustSubbed
                  ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/45 z-10 shadow-lg shadow-emerald-500/20'
                  : isSubInReady
                  ? 'bg-slate-900/95 border-dashed border-emerald-400/80 hover:border-emerald-300 hover:bg-emerald-950/80 z-10'
                  : 'bg-slate-900/92 border-slate-700/90 hover:border-slate-500 hover:bg-slate-800/95 z-10'
              }`}
            >
              {(isSelectedOut || isDragTarget || isJustSubbed) && (
                <span
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded text-[8px] font-black uppercase tracking-wider whitespace-nowrap shadow ${
                    isDragTarget
                      ? 'bg-emerald-500 text-slate-950'
                      : isSelectedOut
                      ? 'bg-orange-500 text-slate-950'
                      : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  {isDragTarget ? 'SOSTITUISCI' : isSelectedOut ? 'ESCE' : 'ENTRATO ✓'}
                </span>
              )}

              <div className="flex items-center justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className="px-1 py-[1px] rounded text-[9px] font-black text-slate-950 leading-tight shrink-0"
                    style={{ backgroundColor: roleColor }}
                  >
                    {player.position}
                  </span>
                  {player.position !== pos && (
                    <span className="text-[8px] text-slate-400 font-semibold leading-none">
                      /{pos}
                    </span>
                  )}
                  {isPrimaryOpt && (
                    <span className="px-1 rounded bg-emerald-500/25 border border-emerald-500/50 text-[8px] font-black text-emerald-300 leading-tight">
                      ★1
                    </span>
                  )}
                  {isSecondaryOpt && (
                    <span className="px-1 rounded bg-sky-500/25 border border-sky-500/50 text-[8px] font-black text-sky-300 leading-tight">
                      #2
                    </span>
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold tabular-nums shrink-0 ${
                    player.fouls >= 4
                      ? 'text-red-400 font-black'
                      : player.fouls === 3
                      ? 'text-amber-300'
                      : 'text-slate-400'
                  }`}
                >
                  {player.fouls}F
                </span>
              </div>

              <div className="text-[11px] font-extrabold text-white truncate leading-tight">
                {getCompactSurname(player.name)}
              </div>

              <div className="flex items-center justify-between text-[9px] tabular-nums mt-0.5">
                <span className="text-slate-300 font-semibold">{player.points}p</span>
                <span className={`font-bold ${getStaminaTextClass(stamPct)}`}>{stamPct}%</span>
              </div>

              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all ${getStaminaBarClass(stamPct)}`}
                  style={{ width: `${stamPct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback contestuale immediato */}
      {selectedOutPlayer ? (
        <div className="px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/40 text-[11px] text-orange-200 flex items-center justify-between gap-2">
          <span>
            In uscita:{' '}
            <strong className="text-white">
              [{selectedOutPlayer.position}] {selectedOutPlayer.name}
            </strong>{' '}
            — clicca chi entra dalla panchina
          </span>
          <button
            type="button"
            onClick={() => onSelectSubOut('')}
            className="text-[10px] text-orange-300 hover:text-white underline shrink-0 cursor-pointer"
          >
            Annulla
          </button>
        </div>
      ) : selectedInPlayer ? (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center justify-between gap-2">
          <span>
            Pronto ad entrare:{' '}
            <strong className="text-white">
              [{selectedInPlayer.position}] {selectedInPlayer.name}
            </strong>{' '}
            — clicca chi esce sulla lavagna
          </span>
          <button
            type="button"
            onClick={() => setSubInId('')}
            className="text-[10px] text-emerald-300 hover:text-white underline shrink-0 cursor-pointer"
          >
            Annulla
          </button>
        </div>
      ) : lastSwap ? (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/12 border border-emerald-500/35 text-[11px] text-emerald-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              Cambio: esce{' '}
              <strong className="text-slate-200">
                [{lastSwap.outPlayer.position}] {getCompactSurname(lastSwap.outPlayer.name)}
              </strong>{' '}
              → entra{' '}
              <strong className="text-white">
                [{lastSwap.inPlayer.position}] {getCompactSurname(lastSwap.inPlayer.name)}
              </strong>
            </span>
          </div>
          {swapCount > 1 && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] font-bold text-emerald-300 shrink-0 tabular-nums">
              {swapCount} cambi
            </span>
          )}
        </div>
      ) : null}

      {/* Panchina integrata */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            Panchina disponibile ({userBenchPlayers.length})
          </span>
          {userFouledOutPlayers.length > 0 && (
            <span className="text-[10px] font-bold text-red-400">
              {userFouledOutPlayers.length} fuori per falli
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
          {userBenchPlayers.map((p) => {
            const stamPct = Math.round(p.stamina);
            const isSelectedIn = subInId === p.playerId;
            const sameRoleAsOut =
              selectedOutPlayer !== null && selectedOutPlayer.position === p.position;
            const isPrimaryOpt = goToPlayerId === p.playerId;
            const isSecondaryOpt = secondaryOptionPlayerId === p.playerId;

            return (
              <button
                key={p.playerId}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', p.playerId);
                  e.dataTransfer.effectAllowed = 'move';
                  setDragBenchId(p.playerId);
                  onSelectSubOut('');
                  setSubInId('');
                }}
                onDragEnd={() => {
                  setDragBenchId(null);
                  setDragOverCourtId(null);
                }}
                onClick={() => {
                  if (subOutId) {
                    executeSwap(subOutId, p.playerId);
                    return;
                  }
                  setSubInId(isSelectedIn ? '' : p.playerId);
                }}
                className={`group w-full text-left px-2.5 py-2 rounded-xl border text-[11px] transition cursor-pointer ${
                  isSelectedIn
                    ? 'bg-emerald-500/20 border-emerald-400 text-white ring-1 ring-emerald-400/50'
                    : subOutId
                    ? sameRoleAsOut
                      ? 'bg-slate-900/95 border-amber-500/45 hover:border-emerald-400 hover:bg-emerald-500/15 text-slate-100'
                      : 'bg-slate-900/80 border-slate-800 hover:border-emerald-400 hover:bg-emerald-500/15 text-slate-200'
                    : 'bg-slate-950/75 border-slate-800/90 hover:border-slate-600 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0" />
                    <span
                      className="px-1 py-[1px] rounded text-[9px] font-black text-slate-950 shrink-0"
                      style={{ backgroundColor: ROLE_COLORS[p.position] }}
                    >
                      {p.position}
                    </span>
                    <span className="font-bold truncate text-slate-100">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums shrink-0">
                    {p.points}p
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStaminaBarClass(stamPct)}`}
                        style={{ width: `${stamPct}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-bold tabular-nums ${getStaminaTextClass(stamPct)}`}>
                      {stamPct}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isPrimaryOpt && (
                      <span className="px-1 rounded bg-emerald-500/20 text-[8px] font-black text-emerald-300">
                        ★1
                      </span>
                    )}
                    {isSecondaryOpt && (
                      <span className="px-1 rounded bg-sky-500/20 text-[8px] font-black text-sky-300">
                        #2
                      </span>
                    )}
                    {sameRoleAsOut && (
                      <span className="px-1 py-[1px] rounded bg-amber-500/20 border border-amber-500/35 text-[8px] font-bold text-amber-300">
                        Stesso ruolo
                      </span>
                    )}
                    <span
                      className={`text-[9px] tabular-nums ${
                        p.fouls >= 4 ? 'text-red-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {p.fouls}/5F
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {userFouledOutPlayers.map((p) => (
            <div
              key={p.playerId}
              className="w-full px-2.5 py-2 rounded-xl border border-red-900/40 bg-red-950/15 opacity-55 text-[11px] text-slate-400 cursor-not-allowed"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="px-1 rounded text-[9px] font-black bg-slate-700 text-slate-300 shrink-0">
                    {p.position}
                  </span>
                  <span className="font-semibold truncate line-through">{p.name}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-[9px] font-black text-red-300 shrink-0">
                  5F OUT
                </span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 tabular-nums">
                {p.points}p • Espulso per falli
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
