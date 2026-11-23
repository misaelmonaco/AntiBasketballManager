import { create } from 'zustand';
import { CareerSave, ManagerProfile } from '../types';
import { getRoundDate } from '../engine/calendarUtils';
import { createInitialCareerMessages } from '../engine/messagesEngine';
import {
  createDefaultManagerProfile,
  getTeamBoardObjective,
  MANAGER_PHILOSOPHIES,
} from '../engine/managerEngine';
import {
  generateFreeAgents,
  generateInitialNews,
  generateLeagueTeams,
  generateSchedule,
  generateStaffMarket,
} from '../data/generator';
import { autoBalanceRotationMinutes } from '../engine/ratings';
import {
  createInitialCoppaItalia,
  createInitialEuroCompetitions,
} from '../engine/competitionsEngine';
import { migrateCareerSave } from '../engine/saveMigration';
import {
  deleteSaveSlot,
  listSaveSlots,
  loadCareerFromSlot,
  saveCareerToSlot,
} from '../services/saveService';
import {
  DashboardTab,
  FastSimTarget,
  GameStore,
  ScreenMode,
  StepDayResult,
} from './storeTypes';
import { createRosterSlice } from './slices/rosterSlice';
import { createTacticsAndTrainingSlice } from './slices/tacticsAndTrainingSlice';
import { createMarketSlice } from './slices/marketSlice';
import { createLiveMatchSlice } from './slices/liveMatchSlice';
import { createCalendarAdvanceSlice } from './slices/calendarAdvanceSlice';

export type {
  DashboardTab,
  FastSimTarget,
  GameStore,
  ScreenMode,
  StepDayResult,
};

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'menu',
  activeTab: 'office',
  career: null,
  liveMatch: null,
  autoSubUser: true,
  saveSlots: [],
  toast: null,
  inspectedPlayerId: null,
  inspectedTeamId: null,
  fastSimTarget: null,
  rosterComplianceModalOpen: false,
  firingContext: null,
  activeChatModal: null,

  clearToast: () => set({ toast: null }),
  setToast: (msg) => set({ toast: msg }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAutoSubUser: (val) => set({ autoSubUser: val }),
  openPlayerProfile: (playerId) => set({ inspectedPlayerId: playerId }),
  closePlayerProfile: () => set({ inspectedPlayerId: null }),
  openTeamProfile: (teamId) => set({ inspectedTeamId: teamId, activeTab: 'opponents' }),
  openRosterComplianceModal: () => set({ rosterComplianceModalOpen: true }),
  closeRosterComplianceModal: () => set({ rosterComplianceModalOpen: false }),
  setIgnoreFastSimAlerts: (val) => {
    const { career } = get();
    if (!career) return;
    set({ career: { ...career, ignoreFastSimAlerts: val } });
  },
  requestFastSim: (target) => set({ fastSimTarget: target }),
  clearFastSimTarget: () => set({ fastSimTarget: null }),

  refreshSaveSlots: async () => {
    const slots = await listSaveSlots();
    set({ saveSlots: slots });
  },

  startNewCareer: async (teamId, managerInput, slotName) => {
    const profile: ManagerProfile =
      typeof managerInput === 'string'
        ? createDefaultManagerProfile(managerInput)
        : managerInput;
    const philDef = MANAGER_PHILOSOPHIES.find((p) => p.id === profile.philosophy);
    const fullName = `${profile.firstName} ${profile.lastName}`.trim() || 'Coach';

    const teams = generateLeagueTeams().map((t) => ({
      ...t,
      tactics: t.id === teamId && philDef ? { ...philDef.tactics } : t.tactics,
      roster: autoBalanceRotationMinutes(t.roster),
    }));
    const freeAgents = generateFreeAgents(140);
    const staffMarket = generateStaffMarket(4);
    const schedule = generateSchedule(teams);
    const userTeam = teams.find((t) => t.id === teamId) ?? teams[0];
    const news = generateInitialNews(userTeam);
    const startDate = getRoundDate(2026, 1);
    const boardObjective = getTeamBoardObjective(userTeam.prestige);
    const messages = createInitialCareerMessages({
      team: userTeam,
      managerName: fullName,
      boardObjective,
      seasonYear: 2026,
      startDate,
    });

    const slotId = `slot_${Date.now()}`;
    const newCareer: CareerSave = {
      version: 1,
      slotId,
      slotName: slotName.trim() || `${userTeam.shortName} - Carriera`,
      savedAt: new Date().toISOString(),
      managerName: fullName,
      managerProfile: profile,
      allowFiring: profile.allowFiring ?? true,
      boardObjective,
      boardConfidence: 75,
      userTeamId: userTeam.id,
      seasonYear: 2026,
      currentRound: 1,
      currentDate: startDate,
      ignoreFastSimAlerts: false,
      phase: 'regular',
      teams,
      freeAgents,
      staffMarket,
      scoutedPlayerIds: [],
      activeScouting: [],
      incomingOffers: [],
      schedule,
      playoffs: [],
      coppaItalia: createInitialCoppaItalia(2026),
      euroLeagues: createInitialEuroCompetitions(teams),
      news,
      messages,
    };

    let slots = get().saveSlots;
    try {
      await saveCareerToSlot(newCareer);
      slots = await listSaveSlots();
    } catch (err) {
      console.error('Errore durante il salvataggio della nuova carriera:', err);
    }
    set({
      career: newCareer,
      saveSlots: slots,
      screen: 'dashboard',
      activeTab: 'office',
      inspectedTeamId: null,
      firingContext: null,
      activeChatModal: null,
      toast: `Benvenuto alla guida di ${userTeam.name}!`,
    });
  },

  loadCareer: async (slotId) => {
    const loaded = await loadCareerFromSlot(slotId);
    if (!loaded) {
      set({ toast: 'Impossibile caricare il salvataggio selezionato.' });
      return;
    }
    const migrated = migrateCareerSave(loaded);
    set({
      career: migrated,
      screen: 'dashboard',
      activeTab: 'office',
      inspectedTeamId: null,
      firingContext: null,
      activeChatModal: null,
      toast: `Carriera "${migrated.slotName}" caricata.`,
    });
  },

  loadCareerObject: (loaded) => {
    const migrated = migrateCareerSave(loaded);
    set({
      career: migrated,
      screen: 'dashboard',
      activeTab: 'office',
      inspectedTeamId: null,
      firingContext: null,
      activeChatModal: null,
      toast: `Salvataggio "${migrated.slotName}" importato con successo.`,
    });
  },

  saveCurrentCareer: async () => {
    const { career } = get();
    if (!career) return;
    await saveCareerToSlot(career);
    const slots = await listSaveSlots();
    set({ saveSlots: slots, toast: 'Partita salvata su disco (.json).' });
  },

  deleteSlot: async (slotId) => {
    await deleteSaveSlot(slotId);
    const slots = await listSaveSlots();
    set({ saveSlots: slots, toast: 'Salvataggio eliminato.' });
  },

  exitToMenu: () =>
    set({
      screen: 'menu',
      liveMatch: null,
      inspectedTeamId: null,
      firingContext: null,
      activeChatModal: null,
    }),

  ...createRosterSlice(set, get),
  ...createTacticsAndTrainingSlice(set, get),
  ...createMarketSlice(set, get),
  ...createLiveMatchSlice(set, get),
  ...createCalendarAdvanceSlice(set, get),
}));
