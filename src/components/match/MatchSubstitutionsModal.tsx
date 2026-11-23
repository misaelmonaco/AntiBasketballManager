import React from 'react';
import { X } from 'lucide-react';
import { Nationality, PlayerBoxScore } from '../../types';
import { CountryFlag, FormationBadge } from '../CountryFlag';

interface MatchSubstitutionsModalProps {
  teamName: string;
  players: PlayerBoxScore[];
  nationalityByPlayerId: Map<string, Nationality>;
  subOutId: string;
  onSelectSubOut: (playerId: string) => void;
  onSubstitute: (outPlayerId: string, inPlayerId: string) => void;
  onClose: () => void;
}

export const MatchSubstitutionsModal: React.FC<MatchSubstitutionsModalProps> = ({
  teamName,
  players,
  nationalityByPlayerId,
  subOutId,
  onSelectSubOut,
  onSubstitute,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="fm-modal rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Sostituzioni — {teamName}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
          <div>
            <div className="font-bold text-orange-400 mb-2">In Campo (seleziona chi esce)</div>
            <div className="space-y-1.5">
              {players
                .filter((p) => p.onCourt)
                .map((p) => (
                  <button
                    key={p.playerId}
                    type="button"
                    onClick={() => onSelectSubOut(p.playerId)}
                    className={`w-full text-left p-2.5 rounded-xl border cursor-pointer ${
                      subOutId === p.playerId
                        ? 'bg-orange-500/20 border-orange-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <CountryFlag
                        nationality={nationalityByPlayerId.get(p.playerId) ?? 'ITA'}
                        size="sm"
                      />
                      <span>
                        {p.position} • {p.name}
                      </span>
                      <FormationBadge isItalianFormation={p.isItalianFormation} />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Stamina {Math.round(p.stamina)}% • Falli {p.fouls}/5
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <div>
            <div className="font-bold text-emerald-400 mb-2">Panchina (clicca per entrare)</div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {players
                .filter((p) => !p.onCourt)
                .map((p) => (
                  <button
                    key={p.playerId}
                    type="button"
                    disabled={p.fouledOut || !subOutId}
                    onClick={() => {
                      onSubstitute(subOutId, p.playerId);
                      onSelectSubOut('');
                    }}
                    className="w-full text-left p-2.5 rounded-xl border bg-slate-950 border-slate-800 hover:border-emerald-500 disabled:opacity-40 text-slate-200 cursor-pointer"
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <CountryFlag
                        nationality={nationalityByPlayerId.get(p.playerId) ?? 'ITA'}
                        size="sm"
                      />
                      <span>
                        {p.position} • {p.name} {p.fouledOut ? '(OUT 5 FALLI)' : ''}
                      </span>
                      <FormationBadge isItalianFormation={p.isItalianFormation} />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Stamina {Math.round(p.stamina)}% • Falli {p.fouls}/5
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
