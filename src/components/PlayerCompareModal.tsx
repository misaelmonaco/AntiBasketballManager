import React, { useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import { Player, PlayerAttributes } from '../types';
import { formatEuro } from '../engine/ratings';

interface PlayerCompareModalProps {
  players: Player[];
  onClose: () => void;
}

const COMPARE_ATTRS: { key: keyof PlayerAttributes; label: string }[] = [
  { key: 'threePoint', label: 'Tiro da 3' },
  { key: 'twoPoint', label: 'Tiro da 2' },
  { key: 'finishing', label: 'Finalizzazione' },
  { key: 'freeThrow', label: 'Tiri Liberi' },
  { key: 'passing', label: 'Passaggio' },
  { key: 'ballHandling', label: 'Palleggio' },
  { key: 'perimeterDef', label: 'Dif. Perimetrale' },
  { key: 'postDef', label: 'Dif. in Post' },
  { key: 'rebounding', label: 'Rimbalzi' },
  { key: 'athleticism', label: 'Atletismo' },
  { key: 'stamina', label: 'Resistenza' },
  { key: 'basketballIQ', label: 'QI Cestistico' },
];

export const PlayerCompareModal: React.FC<PlayerCompareModalProps> = ({ players, onClose }) => {
  const [leftId, setLeftId] = useState<string>(players[0]?.id ?? '');
  const [rightId, setRightId] = useState<string>(players[1]?.id ?? players[0]?.id ?? '');

  const left = players.find((p) => p.id === leftId) ?? players[0];
  const right = players.find((p) => p.id === rightId) ?? players[1] ?? players[0];

  if (!left || !right) return null;

  const avg = (p: Player, val: number) =>
    p.seasonStats.gamesPlayed > 0 ? (val / p.seasonStats.gamesPlayed).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fm-modal rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-black text-white">Confronto Giocatori</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={left.id}
              onChange={(e) => setLeftId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-orange-500/40 text-white font-bold"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.primaryPosition} • OVR {p.overall})
                </option>
              ))}
            </select>
            <select
              value={right.id}
              onChange={(e) => setRightId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-sky-500/40 text-white font-bold"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.primaryPosition} • OVR {p.overall})
                </option>
              ))}
            </select>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { p: left, accent: 'text-orange-400' },
              { p: right, accent: 'text-sky-400' },
            ].map(({ p, accent }) => (
              <div key={p.id} className="fm-subcard rounded-xl p-4 space-y-1.5">
                <div className={`text-sm font-black ${accent}`}>
                  {p.firstName} {p.lastName}
                </div>
                <div className="text-slate-300">
                  {p.primaryPosition} • {p.age} anni • OVR <b>{p.overall}</b> •{' '}
                  {formatEuro(p.salary)}
                </div>
                <div className="text-slate-400 tabular-nums">
                  {avg(p, p.seasonStats.points)} PPG • {avg(p, p.seasonStats.rebounds)} RPG •{' '}
                  {avg(p, p.seasonStats.assists)} APG • {avg(p, p.seasonStats.pir)} PIR
                </div>
              </div>
            ))}
          </div>

          {/* Attributes comparison */}
          <div className="fm-subcard rounded-xl p-4 space-y-2">
            {COMPARE_ATTRS.map(({ key, label }) => {
              const lv = left.attributes[key];
              const rv = right.attributes[key];
              return (
                <div
                  key={String(key)}
                  className="grid grid-cols-12 items-center gap-2 py-1 border-b border-slate-800/50 last:border-0"
                >
                  <div
                    className={`col-span-3 text-right font-black tabular-nums ${
                      lv > rv ? 'text-emerald-400' : lv < rv ? 'text-slate-400' : 'text-white'
                    }`}
                  >
                    {lv}
                  </div>
                  <div className="col-span-6 text-center text-slate-300 font-semibold">
                    {label}
                  </div>
                  <div
                    className={`col-span-3 text-left font-black tabular-nums ${
                      rv > lv ? 'text-emerald-400' : rv < lv ? 'text-slate-400' : 'text-white'
                    }`}
                  >
                    {rv}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
