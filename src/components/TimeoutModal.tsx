import React, { useMemo, useState } from 'react';
import { Crosshair, Flame, Play, Shield, Timer, UserCog, X, Zap } from 'lucide-react';
import { BUILT_IN_PRESETS } from '../data/tacticsCatalog';
import {
  DefenseType,
  DefensiveIntensity,
  MatchTeamState,
  OffensiveAggression,
  OffensiveFocus,
  OpponentDefensiveFocus,
  OpponentPlayerRule,
  PaceType,
  PickAndRollCoverage,
  ReboundPolicy,
  TacticsPreset,
} from '../types';
import { TimeoutTacticalPlan } from '../engine/matchSimulator';
import { computeAssistantTimeoutPlan } from '../engine/assistantCoachTactics';
import { TimeoutTacticsColumn } from './match/TimeoutTacticsColumn';
import { TimeoutSubstitutionsCard } from './match/TimeoutSubstitutionsCard';
import {
  TimeoutMatchupsPanel,
  TimeoutOffensiveHierarchyCard,
} from './match/TimeoutMatchupsPanel';

interface TimeoutModalProps {
  userTeam: MatchTeamState;
  opponentTeam: MatchTeamState;
  quarter?: number;
  clockRemaining?: number;
  assistantName?: string;
  quarterLabel: string;
  clockFormatted: string;
  onSubstitute: (outPlayerId: string, inPlayerId: string) => void;
  onApply: (plan: TimeoutTacticalPlan, resumePlay: boolean) => void;
  onClose: () => void;
}

type TimeoutTacticsTab = 'offense' | 'defense' | 'matchups';

function formatShortPlayerName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

/**
 * Modale tattica del Timeout organizzata su 3 livelli gerarchici:
 * header contestuale, strip preset/stato, corpo bilanciato con lavagnetta cambi e deck tattico a tab.
 */
export const TimeoutModal: React.FC<TimeoutModalProps> = ({
  userTeam,
  opponentTeam,
  quarter = 1,
  clockRemaining = 300,
  assistantName = 'Vice Allenatore',
  quarterLabel,
  clockFormatted,
  onSubstitute,
  onApply,
  onClose,
}) => {
  const [assistantBanner, setAssistantBanner] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TimeoutTacticsTab>('offense');
  const [pace, setPace] = useState<PaceType>(userTeam.tactics.pace);
  const [offensiveFocus, setOffensiveFocus] = useState<OffensiveFocus>(
    userTeam.tactics.offensiveFocus
  );
  const [defense, setDefense] = useState<DefenseType>(userTeam.tactics.defense);
  const [offensiveAggression, setOffensiveAggression] = useState<OffensiveAggression>(
    userTeam.tactics.offensiveAggression ?? 'Normale'
  );
  const [reboundPolicy, setReboundPolicy] = useState<ReboundPolicy>(
    userTeam.tactics.reboundPolicy ?? 'Equilibrato'
  );
  const [pnrCoverage, setPnrCoverage] = useState<PickAndRollCoverage>(
    userTeam.tactics.pnrCoverage ?? 'Hedge & Recover'
  );
  const [defensiveIntensity, setDefensiveIntensity] = useState<DefensiveIntensity>(
    userTeam.tactics.defensiveIntensity ?? 'Standard'
  );
  const [opponentFocus, setOpponentFocus] = useState<OpponentDefensiveFocus>(
    userTeam.tactics.opponentFocus ?? 'Equilibrata'
  );
  const [goToPlayerId, setGoToPlayerId] = useState<string | null>(
    userTeam.goToPlayerId ?? null
  );
  const [secondaryOptionPlayerId, setSecondaryOptionPlayerId] = useState<string | null>(
    userTeam.secondaryOptionPlayerId ?? null
  );
  const [defensiveFocusPlayerId, setDefensiveFocusPlayerId] = useState<string | null>(
    userTeam.defensiveFocusPlayerId ?? null
  );
  const [defensiveMatchups, setDefensiveMatchups] = useState<Record<string, string>>(
    userTeam.defensiveMatchups ?? {}
  );
  const [opponentPlayerRules, setOpponentPlayerRules] = useState<
    Record<string, OpponentPlayerRule>
  >(userTeam.opponentPlayerRules ?? {});
  const [nextAtoPlayId, setNextAtoPlayId] = useState<string | null>(
    userTeam.nextAtoPlayId ?? null
  );
  const [subOutId, setSubOutId] = useState<string>('');

  const customPlays = userTeam.tactics.customPlays ?? [];
  const userActivePlayers = userTeam.players.filter((p) => !p.fouledOut && p.onCourt);
  const userBenchPlayers = userTeam.players.filter((p) => !p.fouledOut && !p.onCourt);
  const userFouledOutPlayers = userTeam.players.filter((p) => p.fouledOut);
  const oppOnCourt = opponentTeam.players.filter((p) => !p.fouledOut && p.onCourt);
  const oppAllActive = opponentTeam.players.filter((p) => !p.fouledOut);

  const buildPlan = (): TimeoutTacticalPlan => ({
    pace,
    offensiveFocus,
    defense,
    offensiveAggression,
    reboundPolicy,
    pnrCoverage,
    defensiveIntensity,
    opponentFocus,
    goToPlayerId,
    secondaryOptionPlayerId,
    defensiveFocusPlayerId,
    defensiveMatchups,
    opponentPlayerRules,
    nextAtoPlayId,
  });

  const handleMatchupChange = (oppPlayerId: string, myPlayerId: string) => {
    setDefensiveMatchups((prev) => {
      const next = { ...prev };
      if (!myPlayerId) {
        delete next[oppPlayerId];
      } else {
        next[oppPlayerId] = myPlayerId;
      }
      return next;
    });
  };

  const handleRuleChange = (oppPlayerId: string, rule: OpponentPlayerRule) => {
    setOpponentPlayerRules((prev) => {
      const next = { ...prev };
      if (rule === 'Standard') {
        delete next[oppPlayerId];
      } else {
        next[oppPlayerId] = rule;
      }
      return next;
    });
  };

  const applyPreset = (preset: TacticsPreset) => {
    setPace(preset.tactics.pace);
    setOffensiveFocus(preset.tactics.offensiveFocus);
    setDefense(preset.tactics.defense);
    setOffensiveAggression(preset.tactics.offensiveAggression ?? 'Normale');
    setReboundPolicy(preset.tactics.reboundPolicy ?? 'Equilibrato');
    setPnrCoverage(preset.tactics.pnrCoverage ?? 'Hedge & Recover');
    setDefensiveIntensity(preset.tactics.defensiveIntensity ?? 'Standard');
    setOpponentFocus(preset.tactics.opponentFocus ?? 'Equilibrata');
    setAssistantBanner(`Preset "${preset.name}" applicato alla lavagna del timeout.`);
  };

  const handleDelegateToAssistant = () => {
    const { plan, summary } = computeAssistantTimeoutPlan(
      userTeam,
      opponentTeam,
      quarter,
      clockRemaining,
      assistantName
    );
    setPace(plan.pace);
    setOffensiveFocus(plan.offensiveFocus);
    setDefense(plan.defense);
    setOffensiveAggression(plan.offensiveAggression);
    if (plan.reboundPolicy) setReboundPolicy(plan.reboundPolicy);
    if (plan.pnrCoverage) setPnrCoverage(plan.pnrCoverage);
    if (plan.defensiveIntensity) setDefensiveIntensity(plan.defensiveIntensity);
    if (plan.opponentFocus) setOpponentFocus(plan.opponentFocus);
    setGoToPlayerId(plan.goToPlayerId);
    setSecondaryOptionPlayerId(plan.secondaryOptionPlayerId ?? null);
    setDefensiveFocusPlayerId(plan.defensiveFocusPlayerId);
    setDefensiveMatchups(plan.defensiveMatchups);
    if (plan.opponentPlayerRules) setOpponentPlayerRules(plan.opponentPlayerRules);
    setAssistantBanner(summary);
  };

  const allPresets = [...BUILT_IN_PRESETS, ...(userTeam.tactics.presets ?? [])];

  const activeMatchupsCount = useMemo(
    () =>
      Object.keys(defensiveMatchups).length +
      Object.keys(opponentPlayerRules).length +
      (defensiveFocusPlayerId ? 1 : 0),
    [defensiveMatchups, opponentPlayerRules, defensiveFocusPlayerId]
  );

  const goToPlayer = useMemo(
    () =>
      goToPlayerId ? userTeam.players.find((p) => p.playerId === goToPlayerId) ?? null : null,
    [goToPlayerId, userTeam.players]
  );

  const defensiveFocusPlayer = useMemo(
    () =>
      defensiveFocusPlayerId
        ? opponentTeam.players.find((p) => p.playerId === defensiveFocusPlayerId) ?? null
        : null,
    [defensiveFocusPlayerId, opponentTeam.players]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="fm-modal border-amber-500/40 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Livello 1: Header Contestuale */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Timer className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  TIMEOUT — Lavagna Tattica
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/35 tabular-nums">
                  {quarterLabel} • {clockFormatted}
                </span>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-100 tabular-nums">
                  <span className="text-orange-300">{userTeam.shortName}</span>{' '}
                  {userTeam.score} – {opponentTeam.score}{' '}
                  <span className="text-sky-300">{opponentTeam.shortName}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                  +11% Stamina
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Inerzia avversaria spezzata. Imposta quintetto sulla lavagna e adegua piano partita live.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDelegateToAssistant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer transition"
            >
              <UserCog className="w-3.5 h-3.5" />
              Delega al Vice Allenatore
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Chiudi senza modificare"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header: Preset Rapidi + Riepilogo Attivo */}
        <div className="px-5 py-2 bg-slate-950/65 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Preset:
            </span>
            {allPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/50 text-[11px] font-bold text-slate-200 cursor-pointer transition"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-300">
              {pace} · {offensiveFocus}
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300">
              {defense} · {pnrCoverage}
            </span>
          </div>
        </div>

        {assistantBanner && (
          <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <UserCog className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{assistantBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setAssistantBanner(null)}
              className="text-[10px] text-amber-300 hover:text-white underline shrink-0 cursor-pointer"
            >
              Nascondi
            </button>
          </div>
        )}

        {/* Livello 2: Body — Lavagnetta Cambi a sinistra + Deck Tattico a Tab a destra */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-6">
            <TimeoutSubstitutionsCard
              userTeamShortName={userTeam.shortName}
              teamFoulsThisQuarter={userTeam.teamFoulsThisQuarter}
              userActivePlayers={userActivePlayers}
              userBenchPlayers={userBenchPlayers}
              userFouledOutPlayers={userFouledOutPlayers}
              goToPlayerId={goToPlayerId}
              secondaryOptionPlayerId={secondaryOptionPlayerId}
              subOutId={subOutId}
              onSelectSubOut={setSubOutId}
              onSubstitute={onSubstitute}
            />
          </div>

          <div className="lg:col-span-6 space-y-3">
            {/* Barra tab gerarchica per le scelte tattiche */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950/90 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('offense')}
                className={`px-3 py-2 rounded-lg text-left transition cursor-pointer ${
                  activeTab === 'offense'
                    ? 'bg-orange-500/20 border border-orange-500/60 text-white shadow-sm'
                    : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold">
                  <Flame
                    className={`w-3.5 h-3.5 ${
                      activeTab === 'offense' ? 'text-orange-400' : 'text-slate-500'
                    }`}
                  />
                  Attacco
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {pace} · {offensiveFocus}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('defense')}
                className={`px-3 py-2 rounded-lg text-left transition cursor-pointer ${
                  activeTab === 'defense'
                    ? 'bg-sky-500/20 border border-sky-500/60 text-white shadow-sm'
                    : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold">
                  <Shield
                    className={`w-3.5 h-3.5 ${
                      activeTab === 'defense' ? 'text-sky-400' : 'text-slate-500'
                    }`}
                  />
                  Difesa
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {defense} · {defensiveIntensity}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('matchups')}
                className={`px-3 py-2 rounded-lg text-left transition cursor-pointer ${
                  activeTab === 'matchups'
                    ? 'bg-rose-500/20 border border-rose-500/60 text-white shadow-sm'
                    : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold">
                  <Crosshair
                    className={`w-3.5 h-3.5 ${
                      activeTab === 'matchups' ? 'text-rose-400' : 'text-slate-500'
                    }`}
                  />
                  Matchup
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {activeMatchupsCount > 0 ? `${activeMatchupsCount} attivi` : 'Auto'}
                </div>
              </button>
            </div>

            {activeTab === 'offense' && (
              <div className="space-y-3">
                <TimeoutTacticsColumn
                  section="offense"
                  pace={pace}
                  offensiveFocus={offensiveFocus}
                  offensiveAggression={offensiveAggression}
                  reboundPolicy={reboundPolicy}
                  defense={defense}
                  pnrCoverage={pnrCoverage}
                  defensiveIntensity={defensiveIntensity}
                  opponentFocus={opponentFocus}
                  customPlays={customPlays}
                  nextAtoPlayId={nextAtoPlayId}
                  onChangePace={setPace}
                  onChangeOffensiveFocus={setOffensiveFocus}
                  onChangeOffensiveAggression={setOffensiveAggression}
                  onChangeReboundPolicy={setReboundPolicy}
                  onChangeDefense={setDefense}
                  onChangePnrCoverage={setPnrCoverage}
                  onChangeDefensiveIntensity={setDefensiveIntensity}
                  onChangeOpponentFocus={setOpponentFocus}
                  onChangeNextAtoPlayId={setNextAtoPlayId}
                />
                <TimeoutOffensiveHierarchyCard
                  userActivePlayers={userActivePlayers}
                  userBenchPlayers={userBenchPlayers}
                  goToPlayerId={goToPlayerId}
                  secondaryOptionPlayerId={secondaryOptionPlayerId}
                  onChangeGoToPlayer={setGoToPlayerId}
                  onChangeSecondaryOptionPlayer={setSecondaryOptionPlayerId}
                />
              </div>
            )}

            {activeTab === 'defense' && (
              <TimeoutTacticsColumn
                section="defense"
                pace={pace}
                offensiveFocus={offensiveFocus}
                offensiveAggression={offensiveAggression}
                reboundPolicy={reboundPolicy}
                defense={defense}
                pnrCoverage={pnrCoverage}
                defensiveIntensity={defensiveIntensity}
                opponentFocus={opponentFocus}
                customPlays={customPlays}
                nextAtoPlayId={nextAtoPlayId}
                onChangePace={setPace}
                onChangeOffensiveFocus={setOffensiveFocus}
                onChangeOffensiveAggression={setOffensiveAggression}
                onChangeReboundPolicy={setReboundPolicy}
                onChangeDefense={setDefense}
                onChangePnrCoverage={setPnrCoverage}
                onChangeDefensiveIntensity={setDefensiveIntensity}
                onChangeOpponentFocus={setOpponentFocus}
                onChangeNextAtoPlayId={setNextAtoPlayId}
              />
            )}

            {activeTab === 'matchups' && (
              <TimeoutMatchupsPanel
                userActivePlayers={userActivePlayers}
                oppOnCourt={oppOnCourt}
                oppAllActive={oppAllActive}
                defensiveFocusPlayerId={defensiveFocusPlayerId}
                defensiveMatchups={defensiveMatchups}
                opponentPlayerRules={opponentPlayerRules}
                onChangeDefensiveFocusPlayer={setDefensiveFocusPlayerId}
                onMatchupChange={handleMatchupChange}
                onRuleChange={handleRuleChange}
                onResetMatchups={() => {
                  setDefensiveMatchups({});
                  setOpponentPlayerRules({});
                }}
              />
            )}
          </div>
        </div>

        {/* Livello 3: Footer Azioni */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/90 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            {goToPlayer || defensiveFocusPlayer ? (
              <>
                {goToPlayer && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
                    ★1 {formatShortPlayerName(goToPlayer.name)}
                  </span>
                )}
                {defensiveFocusPlayer && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold">
                    Focus: {formatShortPlayerName(defensiveFocusPlayer.name)}
                  </span>
                )}
              </>
            ) : (
              <span>I cambi effettuati sulla lavagna sono applicati subito in campo.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition"
            >
              Solo Pausa
            </button>
            <button
              type="button"
              onClick={() => onApply(buildPlan(), false)}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-bold cursor-pointer transition"
            >
              Applica Tattiche
            </button>
            <button
              type="button"
              onClick={() => onApply(buildPlan(), true)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 cursor-pointer transition"
            >
              <Play className="w-3.5 h-3.5" />
              Applica &amp; Riprendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
