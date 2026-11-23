import React, { useEffect, useMemo, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  Play,
  FolderOpen,
  Power,
  Trash2,
  FileUp,
  ArrowLeft,
  SlidersHorizontal,
  ChevronRight,
  Trophy,
  Database,
  UserCog,
} from 'lucide-react';
import {
  importCareerFromFileDialog,
  isTauriRuntime,
  loadCareerFromSlot,
} from '../services/saveService';
import { useGameStore } from '../store/gameStore';
import { CareerSave } from '../types';
import { DEFAULT_AVATAR, getCoachPreset } from '../engine/managerEngine';
import { computeStandings } from '../engine/seasonEngine';
import { LEAGUES } from '../data/teams';
import { CareerWizard } from './CareerWizard';
import { DatabaseEditor } from './DatabaseEditor';
import { ClubBadge } from './ClubBadge';
import { ManagerAppearanceModal } from './ManagerAppearanceModal';

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMins < 2) return 'ADESSO';
  if (diffMins < 60) return `${diffMins} MIN FA`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return diffHours === 1 ? '1 ORA FA' : `${diffHours} ORE FA`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'IERI';
  if (diffDays < 7) return `${diffDays} GIORNI FA`;
  const diffWeeks = Math.floor(diffDays / 7);
  return diffWeeks === 1 ? '1 SETTIMANA FA' : `${diffWeeks} SETTIMANE FA`;
}

export const MainMenu: React.FC = () => {
  const {
    saveSlots,
    refreshSaveSlots,
    startNewCareer,
    loadCareer,
    loadCareerObject,
    deleteSlot,
    setToast,
  } = useGameStore();

  const [mode, setMode] = useState<'home' | 'new' | 'load' | 'editor'>('home');
  const [latestCareer, setLatestCareer] = useState<CareerSave | null>(null);
  const [appearanceModalOpen, setAppearanceModalOpen] = useState(false);

  useEffect(() => {
    refreshSaveSlots();
  }, [refreshSaveSlots]);

  const latestSlot = saveSlots[0] ?? null;

  useEffect(() => {
    let active = true;
    if (!latestSlot) {
      setLatestCareer(null);
      return;
    }
    loadCareerFromSlot(latestSlot.slotId)
      .then((loaded) => {
        if (active) setLatestCareer(loaded);
      })
      .catch(() => {
        if (active) setLatestCareer(null);
      });
    return () => {
      active = false;
    };
  }, [latestSlot?.slotId, latestSlot?.savedAt]);

  const handleExit = async () => {
    if (isTauriRuntime()) {
      await getCurrentWindow().close();
    } else {
      setToast('In modalità desktop Tauri questo pulsante chiude la finestra.');
    }
  };

  const handleImportJson = async () => {
    try {
      const imported = await importCareerFromFileDialog();
      if (imported) {
        loadCareerObject(imported);
      }
    } catch {
      setToast('File di salvataggio non valido.');
    }
  };

  const recentContext = useMemo(() => {
    if (!latestCareer || !latestSlot) {
      return {
        teamName: 'Basket Manager Italia',
        shortName: 'BMI',
        primaryColor: '#ea580c',
        secondaryColor: '#ffffff',
        managerName: 'Coach Italia',
        avatar: DEFAULT_AVATAR,
        rankLabel: null as string | null,
        leagueName: '5 Leghe Italiane',
      };
    }

    const userTeam = latestCareer.teams.find((t) => t.id === latestCareer.userTeamId);
    const primaryColor = userTeam?.primaryColor ?? '#ea580c';
    const secondaryColor = userTeam?.secondaryColor ?? '#ffffff';
    const shortName = userTeam?.shortName ?? 'BMI';
    const teamName = userTeam?.name ?? latestSlot.teamName;
    const leagueId = userTeam?.leagueId ?? 'ITA_LBA';
    const leagueName = LEAGUES.find((l) => l.id === leagueId)?.name ?? 'Serie A LBA';

    let rankLabel: string | null = null;
    if (userTeam) {
      const leagueTeams = latestCareer.teams.filter((t) => t.leagueId === leagueId);
      const standings = computeStandings(leagueTeams, latestCareer.schedule);
      const idx = standings.findIndex((r) => r.teamId === userTeam.id);
      if (idx !== -1) rankLabel = `${idx + 1}°`;
    }

    return {
      teamName,
      shortName,
      primaryColor,
      secondaryColor,
      managerName: latestCareer.managerName,
      avatar: latestCareer.managerProfile?.avatar ?? DEFAULT_AVATAR,
      rankLabel,
      leagueName,
    };
  }, [latestCareer, latestSlot]);

  if (mode === 'home') {
    return (
      <div className="flex-1 relative overflow-hidden bg-slate-950 flex">
        {/* Custom Locker Room Background Image */}
        <img
          src="/images/main-menu-bg.jpg"
          alt="Spogliatoio Basket Manager Italia"
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover object-left"
        />
        {/* Selected Coach Full-Body Cutout aligned on locker room floor */}
        <img
          src={getCoachPreset(recentContext.avatar.coachPresetId).imagePath}
          alt={recentContext.managerName}
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover object-left drop-shadow-[0_14px_18px_rgba(0,0,0,0.65)] transition-all duration-300"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/30" />

        {/* Top-Left Subtle Branding Badge */}
        <div className="relative z-10 p-6 hidden md:flex flex-col justify-between pointer-events-none">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950/75 border border-white/10 backdrop-blur-md shadow-xl">
            <Trophy className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-black tracking-wider uppercase text-white">
              AntiBM
            </span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
              27
            </span>
          </div>

          <div className="text-[11px] text-slate-400/80 font-mono">
            v0.1.0 • 5 Leghe • 86 Club • EuroLega &amp; Coppa Italia
          </div>
        </div>

        {/* Right Diagonal FM20-Style Sidebar */}
        <div className="ml-auto relative z-20 w-full sm:w-[470px] lg:w-[540px] h-full flex flex-col justify-center">
          {/* Translucent Diagonal Club-Colored Backdrop */}
          <div
            className="hidden sm:block absolute inset-0 shadow-2xl"
            style={{
              clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)',
              background: `linear-gradient(155deg, ${recentContext.primaryColor}e0 0%, #111827f2 55%, #060911fa 100%)`,
            }}
          />
          <div
            className="hidden sm:block absolute inset-y-0 left-0 w-full pointer-events-none opacity-35"
            style={{
              clipPath: 'polygon(18% 0, 19.2% 0, 1.2% 100%, 0% 100%)',
              backgroundColor: recentContext.secondaryColor,
            }}
          />
          {/* Mobile solid fallback */}
          <div
            className="sm:hidden absolute inset-0"
            style={{
              background: `linear-gradient(165deg, ${recentContext.primaryColor}d9 0%, #090d16f7 60%)`,
            }}
          />

          {/* Sidebar Inner Content */}
          <div className="relative z-10 px-7 sm:pl-24 sm:pr-10 py-8 flex flex-col justify-between h-full max-h-[820px]">
            {/* Top Logo */}
            <div className="text-right">
              <div className="inline-block text-right">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/75">
                  Edizione Italiana
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-none mt-0.5">
                  Basket <span className="text-orange-400">Manager</span>
                </h1>
              </div>
            </div>

            {/* Middle: Floating "Più Recenti" Card + Main Menu Stack */}
            <div className="space-y-6 my-auto py-4">
              {/* Most Recent Career Quick-Load Card */}
              {latestSlot ? (
                <div className="space-y-2 sm:-ml-10">
                  <button
                    onClick={() => loadCareer(latestSlot.slotId)}
                    className="group w-full text-left p-4 rounded-2xl bg-slate-950/85 hover:bg-slate-900/95 border border-white/15 hover:border-orange-400/60 backdrop-blur-md shadow-2xl transition-all cursor-pointer flex items-center gap-3.5"
                  >
                    <ClubBadge
                      shortName={recentContext.shortName}
                      primaryColor={recentContext.primaryColor}
                      secondaryColor={recentContext.secondaryColor}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-orange-300">
                        Più recenti • {formatRelativeTime(latestSlot.savedAt)}
                      </div>
                      <div className="text-sm font-black text-white truncate mt-0.5 group-hover:text-orange-200 transition-colors">
                        Carica &apos;{latestSlot.managerName} - {latestSlot.teamName}&apos;
                      </div>
                      <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                        {recentContext.rankLabel && (
                          <span className="font-black text-white">{recentContext.rankLabel}</span>
                        )}
                        <span>{recentContext.leagueName}</span>
                        <span>•</span>
                        <span>
                          {latestSlot.phase === 'offseason'
                            ? 'Offseason / Mercato'
                            : latestSlot.phase === 'regular'
                            ? `Giornata ${latestSlot.currentRound}`
                            : latestSlot.phase === 'playoffs'
                            ? 'Playoff'
                            : 'Fine Stagione'}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-orange-500 group-hover:bg-orange-400 text-slate-950 flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </button>

                  {latestCareer && (
                    <button
                      onClick={() => setAppearanceModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/75 hover:bg-slate-900 border border-white/10 hover:border-white/25 text-xs font-bold text-slate-200 hover:text-white backdrop-blur-md transition-all cursor-pointer"
                    >
                      <UserCog className="w-3.5 h-3.5 text-orange-400" />
                      Modifica l&apos;aspetto dell&apos;allenatore
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full sm:-ml-10 p-4 rounded-2xl bg-slate-950/75 border border-white/10 backdrop-blur-md text-xs text-slate-300">
                  Nessuna carriera recente trovata. Avvia una nuova panchina qui sotto.
                </div>
              )}

              {/* Primary Menu Actions */}
              <div className="space-y-3.5">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/60">
                  Inizia una nuova partita
                </div>

                <button
                  onClick={() => setMode('new')}
                  className="group w-full text-left py-1.5 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white group-hover:text-orange-300 transition-colors">
                      Nuova Carriera
                    </div>
                    <div className="text-xs text-white/70">
                      Scegli una squadra tra 5 leghe e inizia la tua storia
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-orange-300 group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                <button
                  onClick={() => setMode('load')}
                  className="group w-full text-left py-1.5 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white group-hover:text-sky-300 transition-colors">
                      Carica Partita
                    </div>
                    <div className="text-xs text-white/70">
                      {saveSlots.length > 0
                        ? `${saveSlots.length} salvataggi locali disponibili`
                        : 'Apri salvataggi locali o importa .json'}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-sky-300 group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                <button
                  onClick={() => setMode('editor')}
                  className="group w-full text-left py-1.5 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                      Editor Database
                    </div>
                    <div className="text-xs text-white/70">
                      Modifica club, giocatori e importa file CSV / JSON
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              </div>

              {/* Compact Secondary Links (FM20 style 2-column grid) */}
              <div className="pt-4 border-t border-white/15 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-bold text-white/80">
                <button
                  onClick={() => setMode('load')}
                  className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>Gestisci Slot</span>
                </button>

                <button
                  onClick={() => setMode('editor')}
                  className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>Importa CSV/JSON</span>
                </button>

                {isTauriRuntime() ? (
                  <button
                    onClick={handleImportJson}
                    className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <FileUp className="w-3.5 h-3.5 text-orange-300 shrink-0" />
                    <span>Sfoglia Salvataggio</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setMode('new')}
                    className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-orange-300 shrink-0" />
                    <span>Crea Profilo Coach</span>
                  </button>
                )}

                <button
                  onClick={handleExit}
                  className="flex items-center gap-2 hover:text-red-300 transition-colors cursor-pointer text-left"
                >
                  <Power className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>Esci</span>
                </button>
              </div>
            </div>

            {/* Bottom Info Pill */}
            <div className="p-3.5 rounded-xl bg-black/35 border border-white/10 backdrop-blur-sm flex items-center justify-between gap-3 text-[11px]">
              <div className="text-white/80">
                <strong className="text-orange-300">Regole Federali:</strong> 6+6 LBA • 10+2 A2 • 11+1 Serie B
              </div>
              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-extrabold shrink-0">
                86 CLUB
              </span>
            </div>
          </div>
        </div>

        {appearanceModalOpen && latestCareer && (
          <ManagerAppearanceModal
            career={latestCareer}
            primaryColor={recentContext.primaryColor}
            secondaryColor={recentContext.secondaryColor}
            onClose={() => setAppearanceModalOpen(false)}
            onSaved={(updated) => {
              setLatestCareer(updated);
              refreshSaveSlots();
              setAppearanceModalOpen(false);
            }}
            onToast={setToast}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 tactical-grid-bg flex items-center justify-center p-6 overflow-y-auto relative">
      {mode === 'new' && (
        <CareerWizard
          onCancel={() => setMode('home')}
          onComplete={async (teamId, profile, slot) => {
            await startNewCareer(teamId, profile, slot);
          }}
        />
      )}

      {mode === 'editor' && (
        <DatabaseEditor onClose={() => setMode('home')} onToast={setToast} />
      )}

      {mode === 'load' && (
        <div className="w-full max-w-2xl fm-panel rounded-3xl p-6 relative z-10">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('home')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-extrabold text-white">Carica Salvataggio Locale</h2>
                <p className="text-xs text-slate-400">File .json salvati nella cartella locale</p>
              </div>
            </div>

            {isTauriRuntime() && (
              <button
                onClick={handleImportJson}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-orange-400 border border-slate-700 cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                Sfoglia .json
              </button>
            )}
          </div>

          {saveSlots.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Nessun salvataggio trovato. Avvia una Nuova Carriera per creare il primo slot.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {saveSlots.map((slot) => (
                <div
                  key={slot.slotId}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-orange-500/40 transition-colors"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{slot.slotName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      <span className="text-orange-300 font-semibold">{slot.teamName}</span> •{' '}
                      {slot.managerName} •{' '}
                      {slot.phase === 'offseason'
                        ? 'Offseason / Mercato'
                        : slot.phase === 'regular'
                        ? `Giornata ${slot.currentRound}`
                        : slot.phase === 'playoffs'
                        ? 'Playoff'
                        : 'Fine Stagione'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Salvato il {new Date(slot.savedAt).toLocaleString('it-IT')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadCareer(slot.slotId)}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold text-xs cursor-pointer"
                    >
                      Carica
                    </button>
                    <button
                      onClick={() => deleteSlot(slot.slotId)}
                      title="Elimina salvataggio"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
