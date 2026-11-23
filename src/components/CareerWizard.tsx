import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Star,
  Target,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { getEffectiveTeamTemplates } from '../services/editorDbService';
import { formatEuro } from '../engine/ratings';
import { ClubBadge } from './ClubBadge';
import {
  DEFAULT_AVATAR,
  getAutoAllocatedAttributes,
  getTeamBoardObjective,
  getTotalAttributePool,
  MANAGER_BACKGROUNDS,
  MANAGER_PHILOSOPHIES,
} from '../engine/managerEngine';
import { isTauriRuntime, pickManagerPhotoDialog } from '../services/saveService';
import {
  ManagerAttributes,
  ManagerAvatarConfig,
  ManagerBackground,
  ManagerPhilosophy,
  ManagerProfile,
  Nationality,
} from '../types';
import { COUNTRY_NAMES, CountryFlag } from './CountryFlag';
import { ManagerAvatar } from './ManagerAvatar';
import { WizardStepIdentity } from './wizard/WizardStepIdentity';
import { WizardStepPhilosophy } from './wizard/WizardStepPhilosophy';
import { WizardStepClub } from './wizard/WizardStepClub';

interface CareerWizardProps {
  onCancel: () => void;
  onComplete: (teamId: string, profile: ManagerProfile, slotName: string) => Promise<void>;
}

export const CareerWizard: React.FC<CareerWizardProps> = ({ onCancel, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);

  // Step 1: Identity & Avatar
  const [firstName, setFirstName] = useState('Marco');
  const [lastName, setLastName] = useState('Rossi');
  const [age, setAge] = useState(42);
  const [nationality, setNationality] = useState<Nationality>('ITA');
  const [avatar, setAvatar] = useState<ManagerAvatarConfig>({ ...DEFAULT_AVATAR });

  // Step 2: Background, Philosophy & Attributes
  const [background, setBackground] = useState<ManagerBackground>('serie_a_pro');
  const [philosophy, setPhilosophy] = useState<ManagerPhilosophy>('pick_and_roll_master');
  const [attributes, setAttributes] = useState<ManagerAttributes>(() =>
    getAutoAllocatedAttributes('pick_and_roll_master', getTotalAttributePool('serie_a_pro'))
  );

  const effectiveTeams = useMemo(() => getEffectiveTeamTemplates(), []);
  // Step 3: Team, Firing rule & Slot
  const [selectedTeamId, setSelectedTeamId] = useState(effectiveTeams[0].id);
  const [allowFiring, setAllowFiring] = useState<boolean>(true);
  const [slotName, setSlotName] = useState('Carriera Basket Italia 2026');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPool = getTotalAttributePool(background);
  const usedPoints = useMemo(
    () => Object.values(attributes).reduce((s, v) => s + v, 0),
    [attributes]
  );
  const remainingPoints = totalPool - usedPoints;

  const selectedBg = MANAGER_BACKGROUNDS.find((b) => b.id === background)!;
  const selectedPhil = MANAGER_PHILOSOPHIES.find((p) => p.id === philosophy)!;
  const selectedTeam = effectiveTeams.find((t) => t.id === selectedTeamId) ?? effectiveTeams[0];
  const boardObjective = getTeamBoardObjective(selectedTeam.prestige);

  const handleSelectBackground = (bg: ManagerBackground) => {
    setBackground(bg);
    const nextPool = getTotalAttributePool(bg);
    setAttributes(getAutoAllocatedAttributes(philosophy, nextPool));
  };

  const handleSelectPhilosophy = (phil: ManagerPhilosophy) => {
    setPhilosophy(phil);
    setAttributes(getAutoAllocatedAttributes(phil, totalPool));
  };

  const handleAutoAllocate = () => {
    setAttributes(getAutoAllocatedAttributes(philosophy, totalPool));
  };

  const adjustAttr = (key: keyof ManagerAttributes, delta: number) => {
    const cur = attributes[key];
    const next = cur + delta;
    if (next < 1 || next > 20) return;
    if (delta > 0 && remainingPoints <= 0) return;
    setAttributes({ ...attributes, [key]: next });
  };

  const handleUploadPhoto = async () => {
    if (isTauriRuntime()) {
      const dataUrl = await pickManagerPhotoDialog();
      if (dataUrl) {
        setAvatar((a) => ({ ...a, customPhotoDataUrl: dataUrl }));
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleBrowserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar((a) => ({ ...a, customPhotoDataUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinish = async () => {
    setBusy(true);
    try {
      const profile: ManagerProfile = {
        firstName: firstName.trim() || 'Coach',
        lastName: lastName.trim() || 'Rossi',
        age,
        nationality,
        avatar,
        background,
        philosophy,
        reputation: selectedBg.reputation,
        attributes,
        allowFiring,
      };
      await onComplete(selectedTeamId, profile, slotName);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-6xl fm-panel rounded-2xl shadow-2xl relative z-10 max-h-[90vh] flex flex-col overflow-hidden border border-white/15">
      {/* Top Wizard Header + Stepper */}
      <div
        className="relative px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${selectedTeam.primaryColor}b8 0%, #090d16f5 58%)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-72 opacity-20"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0% 100%)',
            backgroundColor: selectedTeam.secondaryColor,
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-400">
              Nuova Carriera • Basket Manager Italia
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">
              Creazione Carriera & Profilo Allenatore
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold">
          {[
            { n: 1, label: 'Identità & Look' },
            { n: 2, label: 'Filosofia & Attributi' },
            { n: 3, label: 'Scelta Club' },
          ].map((s, idx) => (
            <React.Fragment key={s.n}>
              <button
                onClick={() => setStep(s.n as 1 | 2 | 3)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  step === s.n
                    ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-md shadow-orange-500/20'
                    : step > s.n
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-black">
                  {s.n}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {idx < 2 && <div className="w-4 h-px bg-slate-800 hidden sm:block" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content + Persistent Right Summary */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        {/* Left 2 cols: Current Step */}
        <div className="lg:col-span-2 p-6 overflow-y-auto space-y-6">
          {step === 1 && (
            <WizardStepIdentity
              firstName={firstName}
              lastName={lastName}
              age={age}
              nationality={nationality}
              avatar={avatar}
              fileInputRef={fileInputRef}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onAgeChange={setAge}
              onNationalityChange={setNationality}
              onAvatarChange={setAvatar}
              onUploadPhoto={handleUploadPhoto}
              onBrowserFileChange={handleBrowserFileChange}
            />
          )}

          {step === 2 && (
            <WizardStepPhilosophy
              background={background}
              philosophy={philosophy}
              attributes={attributes}
              totalPool={totalPool}
              remainingPoints={remainingPoints}
              onSelectBackground={handleSelectBackground}
              onSelectPhilosophy={handleSelectPhilosophy}
              onAutoAllocate={handleAutoAllocate}
              onAdjustAttr={adjustAttr}
            />
          )}

          {step === 3 && (
            <WizardStepClub
              selectedTeamId={selectedTeamId}
              slotName={slotName}
              allowFiring={allowFiring}
              onSelectTeam={setSelectedTeamId}
              onSlotNameChange={setSlotName}
              onAllowFiringChange={setAllowFiring}
            />
          )}
        </div>

        {/* Right Col: Persistent Live Summary Sidebar (Tesserino Tecnico) */}
        <aside className="bg-slate-950/90 border-l border-slate-800 p-5 flex flex-col justify-between gap-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-400">
                Tesserino Tecnico Live
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400">
                Rep. {selectedBg.reputation}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center gap-3.5 shadow-inner">
              <ManagerAvatar
                avatar={avatar}
                clubColor={selectedTeam.primaryColor}
                size="lg"
              />
              <div className="min-w-0">
                <div className="text-base font-black text-white truncate">
                  {firstName || 'Coach'} {lastName || 'Rossi'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <CountryFlag nationality={nationality} size="sm" />
                  <span className="truncate">{COUNTRY_NAMES[nationality]}</span>
                  <span>•</span>
                  <span className="tabular-nums">{age}a</span>
                </div>
                <div className="text-[11px] font-bold text-sky-300 mt-1 truncate">
                  {selectedPhil.title}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Passato:</span>
                <strong className="text-slate-200">{selectedBg.title}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Ritmo / Focus:</span>
                <strong className="text-slate-200">
                  {selectedPhil.tactics.pace} • {selectedPhil.tactics.offensiveFocus}
                </strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Difesa:</span>
                <strong className="text-slate-200">{selectedPhil.tactics.defense}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Regola Esoneri:</span>
                <strong className={allowFiring ? 'text-orange-300' : 'text-emerald-300'}>
                  {allowFiring ? 'Attiva (<20%)' : 'Panchina blindata'}
                </strong>
              </div>
            </div>

            {/* Selected Club Summary */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: `linear-gradient(90deg, ${selectedTeam.primaryColor}, ${selectedTeam.secondaryColor})`,
                }}
              />
              <div className="flex items-center gap-2.5 pt-0.5">
                <ClubBadge
                  shortName={selectedTeam.shortName}
                  primaryColor={selectedTeam.primaryColor}
                  secondaryColor={selectedTeam.secondaryColor}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="font-black text-white truncate">{selectedTeam.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    <Building2 className="w-3 h-3 inline mr-1" />
                    {selectedTeam.arena} ({selectedTeam.arenaCapacity.toLocaleString('it-IT')})
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    Budget:
                  </span>
                  <strong>{formatEuro(selectedTeam.budget)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    Prestigio:
                  </span>
                  <strong>{selectedTeam.prestige}/100</strong>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Target className="w-3.5 h-3.5 text-orange-400" />
                    Obiettivo:
                  </span>
                  <strong className="text-orange-300">{boardObjective}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Indietro
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                Avanti
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                {busy ? 'Creazione...' : 'Firma Contratto e Inizia Carriera'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
