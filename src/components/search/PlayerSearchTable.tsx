import React from 'react';
import { ArrowLeftRight, Binoculars, Eye, Handshake, Star } from 'lucide-react';
import { formatEuro } from '../../engine/ratings';
import {
  getAttributeEstimate,
  getPlayerBuyoutClause,
  getSalaryEstimate,
} from '../../engine/scoutingEngine';
import { LeagueId, Player } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';
import { SortableTh, SortDir } from '../SortableHeader';

export type SearchSortKey =
  | 'name'
  | 'team'
  | 'nationality'
  | 'position'
  | 'age'
  | 'overall'
  | 'threePoint'
  | 'defense'
  | 'rebounding'
  | 'salary'
  | 'contract';

export interface IndexedPlayer {
  player: Player;
  clubId: string | null;
  clubName: string;
  leagueId: LeagueId | null;
  isUserClub: boolean;
}

interface PlayerSearchTableProps {
  visibleRows: IndexedPlayer[];
  totalMatches: number;
  sortKey: SearchSortKey;
  sortDir: SortDir;
  scoutRating: number;
  scoutedSet: Set<string>;
  activeScoutSet: Set<string>;
  shortlistSet: Set<string>;
  onSort: (key: SearchSortKey) => void;
  onToggleShortlist: (playerId: string) => void;
  onOpenProfile: (playerId: string) => void;
  onStartScouting: (playerId: string, fullName: string, clubName: string) => void;
  onOfferFreeAgent: (player: Player) => void;
  onOfferBuyout: (player: Player, clubId: string, clubName: string, buyoutCost: number) => void;
  onRequestLoan: (player: Player, clubId: string, clubName: string) => void;
  onProposeTrade: (player: Player, clubId: string, clubName: string) => void;
}

export const PlayerSearchTable: React.FC<PlayerSearchTableProps> = ({
  visibleRows,
  totalMatches,
  sortKey,
  sortDir,
  scoutRating,
  scoutedSet,
  activeScoutSet,
  shortlistSet,
  onSort,
  onToggleShortlist,
  onOpenProfile,
  onStartScouting,
  onOfferFreeAgent,
  onOfferBuyout,
  onRequestLoan,
  onProposeTrade,
}) => {
  const formatEst = (val: number, pid: string, key: string, known: boolean) => {
    if (known) return String(val);
    const est = getAttributeEstimate(val, pid, key, scoutRating);
    return `${est.min}-${est.max}`;
  };

  return (
    <div className="fm-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="fm-table-head">
            <tr>
              <SortableTh label="Giocatore" sortKey="name" activeKey={sortKey} sortDir={sortDir} onSort={onSort} className="py-3 px-3" />
              <SortableTh label="Club / Status" sortKey="team" activeKey={sortKey} sortDir={sortDir} onSort={onSort} className="py-3 px-2" />
              <SortableTh label="Naz" sortKey="nationality" activeKey={sortKey} sortDir={sortDir} onSort={onSort} className="py-3 px-2" />
              <SortableTh label="Ruolo" sortKey="position" activeKey={sortKey} sortDir={sortDir} onSort={onSort} className="py-3 px-2" />
              <SortableTh label="Età" sortKey="age" activeKey={sortKey} sortDir={sortDir} onSort={onSort} align="center" className="py-3 px-2" />
              <SortableTh label="OVR" sortKey="overall" activeKey={sortKey} sortDir={sortDir} onSort={onSort} align="center" className="py-3 px-2" />
              <SortableTh label="3PT" sortKey="threePoint" activeKey={sortKey} sortDir={sortDir} onSort={onSort} align="center" className="py-3 px-2" />
              <SortableTh label="DIF" sortKey="defense" activeKey={sortKey} sortDir={sortDir} onSort={onSort} align="center" className="py-3 px-2" />
              <SortableTh label="REB" sortKey="rebounding" activeKey={sortKey} sortDir={sortDir} onSort={onSort} align="center" className="py-3 px-2" />
              <SortableTh label="Ingaggio / Rich." sortKey="salary" activeKey={sortKey} sortDir={sortDir} onSort={onSort} className="py-3 px-3" />
              <SortableTh label="Contratto" sortKey="contract" activeKey={sortKey} sortDir={sortDir} onSort={onSort} className="py-3 px-2" />
              <th className="py-3 px-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-10 text-center text-slate-400">
                  Nessun giocatore corrisponde ai filtri di ricerca impostati.
                </td>
              </tr>
            ) : (
              visibleRows.map(({ player: p, clubId, clubName, isUserClub }) => {
                const isScouted = isUserClub || scoutedSet.has(p.id);
                const isScouting = activeScoutSet.has(p.id);
                const avgDef = Math.round(
                  (p.attributes.perimeterDef + p.attributes.postDef) / 2
                );
                const salEst = getSalaryEstimate(p.salary, p.id, scoutRating);
                return (
                  <tr key={`${clubId ?? 'fa'}_${p.id}`} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-bold text-slate-100">
                        <button
                          onClick={() => onOpenProfile(p.id)}
                          className="hover:text-orange-400 hover:underline text-left cursor-pointer"
                        >
                          {p.firstName} {p.lastName}
                        </button>
                        {isScouted && !isUserClub && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[9px] font-bold">
                            Osservato
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">{p.personality}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`text-[11px] font-semibold ${
                          clubId === null
                            ? 'text-emerald-400'
                            : isUserClub
                            ? 'text-orange-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {clubName}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <CountryFlag nationality={p.nationality} size="sm" />
                        <FormationBadge isItalianFormation={p.isItalianFormation} />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-200">
                      {p.primaryPosition}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300 tabular-nums">{p.age}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-extrabold tabular-nums ${
                          isScouted
                            ? 'bg-slate-800 text-orange-400'
                            : 'bg-slate-950 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {formatEst(p.overall, p.id, 'ovr', isScouted)}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300 tabular-nums">
                      {formatEst(p.attributes.threePoint, p.id, '3pt', isScouted)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300 tabular-nums">
                      {formatEst(avgDef, p.id, 'def', isScouted)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300 tabular-nums">
                      {formatEst(p.attributes.rebounding, p.id, 'reb', isScouted)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-400 tabular-nums">
                      {isScouted
                        ? formatEuro(p.salary)
                        : `${Math.round(salEst.min / 1000)}k-${Math.round(salEst.max / 1000)}k €`}
                    </td>
                    <td className="py-2.5 px-2 text-slate-300 text-[11px]">
                      {clubId === null
                        ? 'Svincolato'
                        : `${p.contractYears} ${p.contractYears === 1 ? 'anno' : 'anni'}`}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onToggleShortlist(p.id)}
                          title="Aggiungi/Rimuovi Lista Monitoraggio"
                          className={`p-1.5 rounded-lg cursor-pointer ${
                            shortlistSet.has(p.id)
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenProfile(p.id)}
                          title="Apri Profilo"
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
                                clubName
                              )
                            }
                            disabled={isScouting}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sky-300 font-semibold cursor-pointer"
                          >
                            <Binoculars className="w-3 h-3" />
                            {isScouting ? 'In corso' : 'Osserva'}
                          </button>
                        )}
                        {clubId === null ? (
                          <button
                            onClick={() => onOfferFreeAgent(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold cursor-pointer"
                          >
                            <Handshake className="w-3 h-3" />
                            Offri
                          </button>
                        ) : !isUserClub ? (
                          <>
                            <button
                              onClick={() =>
                                onOfferBuyout(p, clubId, clubName, getPlayerBuyoutClause(p))
                              }
                              className="px-2 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-bold cursor-pointer"
                            >
                              Buyout
                            </button>
                            <button
                              onClick={() => onRequestLoan(p, clubId, clubName)}
                              title="Richiedi Prestito"
                              className="px-2 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold cursor-pointer"
                            >
                              Prestito
                            </button>
                            <button
                              onClick={() => onProposeTrade(p, clubId, clubName)}
                              title="Proponi Scambio"
                              className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 cursor-pointer"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalMatches > 120 && (
        <div className="px-4 py-2.5 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          Visualizzati i primi 120 risultati su {totalMatches}. Affina i filtri per restringere la ricerca.
        </div>
      )}
    </div>
  );
};
