import React, { useState } from 'react';
import { Dices, RefreshCw, Save, Sliders, Sparkles, X } from 'lucide-react';
import {
  Nationality,
  PlayerAttributes,
  PlayerPersonality,
  Position,
} from '../../types';
import {
  createRandomCustomPlayerTemplate,
  CustomPlayerTemplate,
} from '../../services/editorDbService';
import { buildDefaultAttributesForTemplate } from '../../data/generator';
import { adaptAttributesToOverall, calculateOverall } from '../../engine/ratings';

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
const NATIONALITIES: Nationality[] = [
  'ITA',
  'USA',
  'SRB',
  'ESP',
  'LTU',
  'FRA',
  'GER',
  'ARG',
  'GRE',
  'SLO',
  'CRO',
  'LAT',
];
const PERSONALITIES: PlayerPersonality[] = [
  'Leader',
  'Professionista',
  'Egocentrico',
  'Giovane ambizioso',
];

const COUNTRY_NAMES: Record<Nationality, string> = {
  ITA: 'Italia',
  USA: 'Stati Uniti',
  SRB: 'Serbia',
  ESP: 'Spagna',
  LTU: 'Lituania',
  FRA: 'Francia',
  GER: 'Germania',
  ARG: 'Argentina',
  GRE: 'Grecia',
  SLO: 'Slovenia',
  CRO: 'Croazia',
  LAT: 'Lettonia',
};

const SKILL_GROUPS: {
  title: string;
  accent: string;
  fields: { key: keyof PlayerAttributes; label: string }[];
}[] = [
  {
    title: 'Attacco',
    accent: 'text-orange-400',
    fields: [
      { key: 'threePoint', label: 'Tiro da 3' },
      { key: 'twoPoint', label: 'Tiro da 2' },
      { key: 'freeThrow', label: 'Tiri Liberi' },
      { key: 'passing', label: 'Passaggio' },
      { key: 'ballHandling', label: 'Palleggio' },
      { key: 'finishing', label: 'Finalizzazione' },
    ],
  },
  {
    title: 'Difesa',
    accent: 'text-sky-400',
    fields: [
      { key: 'perimeterDef', label: 'Dif. Perimetrale' },
      { key: 'postDef', label: 'Dif. in Post' },
      { key: 'blocks', label: 'Stoppate' },
      { key: 'steals', label: 'Palle Rubate' },
    ],
  },
  {
    title: 'Fisico & Mentale',
    accent: 'text-emerald-400',
    fields: [
      { key: 'athleticism', label: 'Atletismo' },
      { key: 'rebounding', label: 'Rimbalzi' },
      { key: 'stamina', label: 'Resistenza' },
      { key: 'basketballIQ', label: 'QI Cestistico' },
    ],
  },
];

interface PlayerEditorModalProps {
  player: CustomPlayerTemplate;
  teamName: string;
  isNew?: boolean;
  destinationOptions?: {
    teams: { id: string; name: string }[];
    initialTarget: string; // teamId oppure '__FREE_AGENT__'
  };
  onSave: (updated: CustomPlayerTemplate, destinationId?: string) => void;
  onClose: () => void;
}

export const PlayerEditorModal: React.FC<PlayerEditorModalProps> = ({
  player,
  teamName,
  isNew = false,
  destinationOptions,
  onSave,
  onClose,
}) => {
  const defaultAttrs = buildDefaultAttributesForTemplate(
    player.primaryPosition,
    player.overall
  );

  const [draft, setDraft] = useState<CustomPlayerTemplate>(() => ({
    ...player,
    attributes: {
      ...defaultAttrs,
      ...(player.attributes ?? {}),
    },
  }));

  const [destinationId, setDestinationId] = useState<string>(
    destinationOptions?.initialTarget ?? '__FREE_AGENT__'
  );
  const [targetOvrInput, setTargetOvrInput] = useState<string>(String(player.overall));

  const attrs: PlayerAttributes = {
    ...defaultAttrs,
    ...(draft.attributes ?? {}),
  };

  const calculatedOvr = calculateOverall(attrs, draft.primaryPosition);

  const setAttr = (key: keyof PlayerAttributes, rawVal: number) => {
    const val = Math.max(30, Math.min(99, Math.round(rawVal || 30)));
    setDraft((prev) => ({
      ...prev,
      attributes: {
        ...defaultAttrs,
        ...(prev.attributes ?? {}),
        [key]: val,
      },
    }));
  };

  const handleAdaptToTargetOvr = (rawInput: string = targetOvrInput) => {
    const parsed = Math.max(30, Math.min(99, Math.round(Number(rawInput) || calculatedOvr)));
    const adapted = adaptAttributesToOverall(attrs, draft.primaryPosition, parsed);
    const actualOvr = calculateOverall(adapted, draft.primaryPosition);
    setTargetOvrInput(String(actualOvr));
    setDraft((prev) => ({
      ...prev,
      overall: actualOvr,
      attributes: adapted,
    }));
  };

  const handleRegenerateFromOvr = () => {
    const parsed = Math.max(30, Math.min(99, Math.round(Number(targetOvrInput) || draft.overall)));
    const baseAttrs = buildDefaultAttributesForTemplate(draft.primaryPosition, parsed);
    const exactAttrs = adaptAttributesToOverall(baseAttrs, draft.primaryPosition, parsed);
    const actualOvr = calculateOverall(exactAttrs, draft.primaryPosition);
    setTargetOvrInput(String(actualOvr));
    setDraft((prev) => ({
      ...prev,
      overall: actualOvr,
      attributes: exactAttrs,
    }));
  };

  const handleSyncOvrFromSkills = () => {
    setTargetOvrInput(String(calculatedOvr));
    setDraft((prev) => ({
      ...prev,
      overall: calculatedOvr,
    }));
  };

  const handleRandomizeAll = () => {
    const rnd = createRandomCustomPlayerTemplate();
    const baseAttrs = buildDefaultAttributesForTemplate(rnd.primaryPosition, rnd.overall);
    const exactAttrs = adaptAttributesToOverall(baseAttrs, rnd.primaryPosition, rnd.overall);
    const actualOvr = calculateOverall(exactAttrs, rnd.primaryPosition);
    setTargetOvrInput(String(actualOvr));
    setDraft({
      ...rnd,
      overall: actualOvr,
      attributes: exactAttrs,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-orange-400" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isNew ? 'Crea Nuovo Giocatore' : 'Editor Giocatore'} • {teamName}
              </div>
              <h3 className="text-base font-extrabold text-white">
                #{draft.jerseyNumber} {draft.firstName} {draft.lastName}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomizeAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-extrabold cursor-pointer"
              title="Randomizza anagrafica, ruolo, fisico, contratto e tutte le skill"
            >
              <Dices className="w-3.5 h-3.5" />
              Randomizza Tutto
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {destinationOptions && (
            <div className="bg-slate-950/70 border border-sky-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400">
                  Destinazione Giocatore
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Scegli se inserire il giocatore nel roster di una squadra o nella lista Free Agency
                </div>
              </div>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-sky-500 cursor-pointer min-w-[240px]"
              >
                <option value="__FREE_AGENT__">Free Agency (Svincolati)</option>
                {destinationOptions.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    Squadra: {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Anagrafica & Ruolo */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400">
              Anagrafica, Fisico & Contratto
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={draft.firstName}
                  onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Cognome
                </label>
                <input
                  type="text"
                  value={draft.lastName}
                  onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Numero Maglia
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={draft.jerseyNumber}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      jerseyNumber: Math.max(0, Math.min(99, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Età (anni)
                </label>
                <input
                  type="number"
                  min={16}
                  max={45}
                  value={draft.age ?? ''}
                  placeholder="Auto (20-34)"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      age: e.target.value
                        ? Math.max(16, Math.min(45, Number(e.target.value)))
                        : undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Ruolo Primario
                </label>
                <select
                  value={draft.primaryPosition}
                  onChange={(e) =>
                    setDraft({ ...draft, primaryPosition: e.target.value as Position })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Ruolo Secondario
                </label>
                <select
                  value={draft.secondaryPosition ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      secondaryPosition: e.target.value
                        ? (e.target.value as Position)
                        : undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="">Nessuno (Auto)</option>
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Nazionalità
                </label>
                <select
                  value={draft.nationality}
                  onChange={(e) => {
                    const nat = e.target.value as Nationality;
                    setDraft({
                      ...draft,
                      nationality: nat,
                      isItalianFormation: nat === 'ITA' ? true : draft.isItalianFormation,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  {NATIONALITIES.map((nat) => (
                    <option key={nat} value={nat}>
                      {COUNTRY_NAMES[nat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Formazione
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, isItalianFormation: !draft.isItalianFormation })
                  }
                  className={`w-full px-2.5 py-1.5 rounded-lg font-extrabold border cursor-pointer ${
                    draft.isItalianFormation
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {draft.isItalianFormation ? 'Formazione ITA' : 'Straniero (STR)'}
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Altezza (cm)
                </label>
                <input
                  type="number"
                  min={160}
                  max={235}
                  value={draft.heightCm ?? ''}
                  placeholder="Auto"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      heightCm: e.target.value
                        ? Math.max(160, Math.min(235, Number(e.target.value)))
                        : undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  min={60}
                  max={160}
                  value={draft.weightKg ?? ''}
                  placeholder="Auto"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      weightKg: e.target.value
                        ? Math.max(60, Math.min(160, Number(e.target.value)))
                        : undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Personalità
                </label>
                <select
                  value={draft.personality ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      personality: e.target.value
                        ? (e.target.value as PlayerPersonality)
                        : undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="">Casuale (Auto)</option>
                  {PERSONALITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Overall Target
                </label>
                <input
                  type="number"
                  min={35}
                  max={99}
                  value={draft.overall}
                  onChange={(e) => {
                    const nextOvr = Math.max(30, Math.min(99, Number(e.target.value) || 60));
                    setTargetOvrInput(String(nextOvr));
                    setDraft({
                      ...draft,
                      overall: nextOvr,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-orange-400 font-extrabold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Stipendio (€/anno)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={draft.salary ?? ''}
                  placeholder="Auto da OVR"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      salary: e.target.value ? Math.max(0, Number(e.target.value)) : undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Durata Contratto
                </label>
                <select
                  value={draft.contractYears ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      contractYears: e.target.value
                        ? (Number(e.target.value) as 1 | 2)
                        : undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="">Casuale (1-2 anni)</option>
                  <option value="1">1 anno</option>
                  <option value="2">2 anni</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills / Attributi */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400">
                  Skills & Attributi (30–99)
                </div>
                <div className="text-[11px] text-slate-400">
                  OVR calcolato dalle skill per ruolo {draft.primaryPosition}:{' '}
                  <span className="font-extrabold text-white">{calculatedOvr}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                  <span className="text-[11px] font-bold text-slate-400">OVR:</span>
                  <input
                    type="number"
                    min={30}
                    max={99}
                    value={targetOvrInput}
                    onChange={(e) => setTargetOvrInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdaptToTargetOvr(targetOvrInput);
                      }
                    }}
                    className="w-12 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-center font-mono font-extrabold text-orange-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdaptToTargetOvr(targetOvrInput)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold cursor-pointer"
                    title="Adatta proporzionalmente tutte le 14 skills all'overall inserito"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Adatta Attributi
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRegenerateFromOvr}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
                  title="Rigenera il profilo base delle skills per il ruolo selezionato"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                  Profilo Base
                </button>
                <button
                  type="button"
                  onClick={handleSyncOvrFromSkills}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 font-semibold cursor-pointer"
                >
                  Allinea OVR a {calculatedOvr}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SKILL_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 space-y-2.5"
                >
                  <div className={`text-[11px] font-extrabold uppercase tracking-wider ${group.accent}`}>
                    {group.title}
                  </div>
                  {group.fields.map(({ key, label }) => {
                    const val = attrs[key];
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-300 font-medium">{label}</span>
                          <input
                            type="number"
                            min={30}
                            max={99}
                            value={val}
                            onChange={(e) => setAttr(key, Number(e.target.value))}
                            className="w-12 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-center font-mono font-bold text-white"
                          />
                        </div>
                        <input
                          type="range"
                          min={30}
                          max={99}
                          value={val}
                          onChange={(e) => setAttr(key, Number(e.target.value))}
                          className="w-full accent-orange-500 cursor-pointer h-1.5"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() =>
              onSave(
                {
                  ...draft,
                  overall: calculateOverall(attrs, draft.primaryPosition),
                },
                destinationOptions ? destinationId : undefined
              )
            }
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-extrabold cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {isNew ? 'Crea Giocatore' : 'Applica Modifiche'}
          </button>
        </div>
      </div>
    </div>
  );
};
