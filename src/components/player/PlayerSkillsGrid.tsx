import React from 'react';
import { Brain, Dumbbell, Flame, Shield, Star } from 'lucide-react';
import { getAttributeEstimate } from '../../engine/scoutingEngine';
import { Player } from '../../types';

function attrTextColor(val: number): string {
  if (val >= 85) return 'text-orange-400';
  if (val >= 75) return 'text-emerald-400';
  if (val >= 65) return 'text-sky-300';
  return 'text-slate-400';
}

export const StarRating: React.FC<{ value: number; max?: number }> = ({
  value,
  max = 100,
}) => {
  const scaled = Math.max(0.5, Math.min(5, Math.round((value / max) * 5 * 2) / 2));
  return (
    <div className="inline-flex items-center gap-0.5 shrink-0" title={`${scaled.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((idx) => {
        const full = scaled >= idx;
        const half = !full && scaled >= idx - 0.5;
        return (
          <span key={idx} className="relative inline-block w-3 h-3">
            <Star className="w-3 h-3 text-slate-700" />
            {full && (
              <Star className="w-3 h-3 text-orange-400 fill-orange-400 absolute inset-0" />
            )}
            {half && (
              <span className="absolute inset-0 overflow-hidden w-1/2">
                <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};

interface SkillRowProps {
  label: string;
  value: number;
  playerId: string;
  attrKey: string;
  isScouted: boolean;
  scoutRating: number;
}

const SkillRow: React.FC<SkillRowProps> = ({
  label,
  value,
  playerId,
  attrKey,
  isScouted,
  scoutRating,
}) => {
  const est = !isScouted
    ? getAttributeEstimate(value, playerId, attrKey, scoutRating)
    : null;
  const displayVal = isScouted ? `${value}` : `${est!.min}-${est!.max}`;
  const starVal = isScouted ? value : Math.round((est!.min + est!.max) / 2);

  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-800/60 last:border-b-0">
      <span className="text-[11px] text-slate-300 truncate">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-xs font-extrabold tabular-nums w-9 text-right ${
            isScouted ? attrTextColor(value) : 'text-slate-400'
          }`}
        >
          {displayVal}
        </span>
        <StarRating value={starVal} />
      </div>
    </div>
  );
};

interface PlayerSkillsGridProps {
  player: Player;
  isScouted: boolean;
  scoutRating: number;
  estimatedPotential: number;
  leadership: number;
  consistency: number;
  skillsIndex: number;
}

export const PlayerSkillsGrid: React.FC<PlayerSkillsGridProps> = ({
  player,
  isScouted,
  scoutRating,
  estimatedPotential,
  leadership,
  consistency,
  skillsIndex,
}) => {
  const attr = player.attributes;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
      {/* Offensive Skills */}
      <div className="xl:col-span-3 bg-slate-900/90 border border-red-900/50 rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-400 mb-2">
          <Flame className="w-4 h-4" />
          Offensive Skills
        </div>
        <SkillRow
          label="Passing"
          value={attr.passing}
          playerId={player.id}
          attrKey="passing"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Ball Handling"
          value={attr.ballHandling}
          playerId={player.id}
          attrKey="ballHandling"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Inside 2pt (Finishing)"
          value={attr.finishing}
          playerId={player.id}
          attrKey="finishing"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Outside 2pt (Mid)"
          value={attr.twoPoint}
          playerId={player.id}
          attrKey="twoPoint"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="3pt FG"
          value={attr.threePoint}
          playerId={player.id}
          attrKey="threePoint"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Free Throws"
          value={attr.freeThrow}
          playerId={player.id}
          attrKey="freeThrow"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
      </div>

      {/* Defensive Skills */}
      <div className="xl:col-span-3 bg-slate-900/90 border border-red-900/50 rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-400 mb-2">
          <Shield className="w-4 h-4" />
          Defensive Skills
        </div>
        <SkillRow
          label="Perimeter Defence"
          value={attr.perimeterDef}
          playerId={player.id}
          attrKey="perimeterDef"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Interior / Post Def"
          value={attr.postDef}
          playerId={player.id}
          attrKey="postDef"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Steals"
          value={attr.steals}
          playerId={player.id}
          attrKey="steals"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Rebounding"
          value={attr.rebounding}
          playerId={player.id}
          attrKey="rebounding"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Blocks"
          value={attr.blocks}
          playerId={player.id}
          attrKey="blocks"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
      </div>

      {/* Physical Skills */}
      <div className="xl:col-span-2 bg-slate-900/90 border border-red-900/50 rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 mb-2">
          <Dumbbell className="w-4 h-4" />
          Physical Skills
        </div>
        <SkillRow
          label="Athleticism"
          value={attr.athleticism}
          playerId={player.id}
          attrKey="athleticism"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Stamina"
          value={attr.stamina}
          playerId={player.id}
          attrKey="stamina"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Condition"
          value={player.condition}
          playerId={player.id}
          attrKey="condition"
          isScouted={true}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Potential"
          value={estimatedPotential}
          playerId={player.id}
          attrKey="potential"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
      </div>

      {/* Mental Skills */}
      <div className="xl:col-span-2 bg-slate-900/90 border border-red-900/50 rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-400 mb-2">
          <Brain className="w-4 h-4" />
          Mental Skills
        </div>
        <SkillRow
          label="Basketball IQ"
          value={attr.basketballIQ}
          playerId={player.id}
          attrKey="basketballIQ"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Morale"
          value={player.morale}
          playerId={player.id}
          attrKey="morale"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Leadership"
          value={leadership}
          playerId={player.id}
          attrKey="leadership"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
        <SkillRow
          label="Consistency"
          value={consistency}
          playerId={player.id}
          attrKey="consistency"
          isScouted={isScouted}
          scoutRating={scoutRating}
        />
      </div>

      {/* Skills Index Gauge */}
      <div className="xl:col-span-2 bg-slate-900/90 border border-red-900/50 rounded-xl p-3.5 flex flex-col items-center justify-center text-center">
        <div className="w-full bg-slate-950 border border-slate-700 rounded-md h-6 p-0.5 overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300 rounded-sm transition-all"
            style={{ width: `${isScouted ? skillsIndex : 50}%` }}
          />
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Skills Index
        </div>
        <div className="text-4xl font-black text-red-500 mt-1 tabular-nums">
          {isScouted ? skillsIndex : '?'}
        </div>
        {!isScouted && (
          <div className="text-[10px] text-slate-400 mt-1">Osserva per valori esatti</div>
        )}
      </div>
    </div>
  );
};
