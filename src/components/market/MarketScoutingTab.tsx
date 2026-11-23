import React from 'react';
import { Clock } from 'lucide-react';
import { ScoutingAssignment } from '../../types';

interface MarketScoutingTabProps {
  activeScouting: ScoutingAssignment[];
  onAdvanceDays: (days: number) => void;
}

export const MarketScoutingTab: React.FC<MarketScoutingTabProps> = ({
  activeScouting,
  onAdvanceDays,
}) => {
  return (
    <div className="fm-card rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">
            Osservazione Giocatori in Corso ({activeScouting.length}/5)
          </h2>
          <p className="text-xs text-slate-400">
            I report si completano automaticamente dopo la partita della settimana, oppure puoi avanzare di 3 giorni.
          </p>
        </div>
        <button
          onClick={() => onAdvanceDays(3)}
          disabled={activeScouting.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer"
        >
          <Clock className="w-4 h-4" />
          Avanza 3 Giorni Scouting
        </button>
      </div>

      {activeScouting.length === 0 ? (
        <div className="py-10 text-center text-slate-500 text-sm">
          Nessun giocatore attualmente sotto osservazione. Clicca &quot;Osserva&quot; su un Free Agent o un giocatore rivale.
        </div>
      ) : (
        <div className="space-y-3">
          {activeScouting.map((s) => {
            const pct = Math.round(
              ((s.totalDays - s.daysRemaining) / s.totalDays) * 100
            );
            return (
              <div
                key={s.playerId}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">
                    {s.playerName}{' '}
                    <span className="text-xs text-slate-400 font-normal">
                      ({s.originLabel})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 mt-2 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 transition-all"
                      style={{ width: `${Math.max(12, pct)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-400 shrink-0">
                  -{s.daysRemaining} giorni
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
