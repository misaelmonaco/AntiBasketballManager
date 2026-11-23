import React from 'react';
import {
  Activity,
  ClipboardList,
  Crosshair,
  Flame,
  Gauge,
  RefreshCw,
  Shield,
  Target,
} from 'lucide-react';
import {
  AGGRESSION_OPTIONS,
  DEFENSE_OPTIONS,
  DEFENSIVE_INTENSITY_OPTIONS,
  OFFENSIVE_FOCUS_OPTIONS,
  PACE_OPTIONS,
  PLAYBOOK_PLAYS,
  PNR_COVERAGE_OPTIONS,
  REBOUND_POLICY_OPTIONS,
} from '../../data/tacticsCatalog';
import { OffensivePlayId, Player, Tactics } from '../../types';

interface TacticsCoreSectionsProps {
  tactics: Tactics;
  roster: Player[];
  onUpdateTactics: (patch: Partial<Tactics>) => void;
}

export const TacticsCoreSections: React.FC<TacticsCoreSectionsProps> = ({
  tactics,
  roster,
  onUpdateTactics,
}) => {
  const selectedPlaybook: OffensivePlayId[] = tactics.playbook ?? [
    'pick_and_roll_centrale',
    'horns',
    'floppy',
  ];

  const activePlayers = roster
    .filter((p) => p.injuryWeeks === 0 && p.rosterSlot !== 'reserve')
    .sort((a, b) => b.overall - a.overall);
  const selectablePlayers = activePlayers.length > 0 ? activePlayers : roster;

  const togglePlay = (playId: OffensivePlayId) => {
    const exists = selectedPlaybook.includes(playId);
    if (exists) {
      if (selectedPlaybook.length <= 1) return;
      onUpdateTactics({ playbook: selectedPlaybook.filter((id) => id !== playId) });
    } else {
      if (selectedPlaybook.length >= 4) {
        onUpdateTactics({ playbook: [...selectedPlaybook.slice(1), playId] });
      } else {
        onUpdateTactics({ playbook: [...selectedPlaybook, playId] });
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. RITMO & TRANSIZIONE */}
      <div className="fm-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Gauge className="w-4 h-4 text-orange-400" />
            <span>1. Ritmo di Gioco, Atteggiamento &amp; Transizione</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Impatto su numero possessi, fatica e contropiedi
          </span>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Ritmo di Gioco (5 Livelli)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {PACE_OPTIONS.map((opt) => {
              const active = tactics.pace === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateTactics({ pace: opt.value })}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-orange-500/15 border-orange-500 text-white shadow-sm'
                      : 'fm-subcard text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.value}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Atteggiamento Offensivo
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AGGRESSION_OPTIONS.map((opt) => {
                const active = (tactics.offensiveAggression ?? 'Normale') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateTactics({ offensiveAggression: opt.value })}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'fm-subcard text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              Rimbalzo Offensivo vs Rientro Difensivo
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {REBOUND_POLICY_OPTIONS.map((opt) => {
                const active = (tactics.reboundPolicy ?? 'Equilibrato') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateTactics({ reboundPolicy: opt.value })}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'fm-subcard text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. FOCUS OFFENSIVO, PLAYBOOK & GERARCHIE */}
      <div className="fm-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Target className="w-4 h-4 text-amber-400" />
            <span>2. Focus Offensivo, Playbook &amp; Gerarchie d&apos;Attacco</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Playbook attivo: <b className="text-amber-300">{selectedPlaybook.length}/4</b> schemi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {OFFENSIVE_FOCUS_OPTIONS.map((opt) => {
            const active = tactics.offensiveFocus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdateTactics({ offensiveFocus: opt.value })}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                    : 'fm-subcard text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs">{opt.value}</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">{opt.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
          {/* Playbook */}
          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
              Schemi Selezionati per la Partita (1–4 schemi)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLAYBOOK_PLAYS.map((play) => {
                const active = selectedPlaybook.includes(play.id);
                return (
                  <button
                    key={play.id}
                    type="button"
                    onClick={() => togglePlay(play.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500/15 border-amber-500/70 text-white'
                        : 'fm-subcard text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{play.label}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-semibold text-amber-300">
                        {play.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {play.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gerarchie 1a e 2a opzione */}
          <div className="lg:col-span-4 space-y-3 bg-slate-950/75 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              <Crosshair className="w-3.5 h-3.5" />
              Gerarchie Pre-Partita
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300">
                1ª Opzione Offensiva (Go-To Guy)
              </label>
              <select
                value={tactics.goToPlayerId ?? ''}
                onChange={(e) => {
                  const val = e.target.value || null;
                  onUpdateTactics({
                    goToPlayerId: val,
                    ...(val && val === tactics.secondaryOptionPlayerId
                      ? { secondaryOptionPlayerId: null }
                      : {}),
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="">Distribuzione equilibrata</option>
                {selectablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.primaryPosition}] {p.firstName} {p.lastName} (OVR {p.overall})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300">
                2ª Opzione Offensiva
              </label>
              <select
                value={tactics.secondaryOptionPlayerId ?? ''}
                onChange={(e) =>
                  onUpdateTactics({ secondaryOptionPlayerId: e.target.value || null })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="">Nessuna 2ª opzione fissa</option>
                {selectablePlayers
                  .filter((p) => p.id !== tactics.goToPlayerId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.primaryPosition}] {p.firstName} {p.lastName} (OVR {p.overall})
                    </option>
                  ))}
              </select>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Le gerarchie vengono caricate all&apos;inizio della gara e restano modificabili in ogni timeout.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SISTEMA DIFENSIVO & COPERTURE */}
      <div className="fm-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>3. Sistema Difensivo &amp; Coperture Tecniche</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Disposizione visualizzata anche sul campo 2D
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {DEFENSE_OPTIONS.map((opt) => {
            const active = tactics.defense === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdateTactics({ defense: opt.value })}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-sky-500/15 border-sky-500 text-white shadow-sm'
                    : 'fm-subcard text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs">{opt.value}</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">{opt.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Copertura sul Pick &amp; Roll
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PNR_COVERAGE_OPTIONS.map((opt) => {
                const active = (tactics.pnrCoverage ?? 'Hedge & Recover') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateTactics({ pnrCoverage: opt.value })}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-sky-500/15 border-sky-500 text-white'
                        : 'fm-subcard text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              Intensità Difensiva
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEFENSIVE_INTENSITY_OPTIONS.map((opt) => {
                const active = (tactics.defensiveIntensity ?? 'Standard') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateTactics({ defensiveIntensity: opt.value })}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-rose-500/15 border-rose-500 text-white'
                        : 'fm-subcard text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
