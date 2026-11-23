import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FastForward,
  PauseCircle,
  Play,
  ShieldAlert,
  Square,
  Trophy,
  X,
} from 'lucide-react';
import { FastSimAlert, FastSimMatchSummary } from '../types';
import { daysBetween, formatItalianDate, getRoundDate } from '../engine/calendarUtils';
import { useGameStore } from '../store/gameStore';

export const FastSimModal: React.FC = () => {
  const {
    career,
    fastSimTarget,
    firingContext,
    clearFastSimTarget,
    advanceOneDay,
    setActiveTab,
    setIgnoreFastSimAlerts,
  } = useGameStore();

  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [daysDone, setDaysDone] = useState(0);
  const [totalDays, setTotalDays] = useState(1);
  const [matches, setMatches] = useState<FastSimMatchSummary[]>([]);
  const [pausedAlert, setPausedAlert] = useState<FastSimAlert | null>(null);
  const [resumeOffset, setResumeOffset] = useState(0);

  const abortRef = useRef(false);
  const runningLoopRef = useRef(false);

  const startLoop = async (startOffset = 0) => {
    if (!career || !fastSimTarget || runningLoopRef.current) return;
    runningLoopRef.current = true;
    abortRef.current = false;
    setRunning(true);
    setCompleted(false);
    setPausedAlert(null);

    const startDate =
      career.currentDate ?? getRoundDate(career.seasonYear, career.currentRound);

    let computedTotal = 1;
    if (fastSimTarget.type === 'days') {
      computedTotal = Math.max(1, fastSimTarget.days);
    } else if (fastSimTarget.type === 'end_regular') {
      const regularEndDate = getRoundDate(career.seasonYear, 30);
      computedTotal = Math.max(1, daysBetween(startDate, regularEndDate) + 1);
    } else if (fastSimTarget.type === 'until_date') {
      computedTotal = Math.max(1, daysBetween(startDate, fastSimTarget.targetDate));
    }

    if (startOffset === 0) {
      setTotalDays(computedTotal);
      setDaysDone(0);
      setMatches([]);
    }

    let step = startOffset;
    const maxSteps = startOffset === 0 ? computedTotal : totalDays;

    while (!abortRef.current && step < maxSteps) {
      const currentCareer = useGameStore.getState().career;
      if (!currentCareer) break;

      if (
        fastSimTarget.type === 'end_regular' &&
        currentCareer.phase !== 'regular'
      ) {
        break;
      }

      if (
        fastSimTarget.type === 'until_date' &&
        (currentCareer.currentDate ?? startDate) >= fastSimTarget.targetDate
      ) {
        break;
      }

      const res = advanceOneDay(true);
      if (res.userMatchPlayed) {
        setMatches((prev) => [res.userMatchPlayed!, ...prev]);
      }

      if (res.alert?.reason === 'coach_fired' || useGameStore.getState().firingContext) {
        abortRef.current = true;
        runningLoopRef.current = false;
        setRunning(false);
        setPausedAlert(null);
        clearFastSimTarget();
        return;
      }

      if (!res.advanced) {
        if (res.alert) {
          setPausedAlert(res.alert);
          setResumeOffset(step);
        }
        setRunning(false);
        runningLoopRef.current = false;
        return;
      }

      step += 1;
      setDaysDone(step);

      // Se fine regular season richiesta, fermati appena finita la 30ª giornata
      if (
        fastSimTarget.type === 'end_regular' &&
        res.phaseChangedTo === 'playoffs'
      ) {
        if (res.alert) {
          setPausedAlert(res.alert);
          setResumeOffset(step);
          setRunning(false);
          runningLoopRef.current = false;
          return;
        }
        break;
      }

      if (res.alert) {
        setPausedAlert(res.alert);
        setResumeOffset(step);
        setRunning(false);
        runningLoopRef.current = false;
        return;
      }

      // Yield al thread UI per mantenere fluida l'interfaccia Tauri/React
      await new Promise((resolve) => setTimeout(resolve, 28));
    }

    setRunning(false);
    setCompleted(true);
    runningLoopRef.current = false;
  };

  useEffect(() => {
    if (fastSimTarget && !firingContext && !runningLoopRef.current && !pausedAlert && !completed) {
      startLoop(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fastSimTarget, firingContext]);

  if (!fastSimTarget || !career || firingContext) return null;

  const currentDate =
    career.currentDate ?? getRoundDate(career.seasonYear, career.currentRound);
  const progressPct = Math.min(100, Math.round((daysDone / Math.max(1, totalDays)) * 100));

  const handleStop = () => {
    abortRef.current = true;
  };

  const handleClose = () => {
    abortRef.current = true;
    runningLoopRef.current = false;
    setRunning(false);
    setCompleted(false);
    setPausedAlert(null);
    setMatches([]);
    clearFastSimTarget();
  };

  const handleManageAlert = () => {
    const reason = pausedAlert?.reason;
    handleClose();
    if (reason === 'injury' || reason === 'rule_6_6' || reason === 'morale_warning') {
      setActiveTab('roster');
    } else if (reason === 'buyout_offer') {
      setActiveTab('market');
    } else if (reason === 'playoffs_start' || reason === 'season_finished') {
      setActiveTab('calendar');
    } else if (reason === 'coach_fired') {
      setActiveTab('messages');
    }
  };

  const wins = matches.filter((m) => m.userWon).length;
  const losses = matches.length - wins;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              {pausedAlert ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <FastForward className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {pausedAlert
                  ? 'Simulazione in Pausa (Smart Stop)'
                  : completed
                  ? 'Simulazione Completata'
                  : 'Simulazione Rapida in Corso'}
              </h2>
              <p className="text-xs text-slate-400">{fastSimTarget.label}</p>
            </div>
          </div>

          {!running && (
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Date & Progress */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                Data corrente: <span className="text-white font-bold">{formatItalianDate(currentDate)}</span>
              </span>
              <span className="text-slate-400 font-mono">
                {daysDone} / {totalDays} giorni ({progressPct}%)
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  pausedAlert
                    ? 'bg-amber-500'
                    : completed
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-orange-500 to-amber-400'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Smart Stop Alert Box */}
          {pausedAlert && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                {pausedAlert.reason === 'playoffs_start' ||
                pausedAlert.reason === 'season_finished' ? (
                  <Trophy className="w-4 h-4 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                )}
                <span>{pausedAlert.title}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{pausedAlert.message}</p>
            </div>
          )}

          {/* Live Match Results Feed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Partite giocate dalla nostra squadra ({matches.length})
              </span>
              {matches.length > 0 && (
                <span className="text-xs font-semibold text-slate-300">
                  Bilancio:{' '}
                  <span className="text-emerald-400">{wins}V</span> -{' '}
                  <span className="text-red-400">{losses}P</span>
                </span>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {matches.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 text-center">
                  Nessuna partita disputata in questo intervallo finora.
                </div>
              ) : (
                matches.map((m, idx) => (
                  <div
                    key={`${m.date}_${idx}`}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded font-black text-[10px] ${
                          m.userWon
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {m.userWon ? 'V' : 'P'}
                      </span>
                      <span className="text-slate-400 shrink-0">{m.roundLabel}</span>
                      <span className="text-white font-semibold truncate">
                        {m.homeName} vs {m.awayName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-orange-400 shrink-0 ml-2">
                      {m.homeScore} - {m.awayScore}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(career.ignoreFastSimAlerts)}
                onChange={(e) => setIgnoreFastSimAlerts(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-orange-500"
              />
              Modalità Vacanza (ignora avvisi)
            </label>

            <div className="flex items-center gap-2">
              {running ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Interrompi Simulazione
                </button>
              ) : pausedAlert ? (
                <>
                  <button
                    onClick={handleManageAlert}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                    Gestisci Ora
                  </button>
                  {pausedAlert.reason !== 'season_finished' &&
                    pausedAlert.reason !== 'rule_6_6' && (
                      <button
                        onClick={() => startLoop(resumeOffset)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Riprendi Simulazione
                      </button>
                    )}
                </>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Chiudi
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
