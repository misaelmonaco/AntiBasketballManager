import React from 'react';
import { ArrowUpRight, Eye, GraduationCap } from 'lucide-react';
import { formatEuro } from '../../engine/ratings';
import { Player } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';
import { SortableTh, SortDir } from '../SortableHeader';

export type RosterSortKey =
  | 'slot'
  | 'name'
  | 'nationality'
  | 'position'
  | 'age'
  | 'overall'
  | 'condition'
  | 'morale'
  | 'salary'
  | 'contract';

interface RosterYouthTableProps {
  sortedYouth: Player[];
  youthSortKey: RosterSortKey;
  youthSortDir: SortDir;
  onSort: (key: RosterSortKey) => void;
  onCallUpYouth: () => void;
  onPromoteYouth: (playerId: string) => void;
  onOpenProfile: (playerId: string) => void;
}

export const RosterYouthTable: React.FC<RosterYouthTableProps> = ({
  sortedYouth,
  youthSortKey,
  youthSortDir,
  onSort,
  onCallUpYouth,
  onPromoteYouth,
  onOpenProfile,
}) => {
  return (
    <div className="fm-card rounded-2xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
        <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
          <GraduationCap className="w-4 h-4" />
          Settore Giovanile Under 19 — Prospetti ITA e Stranieri pronti per la Prima Squadra
        </div>
        {sortedYouth.length === 0 && (
          <button
            onClick={onCallUpYouth}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
          >
            + Genera Nuovo Prospetto U19
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="fm-table-head">
            <tr>
              <SortableTh label="Giocatore U19" sortKey="name" activeKey={youthSortKey} sortDir={youthSortDir} onSort={onSort} className="py-3 px-4" />
              <SortableTh label="Naz" sortKey="nationality" activeKey={youthSortKey} sortDir={youthSortDir} onSort={onSort} className="py-3 px-2" />
              <SortableTh label="Ruolo" sortKey="position" activeKey={youthSortKey} sortDir={youthSortDir} onSort={onSort} className="py-3 px-2" />
              <SortableTh label="Età" sortKey="age" activeKey={youthSortKey} sortDir={youthSortDir} onSort={onSort} align="center" className="py-3 px-2" />
              <SortableTh label="OVR" sortKey="overall" activeKey={youthSortKey} sortDir={youthSortDir} onSort={onSort} align="center" className="py-3 px-2" />
              <SortableTh label="Cond." sortKey="condition" activeKey={youthSortKey} sortDir={youthSortDir} onSort={onSort} align="center" className="py-3 px-2" />
              <SortableTh label="Stipendio" sortKey="salary" activeKey={youthSortKey} sortDir={youthSortDir} onSort={onSort} className="py-3 px-3" />
              <th className="py-3 px-4 text-right">Azione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedYouth.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  Tutti i giovani U19 sono già stati convocati in Prima Squadra.
                </td>
              </tr>
            ) : (
              sortedYouth.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-800/40 transition-colors border-l-2 ${
                    p.isItalianFormation
                      ? 'border-l-emerald-500/70'
                      : 'border-l-amber-500/50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onOpenProfile(p.id)}
                      className="font-bold text-slate-100 hover:text-orange-400 hover:underline text-left cursor-pointer"
                    >
                      {p.firstName} {p.lastName}
                    </button>
                    <div className="text-[11px] text-slate-500">{p.personality}</div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1.5">
                      <CountryFlag nationality={p.nationality} size="sm" />
                      <FormationBadge isItalianFormation={p.isItalianFormation} />
                    </div>
                  </td>
                  <td className="py-3 px-2 font-semibold text-slate-200">{p.primaryPosition}</td>
                  <td className="py-3 px-2 text-center text-slate-300">{p.age}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-block w-8 py-0.5 rounded bg-slate-800 font-extrabold text-emerald-400">
                      {p.overall}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-400 font-semibold">
                    {p.condition}%
                  </td>
                  <td className="py-3 px-3 text-slate-300">{formatEuro(p.salary)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onOpenProfile(p.id)}
                        title="Scheda giocatore"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onPromoteYouth(p.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Convoca in Prima Squadra
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
