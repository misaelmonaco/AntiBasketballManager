import React from 'react';
import {
  ArrowDownLeft,
  Eye,
  FileSignature,
  Tag,
  UserX,
} from 'lucide-react';
import { formatEuro } from '../../engine/ratings';
import { Player } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';
import { SortableTh, SortDir } from '../SortableHeader';
import { RosterSortKey } from './RosterYouthTable';

interface RosterFirstTeamTableProps {
  players: Player[];
  seasonYear: number;
  sortKey: RosterSortKey;
  sortDir: SortDir;
  onSort: (key: RosterSortKey) => void;
  onToggleMatchdaySquad: (playerId: string) => void;
  onOpenProfile: (playerId: string) => void;
  onDemoteToYouth: (playerId: string) => void;
  onToggleTransferList: (playerId: string) => void;
  onRenewPlayer: (player: Player) => void;
  onConfirmCut: (player: Player) => void;
}

export const RosterFirstTeamTable: React.FC<RosterFirstTeamTableProps> = ({
  players,
  seasonYear,
  sortKey,
  sortDir,
  onSort,
  onToggleMatchdaySquad,
  onOpenProfile,
  onDemoteToYouth,
  onToggleTransferList,
  onRenewPlayer,
  onConfirmCut,
}) => {
  return (
    <div className="fm-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="fm-table-head">
            <tr>
              <SortableTh
                label="A Referto"
                sortKey="slot"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                align="center"
                className="py-3 px-3"
              />
              <SortableTh
                label="Giocatore"
                sortKey="name"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                className="py-3 px-3"
              />
              <SortableTh
                label="Naz"
                sortKey="nationality"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                className="py-3 px-2"
              />
              <SortableTh
                label="Ruolo"
                sortKey="position"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                className="py-3 px-2"
              />
              <SortableTh
                label="Età"
                sortKey="age"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                align="center"
                className="py-3 px-2"
              />
              <SortableTh
                label="OVR"
                sortKey="overall"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                align="center"
                className="py-3 px-2"
              />
              <SortableTh
                label="Cond."
                sortKey="condition"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                align="center"
                className="py-3 px-2"
              />
              <SortableTh
                label="Morale"
                sortKey="morale"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                align="center"
                className="py-3 px-2"
              />
              <SortableTh
                label="Stipendio"
                sortKey="salary"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                className="py-3 px-3"
              />
              <SortableTh
                label="Scadenza"
                sortKey="contract"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                className="py-3 px-3"
              />
              <th className="py-3 px-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {players.map((p) => {
              const isActive = p.rosterSlot !== 'reserve';
              const expiryYear = seasonYear + p.contractYears;
              return (
                <tr
                  key={p.id}
                  className={`transition-colors border-l-2 ${
                    p.isItalianFormation
                      ? 'border-l-emerald-500/70'
                      : 'border-l-amber-500/50'
                  } ${
                    isActive
                      ? 'hover:bg-slate-800/40'
                      : 'bg-slate-950/40 opacity-75 hover:opacity-100'
                  }`}
                >
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => onToggleMatchdaySquad(p.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-orange-500 focus:ring-orange-500 cursor-pointer"
                      title={
                        isActive ? 'Rimuovi dai 12 convocati' : 'Convoca A Referto'
                      }
                    />
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => onOpenProfile(p.id)}
                      className="font-bold text-slate-100 hover:text-orange-400 hover:underline text-left cursor-pointer"
                    >
                      {p.firstName} {p.lastName}
                    </button>
                    {p.onTransferList && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-extrabold uppercase">
                        Sul Mercato
                      </span>
                    )}
                    {p.loanedFromTeamName && (
                      <span
                        title={`In prestito da ${p.loanedFromTeamName}`}
                        className="ml-2 px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[9px] font-extrabold uppercase"
                      >
                        Prestito
                      </span>
                    )}
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>
                        {p.rosterSlot === 'starter'
                          ? 'Titolare'
                          : p.rosterSlot === 'bench'
                          ? 'Panchina'
                          : 'Non convocato'}
                      </span>
                      {p.injuryWeeks > 0 && (
                        <span className="text-red-400 font-bold">
                          • Infortunato ({p.injuryWeeks} sett.)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1.5">
                      <CountryFlag nationality={p.nationality} size="sm" />
                      <FormationBadge isItalianFormation={p.isItalianFormation} />
                    </div>
                  </td>
                  <td className="py-3 px-2 font-semibold text-slate-200">
                    {p.primaryPosition}
                    {p.secondaryPosition ? `/${p.secondaryPosition}` : ''}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-300">{p.age}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-block w-8 py-0.5 rounded bg-slate-800 font-extrabold text-orange-400">
                      {p.overall}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`font-semibold ${
                        p.condition >= 85
                          ? 'text-emerald-400'
                          : p.condition >= 68
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {p.condition}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`font-semibold ${
                        p.morale >= 70
                          ? 'text-emerald-400'
                          : p.morale >= 50
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {p.morale}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-300">
                    {formatEuro(p.salary)}
                  </td>
                  <td className="py-3 px-3 text-slate-300">Giu {expiryYear}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenProfile(p.id)}
                        title="Scheda giocatore"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {p.age <= 19 && (
                        <button
                          onClick={() => onDemoteToYouth(p.id)}
                          title="Rimanda nelle Giovanili U19"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 cursor-pointer"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onToggleTransferList(p.id)}
                        title={
                          p.onTransferList
                            ? 'Rimuovi dalla lista trasferimenti'
                            : 'Metti sul mercato (attira offerte)'
                        }
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          p.onTransferList
                            ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300'
                            : 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRenewPlayer(p)}
                        title="Rinnova contratto"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-500/20 text-slate-300 hover:text-orange-300 cursor-pointer"
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onConfirmCut(p)}
                        title="Taglia giocatore (con buonuscita)"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
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
