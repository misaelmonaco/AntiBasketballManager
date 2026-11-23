import React from 'react';
import { X } from 'lucide-react';
import { Player } from '../../types';
import { formatEuro } from '../../engine/ratings';

interface MarketLoanModalProps {
  player: Player;
  fromTeamName: string;
  loanSharePct: 50 | 75 | 100;
  feedback: string | null;
  onChangeSharePct: (pct: 50 | 75 | 100) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const MarketLoanModal: React.FC<MarketLoanModalProps> = ({
  player,
  fromTeamName,
  loanSharePct,
  feedback,
  onChangeSharePct,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="fm-modal rounded-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
              Richiesta Prestito Fino a Fine Stagione
            </div>
            <h3 className="text-base font-black text-white">
              {player.firstName} {player.lastName}
            </h3>
            <p className="text-xs text-slate-400">Club proprietario: {fromTeamName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300">
            Quota di stipendio coperta dal tuo club:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([50, 75, 100] as const).map((pct) => {
              const estCost =
                Math.max(15000, Math.round((player.salary * (pct / 100)) / 5000) * 5000);
              const active = loanSharePct === pct;
              return (
                <button
                  key={pct}
                  onClick={() => onChangeSharePct(pct)}
                  className={`p-3 rounded-xl border text-center cursor-pointer ${
                    active
                      ? 'bg-sky-500/20 border-sky-500 text-white'
                      : 'fm-subcard text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-black">{pct}%</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                    {formatEuro(estCost)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {feedback && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-700/50 text-xs text-red-200">
            {feedback}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
          >
            Annulla
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black cursor-pointer"
          >
            Invia Richiesta Prestito
          </button>
        </div>
      </div>
    </div>
  );
};
