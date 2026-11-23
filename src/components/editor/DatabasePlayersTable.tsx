import React from 'react';
import { Sliders } from 'lucide-react';
import { CustomPlayerTemplate } from '../../services/editorDbService';
import { Nationality, Position } from '../../types';
import { COUNTRY_NAMES, CountryFlag } from '../CountryFlag';

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
const NATIONALITIES: Nationality[] = [
  'ITA',
  'USA',
  'SRB',
  'ESP',
  'LTU',
  'FRA',
  'GER',
  'ARG',
  'GRE',
  'SLO',
  'CRO',
  'LAT',
];

interface DatabasePlayersTableProps {
  roster: CustomPlayerTemplate[];
  leagueLimit: { ruleLabel: string; minIta: number; maxForeign: number };
  itaCount: number;
  foreignCount: number;
  onUpdatePlayerField: <K extends keyof CustomPlayerTemplate>(
    idx: number,
    field: K,
    value: CustomPlayerTemplate[K]
  ) => void;
  onOpenPlayerModal: (idx: number) => void;
}

export const DatabasePlayersTable: React.FC<DatabasePlayersTableProps> = ({
  roster,
  leagueLimit,
  itaCount,
  foreignCount,
  onUpdatePlayerField,
  onOpenPlayerModal,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs">
        <span className="text-slate-300">
          Modifica i 12 giocatori del roster base (primi 5 = quintetto base).
        </span>
        <div className="flex items-center gap-3 font-bold">
          <span className="text-slate-400">{leagueLimit.ruleLabel}:</span>
          <span className={itaCount >= leagueLimit.minIta ? 'text-emerald-400' : 'text-red-400'}>
            ITA: {itaCount}/{leagueLimit.minIta} min.
          </span>
          <span
            className={foreignCount <= leagueLimit.maxForeign ? 'text-sky-400' : 'text-red-400'}
          >
            STR: {foreignCount}/{leagueLimit.maxForeign} max.
          </span>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-2.5">#</th>
                <th className="py-2.5 px-2">Nome</th>
                <th className="py-2.5 px-2">Cognome</th>
                <th className="py-2.5 px-2">Ruolo</th>
                <th className="py-2.5 px-2">Nazionalità</th>
                <th className="py-2.5 px-2 text-center">Quota</th>
                <th className="py-2.5 px-2 text-center">OVR</th>
                <th className="py-2.5 px-2 text-center">Dettagli</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {roster.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50">
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={p.jerseyNumber}
                      onChange={(e) =>
                        onUpdatePlayerField(
                          idx,
                          'jerseyNumber',
                          Math.max(0, Math.min(99, Number(e.target.value) || 0))
                        )
                      }
                      className="w-12 px-1.5 py-1 rounded bg-slate-900 border border-slate-800 text-center font-mono text-white"
                    />
                  </td>
                  <td className="py-1.5 px-1.5">
                    <input
                      value={p.firstName}
                      onChange={(e) => onUpdatePlayerField(idx, 'firstName', e.target.value)}
                      className="w-28 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                    />
                  </td>
                  <td className="py-1.5 px-1.5">
                    <input
                      value={p.lastName}
                      onChange={(e) => onUpdatePlayerField(idx, 'lastName', e.target.value)}
                      className="w-32 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white font-semibold"
                    />
                  </td>
                  <td className="py-1.5 px-1.5">
                    <select
                      value={p.primaryPosition}
                      onChange={(e) =>
                        onUpdatePlayerField(idx, 'primaryPosition', e.target.value as Position)
                      }
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white font-bold"
                    >
                      {POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1.5 px-1.5">
                    <div className="flex items-center gap-1.5">
                      <CountryFlag nationality={p.nationality} size="sm" />
                      <select
                        value={p.nationality}
                        onChange={(e) => {
                          const nextNat = e.target.value as Nationality;
                          onUpdatePlayerField(idx, 'nationality', nextNat);
                          if (nextNat === 'ITA') {
                            onUpdatePlayerField(idx, 'isItalianFormation', true);
                          }
                        }}
                        className="px-1.5 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                      >
                        {NATIONALITIES.map((nat) => (
                          <option key={nat} value={nat}>
                            {COUNTRY_NAMES[nat] ?? nat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="py-1.5 px-1.5 text-center">
                    <button
                      onClick={() =>
                        onUpdatePlayerField(idx, 'isItalianFormation', !p.isItalianFormation)
                      }
                      className={`px-2 py-0.5 rounded font-extrabold text-[10px] cursor-pointer ${
                        p.isItalianFormation
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {p.isItalianFormation ? 'ITA' : 'STR'}
                    </button>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <input
                      type="number"
                      min={35}
                      max={99}
                      value={p.overall}
                      onChange={(e) =>
                        onUpdatePlayerField(
                          idx,
                          'overall',
                          Math.max(35, Math.min(99, Number(e.target.value) || 60))
                        )
                      }
                      className="w-12 px-1.5 py-1 rounded bg-slate-900 border border-slate-800 text-center font-bold text-orange-400"
                    />
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <button
                      onClick={() => onOpenPlayerModal(idx)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                        p.attributes
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 hover:bg-orange-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                      title="Modifica tutti i valori e le skills del giocatore"
                    >
                      <Sliders className="w-3 h-3" />
                      Skills
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
