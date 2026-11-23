import React from 'react';
import { Flame, Shield, Sparkles, Target } from 'lucide-react';
import {
  AGGRESSION_OPTIONS,
  DEFENSE_OPTIONS,
  DEFENSIVE_INTENSITY_OPTIONS,
  OFFENSIVE_FOCUS_OPTIONS,
  OPPONENT_FOCUS_OPTIONS,
  PACE_OPTIONS,
  PNR_COVERAGE_OPTIONS,
  REBOUND_POLICY_OPTIONS,
  TacticOption,
} from '../../data/tacticsCatalog';
import {
  CustomPlay,
  DefenseType,
  DefensiveIntensity,
  OffensiveAggression,
  OffensiveFocus,
  OpponentDefensiveFocus,
  PaceType,
  PickAndRollCoverage,
  ReboundPolicy,
} from '../../types';

interface TimeoutTacticsColumnProps {
  section: 'offense' | 'defense';
  pace: PaceType;
  offensiveFocus: OffensiveFocus;
  offensiveAggression: OffensiveAggression;
  reboundPolicy: ReboundPolicy;
  defense: DefenseType;
  pnrCoverage: PickAndRollCoverage;
  defensiveIntensity: DefensiveIntensity;
  opponentFocus: OpponentDefensiveFocus;
  customPlays: CustomPlay[];
  nextAtoPlayId: string | null;
  onChangePace: (pace: PaceType) => void;
  onChangeOffensiveFocus: (focus: OffensiveFocus) => void;
  onChangeOffensiveAggression: (aggression: OffensiveAggression) => void;
  onChangeReboundPolicy: (policy: ReboundPolicy) => void;
  onChangeDefense: (defense: DefenseType) => void;
  onChangePnrCoverage: (coverage: PickAndRollCoverage) => void;
  onChangeDefensiveIntensity: (intensity: DefensiveIntensity) => void;
  onChangeOpponentFocus: (focus: OpponentDefensiveFocus) => void;
  onChangeNextAtoPlayId: (playId: string | null) => void;
}

type AccentTone = 'orange' | 'amber' | 'emerald' | 'sky' | 'rose';

const ACTIVE_BUTTON_TONES: Record<AccentTone, string> = {
  orange: 'bg-orange-500/20 border-orange-500 text-white shadow-sm shadow-orange-500/15',
  amber: 'bg-amber-500/20 border-amber-500 text-white shadow-sm shadow-amber-500/15',
  emerald: 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm shadow-emerald-500/15',
  sky: 'bg-sky-500/20 border-sky-500 text-white shadow-sm shadow-sky-500/15',
  rose: 'bg-rose-500/20 border-rose-500 text-white shadow-sm shadow-rose-500/15',
};

function getActiveDescription<T extends string>(
  options: TacticOption<T>[],
  activeValue: T
): string | undefined {
  return options.find((opt) => opt.value === activeValue)?.desc;
}

interface TacticOptionSelectorProps<T extends string> {
  options: TacticOption<T>[];
  value: T;
  onChange: (value: T) => void;
  tone: AccentTone;
  gridClassName: string;
  paddingClassName?: string;
}

function TacticOptionSelector<T extends string>({
  options,
  value,
  onChange,
  tone,
  gridClassName,
  paddingClassName = 'px-2.5 py-2',
}: TacticOptionSelectorProps<T>) {
  const activeDesc = getActiveDescription(options, value);

  return (
    <div className="space-y-1.5">
      <div className={`grid gap-1.5 ${gridClassName}`}>
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.desc}
              className={`${paddingClassName} rounded-xl border text-left transition cursor-pointer ${
                isActive
                  ? ACTIVE_BUTTON_TONES[tone]
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="text-[11px] font-bold leading-tight truncate">{opt.value}</div>
            </button>
          );
        })}
      </div>
      {activeDesc && (
        <p className="text-[10px] leading-snug text-slate-400 px-0.5">{activeDesc}</p>
      )}
    </div>
  );
}

/**
 * Colonna delle scelte tattiche del timeout divisa per contesto ('offense' | 'defense')
 * con gerarchia visiva tra impostazioni primarie, secondarie e descrizioni attive.
 */
export const TimeoutTacticsColumn: React.FC<TimeoutTacticsColumnProps> = ({
  section,
  pace,
  offensiveFocus,
  offensiveAggression,
  reboundPolicy,
  defense,
  pnrCoverage,
  defensiveIntensity,
  opponentFocus,
  customPlays,
  nextAtoPlayId,
  onChangePace,
  onChangeOffensiveFocus,
  onChangeOffensiveAggression,
  onChangeReboundPolicy,
  onChangeDefense,
  onChangePnrCoverage,
  onChangeDefensiveIntensity,
  onChangeOpponentFocus,
  onChangeNextAtoPlayId,
}) => {
  if (section === 'offense') {
    return (
      <div className="space-y-3">
        {/* Card Primaria: Ritmo & Filosofia Offensiva */}
        <div className="fm-card rounded-2xl p-4 border-orange-500/25 space-y-3.5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange-400">
                <Flame className="w-4 h-4" />
                Ritmo di Gioco
              </div>
              <span className="text-[10px] font-bold text-orange-300/90 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-md">
                {pace}
              </span>
            </div>
            <TacticOptionSelector
              options={PACE_OPTIONS}
              value={pace}
              onChange={onChangePace}
              tone="orange"
              gridClassName="grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
              paddingClassName="px-2 py-1.5"
            />
          </div>

          <div className="border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange-400">
                <Target className="w-4 h-4" />
                Modalità Offensiva
              </div>
              <span className="text-[10px] font-bold text-orange-300/90 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-md">
                {offensiveFocus}
              </span>
            </div>
            <TacticOptionSelector
              options={OFFENSIVE_FOCUS_OPTIONS}
              value={offensiveFocus}
              onChange={onChangeOffensiveFocus}
              tone="orange"
              gridClassName="grid-cols-2 sm:grid-cols-3"
            />
          </div>
        </div>

        {/* Card Secondaria: Gestione Possesso & Transizione */}
        <div className="fm-subcard rounded-2xl p-3.5 space-y-2.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Gestione Possesso &amp; Transizione
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Atteggiamento
              </div>
              <TacticOptionSelector
                options={AGGRESSION_OPTIONS}
                value={offensiveAggression}
                onChange={onChangeOffensiveAggression}
                tone="amber"
                gridClassName="grid-cols-2"
                paddingClassName="px-2 py-1.5"
              />
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                Rimbalzo vs Rientro
              </div>
              <TacticOptionSelector
                options={REBOUND_POLICY_OPTIONS}
                value={reboundPolicy}
                onChange={onChangeReboundPolicy}
                tone="emerald"
                gridClassName="grid-cols-1"
                paddingClassName="px-2.5 py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Card ATO: Schema per il prossimo possesso */}
        {customPlays.length > 0 && (
          <div className="fm-subcard rounded-2xl p-3.5 border-amber-500/35 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                Chiama Schema ATO (Prossimo Possesso)
              </div>
              {nextAtoPlayId && (
                <button
                  type="button"
                  onClick={() => onChangeNextAtoPlayId(null)}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <select
              value={nextAtoPlayId ?? ''}
              onChange={(e) => onChangeNextAtoPlayId(e.target.value || null)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="">Nessuno schema ATO forzato</option>
              {customPlays.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  ★ {cp.name} (Tiro: {cp.shooterRole}
                  {cp.screeners.length > 0 ? `, Blocchi: ${cp.screeners.join('+')}` : ''})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Card Primaria: Sistema Difensivo */}
      <div className="fm-card rounded-2xl p-4 border-sky-500/25 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-400">
            <Shield className="w-4 h-4" />
            Sistema Difensivo
          </div>
          <span className="text-[10px] font-bold text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-md">
            {defense}
          </span>
        </div>
        <TacticOptionSelector
          options={DEFENSE_OPTIONS}
          value={defense}
          onChange={onChangeDefense}
          tone="sky"
          gridClassName="grid-cols-2 sm:grid-cols-3"
        />
      </div>

      {/* Card Secondaria: Copertura P&R & Intensità */}
      <div className="fm-subcard rounded-2xl p-3.5 space-y-2.5">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Regole su Pick &amp; Roll e Aggressività
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-300 mb-1.5">
              Copertura Pick &amp; Roll
            </div>
            <TacticOptionSelector
              options={PNR_COVERAGE_OPTIONS}
              value={pnrCoverage}
              onChange={onChangePnrCoverage}
              tone="sky"
              gridClassName="grid-cols-2"
              paddingClassName="px-2 py-1.5"
            />
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-300 mb-1.5">
              Intensità Difensiva
            </div>
            <TacticOptionSelector
              options={DEFENSIVE_INTENSITY_OPTIONS}
              value={defensiveIntensity}
              onChange={onChangeDefensiveIntensity}
              tone="rose"
              gridClassName="grid-cols-1"
              paddingClassName="px-2.5 py-1.5"
            />
          </div>
        </div>
      </div>

      {/* Card Secondaria: Istruzione Collettiva sull'Avversario */}
      <div className="fm-subcard rounded-2xl p-3.5 border-emerald-500/20 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Istruzione Collettiva sull&apos;Avversario
          </div>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
            {opponentFocus}
          </span>
        </div>
        <TacticOptionSelector
          options={OPPONENT_FOCUS_OPTIONS}
          value={opponentFocus}
          onChange={onChangeOpponentFocus}
          tone="emerald"
          gridClassName="grid-cols-2 sm:grid-cols-3"
          paddingClassName="px-2 py-1.5"
        />
      </div>
    </div>
  );
};
