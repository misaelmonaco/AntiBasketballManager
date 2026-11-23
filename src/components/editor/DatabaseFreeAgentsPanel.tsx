import React from 'react';
import { Sliders, Trash2, UserPlus } from 'lucide-react';
import { CustomPlayerTemplate } from '../../services/editorDbService';

interface DatabaseFreeAgentsPanelProps {
  customFreeAgents: CustomPlayerTemplate[];
  onCreateFreeAgent: () => void;
  onEditFreeAgent: (idx: number) => void;
  onDeleteFreeAgent: (idx: number) => void;
}

export const DatabaseFreeAgentsPanel: React.FC<DatabaseFreeAgentsPanelProps> = ({
  customFreeAgents,
  onCreateFreeAgent,
  onEditFreeAgent,
  onDeleteFreeAgent,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-xs">
        <span className="text-slate-300">
          Giocatori creati manualmente e inseriti direttamente nella lista{' '}
          <b>Free Agency</b> di inizio carriera (in aggiunta ai 140 free agent generati).
        </span>
        <button
          onClick={onCreateFreeAgent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Nuovo Free Agent
        </button>
      </div>

      {customFreeAgents.length === 0 ? (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400">
          Nessun Free Agent personalizzato creato. Clicca su <b>Nuovo Free Agent</b> o{' '}
          <b>Crea Giocatore</b> per aggiungerne uno.
        </div>
      ) : (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Giocatore</th>
                <th className="py-2.5 px-2">Ruolo</th>
                <th className="py-2.5 px-2">Naz</th>
                <th className="py-2.5 px-2 text-center">OVR</th>
                <th className="py-2.5 px-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customFreeAgents.map((fa, idx) => (
                <tr
                  key={`${fa.firstName}_${fa.lastName}_${idx}`}
                  className="hover:bg-slate-900/60"
                >
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {fa.jerseyNumber}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">
                    {fa.firstName} {fa.lastName}
                  </td>
                  <td className="py-2.5 px-2 text-slate-300">
                    {fa.primaryPosition}
                    {fa.secondaryPosition ? `/${fa.secondaryPosition}` : ''}
                  </td>
                  <td className="py-2.5 px-2 text-slate-300">
                    {fa.nationality} {fa.isItalianFormation ? '(ITA)' : '(STR)'}
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-orange-400">
                    {fa.overall}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onEditFreeAgent(idx)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                        title="Modifica"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteFreeAgent(idx)}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/70 text-red-300 cursor-pointer"
                        title="Elimina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
