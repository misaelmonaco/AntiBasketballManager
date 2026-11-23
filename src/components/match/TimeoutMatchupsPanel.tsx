import React from 'react';
import { Crosshair, Shield } from 'lucide-react';
import { OPPONENT_PLAYER_RULE_OPTIONS } from '../../data/tacticsCatalog';
import { OpponentPlayerRule, PlayerBoxScore } from '../../types';
import { ROLE_COLORS } from '../tactics/customPlayCanvasDraw';

export interface TimeoutOffensiveHierarchyCardProps {
  userActivePlayers: PlayerBoxScore[];
  userBenchPlayers: PlayerBoxScore[];
  goToPlayerId: string | null;
  secondaryOptionPlayerId: string | null;
  onChangeGoToPlayer: (playerId: string | null) => void;
  onChangeSecondaryOptionPlayer: (playerId: string | null) => void;
}

/**
 * Selettore delle opzioni offensive primarie (#1 e #2), sincronizzato visivamente
 * con i badge ★1 / #2 sui giocatori della lavagnetta tattica.
 */
export const TimeoutOffensiveHierarchyCard: React.FC<TimeoutOffensiveHierarchyCardProps> = ({
  userActivePlayers,
  userBenchPlayers,
  goToPlayerId,
  secondaryOptionPlayerId,
  onChangeGoToPlayer,
  onChangeSecondaryOptionPlayer,
}) => {
  return (
    <div className="fm-subcard rounded-2xl p-3.5 border-emerald-500/25 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
          <Crosshair className="w-4 h-4" />
          Gerarchie Offensive (Opzione #1 &amp; #2)
        </div>
        {(goToPlayerId || secondaryOptionPlayerId) && (
          <button
            type="button"
            onClick={() => {
              onChangeGoToPlayer(null);
              onChangeSecondaryOptionPlayer(null);
            }}
            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
            1ª Opzione Offensiva (★1)
          </label>
          <select
            value={goToPlayerId ?? ''}
            onChange={(e) => {
              const val = e.target.value || null;
              onChangeGoToPlayer(val);
              if (val && val === secondaryOptionPlayerId) {
                onChangeSecondaryOptionPlayer(null);
              }
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="">Equilibrata (tutti coinvolti)</option>
            <optgroup label="In campo ora">
              {userActivePlayers.map((p) => (
                <option key={p.playerId} value={p.playerId}>
                  [{p.position}] {p.name} ({p.points}p)
                </option>
              ))}
            </optgroup>
            {userBenchPlayers.length > 0 && (
              <optgroup label="Panchina">
                {userBenchPlayers.map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    [{p.position}] {p.name} ({p.points}p)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
            2ª Opzione Offensiva (#2)
          </label>
          <select
            value={secondaryOptionPlayerId ?? ''}
            onChange={(e) => onChangeSecondaryOptionPlayer(e.target.value || null)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-sky-500"
          >
            <option value="">Nessuna 2ª opzione</option>
            {[...userActivePlayers, ...userBenchPlayers]
              .filter((p) => p.playerId !== goToPlayerId)
              .map((p) => (
                <option key={p.playerId} value={p.playerId}>
                  [{p.position}] {p.name} ({p.points}p)
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
};

interface TimeoutMatchupsPanelProps {
  userActivePlayers: PlayerBoxScore[];
  oppOnCourt: PlayerBoxScore[];
  oppAllActive: PlayerBoxScore[];
  defensiveFocusPlayerId: string | null;
  defensiveMatchups: Record<string, string>;
  opponentPlayerRules: Record<string, OpponentPlayerRule>;
  onChangeDefensiveFocusPlayer: (playerId: string | null) => void;
  onMatchupChange: (oppPlayerId: string, myPlayerId: string) => void;
  onRuleChange: (oppPlayerId: string, rule: OpponentPlayerRule) => void;
  onResetMatchups: () => void;
}

/**
 * Pannello della tab Matchup per impostare la marcatura speciale sulla stella avversaria
 * e gli accoppiamenti / regole difensive individuali per il quintetto avversario in campo.
 */
export const TimeoutMatchupsPanel: React.FC<TimeoutMatchupsPanelProps> = ({
  userActivePlayers,
  oppOnCourt,
  oppAllActive,
  defensiveFocusPlayerId,
  defensiveMatchups,
  opponentPlayerRules,
  onChangeDefensiveFocusPlayer,
  onMatchupChange,
  onRuleChange,
  onResetMatchups,
}) => {
  const customRulesCount =
    Object.keys(defensiveMatchups).length + Object.keys(opponentPlayerRules).length;

  return (
    <div className="space-y-3">
      {/* Card Primaria: Focus difensivo prioritario */}
      <div className="fm-card rounded-2xl p-4 border-rose-500/25 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-400">
            <Shield className="w-4 h-4" />
            Focus Difensivo Prioritario (Stella Avversaria)
          </div>
          {defensiveFocusPlayerId && (
            <button
              type="button"
              onClick={() => onChangeDefensiveFocusPlayer(null)}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer shrink-0"
            >
              Reset
            </button>
          )}
        </div>
        <select
          value={defensiveFocusPlayerId ?? ''}
          onChange={(e) => onChangeDefensiveFocusPlayer(e.target.value || null)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-rose-500"
        >
          <option value="">Nessuna marcatura speciale</option>
          {oppAllActive
            .slice()
            .sort((a, b) => b.points - a.points)
            .map((p) => (
              <option key={p.playerId} value={p.playerId}>
                [{p.position}] {p.name} — {p.points} PT ({p.fgm}/{p.fga} FG)
              </option>
            ))}
        </select>
        <p className="text-[10px] text-slate-400">
          Concentra gli aiuti difensivi e la pressione sul principale finalizzatore avversario.
        </p>
      </div>

      {/* Card Primaria: Matchup & Regole Individuali */}
      <div className="fm-card rounded-2xl p-4 border-sky-500/25 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
              Matchup &amp; Regole Individuali (In Campo)
            </div>
            {customRulesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/35 text-[10px] font-bold text-sky-300 tabular-nums">
                {customRulesCount} attivi
              </span>
            )}
          </div>
          {customRulesCount > 0 && (
            <button
              type="button"
              onClick={onResetMatchups}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer shrink-0"
            >
              Reset Matchup
            </button>
          )}
        </div>

        <div className="space-y-2">
          {oppOnCourt.map((opp) => {
            const rule = opponentPlayerRules[opp.playerId] ?? 'Standard';
            const hasCustomMatchup = Boolean(defensiveMatchups[opp.playerId]);
            const hasCustomRule = rule !== 'Standard';
            const isStarFocus = defensiveFocusPlayerId === opp.playerId;

            return (
              <div
                key={opp.playerId}
                className={`rounded-xl border px-3 py-2 space-y-1.5 transition ${
                  isStarFocus
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : hasCustomMatchup || hasCustomRule
                    ? 'bg-slate-900/95 border-sky-500/35'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="px-1.5 py-[1px] rounded text-[9px] font-black text-slate-950 shrink-0"
                      style={{ backgroundColor: ROLE_COLORS[opp.position] }}
                    >
                      {opp.position}
                    </span>
                    <span className="font-bold text-slate-100 truncate">{opp.name}</span>
                    {isStarFocus && (
                      <span className="px-1.5 py-[1px] rounded bg-rose-500/20 border border-rose-500/40 text-[9px] font-bold text-rose-300 shrink-0">
                        FOCUS
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] tabular-nums shrink-0 text-slate-400">
                    <span className="font-semibold text-slate-200">{opp.points} PT</span>
                    <span>•</span>
                    <span className={opp.fouls >= 4 ? 'text-red-400 font-bold' : ''}>
                      {opp.fouls}F
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <select
                    value={defensiveMatchups[opp.playerId] ?? ''}
                    onChange={(e) => onMatchupChange(opp.playerId, e.target.value)}
                    className={`w-full bg-slate-900 border rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-sky-500 ${
                      hasCustomMatchup
                        ? 'border-sky-500/60 text-sky-200 font-semibold'
                        : 'border-slate-700 text-slate-300'
                    }`}
                  >
                    <option value="">Marcatore Auto</option>
                    {userActivePlayers.map((mine) => (
                      <option key={mine.playerId} value={mine.playerId}>
                        [{mine.position}] {mine.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={rule}
                    onChange={(e) =>
                      onRuleChange(opp.playerId, e.target.value as OpponentPlayerRule)
                    }
                    className={`w-full bg-slate-900 border rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-emerald-500 ${
                      hasCustomRule
                        ? 'border-emerald-500/70 text-emerald-300 font-semibold'
                        : 'border-slate-700 text-slate-300'
                    }`}
                  >
                    {OPPONENT_PLAYER_RULE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
