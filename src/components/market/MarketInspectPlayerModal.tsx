import React from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { Player } from '../../types';

interface MarketInspectPlayerModalProps {
  player: Player;
  originLabel: string;
  isScouted: boolean;
  formatEst: (val: number, pid: string, key: string, isScouted: boolean) => string;
  onClose: () => void;
}

export const MarketInspectPlayerModal: React.FC<MarketInspectPlayerModalProps> = ({
  player,
  originLabel,
  isScouted,
  formatEst,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="fm-modal rounded-2xl max-w-xl w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-extrabold text-white">
              {player.firstName} {player.lastName}
            </h3>
            <p className="text-xs text-slate-400">
              {originLabel} • {player.primaryPosition} • {player.nationality} •{' '}
              {isScouted
                ? `OVR ${player.overall} • ${player.personality}`
                : 'Report incompleto (Fog of War)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isScouted && (
          <div className="mt-3 p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-xs text-sky-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0" />
            Valori stimati dal tuo Responsabile Scouting. Usa &quot;Osserva&quot; per sbloccare dati reali, carattere e rischio infortuni.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          {(
            [
              ['Tiro da 3', player.attributes.threePoint, '3pt'],
              ['Tiro da 2', player.attributes.twoPoint, '2pt'],
              ['Passaggio', player.attributes.passing, 'pas'],
              ['Finalizzazione', player.attributes.finishing, 'fin'],
              ['Difesa Perimetrale', player.attributes.perimeterDef, 'pdef'],
              ['Difesa in Post', player.attributes.postDef, 'post'],
              ['Rimbalzi', player.attributes.rebounding, 'reb'],
              ['IQ Cestistico', player.attributes.basketballIQ, 'iq'],
            ] as const
          ).map(([label, val, key]) => (
            <div
              key={key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800"
            >
              <span className="text-slate-400">{label}</span>
              <span className="font-bold text-slate-100">
                {formatEst(val, player.id, key, isScouted)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Carattere &amp; Propensione Infortuni:</span>
          <span className="font-bold text-amber-300">
            {isScouted
              ? `${player.personality} • Rischio infortuni: ${player.injuryProneness}/100`
              : 'Sconosciuto (Osserva per sbloccare)'}
          </span>
        </div>
      </div>
    </div>
  );
};
