import React from 'react';
import { Player } from '../../types';
import { calculateBuyout, formatEuro } from '../../engine/ratings';
import { getSalaryEstimate } from '../../engine/scoutingEngine';

interface PlayerContractTabProps {
  player: Player;
  isUserPlayer: boolean;
  isFreeAgent: boolean;
  isScouted: boolean;
  scoutRating: number;
  buyoutCost: number;
  expiryYear: number;
}

export const PlayerContractTab: React.FC<PlayerContractTabProps> = ({
  player,
  isUserPlayer,
  isFreeAgent,
  isScouted,
  scoutRating,
  buyoutCost,
  expiryYear,
}) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl space-y-5">
    <h2 className="text-base font-bold text-white">Dettagli Contrattuali & Clausole</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      <InfoBox
        label="Stipendio Annuo Netto"
        value={
          isScouted
            ? formatEuro(player.salary)
            : (() => {
                const est = getSalaryEstimate(player.salary, player.id, scoutRating);
                return `${formatEuro(est.min)} - ${formatEuro(est.max)}`;
              })()
        }
        highlight="text-emerald-400"
      />
      <InfoBox
        label="Scadenza Contratto"
        value={isFreeAgent ? 'Svincolato' : `Giugno ${expiryYear}`}
      />
      <InfoBox
        label="Durata Residua"
        value={
          isFreeAgent
            ? 'Nessun vincolo'
            : `${player.contractYears} ${player.contractYears === 1 ? 'anno' : 'anni'}`
        }
      />
      <InfoBox
        label="Ruolo Promesso in Squadra"
        value={player.promisedRole ?? 'Non specificato'}
        highlight="text-orange-400"
      />
      <InfoBox
        label="Clausola Rescissoria (Buyout)"
        value={isFreeAgent ? '€ 0 (Free Agent)' : formatEuro(buyoutCost)}
        highlight="text-amber-400"
      />
      <InfoBox
        label="Buonuscita Taglio Immediato"
        value={isUserPlayer ? formatEuro(calculateBuyout(player)) : 'N/A'}
        highlight="text-red-400"
      />
    </div>
  </div>
);

const InfoBox: React.FC<{ label: string; value: string; highlight?: string }> = ({
  label,
  value,
  highlight = 'text-white',
}) => (
  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
    <div className="text-xs text-slate-400">{label}</div>
    <div className={`text-base font-extrabold mt-1 ${highlight}`}>{value}</div>
  </div>
);
