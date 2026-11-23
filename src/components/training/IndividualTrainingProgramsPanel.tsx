import React, { useMemo, useState } from 'react';
import {
  Activity,
  MessageSquare,
  PlusCircle,
  Sliders,
  UserCheck,
  XCircle,
} from 'lucide-react';
import {
  canLearnAdditionalRole,
  createIndividualTrainingProgram,
  estimateProgramOutcome,
  getAvailableTargetPositions,
  TECHNICAL_FOCUS_OPTIONS,
  TRAINING_DURATION_META,
  TRAINING_INTENSITY_META,
} from '../../engine/trainingProgramEngine';
import { useGameStore } from '../../store/gameStore';
import {
  IndividualTrainingDuration,
  IndividualTrainingFocus,
  Player,
  Position,
  TrainingIntensity,
} from '../../types';

const DURATION_LIST: IndividualTrainingDuration[] = ['1_week', '2_weeks', '1_month'];
const INTENSITY_LIST: TrainingIntensity[] = ['Leggera', 'Moderata', 'Intensa'];

export const IndividualTrainingProgramsPanel: React.FC = () => {
  const {
    career,
    startPlayerTrainingProgram,
    cancelPlayerTrainingProgram,
    openPlayerProfile,
    openChatModal,
  } = useGameStore();

  const [configuringPlayerId, setConfiguringPlayerId] = useState<string | null>(null);
  const [draftFocus, setDraftFocus] =
    useState<Exclude<IndividualTrainingFocus, 'Nessuno'>>('Tiro da 3');
  const [draftDuration, setDraftDuration] =
    useState<IndividualTrainingDuration>('2_weeks');
  const [draftIntensity, setDraftIntensity] = useState<TrainingIntensity>('Moderata');
  const [draftTargetPos, setDraftTargetPos] = useState<Position>('SG');

  const userTeam = career?.teams.find((t) => t.id === career.userTeamId);
  const scoutRating = userTeam?.staff?.scout_director?.rating ?? 60;
  const managerYouthDev = career?.managerProfile?.attributes.youthDev ?? 10;

  const configuringPlayer: Player | undefined = useMemo(
    () => userTeam?.roster.find((p) => p.id === configuringPlayerId),
    [userTeam, configuringPlayerId]
  );

  if (!career || !userTeam) return null;

  const handleOpenConfig = (player: Player) => {
    if (configuringPlayerId === player.id) {
      setConfiguringPlayerId(null);
      return;
    }
    const existing = player.trainingProgram;
    const availPos = getAvailableTargetPositions(player);
    setConfiguringPlayerId(player.id);
    if (existing) {
      setDraftFocus(existing.focus);
      setDraftDuration(existing.duration);
      setDraftIntensity(existing.intensity);
      setDraftTargetPos(existing.targetPosition ?? availPos[0] ?? 'SG');
    } else {
      setDraftFocus('Tiro da 3');
      setDraftDuration('2_weeks');
      setDraftIntensity('Moderata');
      setDraftTargetPos(availPos[0] ?? 'SG');
    }
  };

  const activeProgramsCount = userTeam.roster.filter((p) => Boolean(p.trainingProgram)).length;

  return (
    <div className="fm-card rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <UserCheck className="w-4 h-4 text-sky-400" />
          Programmi di Allenamento Individuale ({activeProgramsCount} attivi)
        </div>
        <span className="text-xs text-slate-400">
          Imposta ciclo (1 sett / 2 sett / 1 mese) × intensità o insegna un 2° ruolo (max 2 ruoli)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="fm-table-head">
            <tr>
              <th className="py-2.5 px-4">Giocatore</th>
              <th className="py-2.5 px-2">Ruoli (Max 2)</th>
              <th className="py-2.5 px-2 text-center">Età</th>
              <th className="py-2.5 px-2 text-center">OVR</th>
              <th className="py-2.5 px-2 text-center">Cond.</th>
              <th className="py-2.5 px-3">Programma in Corso</th>
              <th className="py-2.5 px-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {userTeam.roster.map((p) => {
              const prog = p.trainingProgram;
              const pct = prog
                ? Math.min(100, Math.round((prog.daysCompleted / Math.max(1, prog.totalDays)) * 100))
                : 0;
              const isConfigOpen = configuringPlayerId === p.id;
              const canAddRole = canLearnAdditionalRole(p);
              const availRoles = getAvailableTargetPositions(p);

              const previewOutcome =
                isConfigOpen && configuringPlayer
                  ? estimateProgramOutcome(configuringPlayer, {
                      focus: draftFocus,
                      intensity: draftIntensity,
                      duration: draftDuration,
                      scoutRating,
                      managerYouthDev,
                      targetPosition: draftTargetPos,
                    })
                  : null;

              const validationCheck = isConfigOpen
                ? createIndividualTrainingProgram(p, {
                    focus: draftFocus,
                    intensity: draftIntensity,
                    duration: draftDuration,
                    startDate: career.currentDate ?? '',
                    targetPosition: draftTargetPos,
                  })
                : null;

              return (
                <React.Fragment key={p.id}>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-bold text-slate-100">
                      <button
                        type="button"
                        onClick={() => openPlayerProfile(p.id)}
                        className="hover:text-orange-400 hover:underline text-left cursor-pointer"
                      >
                        {p.firstName} {p.lastName}
                      </button>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold text-slate-200">
                          {p.primaryPosition}
                          {p.secondaryPosition ? ` / ${p.secondaryPosition}` : ''}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            canAddRole ? 'text-sky-400' : 'text-slate-500'
                          }`}
                        >
                          {canAddRole ? '1/2' : '2/2'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300 tabular-nums">{p.age}</td>
                    <td className="py-2.5 px-2 text-center font-black text-orange-400 tabular-nums">
                      {p.overall}
                    </td>
                    <td className="py-2.5 px-2 text-center text-emerald-400 font-semibold tabular-nums">
                      {p.condition}%
                    </td>
                    <td className="py-2.5 px-3 min-w-[220px]">
                      {prog ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold text-sky-300 truncate">
                              {prog.focus === 'Nuovo Ruolo' && prog.targetPosition
                                ? `Nuovo Ruolo → ${prog.targetPosition}`
                                : prog.focus}
                            </span>
                            <span className="text-[10px] font-bold text-amber-300 shrink-0">
                              {prog.intensity} • {prog.daysCompleted}/{prog.totalDays} gg
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Nessun programma attivo</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openChatModal({ channel: 'player', playerId: p.id })}
                          title="Parla con il giocatore"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-orange-300 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        {prog && (
                          <button
                            type="button"
                            onClick={() => cancelPlayerTrainingProgram(p.id)}
                            title="Interrompi programma"
                            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-900/50 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenConfig(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                            isConfigOpen
                              ? 'bg-orange-500 text-slate-950 border-orange-400'
                              : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
                          }`}
                        >
                          <Sliders className="w-3 h-3" />
                          {prog ? 'Modifica' : 'Assegna'}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isConfigOpen && previewOutcome && (
                    <tr className="bg-slate-950/80">
                      <td colSpan={7} className="p-4 border-t border-slate-800">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                          {/* Focus + Nuovo Ruolo */}
                          <div className="lg:col-span-4 space-y-2">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              1. Obiettivo Allenamento
                            </div>
                            <select
                              value={draftFocus}
                              onChange={(e) => {
                                const next = e.target.value as Exclude<
                                  IndividualTrainingFocus,
                                  'Nessuno'
                                >;
                                setDraftFocus(next);
                                if (next === 'Nuovo Ruolo') {
                                  setDraftDuration('1_month');
                                  if (availRoles.length > 0 && !availRoles.includes(draftTargetPos)) {
                                    setDraftTargetPos(availRoles[0]);
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                            >
                              {TECHNICAL_FOCUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                              <option value="Nuovo Ruolo" disabled={!canAddRole}>
                                {canAddRole
                                  ? 'Apprendi Nuovo Ruolo (2° Ruolo)'
                                  : `Nuovo Ruolo (Già 2 ruoli: ${p.primaryPosition}/${p.secondaryPosition})`}
                              </option>
                            </select>

                            {draftFocus === 'Nuovo Ruolo' && canAddRole && (
                              <div className="pt-1">
                                <label className="block text-[10px] font-bold text-sky-300 mb-1">
                                  Seleziona 2° ruolo da aggiungere a {p.primaryPosition}:
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {availRoles.map((pos) => (
                                    <button
                                      key={pos}
                                      type="button"
                                      onClick={() => setDraftTargetPos(pos)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-black border cursor-pointer ${
                                        draftTargetPos === pos
                                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                                      }`}
                                    >
                                      {pos}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Durata */}
                          <div className="lg:col-span-4 space-y-2">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              2. Durata Ciclo
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {DURATION_LIST.map((dur) => {
                                const meta = TRAINING_DURATION_META[dur];
                                const active = draftDuration === dur;
                                return (
                                  <button
                                    key={dur}
                                    type="button"
                                    onClick={() => setDraftDuration(dur)}
                                    className={`p-2 rounded-xl border text-left cursor-pointer transition-colors ${
                                      active
                                        ? 'bg-orange-500/15 border-orange-500 text-white'
                                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="text-[11px] font-extrabold">{meta.shortLabel}</div>
                                    <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
                                      {dur === '1_week'
                                        ? '1 Sett.'
                                        : dur === '2_weeks'
                                        ? '2 Sett.'
                                        : '1 Mese'}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pt-1">
                              3. Intensità Esecuzione
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {INTENSITY_LIST.map((intVal) => {
                                const meta = TRAINING_INTENSITY_META[intVal];
                                const active = draftIntensity === intVal;
                                return (
                                  <button
                                    key={intVal}
                                    type="button"
                                    onClick={() => setDraftIntensity(intVal)}
                                    className={`p-2 rounded-xl border text-left cursor-pointer transition-colors ${
                                      active
                                        ? 'bg-amber-500/15 border-amber-500 text-white'
                                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="text-[11px] font-extrabold">{meta.label}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5">
                                      {meta.efficacyMultiplier}x resa
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Riepilogo e Avvio */}
                          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-sky-300">
                              <Activity className="w-3.5 h-3.5" />
                              Previsione Programma
                            </div>
                            <div className="text-xs text-slate-200 font-semibold">
                              {previewOutcome.summaryText}
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                                Efficacia: <b className="text-white">{previewOutcome.efficacyMultiplier}x</b>
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                                Impatto forma: <b className="text-amber-300">{previewOutcome.weeklyConditionLabel}</b>
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                                Rischio: <b className="text-slate-200">{previewOutcome.riskLabel}</b>
                              </span>
                            </div>

                            {validationCheck && !validationCheck.ok && (
                              <div className="text-[11px] text-red-300 font-semibold">
                                {validationCheck.message}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setConfiguringPlayerId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                              >
                                Chiudi
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(validationCheck && !validationCheck.ok)}
                                onClick={() => {
                                  const res = startPlayerTrainingProgram({
                                    playerId: p.id,
                                    focus: draftFocus,
                                    intensity: draftIntensity,
                                    duration: draftDuration,
                                    targetPosition:
                                      draftFocus === 'Nuovo Ruolo' ? draftTargetPos : undefined,
                                  });
                                  if (res.ok) {
                                    setConfiguringPlayerId(null);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Avvia Programma
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
