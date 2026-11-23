import React from 'react';
import { ArrowLeftRight, Binoculars, Eye, Star } from 'lucide-react';
import { LEAGUES } from '../../data/teams';
import { formatEuro } from '../../engine/ratings';
import { getPlayerBuyoutClause } from '../../engine/scoutingEngine';
import { LeagueId, Player, Team } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';

interface MarketRivalsTabProps {
  allRivalTeams: Team[];
  rivalTeams: Team[];
  activeRival: Team;
  selectedRivalLeague: 'ALL' | LeagueId;
  scoutedSet: Set<string>;
  activeScoutSet: Set<string>;
  shortlistIds: string[];
  formatEst: (val: number, pid: string, key: string, isScouted: boolean) => string;
  formatSalaryCell: (player: Player, isScouted: boolean) => string;
  onChangeLeague: (nextLeague: 'ALL' | LeagueId) => void;
  onChangeRival: (teamId: string) => void;
  onOpenProfile: (playerId: string) => void;
  onInspectPlayer: (player: Player, originLabel: string) => void;
  onStartScouting: (playerId: string, playerName: string, originLabel: string) => void;
  onToggleShortlist: (playerId: string) => void;
  onOpenTrade: (player: Player, fromTeamId: string, fromTeamName: string) => void;
  onOpenLoan: (player: Player, fromTeamId: string, fromTeamName: string) => void;
  onOpenBuyout: (
    player: Player,
    fromTeamId: string,
    fromTeamName: string,
    buyoutCost: number
  ) => void;
}

export const MarketRivalsTab: React.FC<MarketRivalsTabProps> = ({
  allRivalTeams,
  rivalTeams,
  activeRival,
  selectedRivalLeague,
  scoutedSet,
  activeScoutSet,
  shortlistIds,
  formatEst,
  formatSalaryCell,
  onChangeLeague,
  onChangeRival,
  onOpenProfile,
  onInspectPlayer,
  onStartScouting,
  onToggleShortlist,
  onOpenTrade,
  onOpenLoan,
  onOpenBuyout,
}) => {
  return (
    <div className="space-y-4">
      <div className="fm-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Campionato:</span>
          <select
            value={selectedRivalLeague}
            onChange={(e) => onChangeLeague(e.target.value as 'ALL' | LeagueId)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Tutti i Campionati ({allRivalTeams.length})</option>
            {LEAGUES.map((league) => {
              const count = allRivalTeams.filter(
                (t) => (t.leagueId ?? 'ITA_LBA') === league.id
              ).length;
              if (count === 0) return null;
              return (
                <option key={league.id} value={league.id}>
                  {league.name} ({count})
                </option>
              );
            })}
          </select>

          <span className="text-xs font-semibold text-slate-400 ml-1">Club:</span>
          <select
            value={activeRival.id}
            onChange={(e) => onChangeRival(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
          >
            {selectedRivalLeague === 'ALL'
              ? LEAGUES.map((league) => {
                  const leagueTeams = rivalTeams.filter(
                    (t) => (t.leagueId ?? 'ITA_LBA') === league.id
                  );
                  if (leagueTeams.length === 0) return null;
                  return (
                    <optgroup key={league.id} label={league.name}>
                      {leagueTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.city})
                        </option>
                      ))}
                    </optgroup>
                  );
                })
              : rivalTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.city})
                  </option>
                ))}
          </select>
        </div>
        <span className="text-xs text-slate-400">
          Puoi attivare la clausola di <b>Buyout</b> per strappare giocatori sotto contratto.
        </span>
      </div>

      <div className="fm-card rounded-2xl overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="fm-table-head">
            <tr>
              <th className="py-3 px-4">Giocatore</th>
              <th className="py-3 px-2">Naz</th>
              <th className="py-3 px-2">Ruolo</th>
              <th className="py-3 px-2 text-center">OVR</th>
              <th className="py-3 px-3">Stipendio</th>
              <th className="py-3 px-3">Clausola Buyout</th>
              <th className="py-3 px-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {activeRival.roster.map((p) => {
              const isScouted = scoutedSet.has(p.id);
              const isScouting = activeScoutSet.has(p.id);
              const buyout = getPlayerBuyoutClause(p);
              return (
                <tr key={p.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-100">
                    <button
                      onClick={() => onOpenProfile(p.id)}
                      className="hover:text-orange-400 hover:underline text-left cursor-pointer"
                    >
                      {p.firstName} {p.lastName}
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1.5">
                      <CountryFlag nationality={p.nationality} size="sm" />
                      <FormationBadge isItalianFormation={p.isItalianFormation} />
                    </div>
                  </td>
                  <td className="py-3 px-2 font-semibold text-slate-200">
                    {p.primaryPosition}
                  </td>
                  <td className="py-3 px-2 text-center font-extrabold text-orange-400">
                    {formatEst(p.overall, p.id, 'ovr', isScouted)}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {formatSalaryCell(p, isScouted)}
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-400">
                    {formatEuro(buyout)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onInspectPlayer(p, activeRival.name)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {!isScouted && (
                        <button
                          onClick={() =>
                            onStartScouting(
                              p.id,
                              `${p.firstName} ${p.lastName}`,
                              activeRival.shortName
                            )
                          }
                          disabled={isScouting}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sky-300 font-semibold cursor-pointer"
                        >
                          <Binoculars className="w-3.5 h-3.5" />
                          {isScouting ? 'In corso' : 'Osserva'}
                        </button>
                      )}
                      <button
                        onClick={() => onToggleShortlist(p.id)}
                        title="Aggiungi/Rimuovi dalla Lista di Monitoraggio"
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          shortlistIds.includes(p.id)
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          onOpenTrade(p, activeRival.id, activeRival.name)
                        }
                        disabled={Boolean(p.loanedFromTeamId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-orange-300 font-bold cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        Scambio
                      </button>
                      <button
                        onClick={() =>
                          onOpenLoan(p, activeRival.id, activeRival.name)
                        }
                        disabled={Boolean(p.loanedFromTeamId)}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 disabled:opacity-40 text-sky-300 font-bold cursor-pointer"
                      >
                        Prestito
                      </button>
                      <button
                        onClick={() =>
                          onOpenBuyout(p, activeRival.id, activeRival.name, buyout)
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                      >
                        Paga Buyout
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
