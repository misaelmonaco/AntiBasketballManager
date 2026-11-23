import React from 'react';
import { Award, AlertTriangle } from 'lucide-react';
import { Player } from '../../types';
import { getAttributeEstimate } from '../../engine/scoutingEngine';
import { PlayerRadarChart, RadarAxis } from './PlayerRadarChart';

export const ATTR_LABELS: Record<keyof Player['attributes'], string> = {
  threePoint: 'Tiro da 3',
  twoPoint: 'Tiro da 2',
  freeThrow: 'Tiri Liberi',
  passing: 'Passaggio / Visione',
  ballHandling: 'Palleggio',
  finishing: 'Finalizzazione al ferro',
  perimeterDef: 'Difesa Perimetrale',
  postDef: 'Difesa in Post',
  blocks: 'Stoppate',
  steals: 'Rubate',
  athleticism: 'Atletismo',
  rebounding: 'Rimbalzi',
  stamina: 'Resistenza',
  basketballIQ: 'IQ Cestistico',
};

function fmAttrColor(val: number): string {
  if (val >= 85) return 'text-amber-400 font-black';
  if (val >= 75) return 'text-emerald-400 font-bold';
  if (val >= 60) return 'text-sky-300 font-semibold';
  return 'text-slate-400 font-medium';
}

interface PlayerOverviewTabProps {
  player: Player;
  isScouted: boolean;
  scoutRating: number;
}

export const PlayerOverviewTab: React.FC<PlayerOverviewTabProps> = ({
  player,
  isScouted,
  scoutRating,
}) => {
  const a = player.attributes;
  const radarAxes: RadarAxis[] = [
    { label: 'Attacco', val: Math.round((a.twoPoint + a.finishing + a.freeThrow) / 3) },
    { label: 'Tiro', val: Math.round((a.threePoint * 1.2 + a.twoPoint * 0.8) / 2) },
    { label: 'Regia', val: Math.round((a.passing + a.ballHandling + a.basketballIQ) / 3) },
    { label: 'Difesa', val: Math.round((a.perimeterDef + a.postDef + a.steals + a.blocks) / 4) },
    { label: 'Rimbalzi', val: a.rebounding },
    { label: 'Atletismo', val: Math.round((a.athleticism + a.stamina) / 2) },
  ];

  const allAttrEntries = (Object.keys(ATTR_LABELS) as (keyof Player['attributes'])[]).map((k) => ({
    key: k,
    label: ATTR_LABELS[k],
    val: a[k],
  }));
  const sortedDesc = [...allAttrEntries].sort((x, y) => y.val - x.val);
  const strengths = sortedDesc.slice(0, 3);
  const weaknesses = sortedDesc.slice(-2).reverse();

  const renderAttrCell = (key: keyof Player['attributes']) => {
    const val = a[key];
    if (!isScouted) {
      const est = getAttributeEstimate(val, player.id, key, scoutRating);
      return (
        <span className="text-slate-300 font-semibold">
          {est.min} - {est.max}
        </span>
      );
    }
    return <span className={fmAttrColor(val)}>{val}</span>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center">
          <div className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 self-start">
            Radar Profilo Tecnico
          </div>
          <PlayerRadarChart axes={radarAxes} dimmed={!isScouted} />
          {!isScouted && (
            <div className="text-[11px] text-sky-300 mt-2 text-center">
              Stima approssimativa (Fog of War). Osserva il giocatore per dati esatti.
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <div className="font-bold uppercase tracking-wider text-orange-400">
            Profilo Tattico & Carattere
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Personalità</span>
            <span className="font-bold text-white">
              {isScouted ? player.personality : 'Sconosciuta'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Ruolo Preferito</span>
            <span className="font-bold text-white">
              {player.primaryPosition}
              {player.secondaryPosition ? ` (adattabile ${player.secondaryPosition})` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Rischio Infortuni</span>
            <span className="font-bold text-amber-300">
              {isScouted ? `${player.injuryProneness}/100` : 'Sconosciuto'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-emerald-400 font-bold mb-1.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Punti di Forza
            </div>
            <div className="flex flex-wrap gap-1.5">
              {isScouted ? (
                strengths.map((s) => (
                  <span
                    key={s.key}
                    className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold"
                  >
                    {s.label} ({s.val})
                  </span>
                ))
              ) : (
                <span className="text-slate-500">Da osservare</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-amber-400 font-bold mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Punti Deboli
            </div>
            <div className="flex flex-wrap gap-1.5">
              {isScouted ? (
                weaknesses.map((w) => (
                  <span
                    key={w.key}
                    className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    {w.label} ({w.val})
                  </span>
                ))
              ) : (
                <span className="text-slate-500">Da osservare</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4 content-start">
        <AttrColumn
          title="Attacco"
          keys={['threePoint', 'twoPoint', 'freeThrow', 'passing', 'ballHandling', 'finishing']}
          renderVal={renderAttrCell}
        />
        <AttrColumn
          title="Difesa"
          keys={['perimeterDef', 'postDef', 'blocks', 'steals']}
          renderVal={renderAttrCell}
        />
        <AttrColumn
          title="Fisico / Mentale"
          keys={['athleticism', 'rebounding', 'stamina', 'basketballIQ']}
          renderVal={renderAttrCell}
        />
      </div>
    </div>
  );
};

const AttrColumn: React.FC<{
  title: string;
  keys: (keyof Player['attributes'])[];
  renderVal: (k: keyof Player['attributes']) => React.ReactNode;
}> = ({ title, keys, renderVal }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
    <div className="font-bold uppercase tracking-wider text-orange-400 pb-2 border-b border-slate-800">
      {title}
    </div>
    {keys.map((k) => (
      <div key={k} className="flex items-center justify-between py-0.5">
        <span className="text-slate-300">{ATTR_LABELS[k]}</span>
        {renderVal(k)}
      </div>
    ))}
  </div>
);
