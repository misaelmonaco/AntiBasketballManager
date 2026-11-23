import React, { useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import { Player } from '../../types';
import { formatEuro } from '../../engine/ratings';

interface MarketTradeModalProps {
  rivalTeamName: string;
  requestedPlayer: Player;
  userRoster: Player[];
  onSubmit: (offeredPlayerId: string, cashAdjustment: number) => { accepted: boolean; message: string };
  onClose: () => void;
}

export const MarketTradeModal: React.FC<MarketTradeModalProps> = ({
  rivalTeamName,
  requestedPlayer,
  userRoster,
  onSubmit,
  onClose,
}) => {
  const tradable = userRoster.filter((p) => !p.loanedFromTeamId);
  const [offeredId, setOfferedId] = useState<string>(tradable[0]?.id ?? '');
  const [cash, setCash] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="fm-modal rounded-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1">
              <ArrowLeftRight className="w-3 h-3" /> Proposta di Scambio
            </div>
            <h3 className="text-base font-black text-white">
              Richiedi {requestedPlayer.firstName} {requestedPlayer.lastName}
            </h3>
            <p className="text-xs text-slate-400">
              {rivalTeamName} • {requestedPlayer.primaryPosition} • OVR {requestedPlayer.overall} •{' '}
              {formatEuro(requestedPlayer.salary)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Giocatore da offrire in cambio:
            </label>
            <select
              value={offeredId}
              onChange={(e) => setOfferedId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
            >
              {tradable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.primaryPosition} • OVR {p.overall} •{' '}
                  {formatEuro(p.salary)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Conguaglio economico ({cash >= 0 ? `paghi ${formatEuro(cash)}` : `chiedi ${formatEuro(Math.abs(cash))}`}):
            </label>
            <input
              type="range"
              min={-150000}
              max={250000}
              step={25000}
              value={cash}
              onChange={(e) => setCash(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>

          {feedback && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-700/50 text-red-200">
              {feedback}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              if (!offeredId) return;
              const res = onSubmit(offeredId, cash);
              if (res.accepted) onClose();
              else setFeedback(res.message);
            }}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-black cursor-pointer"
          >
            Invia Proposta
          </button>
        </div>
      </div>
    </div>
  );
};
