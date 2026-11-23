import {
  ActiveChatModalState,
  CareerSave,
  ChatChannel,
  ChatTone,
  ContractRole,
  FastSimAlert,
  FastSimMatchSummary,
  FiringOfferContext,
  IndividualTrainingDuration,
  IndividualTrainingFocus,
  LbaRosterFormat,
  ManagerProfile,
  MatchState,
  MinutePriority,
  Position,
  RosterSlot,
  SaveSlotMeta,
  SeasonPhase,
  StaffRole,
  Tactics,
  Team,
  TrainingPlan,
} from '../types';
import { TimeoutTacticalPlan } from '../engine/matchSimulator';

export type ScreenMode = 'menu' | 'dashboard' | 'match';

export type DashboardTab =
  | 'office'
  | 'messages'
  | 'roster'
  | 'rotations'
  | 'tactics'
  | 'training'
  | 'staff'
  | 'market'
  | 'free_agents'
  | 'search'
  | 'opponents'
  | 'calendar'
  | 'standings'
  | 'awards'
  | 'finances';

export type FastSimTarget =
  | { type: 'days'; days: number; label: string }
  | { type: 'end_regular'; label: string }
  | { type: 'until_date'; targetDate: string; label: string };

export interface StepDayResult {
  advanced: boolean;
  newDate: string;
  userMatchPlayed?: FastSimMatchSummary;
  alert?: FastSimAlert;
  phaseChangedTo?: SeasonPhase;
}

export interface GameStore {
  screen: ScreenMode;
  activeTab: DashboardTab;
  career: CareerSave | null;
  liveMatch: MatchState | null;
  autoSubUser: boolean;
  saveSlots: SaveSlotMeta[];
  toast: string | null;
  inspectedPlayerId: string | null;
  inspectedTeamId: string | null;
  fastSimTarget: FastSimTarget | null;
  rosterComplianceModalOpen: boolean;
  firingContext: FiringOfferContext | null;
  activeChatModal: ActiveChatModalState | null;

  clearToast: () => void;
  setToast: (msg: string) => void;
  setActiveTab: (tab: DashboardTab) => void;
  setAutoSubUser: (val: boolean) => void;
  openPlayerProfile: (playerId: string) => void;
  closePlayerProfile: () => void;
  openTeamProfile: (teamId: string) => void;
  openRosterComplianceModal: () => void;
  closeRosterComplianceModal: () => void;
  autoFixUserRoster: () => void;
  acceptCoachingJobAfterFiring: (newTeamId: string) => void;
  startRegularSeasonFromOffseason: () => { ok: boolean; error?: string };
  setIgnoreFastSimAlerts: (val: boolean) => void;
  requestFastSim: (target: FastSimTarget) => void;
  clearFastSimTarget: () => void;
  advanceOneDay: (isFastSim?: boolean) => StepDayResult;

  refreshSaveSlots: () => Promise<void>;
  startNewCareer: (
    teamId: string,
    managerInput: string | ManagerProfile,
    slotName: string
  ) => Promise<void>;
  loadCareer: (slotId: string) => Promise<void>;
  loadCareerObject: (career: CareerSave) => void;
  saveCurrentCareer: () => Promise<void>;
  deleteSlot: (slotId: string) => Promise<void>;
  exitToMenu: () => void;

  getUserTeam: () => Team | undefined;
  updatePlayerSlot: (playerId: string, slot: RosterSlot) => void;
  updatePlayerMinutePriority: (playerId: string, priority: MinutePriority) => void;
  togglePlayerMatchdaySquad: (playerId: string) => { ok: boolean; message?: string };
  swapRotationPlayers: (playerIdA: string, playerIdB: string) => void;
  assignPlayerToStarterSlot: (playerId: string, pos: Position) => void;
  moveBenchPlayerOrder: (playerId: string, direction: 'up' | 'down') => void;
  updatePlayerTargetMinutes: (playerId: string, minutes: number) => void;
  autoBalanceMinutes: () => void;
  autoAdjustForInjuries: () => void;
  zeroAllMinutes: () => void;
  callUpYouthItalianPlayer: () => void;
  promoteYouthPlayer: (playerId: string) => void;
  demoteToYouthRoster: (playerId: string) => void;
  updateTactics: (patch: Partial<Tactics>) => void;
  applyAssistantTacticsNow: () => void;
  setDelegateTacticsToAssistant: (enabled: boolean) => void;
  updateTrainingPlan: (patch: Partial<TrainingPlan>) => void;
  updatePlayerIndividualFocus: (playerId: string, focus: IndividualTrainingFocus) => void;
  startPlayerTrainingProgram: (params: {
    playerId: string;
    focus: Exclude<IndividualTrainingFocus, 'Nessuno'>;
    intensity: TrainingPlan['intensity'];
    duration: IndividualTrainingDuration;
    targetPosition?: Position;
  }) => { ok: boolean; message: string };
  cancelPlayerTrainingProgram: (playerId: string) => void;
  openChatModal: (target: ActiveChatModalState) => void;
  closeChatModal: () => void;
  sendChatInteraction: (params: {
    channel: ChatChannel;
    playerId?: string;
    topicId: string;
    tone: ChatTone;
  }) => { ok: boolean; message: string; effects?: string[] };
  hireStaffMember: (staffId: string) => void;
  fireStaffMember: (role: StaffRole) => void;
  cutPlayer: (playerId: string) => { ok: boolean; message: string };
  negotiateFreeAgent: (
    playerId: string,
    offeredSalary: number,
    contractYears: 1 | 2,
    promisedRole: ContractRole
  ) => { accepted: boolean; message: string };
  renewPlayerContract: (
    playerId: string,
    offeredSalary: number,
    contractYears: 1 | 2,
    promisedRole: ContractRole
  ) => { accepted: boolean; message: string };
  buyoutRivalPlayer: (
    fromTeamId: string,
    playerId: string,
    offeredSalary: number,
    contractYears: 1 | 2,
    promisedRole: ContractRole
  ) => { accepted: boolean; message: string };
  requestPlayerLoan: (
    fromTeamId: string,
    playerId: string,
    salarySharePct: number
  ) => { accepted: boolean; message: string };
  startScoutingPlayer: (playerId: string, playerName: string, originLabel: string) => void;
  advanceScoutingDays: (days: number) => void;
  respondToIncomingOffer: (offerId: string, accept: boolean) => void;
  counterIncomingOffer: (
    offerId: string,
    requestedAmount: number
  ) => {
    status: 'accepted' | 'countered' | 'final_offer' | 'withdrawn' | 'error';
    newOfferAmount?: number;
    message: string;
  };
  togglePlayerTransferList: (playerId: string) => void;

  startUserMatch: () => { ok: boolean; error?: string };
  stepLiveMatch: () => void;
  simulateLiveMatchToEnd: () => void;
  userCallTimeout: () => void;
  userApplyTimeoutTactics: (plan: TimeoutTacticalPlan) => void;
  userSubstitute: (outPlayerId: string, inPlayerId: string) => void;
  setUserLbaRosterFormat: (format: LbaRosterFormat) => void;
  completeLiveMatchAndAdvance: () => void;
  startNextSeason: () => Promise<void>;
  dismissRegulationAlert: () => void;
  markMessageRead: (messageId: string) => void;
  markAllMessagesRead: () => void;
  deleteMessage: (messageId: string) => void;
  resolveMessageChoice: (messageId: string, choiceId: string) => void;
  toggleShortlistPlayer: (playerId: string) => void;
  proposePlayerTrade: (
    rivalTeamId: string,
    offeredPlayerId: string,
    requestedPlayerId: string,
    cashAdjustment: number
  ) => { accepted: boolean; message: string };
  upgradeFacility: (facility: 'arenaLevel' | 'youthLevel' | 'medicalLevel') => {
    ok: boolean;
    message: string;
  };
  selectSeasonSponsor: (sponsorName: string, annualBonus: number) => void;
}

export type StoreSet = (
  partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)
) => void;

export type StoreGet = () => GameStore;
