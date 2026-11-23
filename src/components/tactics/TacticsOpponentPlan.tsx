import React, { useMemo, useState } from 'react';
import { Crosshair, RotateCcw, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import {
  OPPONENT_FOCUS_OPTIONS,
  OPPONENT_PLAYER_RULE_OPTIONS,
} from '../../data/tacticsCatalog';
import {
  CareerSave,
  OpponentPlayerRule,
  Player,
  Tactics,
  Team,
} from '../../types';
import { ClubBadge } from '../ClubBadge';

interface TacticsOpponentPlanProps {
  career: CareerSave;
  userTeam: Team;
  nextOpponent?: Team;
  onUpdateTactics: (patch: Partial<Tactics>) => void;
  onGenerateWithAssistant: () => void;
}

export const TacticsOpponentPlan: React.FC<TacticsOpponentPlanProps> = ({
  career,
  userTeam,
  nextOpponent,
  onUpdateTactics,
  onGenerateWithAssistant,
}) => {
  const sameLeagueRivals = useMemo(
    () =>
      career.teams
        .filter((t) => t.id !== userTeam.id && t.leagueId === userTeam.leagueId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [career.teams, userTeam.id, userTeam.leagueId]
  );

  const [selectedOppId, setSelectedOppId] = useState<string>(
    () =>
      nextOpponent?.id ??
      userTeam.tactics.opponentGamePlan?.opponentTeamId ??
      sameLeagueRivals[0]?.id ??
      ''
  );

  const targetOpp =
    career.teams.find((t) => t.id === selectedOppId) ?? nextOpponent ?? sameLeagueRivals[0];

  const myActiveDefenders = useMemo(
    () =>
      userTeam.roster
        .filter((p) => p.injuryWeeks === 0 && p.rosterSlot !== 'reserve')
        .sort((a, b) => b.overall - a.overall),
    [userTeam.roster]
  );

  if (!targetOpp) return null;

  const oppActiveRoster: Player[] = [...targetOpp.roster]
    .filter((p) => p.injuryWeeks === 0 && p.rosterSlot !== 'reserve')
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 10);

  const topScorer = [...targetOpp.roster].sort((a, b) => b.overall - a.overall)[0];
  const topShooter = [...targetOpp.roster].sort(
    (a, b) => b.attributes.threePoint - a.attributes.threePoint
  )[0];
  const topRebounder = [...targetOpp.roster].sort(
    (a, b) => b.attributes.rebounding - a.attributes.rebounding
  )[0];

  const currentPlan =
    userTeam.tactics.opponentGamePlan?.opponentTeamId === targetOpp.id
      ? userTeam.tactics.opponentGamePlan.playerInstructions
      : {};

  const updatePlayerInstruction = (
    oppPlayerId: string,
    patch: { defenderId?: string; rule?: OpponentPlayerRule }
  ) => {
    const prevInst = currentPlan[oppPlayerId] ?? { rule: 'Standard' as OpponentPlayerRule };
    const nextInst = {
      ...prevInst,
      ...patch,
    };
    if (!nextInst.defenderId) {
      delete nextInst.defenderId;
    }
    const nextMap = { ...currentPlan };
    if (!nextInst.defenderId && nextInst.rule === 'Standard') {
      delete nextMap[oppPlayerId];
    } else {
      nextMap[oppPlayerId] = nextInst;
    }
    onUpdateTactics({
      opponentGamePlan: {
        opponentTeamId: targetOpp.id,
        playerInstructions: nextMap,
      },
    });
  };

  const resetOpponentPlan = () => {
    onUpdateTactics({
      opponentGamePlan: {
        opponentTeamId: targetOpp.id,
        playerInstructions: {},
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Selettore Avversario & Mini-Report */}
      <div className="fm-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClubBadge
              shortName={targetOpp.shortName}
              primaryColor={targetOpp.primaryColor}
              secondaryColor={targetOpp.secondaryColor}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">{targetOpp.name}</h3>
                {nextOpponent?.id === targetOpp.id && (
                  <span className="px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-extrabold uppercase">
                    Prossima Partita
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Tattica stimata: <b className="text-slate-200">{targetOpp.tactics.pace}</b> ·{' '}
                <b className="text-slate-200">{targetOpp.tactics.offensiveFocus}</b> · Difesa{' '}
                <b className="text-slate-200">{targetOpp.tactics.defense}</b>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={targetOpp.id}
              onChange={(e) => setSelectedOppId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-orange-500"
            >
              {sameLeagueRivals.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {nextOpponent?.id === t.id ? '(Prossimo)' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onGenerateWithAssistant}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Compila col Vice
            </button>
            <button
              type="button"
              onClick={resetOpponentPlan}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Piano
            </button>
          </div>
        </div>

        {/* Mini-Report Giocatori Chiave Avversari */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topScorer && (
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Stella / Leader Tecnico
              </div>
              <div className="text-sm font-bold text-white mt-1">
                [{topScorer.primaryPosition}] {topScorer.firstName} {topScorer.lastName}
              </div>
              <div className="text-[11px] text-slate-400">
                OVR <b className="text-orange-400">{topScorer.overall}</b> · 2P{' '}
                {topScorer.attributes.twoPoint} · 3P {topScorer.attributes.threePoint}
              </div>
            </div>
          )}

          {topShooter && (
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5" />
                Pericolo Perimetro (3PT)
              </div>
              <div className="text-sm font-bold text-white mt-1">
                [{topShooter.primaryPosition}] {topShooter.firstName} {topShooter.lastName}
              </div>
              <div className="text-[11px] text-slate-400">
                Tiro da 3 <b className="text-sky-300">{topShooter.attributes.threePoint}</b> · OVR{' '}
                {topShooter.overall}
              </div>
            </div>
          )}

          {topRebounder && (
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Dominatore a Rimbalzo
              </div>
              <div className="text-sm font-bold text-white mt-1">
                [{topRebounder.primaryPosition}] {topRebounder.firstName} {topRebounder.lastName}
              </div>
              <div className="text-[11px] text-slate-400">
                Rimbalzi <b className="text-emerald-300">{topRebounder.attributes.rebounding}</b> ·
                Dif. Post {topRebounder.attributes.postDef}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Focus Collettivo sull'Avversario */}
      <div className="fm-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span>Istruzione Collettiva sull&apos;Avversario</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {OPPONENT_FOCUS_OPTIONS.map((opt) => {
            const active = (userTeam.tactics.opponentFocus ?? 'Equilibrata') === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdateTactics({ opponentFocus: opt.value })}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
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

      {/* Istruzioni Individuali per Giocatore Avversario */}
      <div className="fm-card rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-white">
              Istruzioni Individuali sul Roster di {targetOpp.shortName}
            </div>
            <div className="text-xs text-slate-400">
              Abbina i tuoi marcatori e assegna regole specifiche: verranno caricate automaticamente alla palla a due.
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            Istruzioni attive:{' '}
            <b className="text-emerald-400">{Object.keys(currentPlan).length}</b>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Avversario</th>
                <th className="py-2.5 px-2 text-center">OVR</th>
                <th className="py-2.5 px-2 text-center">3P</th>
                <th className="py-2.5 px-2 text-center">Difesa</th>
                <th className="py-2.5 px-3">Marcatore Assegnato</th>
                <th className="py-2.5 px-3">Regola di Marcatura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {oppActiveRoster.map((oppP) => {
                const inst = currentPlan[oppP.id] ?? { rule: 'Standard' as OpponentPlayerRule };
                const avgDef = Math.round(
                  (oppP.attributes.perimeterDef + oppP.attributes.postDef) / 2
                );
                return (
                  <tr key={oppP.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3">
                      <span className="inline-block w-7 font-mono text-[10px] text-orange-400 font-bold">
                        {oppP.primaryPosition}
                      </span>
                      <span className="font-semibold text-white">
                        {oppP.firstName} {oppP.lastName}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-extrabold text-amber-300 tabular-nums">
                      {oppP.overall}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300 tabular-nums">
                      {oppP.attributes.threePoint}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300 tabular-nums">
                      {avgDef}
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={inst.defenderId ?? ''}
                        onChange={(e) =>
                          updatePlayerInstruction(oppP.id, {
                            defenderId: e.target.value || undefined,
                          })
                        }
                        className="w-full min-w-[175px] bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-sky-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="">Auto (Per Ruolo)</option>
                        {myActiveDefenders.map((mine) => (
                          <option key={mine.id} value={mine.id}>
                            [{mine.primaryPosition}] {mine.firstName[0]}. {mine.lastName} (OVR{' '}
                            {mine.overall})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={inst.rule}
                        onChange={(e) =>
                          updatePlayerInstruction(oppP.id, {
                            rule: e.target.value as OpponentPlayerRule,
                          })
                        }
                        className={`w-full min-w-[175px] bg-slate-950 border rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none ${
                          inst.rule !== 'Standard'
                            ? 'border-emerald-500/70 text-emerald-300'
                            : 'border-slate-700 text-slate-300'
                        }`}
                      >
                        {OPPONENT_PLAYER_RULE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.value}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80">
          {OPPONENT_PLAYER_RULE_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className="rounded-lg bg-slate-950/70 border border-slate-800/80 px-2.5 py-2 text-[10px]"
            >
              <div className="font-bold text-emerald-300">{opt.value}</div>
              <div className="text-slate-400 mt-0.5 leading-snug">{opt.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
