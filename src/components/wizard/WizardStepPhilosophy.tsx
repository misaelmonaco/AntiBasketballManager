import React from 'react';
import { Sparkles } from 'lucide-react';
import { MANAGER_BACKGROUNDS, MANAGER_PHILOSOPHIES } from '../../engine/managerEngine';
import { ManagerAttributes, ManagerBackground, ManagerPhilosophy } from '../../types';

const ATTR_META: { key: keyof ManagerAttributes; label: string; desc: string }[] = [
  {
    key: 'offenseSpacing',
    label: 'Attacco & Spaziature',
    desc: 'Bonus efficienza offensiva e percentuali al tiro',
  },
  {
    key: 'defenseOrg',
    label: 'Organizzazione Difensiva',
    desc: 'Bonus difesa di squadra, contestazione tiri e rimbalzi',
  },
  {
    key: 'lockerRoom',
    label: 'Gestione Spogliatoio',
    desc: 'Mitiga il malcontento sui minuti e sostiene il morale',
  },
  {
    key: 'youthDev',
    label: 'Sviluppo Giovani',
    desc: 'Accelera la crescita degli Under 22 in allenamento',
  },
  {
    key: 'liveTactics',
    label: 'Tattica & Adattamento Live',
    desc: 'Potenzia l’effetto di Timeout e cambi tattici in partita',
  },
  {
    key: 'scoutingMarket',
    label: 'Scouting & Mercato',
    desc: 'Velocizza l’osservazione e migliora le trattative',
  },
];

interface WizardStepPhilosophyProps {
  background: ManagerBackground;
  philosophy: ManagerPhilosophy;
  attributes: ManagerAttributes;
  totalPool: number;
  remainingPoints: number;
  onSelectBackground: (bg: ManagerBackground) => void;
  onSelectPhilosophy: (phil: ManagerPhilosophy) => void;
  onAutoAllocate: () => void;
  onAdjustAttr: (key: keyof ManagerAttributes, delta: number) => void;
}

export const WizardStepPhilosophy: React.FC<WizardStepPhilosophyProps> = ({
  background,
  philosophy,
  attributes,
  totalPool,
  remainingPoints,
  onSelectBackground,
  onSelectPhilosophy,
  onAutoAllocate,
  onAdjustAttr,
}) => (
  <>
    {/* Background */}
    <div className="space-y-2.5">
      <h3 className="text-sm font-extrabold text-white">1. Passato Cestistico (Background)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MANAGER_BACKGROUNDS.map((bg) => (
          <button
            key={bg.id}
            onClick={() => onSelectBackground(bg.id)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              background === bg.id
                ? 'bg-orange-500/15 border-orange-500 text-white'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-white">{bg.title}</div>
            <div className="text-[11px] font-bold text-orange-400 mt-1">{bg.subtitle}</div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{bg.description}</p>
          </button>
        ))}
      </div>
    </div>

    {/* Philosophy */}
    <div className="space-y-2.5">
      <h3 className="text-sm font-extrabold text-white">
        2. Filosofia Cestistica (Archetipo Tattico)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MANAGER_PHILOSOPHIES.map((phil) => (
          <button
            key={phil.id}
            onClick={() => onSelectPhilosophy(phil.id)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              philosophy === phil.id
                ? 'bg-sky-500/15 border-sky-500 text-white'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-white">{phil.title}</div>
            <div className="text-[11px] text-sky-300 font-semibold mt-0.5">{phil.tagline}</div>
            <p className="text-[11px] text-slate-400 mt-1.5">{phil.description}</p>
          </button>
        ))}
      </div>
    </div>

    {/* Attributes */}
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-white">3. Distribuzione Attributi (1–20)</h3>
          <p className="text-xs text-slate-400">
            Punti disponibili:{' '}
            <strong className={remainingPoints === 0 ? 'text-emerald-400' : 'text-orange-400'}>
              {remainingPoints}
            </strong>{' '}
            / {totalPool}
          </p>
        </div>
        <button
          onClick={onAutoAllocate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 text-xs font-bold cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Auto-assegna in base alla Filosofia
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ATTR_META.map((m) => {
          const val = attributes[m.key];
          const pct = Math.round((val / 20) * 100);
          const barColor =
            val >= 15
              ? 'bg-emerald-400'
              : val >= 11
              ? 'bg-orange-400'
              : val >= 7
              ? 'bg-sky-400'
              : 'bg-slate-500';
          const textColor =
            val >= 15
              ? 'text-emerald-400'
              : val >= 11
              ? 'text-orange-400'
              : val >= 7
              ? 'text-sky-400'
              : 'text-slate-400';
          return (
            <div
              key={m.key}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white">{m.label}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onAdjustAttr(m.key, -1)}
                    disabled={val <= 1}
                    className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-white cursor-pointer border border-slate-700/60"
                  >
                    -
                  </button>
                  <span className={`w-7 text-center font-mono text-sm font-black tabular-nums ${textColor}`}>
                    {val}
                  </span>
                  <button
                    onClick={() => onAdjustAttr(m.key, 1)}
                    disabled={val >= 20 || remainingPoints <= 0}
                    className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-white cursor-pointer border border-slate-700/60"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">{m.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  </>
);
