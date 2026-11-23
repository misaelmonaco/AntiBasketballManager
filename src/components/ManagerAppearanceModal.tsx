import React, { useRef, useState } from 'react';
import { Save, X } from 'lucide-react';
import { CareerSave, ManagerAvatarConfig, ManagerProfile, Nationality } from '../types';
import {
  createDefaultManagerProfile,
  getCoachPreset,
} from '../engine/managerEngine';
import {
  isTauriRuntime,
  pickManagerPhotoDialog,
  saveCareerToSlot,
} from '../services/saveService';
import { WizardStepIdentity } from './wizard/WizardStepIdentity';
import { ManagerAvatar } from './ManagerAvatar';

interface ManagerAppearanceModalProps {
  career: CareerSave;
  primaryColor: string;
  secondaryColor: string;
  onClose: () => void;
  onSaved: (updatedCareer: CareerSave) => void;
  onToast: (msg: string) => void;
}

export const ManagerAppearanceModal: React.FC<ManagerAppearanceModalProps> = ({
  career,
  primaryColor,
  onClose,
  onSaved,
  onToast,
}) => {
  const baseProfile: ManagerProfile =
    career.managerProfile ?? createDefaultManagerProfile(career.managerName);

  const [firstName, setFirstName] = useState(baseProfile.firstName);
  const [lastName, setLastName] = useState(baseProfile.lastName);
  const [age, setAge] = useState(baseProfile.age);
  const [nationality, setNationality] = useState<Nationality>(baseProfile.nationality);
  const [avatar, setAvatar] = useState<ManagerAvatarConfig>(baseProfile.avatar);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadPhoto = async () => {
    if (isTauriRuntime()) {
      const dataUrl = await pickManagerPhotoDialog();
      if (dataUrl) {
        setAvatar((prev) => ({ ...prev, customPhotoDataUrl: dataUrl }));
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleBrowserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar((prev) => ({ ...prev, customPhotoDataUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanFirst = firstName.trim() || 'Coach';
      const cleanLast = lastName.trim() || 'Rossi';
      const updatedProfile: ManagerProfile = {
        ...baseProfile,
        firstName: cleanFirst,
        lastName: cleanLast,
        age,
        nationality,
        avatar,
      };
      const updatedCareer: CareerSave = {
        ...career,
        managerName: `${cleanFirst} ${cleanLast}`,
        managerProfile: updatedProfile,
        savedAt: new Date().toISOString(),
      };
      await saveCareerToSlot(updatedCareer);
      onSaved(updatedCareer);
      onToast('Aspetto e profilo allenatore aggiornati!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl fm-panel rounded-2xl border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}b8 0%, #090d16f5 58%)`,
          }}
        >
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-300">
              {career.slotName}
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">
              Modifica Aspetto &amp; Profilo Allenatore
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Identity Editor + Live Locker Room Preview */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          <div className="lg:col-span-8 p-6 overflow-y-auto space-y-5">
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
          </div>

          <aside className="lg:col-span-4 bg-slate-950/90 border-t lg:border-t-0 lg:border-l border-white/10 p-6 flex flex-col items-center justify-between gap-4">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-400">
              Anteprima Spogliatoio &amp; Profilo
            </div>

            <div className="w-full my-auto space-y-4 flex flex-col items-center">
              {/* Mini Locker Room Preview */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/15 shadow-xl bg-slate-900">
                <img
                  src="/images/main-menu-bg.jpg"
                  alt="Anteprima Spogliatoio"
                  className="absolute inset-0 w-full h-full object-cover object-left"
                />
                <img
                  src={getCoachPreset(avatar.coachPresetId).imagePath}
                  alt="Coach"
                  className="absolute inset-0 w-full h-full object-cover object-left drop-shadow-[0_10px_14px_rgba(0,0,0,0.65)]"
                />
              </div>

              <div className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <ManagerAvatar avatar={avatar} clubColor={primaryColor} size="md" />
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">
                    {firstName || 'Coach'} {lastName || 'Rossi'}
                  </div>
                  <div className="text-xs text-slate-400">{age} anni</div>
                </div>
              </div>
            </div>

            <div className="w-full flex items-center gap-2.5 pt-3 border-t border-white/10">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Salvataggio...' : 'Salva Aspetto'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
