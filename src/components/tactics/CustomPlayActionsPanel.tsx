import React from 'react';
import { Crosshair } from 'lucide-react';
import { CustomPlay, PlayShotStyle } from '../../types';
import {
  ALL_ROLES,
  CustomPlayAnalysis,
  ROLE_NUMBERS,
  SHOT_STYLE_OPTIONS,
  getEffectivePasses,
  getEffectiveScreens,
  getEffectiveSteps,
  syncCustomPlayFields,
} from '../../engine/customPlayEngine';
import { CustomPlayScreensCard } from './CustomPlayScreensCard';
import { CustomPlayPassesCard } from './CustomPlayPassesCard';

interface CustomPlayActionsPanelProps {
  play: CustomPlay;
  analysis: CustomPlayAnalysis;
  stepIndex: number;
  onUpdatePlay: (updated: CustomPlay) => void;
}

export const CustomPlayActionsPanel: React.FC<CustomPlayActionsPanelProps> = ({
  play,
  analysis,
  stepIndex,
  onUpdatePlay,
}) => {
  const steps = getEffectiveSteps(play);
  const safeStepIdx = Math.min(Math.max(0, stepIndex), steps.length - 1);
  const effectiveScreens = getEffectiveScreens(play);
  const effectivePasses = getEffectivePasses(play);

  const activeShotMeta = SHOT_STYLE_OPTIONS.find(
    (s) => s.value === (play.shotStyle ?? 'auto')
  );

  return (
    <div className="space-y-3">
      {/* 1. PALLA INIZIALE & TERMINALE DI TIRO */}
      <div className="rounded-xl bg-slate-950/85 border border-slate-800 p-3.5 space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-orange-400">
          <Crosshair className="w-3.5 h-3.5" />
          <span>Palla Iniziale &amp; Chi Prende il Tiro</span>
        </div>

        <div>
          <div className="text-[10px] font-semibold text-slate-400 mb-1">
            Portatore palla iniziale (Fase 1)
          </div>
          <div className="grid grid-cols-5 gap-1">
            {ALL_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() =>
                  onUpdatePlay(syncCustomPlayFields({ ...play, initialBallHandler: role }))
                }
                className={`py-1.5 rounded-lg border text-[11px] font-extrabold cursor-pointer ${
                  play.initialBallHandler === role
                    ? 'bg-orange-500 text-slate-950 border-orange-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                {ROLE_NUMBERS[role]} {role}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold text-slate-400 mb-1">
            Chi prende il tiro finale (Terminale)
          </div>
          <div className="grid grid-cols-5 gap-1">
            {ALL_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => onUpdatePlay(syncCustomPlayFields({ ...play, shooterRole: role }))}
                className={`py-1.5 rounded-lg border text-[11px] font-extrabold cursor-pointer ${
                  play.shooterRole === role
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                {ROLE_NUMBERS[role]} {role}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold text-slate-400">
            Come effettua la conclusione
          </label>
          <select
            value={play.shotStyle ?? 'auto'}
            onChange={(e) =>
              onUpdatePlay(
                syncCustomPlayFields({
                  ...play,
                  shotStyle: e.target.value as PlayShotStyle,
                })
              )
            }
            className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-xs text-emerald-200 font-semibold"
          >
            {SHOT_STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {activeShotMeta && (
            <div className="text-[10px] text-slate-400 leading-tight">{activeShotMeta.desc}</div>
          )}
        </div>
      </div>

      {/* 2. CHI PORTA I BLOCCHI */}
      <CustomPlayScreensCard
        play={play}
        steps={steps}
        safeStepIdx={safeStepIdx}
        effectiveScreens={effectiveScreens}
        onCommitScreens={(nextScreens) =>
          onUpdatePlay(syncCustomPlayFields({ ...play, screens: nextScreens }))
        }
      />

      {/* 3. COME VENGONO EFFETTUATI I PASSAGGI */}
      <CustomPlayPassesCard
        play={play}
        steps={steps}
        safeStepIdx={safeStepIdx}
        effectivePasses={effectivePasses}
        onCommitPasses={(nextPasses) =>
          onUpdatePlay(syncCustomPlayFields({ ...play, passes: nextPasses }))
        }
      />

      {/* 4. ANALISI MOTORE TATTICO AUTOMATICA */}
      <div className="rounded-xl bg-slate-950/85 border border-slate-800 p-3.5 space-y-2">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
          Analisi Motore Tattico Automatica
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">Conclusione</div>
            <div className="font-bold text-white">{analysis.summaryBadge}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">Vantaggio Atteso</div>
            <div className="font-bold text-emerald-300">{analysis.bestAgainst}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">Qualità Tiro</div>
            <div className="font-bold text-amber-300">
              +{Math.round(analysis.shotQualityBonus * 1000) / 10}%
              {analysis.foulDrawBonus > 0
                ? ` · +${Math.round(analysis.foulDrawBonus * 100)}% falli`
                : ''}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">Fasi / Blocchi / Pass</div>
            <div className="font-bold text-sky-300">
              {analysis.stepCount} Fasi · {analysis.screenCount} Bl. · {analysis.passCount} Pass
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Tiratore designato: <b className="text-white">{play.shooterRole}</b> (
          {analysis.shotZoneLabel})
          {analysis.passerRole ? (
            <>
              {' '}
              {analysis.passCueLabel} <b className="text-white">{analysis.passerRole}</b>
            </>
          ) : null}
          .
        </p>
      </div>
    </div>
  );
};
