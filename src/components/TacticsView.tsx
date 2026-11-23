import React, { useMemo, useState } from 'react';
import { Crosshair, PenTool, Sliders, Sparkles, UserCog } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Team } from '../types';
import { PageHeader } from './PageHeader';
import { TacticsPresetsBar } from './tactics/TacticsPresetsBar';
import { TacticsCoreSections } from './tactics/TacticsCoreSections';
import { TacticsOpponentPlan } from './tactics/TacticsOpponentPlan';
import { CustomPlayDesigner } from './tactics/CustomPlayDesigner';

export const TacticsView: React.FC = () => {
  const {
    career,
    updateTactics,
    applyAssistantTacticsNow,
    setDelegateTacticsToAssistant,
  } = useGameStore();
  const [activeSubTab, setActiveSubTab] = useState<'core' | 'opponent' | 'designer'>('core');

  const userTeam = career?.teams.find((t) => t.id === career.userTeamId);

  const nextOpponent: Team | undefined = useMemo(() => {
    if (!career || !userTeam) return undefined;
    if (career.phase === 'playoffs') {
      const series = career.playoffs.find(
        (s) =>
          !s.winnerId &&
          (s.higherSeedId === userTeam.id || s.lowerSeedId === userTeam.id)
      );
      if (series) {
        const oppId =
          series.higherSeedId === userTeam.id ? series.lowerSeedId : series.higherSeedId;
        return career.teams.find((t) => t.id === oppId);
      }
    }
    const nextGame = career.schedule.find(
      (g) =>
        !g.played &&
        g.round >= career.currentRound &&
        (g.homeTeamId === userTeam.id || g.awayTeamId === userTeam.id)
    );
    if (!nextGame) return undefined;
    const oppId =
      nextGame.homeTeamId === userTeam.id ? nextGame.awayTeamId : nextGame.homeTeamId;
    return career.teams.find((t) => t.id === oppId);
  }, [career, userTeam]);

  if (!career || !userTeam) return null;

  const { tactics } = userTeam;
  const assistant = userTeam.staff?.assistant_coach;
  const delegated = Boolean(tactics.delegateToAssistant);

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Area Tecnica"
        title="Lavagna Tattica Avanzata"
        subtitle={`Configura identità di gioco, schemi, coperture difensive e piano partita sull'avversario per ${userTeam.name}.`}
      />

      {/* Delega al Vice Allenatore */}
      <div className="fm-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
            <UserCog className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {assistant
                ? `Vice Allenatore: ${assistant.firstName} ${assistant.lastName} (VAL ${assistant.rating})`
                : 'Vice Allenatore'}
              {delegated && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold uppercase">
                  Delega Attiva
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {assistant ? `${assistant.specialty} • ` : ''}
              {delegated
                ? 'Il Vice adatta automaticamente ritmo, coperture P&R, difesa e matchup prima di ogni gara.'
                : 'Puoi applicare i consigli tattici del Vice oppure attivare la delega automatica.'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={applyAssistantTacticsNow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Applica Scelte del Vice Ora
          </button>
          <button
            type="button"
            onClick={() => setDelegateTacticsToAssistant(!delegated)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-extrabold cursor-pointer transition-colors ${
              delegated
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
                : 'bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border-orange-500/40'
            }`}
          >
            <UserCog className="w-3.5 h-3.5" />
            {delegated ? 'Delega Tattica Attiva (Disattiva)' : 'Delega Scelte Tattiche al Vice'}
          </button>
        </div>
      </div>

      {/* Preset Tattici Rapidi */}
      <TacticsPresetsBar tactics={tactics} onUpdateTactics={updateTactics} />

      {/* Switcher Tab: Impianto Tattico vs Piano sull'Avversario */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('core')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
            activeSubTab === 'core'
              ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-sm'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Impianto Tattico &amp; Playbook
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('opponent')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
            activeSubTab === 'opponent'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>Piano sull&apos;Avversario</span>
          {nextOpponent && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                activeSubTab === 'opponent'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-emerald-500/15 text-emerald-300'
              }`}
            >
              vs {nextOpponent.shortName}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('designer')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
            activeSubTab === 'designer'
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Editor Schemi</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
              activeSubTab === 'designer'
                ? 'bg-slate-950/20 text-slate-950'
                : 'bg-amber-500/15 text-amber-300'
            }`}
          >
            {(tactics.customPlays ?? []).filter((cp) => cp.active).length}/
            {(tactics.customPlays ?? []).length}
          </span>
        </button>
      </div>

      {activeSubTab === 'core' ? (
        <TacticsCoreSections
          tactics={tactics}
          roster={userTeam.roster}
          onUpdateTactics={updateTactics}
        />
      ) : activeSubTab === 'opponent' ? (
        <TacticsOpponentPlan
          career={career}
          userTeam={userTeam}
          nextOpponent={nextOpponent}
          onUpdateTactics={updateTactics}
          onGenerateWithAssistant={applyAssistantTacticsNow}
        />
      ) : (
        <CustomPlayDesigner
          customPlays={tactics.customPlays ?? []}
          onUpdateTactics={updateTactics}
        />
      )}
    </div>
  );
};
