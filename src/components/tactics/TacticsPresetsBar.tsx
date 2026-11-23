import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, Zap } from 'lucide-react';
import { BUILT_IN_PRESETS } from '../../data/tacticsCatalog';
import { Tactics, TacticsPreset } from '../../types';

interface TacticsPresetsBarProps {
  tactics: Tactics;
  onUpdateTactics: (patch: Partial<Tactics>) => void;
}

export const TacticsPresetsBar: React.FC<TacticsPresetsBarProps> = ({
  tactics,
  onUpdateTactics,
}) => {
  const [presetName, setPresetName] = useState('');
  const customPresets = tactics.presets ?? [];

  const applyPreset = (preset: TacticsPreset) => {
    onUpdateTactics({ ...preset.tactics });
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = presetName.trim();
    if (!trimmed) return;
    const newPreset: TacticsPreset = {
      id: `custom_${Date.now()}`,
      name: trimmed.slice(0, 28),
      tactics: {
        pace: tactics.pace,
        offensiveFocus: tactics.offensiveFocus,
        defense: tactics.defense,
        offensiveAggression: tactics.offensiveAggression ?? 'Normale',
        reboundPolicy: tactics.reboundPolicy ?? 'Equilibrato',
        pnrCoverage: tactics.pnrCoverage ?? 'Hedge & Recover',
        defensiveIntensity: tactics.defensiveIntensity ?? 'Standard',
        opponentFocus: tactics.opponentFocus ?? 'Equilibrata',
        goToPlayerId: tactics.goToPlayerId ?? null,
        secondaryOptionPlayerId: tactics.secondaryOptionPlayerId ?? null,
        playbook: tactics.playbook ?? ['pick_and_roll_centrale', 'horns', 'floppy'],
      },
    };
    onUpdateTactics({ presets: [...customPresets, newPreset] });
    setPresetName('');
  };

  const handleDeletePreset = (id: string) => {
    onUpdateTactics({ presets: customPresets.filter((p) => p.id !== id) });
  };

  return (
    <div className="fm-card rounded-2xl p-4 border border-slate-800 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-300">
          <Bookmark className="w-4 h-4 text-orange-400" />
          <span>Preset Tattici Rapidi</span>
        </div>

        <form onSubmit={handleSavePreset} className="flex items-center gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Nome nuovo preset..."
            maxLength={28}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 w-44"
          />
          <button
            type="submit"
            disabled={!presetName.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 disabled:opacity-40 border border-orange-500/40 text-orange-300 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Salva Assetto
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {BUILT_IN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{preset.name}</span>
            <span className="text-[10px] text-slate-500 font-normal">
              ({preset.tactics.pace} · {preset.tactics.defense})
            </span>
          </button>
        ))}

        {customPresets.map((preset) => (
          <div
            key={preset.id}
            className="inline-flex items-center rounded-xl bg-sky-500/10 border border-sky-500/35 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 text-xs font-bold text-sky-200 hover:bg-sky-500/20 cursor-pointer"
            >
              {preset.name}
            </button>
            <button
              type="button"
              onClick={() => handleDeletePreset(preset.id)}
              title="Elimina preset"
              className="px-2 py-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border-l border-sky-500/25 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
