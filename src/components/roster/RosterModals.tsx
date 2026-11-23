import React from 'react';
import { X } from 'lucide-react';
import { calculateBuyout, formatEuro } from '../../engine/ratings';
import { Player } from '../../types';

const AttrGroup: React.FC<{ title: string; items: [string, number][] }> = ({ title, items }) => (
  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
    <div className="font-bold text-orange-400 uppercase tracking-wider text-[11px] mb-2">
      {title}
    </div>
    {items.map(([label, val]) => (
      <div key={label} className="flex items-center justify-between">
        <span className="text-slate-400">{label}</span>
        <span
          className={`font-bold ${
            val >= 80 ? 'text-emerald-400' : val >= 68 ? 'text-slate-100' : 'text-amber-400'
          }`}
        >
          {val}
        </span>
      </div>
    ))}
  </div>
);

export const RosterPlayerQuickModal: React.FC<{
  player: Player;
  onClose: () => void;
}> = ({ player, onClose }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="fm-modal rounded-2xl max-w-2xl w-full p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-extrabold text-white">
            {player.firstName} {player.lastName}
          </h3>
          <p className="text-xs text-slate-400">
            {player.nationality} • {player.primaryPosition}
            {player.secondaryPosition ? `/${player.secondaryPosition}` : ''} •{' '}
            {player.age} anni • OVR {player.overall}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 text-xs">
        <AttrGroup
          title="Attacco"
          items={[
            ['Tiro da 3', player.attributes.threePoint],
            ['Tiro da 2', player.attributes.twoPoint],
            ['Tiri Liberi', player.attributes.freeThrow],
            ['Passaggio/Visione', player.attributes.passing],
            ['Palleggio', player.attributes.ballHandling],
            ['Finalizzazione', player.attributes.finishing],
          ]}
        />
        <AttrGroup
          title="Difesa"
          items={[
            ['Dif. Perimetrale', player.attributes.perimeterDef],
            ['Dif. in Post', player.attributes.postDef],
            ['Stoppate', player.attributes.blocks],
            ['Rubate', player.attributes.steals],
          ]}
        />
        <AttrGroup
          title="Fisico / Mentale"
          items={[
            ['Atletismo', player.attributes.athleticism],
            ['Rimbalzi', player.attributes.rebounding],
            ['Resistenza', player.attributes.stamina],
            ['IQ Cestistico', player.attributes.basketballIQ],
          ]}
        />
      </div>
    </div>
  </div>
);

export const RosterConfirmCutModal: React.FC<{
  player: Player;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ player, onCancel, onConfirm }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="fm-modal rounded-2xl max-w-md w-full p-6">
      <h3 className="text-lg font-bold text-white">Conferma Taglio Giocatore</h3>
      <p className="text-sm text-slate-300 mt-2">
        Vuoi risolvere il contratto di{' '}
        <b>
          {player.firstName} {player.lastName}
        </b>
        ? Dovrai pagare una buonuscita di{' '}
        <span className="text-amber-400 font-bold">
          {formatEuro(calculateBuyout(player))}
        </span>{' '}
        dal budget societario, liberando{' '}
        <span className="text-emerald-400 font-bold">
          {formatEuro(player.salary)}
        </span>{' '}
        di spazio salariale.
      </p>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
        >
          Annulla
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white cursor-pointer"
        >
          Taglia e Paga Buonuscita
        </button>
      </div>
    </div>
  </div>
);
