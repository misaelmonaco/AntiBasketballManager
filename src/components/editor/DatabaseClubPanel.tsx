import React from 'react';
import { CustomTeamOverride } from '../../services/editorDbService';

interface DatabaseClubPanelProps {
  effTeam: {
    name: string;
    shortName: string;
    city: string;
    arena: string;
    primaryColor: string;
    secondaryColor: string;
  };
  onUpdateField: <K extends keyof CustomTeamOverride>(
    field: K,
    value: CustomTeamOverride[K]
  ) => void;
}

export const DatabaseClubPanel: React.FC<DatabaseClubPanelProps> = ({
  effTeam,
  onUpdateField,
}) => {
  return (
    <div className="max-w-2xl space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Nome Club</label>
          <input
            value={effTeam.name}
            onChange={(e) => onUpdateField('name', e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Sigla (3-4 lettere)
          </label>
          <input
            maxLength={4}
            value={effTeam.shortName}
            onChange={(e) => onUpdateField('shortName', e.target.value.toUpperCase())}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono uppercase text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Città</label>
          <input
            value={effTeam.city}
            onChange={(e) => onUpdateField('city', e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Palazzetto / Arena
          </label>
          <input
            value={effTeam.arena}
            onChange={(e) => onUpdateField('arena', e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Colore Primario
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={effTeam.primaryColor}
              onChange={(e) => onUpdateField('primaryColor', e.target.value)}
              className="w-10 h-9 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer"
            />
            <input
              value={effTeam.primaryColor}
              onChange={(e) => onUpdateField('primaryColor', e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Colore Secondario
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={effTeam.secondaryColor}
              onChange={(e) => onUpdateField('secondaryColor', e.target.value)}
              className="w-10 h-9 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer"
            />
            <input
              value={effTeam.secondaryColor}
              onChange={(e) => onUpdateField('secondaryColor', e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
