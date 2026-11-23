import React from 'react';
import {
  AlertTriangle,
  ClipboardList,
  Dumbbell,
  HeartHandshake,
  MessageSquare,
  Sparkles,
  UserCog,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import {
  OffensivePlayId,
  TrainingFocus,
  TrainingIntensity,
} from '../types';
import { PageHeader } from './PageHeader';
import { IndividualTrainingProgramsPanel } from './training/IndividualTrainingProgramsPanel';

const FOCUS_OPTIONS: { value: TrainingFocus; desc: string }[] = [
  { value: 'Tiro e Spaziature', desc: '+Precisione al tiro in partita e crescita 2PT/3PT.' },
  { value: 'Difesa di Squadra', desc: '+Solidità difensiva in partita e crescita Difesa.' },
  { value: 'Condizione Fisica', desc: 'Aumenta Stamina/Atletismo, leggero affaticamento.' },
  { value: 'Tattica Pre-Partita', desc: '-Palle perse in partita e crescita IQ/Passaggio.' },
  { value: 'Scarico / Riposo', desc: 'Massimo recupero fisico (+10% cond.) e +Morale.' },
];

const INTENSITY_OPTIONS: { value: TrainingIntensity; badge: string }[] = [
  { value: 'Leggera', badge: 'Recupero alto • Rischio minimo' },
  { value: 'Moderata', badge: 'Equilibrio forma/crescita' },
  { value: 'Intensa', badge: 'Crescita rapida • Rischio affaticamento' },
];

const PLAYBOOK_OPTIONS: {
  id: OffensivePlayId;
  name: string;
  tag: string;
  desc: string;
}[] = [
  {
    id: 'pick_and_roll_centrale',
    name: 'Pick & Roll Centrale',
    tag: 'P&R',
    desc: 'Blocco alto del centro per il playmaker con roll profondo verso il ferro.',
  },
  {
    id: 'horns',
    name: 'Horns (Corna)',
    tag: 'P&R / Gomiti',
    desc: 'Due lunghi ai gomiti della lunetta: doppio blocco per attaccare il centro area.',
  },
  {
    id: 'spain_pnr',
    name: 'Spain Pick & Roll',
    tag: 'Back-Screen',
    desc: 'Blocco sulla palla + back-screen della guardia sul difensore del rollante.',
  },
  {
    id: 'floppy',
    name: 'Floppy / Staggered',
    tag: 'Tiro da 3',
    desc: 'Uscita dai blocchi consecutivi lungo la linea di fondo per il tiratore.',
  },
  {
    id: 'drive_kick_3pt',
    name: 'Drive & Kick 3PT',
    tag: 'Spaziature',
    desc: 'Penetrazione e scarico sul perimetro per tiri piedi a terra da 3 punti.',
  },
  {
    id: 'high_low',
    name: 'High-Low / Post Basso',
    tag: 'Interno',
    desc: 'Palla in post alto per il taglio e ricezione profonda del centro in area.',
  },
  {
    id: 'transizione',
    name: 'Transizione 3 Corsie',
    tag: 'Ritmo',
    desc: 'Contropiede organizzato con corsie laterali aperte per conclusioni rapide.',
  },
];

export const TrainingView: React.FC = () => {
  const {
    career,
    updateTrainingPlan,
    updateTactics,
    applyAssistantTacticsNow,
    openPlayerProfile,
    openChatModal,
  } = useGameStore();

  if (!career) return null;
  const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;

  const avgMorale = Math.round(
    userTeam.roster.reduce((s, p) => s + (p.morale ?? 78), 0) /
      Math.max(1, userTeam.roster.length)
  );

  const fitnessRating = userTeam.staff.fitness_coach?.rating ?? 60;
  const riskLabel =
    userTeam.training.focus === 'Scarico / Riposo'
      ? 'Trascurabile'
      : userTeam.training.intensity === 'Intensa'
      ? fitnessRating >= 80
        ? 'Moderato (mitigato dal Preparatore)'
        : 'Alto'
      : userTeam.training.intensity === 'Moderata'
      ? 'Basso'
      : 'Molto Basso';

  const selectedPlaybook: OffensivePlayId[] = userTeam.tactics.playbook ?? [
    'pick_and_roll_centrale',
    'horns',
    'floppy',
  ];

  const togglePlay = (playId: OffensivePlayId) => {
    const exists = selectedPlaybook.includes(playId);
    let next: OffensivePlayId[];
    if (exists) {
      if (selectedPlaybook.length <= 1) return; // Mantieni almeno 1 schema attivo
      next = selectedPlaybook.filter((id) => id !== playId);
    } else {
      next = [...selectedPlaybook, playId];
    }
    updateTactics({ playbook: next });
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Area Tecnica"
        title="Allenamento & Schemi Partita"
        subtitle="Pianifica il lavoro settimanale, assegna gli allenamenti individuali e scegli gli schemi offensivi per la partita"
      />

      {/* 1. PIANIFICAZIONE SETTIMANALE + CHIMICA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 fm-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Dumbbell className="w-4 h-4 text-amber-400" />
              Allenamento Settimanale di Squadra
            </div>
            <span className="text-xs text-slate-400">
              Rischio infortuni: <b className="text-slate-200">{riskLabel}</b>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FOCUS_OPTIONS.map((opt) => {
              const active = userTeam.training.focus === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateTrainingPlan({ focus: opt.value })}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-orange-500/15 border-orange-500 text-white'
                      : 'fm-subcard text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.value}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <div className="text-xs font-semibold text-slate-400 mb-2">
              Intensità Carico Settimanale
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {INTENSITY_OPTIONS.map((opt) => {
                const active = userTeam.training.intensity === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateTrainingPlan({ intensity: opt.value })}
                    className={`p-3 rounded-xl border text-left cursor-pointer ${
                      active
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'fm-subcard text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.badge}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chimica & Spogliatoio */}
        <div className="lg:col-span-5 fm-card rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              Chimica & Spogliatoio
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="fm-subcard rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Chimica Squadra</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5 tabular-nums">
                {userTeam.chemistry}%
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${userTeam.chemistry}%` }}
                />
              </div>
            </div>
            <div className="fm-subcard rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Morale Medio</div>
              <div className="text-xl font-black text-orange-400 mt-0.5 tabular-nums">
                {avgMorale}%
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${avgMorale}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Alta chimica aumenta gli assist e riduce le palle perse.
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-56 pr-1">
            {userTeam.roster.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl fm-subcard text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-100 truncate flex items-center gap-1.5">
                    <button
                      onClick={() => openPlayerProfile(p.id)}
                      className="hover:text-orange-400 hover:underline text-left cursor-pointer"
                    >
                      {p.firstName[0]}. {p.lastName}
                    </button>
                    {p.injuryWeeks > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {p.injuryWeeks}s
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{p.personality}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400">Morale</span>
                  <span
                    className={`font-extrabold w-8 text-right tabular-nums ${
                      p.morale >= 75
                        ? 'text-emerald-400'
                        : p.morale >= 55
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {p.morale}
                  </span>
                  <button
                    type="button"
                    onClick={() => openChatModal({ channel: 'player', playerId: p.id })}
                    title="Parla / Chat con il giocatore"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-orange-300 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SCELTA SCHEMI DA UTILIZZARE IN PARTITA */}
      <div className="fm-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <ClipboardList className="w-4 h-4 text-orange-400" />
              Playbook Partita — Schemi Offensivi Attivi ({selectedPlaybook.length})
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Seleziona gli schemi che la squadra eseguirà in partita sulla Lavagna Tattica 2D.
            </p>
          </div>
          <button
            type="button"
            onClick={applyAssistantTacticsNow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 cursor-pointer"
          >
            <UserCog className="w-3.5 h-3.5" />
            Delega al Vice Allenatore
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PLAYBOOK_OPTIONS.map((play) => {
            const active = selectedPlaybook.includes(play.id);
            return (
              <button
                key={play.id}
                onClick={() => togglePlay(play.id)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-orange-500/15 border-orange-500 text-white'
                    : 'fm-subcard text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold">{play.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      active
                        ? 'bg-orange-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {play.tag}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">{play.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PROGRAMMI ALLENAMENTO INDIVIDUALE (Durata x Intensità + Nuovo Ruolo) */}
      <IndividualTrainingProgramsPanel />
    </div>
  );
};
