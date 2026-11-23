import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  FastForward,
  Play,
  Settings,
  Palmtree,
  Flag,
  CalendarClock,
  MessageSquare,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import {
  addDays,
  daysBetween,
  formatItalianDate,
  getNextWeekendDate,
  getRoundDate,
} from '../engine/calendarUtils';
import { getLeagueConfig } from '../data/teams';

export const DashboardTopBar: React.FC = () => {
  const {
    career,
    activeChatModal,
    openChatModal,
    advanceOneDay,
    requestFastSim,
    setIgnoreFastSimAlerts,
    setActiveTab,
    setToast,
  } = useGameStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!career) return null;

  const userTeam = career.teams.find((t) => t.id === career.userTeamId);
  const totalRounds = getLeagueConfig(userTeam?.leagueId ?? 'ITA_LBA').totalRounds;
  const currentDate =
    career.currentDate ?? getRoundDate(career.seasonYear, career.currentRound, totalRounds);
  const rawRoundDate = getRoundDate(career.seasonYear, career.currentRound, totalRounds);
  const nextRoundDate =
    currentDate > rawRoundDate ? getNextWeekendDate(currentDate) : rawRoundDate;
  const daysToNextMatch =
    career.phase === 'offseason'
      ? 1
      : Math.max(0, daysBetween(currentDate, nextRoundDate));
  const vacationOn = Boolean(career.ignoreFastSimAlerts);

  const handleAdvanceOne = () => {
    const res = advanceOneDay(false);
    if (!res.advanced && res.alert) {
      setToast(`${res.alert.title}: ${res.alert.message}`);
      return;
    }
    if (res.userMatchPlayed) {
      const m = res.userMatchPlayed;
      setToast(`${m.roundLabel}: ${m.homeName} ${m.homeScore} - ${m.awayScore} ${m.awayName}`);
    } else if (res.phaseChangedTo === 'regular') {
      setToast(`Regular Season avviata! (${formatItalianDate(res.newDate)})`);
    } else if (res.advanced) {
      setToast(`Avanzato al ${formatItalianDate(res.newDate)}.`);
    }
  };

  const handleOpenDatePicker = () => {
    setMenuOpen(false);
    setPickedDate(addDays(currentDate, 14));
    setDateModalOpen(true);
  };

  const handleConfirmDateSim = () => {
    if (!pickedDate || pickedDate <= currentDate) {
      setToast('Seleziona una data futura rispetto alla data corrente.');
      return;
    }
    setDateModalOpen(false);
    requestFastSim({
      type: 'until_date',
      targetDate: pickedDate,
      label: `Simula fino al ${formatItalianDate(pickedDate)}`,
    });
  };

  const clubPrimary = userTeam?.primaryColor ?? '#ea580c';

  return (
    <>
      <div className="h-14 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-5 flex items-center justify-between gap-4 shrink-0 relative z-30">
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-40 opacity-20"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 72% 100%, 0% 100%)',
            backgroundColor: clubPrimary,
          }}
        />
        {/* Left: Current Date & Match Countdown */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="tabular-nums">{formatItalianDate(currentDate)}</span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] font-semibold text-slate-400">
              Stagione {career.seasonYear}/{String(career.seasonYear + 1).slice(-2)}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 truncate">
            {career.phase === 'finished' ? (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                Stagione Conclusa
              </span>
            ) : career.phase === 'offseason' ? (
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold uppercase tracking-wider text-[11px]">
                Offseason • Mercato Estivo
              </span>
            ) : daysToNextMatch === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/40 text-orange-300 font-bold text-[11px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                Giorno di Partita •{' '}
                {career.phase === 'regular' ? `Giornata ${career.currentRound}` : 'Playoff'}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300">
                Prossima partita tra{' '}
                <strong className="text-white tabular-nums">{daysToNextMatch}</strong>{' '}
                {daysToNextMatch === 1 ? 'giorno' : 'giorni'}
              </span>
            )}
          </div>

          {vacationOn && (
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <Palmtree className="w-3 h-3" />
              Modalità Vacanza
            </span>
          )}
        </div>

        {/* Right: Chat + Continue + Fast Sim + Settings */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openChatModal({ channel: 'player' })}
            title="Apri Centro Colloqui & Chat"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              activeChatModal !== null
                ? 'bg-orange-500/20 border-orange-500/60 text-orange-200'
                : 'bg-slate-900 hover:bg-slate-800 border-sky-500/40 text-sky-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          {/* Primary Continue / Advance 1 Day */}
          <button
            onClick={handleAdvanceOne}
            disabled={career.phase === 'finished'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{daysToNextMatch === 0 ? 'Gioca / Avanza' : 'Continua (+1g)'}</span>
          </button>

          {/* Fast Sim Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              disabled={career.phase === 'finished'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700/80 text-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Simula</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 fm-modal rounded-2xl shadow-2xl z-40 overflow-hidden py-1.5">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Opzioni Avanzamento Rapido
                </div>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleAdvanceOne();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Avanza 1 Giorno</span>
                  <span className="text-[11px] text-slate-400">+1g</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    requestFastSim({
                      type: 'days',
                      days: 7,
                      label: 'Simula 1 Settimana (7 giorni)',
                    });
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Simula 1 Settimana</span>
                  <span className="text-[11px] text-slate-400">+7g</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    requestFastSim({
                      type: 'days',
                      days: 30,
                      label: 'Simula 1 Mese (30 giorni)',
                    });
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Simula 1 Mese</span>
                  <span className="text-[11px] text-slate-400">+30g</span>
                </button>

                {career.phase === 'regular' && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      requestFastSim({
                        type: 'end_regular',
                        label: 'Simula fino a Fine Regular Season',
                      });
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-orange-300 hover:bg-slate-800 flex items-center gap-2 font-semibold cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5 text-orange-400" />
                    <span>Simula fino a Fine Regular Season</span>
                  </button>
                )}

                <button
                  onClick={handleOpenDatePicker}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <CalendarClock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Simula fino a Data Specifica...</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveTab('calendar');
                    setToast('Clicca su una data nel Calendario Mensile per simulare fino a quel giorno.');
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-[11px] text-sky-400 hover:bg-slate-800/60 cursor-pointer"
                >
                  Scegli data dal Calendario Mensile →
                </button>

                <div className="my-1.5 border-t border-slate-800" />

                <label className="px-3.5 py-2 flex items-start gap-2.5 text-xs text-slate-300 hover:bg-slate-800/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={vacationOn}
                    onChange={(e) => setIgnoreFastSimAlerts(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-orange-500"
                  />
                  <span>
                    Ignora avvisi durante la simulazione rapida{' '}
                    <span className="text-emerald-400 font-semibold">(Modalità Vacanza)</span>
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Simulation Settings Popover */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              title="Impostazioni Simulazione"
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                vacationOn
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-80 fm-modal rounded-2xl shadow-2xl z-40 p-4 space-y-3">
                <div className="text-xs font-extrabold text-white flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-orange-400" />
                  Impostazioni Simulazione Rapida
                </div>
                <label className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={vacationOn}
                    onChange={(e) => setIgnoreFastSimAlerts(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-orange-500"
                  />
                  <span>
                    Ignora avvisi durante la simulazione rapida (Modalità Vacanza)
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Quando attiva, il Vice Allenatore gestirà automaticamente eventuali infortuni,
                  sostituzioni per la regola 6+6 e offerte di mercato senza interrompere la simulazione.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specific Date Picker Modal */}
      {dateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm fm-modal rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-sky-400" />
              Simula fino a Data Specifica
            </h3>
            <p className="text-xs text-slate-400">
              Data attuale: <strong className="text-slate-200">{formatItalianDate(currentDate)}</strong>
            </p>
            <input
              type="date"
              value={pickedDate}
              min={addDays(currentDate, 1)}
              onChange={(e) => setPickedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDateModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmDateSim}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-xs font-extrabold text-slate-950 cursor-pointer"
              >
                Avvia Simulazione
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
