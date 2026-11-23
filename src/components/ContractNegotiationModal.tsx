import React, { useState } from 'react';
import { X, Handshake } from 'lucide-react';
import { ContractRole, Player } from '../types';
import { formatEuro } from '../engine/ratings';

const CONTRACT_ROLES: { value: ContractRole; desc: string }[] = [
  { value: 'Stella della squadra', desc: 'Minuti garantiti 26+, leader offensivo.' },
  { value: 'Titolare fisso', desc: 'Quintetto base, minuti 20+.' },
  { value: 'Sesto uomo', desc: 'Primo cambio dalla panchina (14+ min).' },
  { value: 'Giocatore di rotazione', desc: 'Minutaggio flessibile dalla panchina.' },
];

interface Props {
  player: Player;
  mode: 'free_agent' | 'renewal' | 'buyout';
  freeCap: number;
  buyoutCost?: number;
  rivalTeamName?: string;
  isScouted: boolean;
  onClose: () => void;
  onSubmit: (
    salary: number,
    years: 1 | 2,
    role: ContractRole
  ) => { accepted: boolean; message: string };
}

export const ContractNegotiationModal: React.FC<Props> = ({
  player,
  mode,
  freeCap,
  buyoutCost = 0,
  rivalTeamName,
  isScouted,
  onClose,
  onSubmit,
}) => {
  const [offerSalary, setOfferSalary] = useState<number>(player.salary);
  const [offerYears, setOfferYears] = useState<1 | 2>(1);
  const [promisedRole, setPromisedRole] = useState<ContractRole>(
    player.promisedRole ?? 'Titolare fisso'
  );
  const [agentMsg, setAgentMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSend = () => {
    const res = onSubmit(offerSalary, offerYears, promisedRole);
    setAgentMsg({ ok: res.accepted, text: res.message });
    if (res.accepted) {
      setTimeout(() => {
        onClose();
      }, 900);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="fm-modal rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Handshake className="w-5 h-5 text-orange-400" />
              {mode === 'renewal'
                ? `Rinnovo: ${player.firstName} ${player.lastName}`
                : mode === 'buyout'
                ? `Buyout & Firma: ${player.firstName} ${player.lastName}`
                : `Trattativa: ${player.firstName} ${player.lastName}`}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {player.primaryPosition} • {player.nationality} •{' '}
              {isScouted ? `OVR ${player.overall} • ${player.personality}` : 'Giocatore non ancora osservato'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          {mode === 'buyout' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              Clausola rescissoria da versare a <b>{rivalTeamName}</b>:{' '}
              <span className="font-extrabold text-amber-300">{formatEuro(buyoutCost)}</span>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Stipendio Annuo Offerto (€) — Spazio salariale: {formatEuro(freeCap)}
            </label>
            <input
              type="number"
              step={5000}
              min={40000}
              value={offerSalary}
              onChange={(e) => setOfferSalary(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-bold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Durata Contratto</label>
            <div className="grid grid-cols-2 gap-2">
              {([1, 2] as const).map((yr) => (
                <button
                  key={yr}
                  onClick={() => setOfferYears(yr)}
                  className={`py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                    offerYears === yr
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {yr === 1 ? 'Annuale (1 anno)' : 'Biennale (2 anni)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Ruolo Garantito in Squadra (influenza le aspettative di minutaggio)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONTRACT_ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setPromisedRole(r.value)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                    promisedRole === r.value
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{r.value}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {agentMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium border ${
                agentMsg.ok
                  ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                  : 'bg-red-950/50 border-red-700 text-red-300'
              }`}
            >
              {agentMsg.text}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              Chiudi
            </button>
            <button
              onClick={handleSend}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-xs font-bold text-slate-950 cursor-pointer"
            >
              Invia Offerta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
