import React from 'react';
import { Glasses, ImageUp, RotateCcw } from 'lucide-react';
import {
  ManagerAvatarConfig,
  ManagerBeardStyle,
  ManagerHairStyle,
  ManagerOutfit,
  Nationality,
} from '../../types';
import { COUNTRY_NAMES, CountryFlag } from '../CountryFlag';
import { COACH_FACE_PRESETS } from '../../engine/managerEngine';

const SKIN_TONES = ['#f5d0b5', '#e8be9e', '#d2996c', '#a86b42', '#6e4228'];
const HAIR_COLORS = ['#1c1917', '#2c1e16', '#78350f', '#ca8a04', '#94a3b8', '#e2e8f0'];
const NATIONALITIES: Nationality[] = [
  'ITA',
  'SRB',
  'ESP',
  'USA',
  'GRE',
  'LTU',
  'FRA',
  'GER',
  'ARG',
  'SLO',
  'CRO',
  'LAT',
];

interface WizardStepIdentityProps {
  firstName: string;
  lastName: string;
  age: number;
  nationality: Nationality;
  avatar: ManagerAvatarConfig;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onAgeChange: (v: number) => void;
  onNationalityChange: (v: Nationality) => void;
  onAvatarChange: React.Dispatch<React.SetStateAction<ManagerAvatarConfig>>;
  onUploadPhoto: () => void;
  onBrowserFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const WizardStepIdentity: React.FC<WizardStepIdentityProps> = ({
  firstName,
  lastName,
  age,
  nationality,
  avatar,
  fileInputRef,
  onFirstNameChange,
  onLastNameChange,
  onAgeChange,
  onNationalityChange,
  onAvatarChange,
  onUploadPhoto,
  onBrowserFileChange,
}) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Nome</label>
        <input
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Cognome</label>
        <input
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
          <span>Età</span>
          <span className="text-orange-400 font-bold">{age} anni</span>
        </div>
        <input
          type="range"
          min={30}
          max={68}
          value={age}
          onChange={(e) => onAgeChange(Number(e.target.value))}
          className="w-full accent-orange-500 cursor-pointer mt-2"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Nazionalità</label>
        <div className="flex items-center gap-2.5">
          <CountryFlag nationality={nationality} size="lg" />
          <select
            value={nationality}
            onChange={(e) => onNationalityChange(e.target.value as Nationality)}
            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
          >
            {NATIONALITIES.map((nat) => (
              <option key={nat} value={nat}>
                {COUNTRY_NAMES[nat] ?? nat} ({nat})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>

    {/* Avatar Editor */}
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-white">Creatore Avatar Manager</h3>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onBrowserFileChange}
            className="hidden"
          />
          <button
            onClick={onUploadPhoto}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
          >
            <ImageUp className="w-3.5 h-3.5 text-orange-400" />
            Carica Foto Personale
          </button>
          {(avatar.customPhotoDataUrl || avatar.coachPresetId) && (
            <button
              onClick={() =>
                onAvatarChange((a) => ({
                  ...a,
                  customPhotoDataUrl: undefined,
                  coachPresetId: undefined,
                }))
              }
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Usa SVG
            </button>
          )}
        </div>
      </div>

      {/* 6 Modelli Coach Ufficiali */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Modelli Allenatore Ufficiali (Spogliatoio &amp; Profilo)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COACH_FACE_PRESETS.map((preset) => {
            const selected = avatar.coachPresetId === preset.id && !avatar.customPhotoDataUrl;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onAvatarChange({
                    ...preset.avatar,
                    coachPresetId: preset.id,
                    customPhotoDataUrl: undefined,
                  })
                }
                className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  selected
                    ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-orange-500/40'
                }`}
              >
                <img
                  src={preset.thumbPath}
                  alt={preset.label}
                  className="w-10 h-10 rounded-lg object-cover object-top border border-white/15 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{preset.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{preset.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-semibold block mb-1.5">Carnagione</span>
          <div className="flex gap-2">
            {SKIN_TONES.map((tone) => (
              <button
                key={tone}
                onClick={() =>
                  onAvatarChange((a) => ({ ...a, skinTone: tone, customPhotoDataUrl: undefined }))
                }
                className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                  avatar.skinTone === tone ? 'border-orange-400 scale-110' : 'border-slate-700'
                }`}
                style={{ backgroundColor: tone }}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block mb-1.5">Colore Capelli / Barba</span>
          <div className="flex gap-2">
            {HAIR_COLORS.map((col) => (
              <button
                key={col}
                onClick={() =>
                  onAvatarChange((a) => ({ ...a, hairColor: col, customPhotoDataUrl: undefined }))
                }
                className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                  avatar.hairColor === col ? 'border-orange-400 scale-110' : 'border-slate-700'
                }`}
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block mb-1.5">Taglio Capelli</span>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['short', 'Corti'],
                ['classic', 'Classici'],
                ['curly', 'Ricci'],
                ['receding', 'Stempiato'],
                ['bald', 'Calvo'],
              ] as [ManagerHairStyle, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() =>
                  onAvatarChange((a) => ({ ...a, hairStyle: id, customPhotoDataUrl: undefined }))
                }
                className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                  avatar.hairStyle === id
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block mb-1.5">Barba & Baffi</span>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['none', 'Rasato'],
                ['stubble', 'Barba corta'],
                ['full', 'Barba folta'],
                ['mustache', 'Baffi'],
              ] as [ManagerBeardStyle, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() =>
                  onAvatarChange((a) => ({ ...a, beardStyle: id, customPhotoDataUrl: undefined }))
                }
                className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                  avatar.beardStyle === id
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block mb-1.5">
            Abbigliamento a Bordo Campo
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['suit', 'Completo + Cravatta'],
                ['blazer', 'Camicia & Giacca'],
                ['polo', 'Polo Tecnica Club'],
              ] as [ManagerOutfit, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() =>
                  onAvatarChange((a) => ({ ...a, outfit: id, customPhotoDataUrl: undefined }))
                }
                className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                  avatar.outfit === id
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={() =>
              onAvatarChange((a) => ({ ...a, glasses: !a.glasses, customPhotoDataUrl: undefined }))
            }
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer ${
              avatar.glasses
                ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Glasses className="w-4 h-4" />
            Occhiali: {avatar.glasses ? 'Attivi' : 'No'}
          </button>
        </div>
      </div>
    </div>
  </>
);
