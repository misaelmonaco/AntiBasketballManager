export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export type Nationality =
  | 'ITA'
  | 'USA'
  | 'SRB'
  | 'ESP'
  | 'LTU'
  | 'FRA'
  | 'GER'
  | 'ARG'
  | 'GRE'
  | 'SLO'
  | 'CRO'
  | 'LAT';

export type MinutePriority = 'Alta' | 'Media' | 'Bassa';

export type RosterSlot = 'starter' | 'bench' | 'reserve';

export type ContractRole =
  | 'Stella della squadra'
  | 'Titolare fisso'
  | 'Sesto uomo'
  | 'Giocatore di rotazione';

export interface ScoutingAssignment {
  playerId: string;
  playerName: string;
  originLabel: string;
  daysRemaining: number;
  totalDays: number;
}

export interface TransferOffer {
  id: string;
  fromTeamId: string;
  fromTeamName: string;
  playerId: string;
  playerName: string;
  buyoutAmount: number;
  round: number;
  reason?: string;
  initialBuyoutAmount?: number;
  negotiationRounds?: number;
  maxWillingAmount?: number;
  lastClubResponse?: string;
  isFinalOffer?: boolean;
}

export type PlayerPersonality =
  | 'Leader'
  | 'Professionista'
  | 'Egocentrico'
  | 'Giovane ambizioso';

export type StaffRole = 'assistant_coach' | 'fitness_coach' | 'scout_director';

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  rating: number; // 50..99
  salary: number; // annuale in €
  specialty: string;
}

export type TrainingFocus =
  | 'Tiro e Spaziature'
  | 'Difesa di Squadra'
  | 'Condizione Fisica'
  | 'Tattica Pre-Partita'
  | 'Scarico / Riposo';

export type TrainingIntensity = 'Leggera' | 'Moderata' | 'Intensa';

export interface TrainingPlan {
  focus: TrainingFocus;
  intensity: TrainingIntensity;
}

export interface PlayerAttributes {
  // Attacco
  threePoint: number;
  twoPoint: number;
  freeThrow: number;
  passing: number;
  ballHandling: number;
  finishing: number;
  // Difesa
  perimeterDef: number;
  postDef: number;
  blocks: number;
  steals: number;
  // Fisico / Mentale
  athleticism: number;
  rebounding: number;
  stamina: number;
  basketballIQ: number;
}

export interface PlayerSeasonStats {
  gamesPlayed: number;
  gamesStarted: number;
  minutes: number;
  points: number;
  rebounds: number;
  oreb: number;
  dreb: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  pir: number;
}

export interface PlayerGameLogEntry {
  gameId: string;
  round: number;
  opponentShort: string;
  isHome: boolean;
  teamScore: number;
  oppScore: number;
  won: boolean;
  starter: boolean;
  minutes: number;
  points: number;
  rebounds: number;
  oreb: number;
  dreb: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  pir: number;
}

export interface CareerHistoryEntry {
  seasonLabel: string;
  teamName: string;
  league: string;
  gamesPlayed: number;
  gamesStarted?: number;
  ppg: number;
  rpg: number;
  apg: number;
  pir: number;
  minutes?: number;
  points?: number;
  rebounds?: number;
  oreb?: number;
  dreb?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fgm?: number;
  fga?: number;
  tpm?: number;
  tpa?: number;
  ftm?: number;
  fta?: number;
  pirTotal?: number;
}

export type IndividualTrainingFocus =
  | 'Nessuno'
  | 'Tiro da 3'
  | 'Tiro da 2 & Finalizzazione'
  | 'Difesa & Rimbalzi'
  | 'Palleggio & Passaggio'
  | 'Atletismo & Resistenza'
  | 'Nuovo Ruolo';

export type IndividualTrainingDuration = '1_week' | '2_weeks' | '1_month';

export interface IndividualTrainingProgram {
  focus: Exclude<IndividualTrainingFocus, 'Nessuno'>;
  intensity: TrainingIntensity;
  duration: IndividualTrainingDuration;
  totalDays: number;
  daysCompleted: number;
  startedAt: string;
  targetPosition?: Position;
  accumulatedWork: number;
}

export type OffensivePlayId =
  | 'pick_and_roll_centrale'
  | 'horns'
  | 'spain_pnr'
  | 'floppy'
  | 'drive_kick_3pt'
  | 'high_low'
  | 'transizione';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  age: number;
  birthDate: string;
  heightCm: number;
  weightKg: number;
  nationality: Nationality;
  /** True se di formazione italiana (regola 6+6 LBA) */
  isItalianFormation: boolean;
  primaryPosition: Position;
  secondaryPosition: Position | null;
  /** Stipendio annuo in Euro */
  salary: number;
  /** Durata residua contratto (1 o 2 anni) */
  contractYears: 1 | 2;
  /** Condizione fisica 0-100 */
  condition: number;
  /** Morale individuale 1-100 */
  morale: number;
  personality: PlayerPersonality;
  /** Propensione agli infortuni 1-100 */
  injuryProneness: number;
  /** Ruolo garantito nel contratto */
  promisedRole?: ContractRole;
  /** Clausola di buyout per uscita anticipata */
  buyoutClause?: number;
  /** True se il giocatore è stato messo sul mercato (lista trasferimenti) */
  onTransferList?: boolean;
  /** Focus di allenamento individuale settimanale */
  individualFocus?: IndividualTrainingFocus;
  /** Programma individuale strutturato (durata x intensità o apprendimento ruolo) */
  trainingProgram?: IndividualTrainingProgram | null;
  /** ID club proprietario se il giocatore è in prestito */
  loanedFromTeamId?: string;
  /** Nome club proprietario se il giocatore è in prestito */
  loanedFromTeamName?: string;
  /** Stipendio originale presso il club proprietario (ripristinato al rientro) */
  loanOriginalSalary?: number;
  /** Settimane di infortunio residue (0 = sano) */
  injuryWeeks: number;
  injuryDescription?: string;
  attributes: PlayerAttributes;
  overall: number;
  rosterSlot: RosterSlot;
  /** Posizione specifica assegnata nel quintetto titolare (PG, SG, SF, PF, C) */
  starterSlot?: Position;
  minutePriority: MinutePriority;
  /** Minuti target per partita (0-40, totale squadra = 200) */
  targetMinutes?: number;
  /** Ordine di rotazione in panchina (0 = 6° uomo .. 6 = 12° uomo) */
  benchOrder?: number;
  seasonStats: PlayerSeasonStats;
  gameLog: PlayerGameLogEntry[];
  careerHistory: CareerHistoryEntry[];
}

export type PaceType =
  | 'Controllo'
  | 'Lento'
  | 'Bilanciato'
  | 'Ritmo Alto'
  | 'Run & Gun';
export type OffensiveFocus =
  | 'Tiro da 3'
  | 'Gioco interno'
  | 'Pick & Roll'
  | 'Motion'
  | 'Isolamento'
  | 'Transizione';
export type DefenseType =
  | 'Uomo'
  | 'Cambio Sistematico'
  | 'Zona 2-3'
  | 'Zona 3-2'
  | 'Zona 1-3-1'
  | 'Box-and-One'
  | 'Pressing';
export type LbaRosterFormat = '6+6' | '5+5';
export type OffensiveAggression =
  | 'Normale'
  | 'Attacca il ferro'
  | 'Tiro rapido'
  | 'Gestione cronometro';

export type ReboundPolicy =
  | 'Aggredisci Rimbalzo'
  | 'Equilibrato'
  | 'Rientro Difensivo';

export type PickAndRollCoverage =
  | 'Drop'
  | 'Hedge & Recover'
  | 'Switch'
  | 'Trap';

export type DefensiveIntensity = 'Conservativa' | 'Standard' | 'Fisica';

export type OpponentDefensiveFocus =
  | 'Equilibrata'
  | 'Raddoppia Stella'
  | 'Chiudi Arco 3PT'
  | 'Proteggi Area'
  | 'Ferma Transizione'
  | 'Attacca i Lunghi';

export type OpponentPlayerRule =
  | 'Standard'
  | 'Nega Ricezione'
  | 'Raddoppia'
  | 'Passa Sotto (3PT)'
  | 'Caccia Mismatch';

export interface OpponentPlayerInstruction {
  defenderId?: string;
  rule: OpponentPlayerRule;
}

export interface OpponentGamePlan {
  opponentTeamId: string;
  playerInstructions: Record<string, OpponentPlayerInstruction>;
}

export interface PlayPoint {
  x: number; // 50..100 nella metà campo offensiva d'attacco a destra
  y: number; // 0..100 altezza campo
}

export type PlayPassStyle = 'diretto' | 'scarico' | 'schiacciato' | 'handoff' | 'lob';

export type PlayScreenType = 'on_ball' | 'off_ball' | 'back_screen';

export type PlayShotStyle = 'auto' | 'catch_and_shoot' | 'pull_up' | 'drive_rim' | 'post_up';

export interface PlayPassAction {
  from: Position;
  to: Position;
  style?: PlayPassStyle;
  stepIndex?: number; // 1-based step index (1..steps.length-1)
}

export interface PlayScreenAction {
  screener: Position;
  target?: Position;
  type: PlayScreenType;
  phase: 'mid' | 'end';
  stepIndex?: number; // 1-based step index (1..steps.length-1)
}

export interface CustomPlayStep {
  id: string;
  label?: string;
  positions: Record<Position, PlayPoint>;
}

export interface CustomPlay {
  id: string;
  name: string;
  active: boolean;
  initialBallHandler: Position;
  positions: {
    start: Record<Position, PlayPoint>;
    mid: Record<Position, PlayPoint>;
    end: Record<Position, PlayPoint>;
  };
  steps?: CustomPlayStep[];
  screeners: Position[];
  screens?: PlayScreenAction[];
  passPhase1?: PlayPassAction | null;
  passPhase2?: PlayPassAction | null;
  passes?: PlayPassAction[];
  shooterRole: Position;
  shotStyle?: PlayShotStyle;
}

export interface TacticsPreset {
  id: string;
  name: string;
  tactics: Omit<Tactics, 'presets' | 'opponentGamePlan' | 'delegateToAssistant'>;
}

export interface Tactics {
  pace: PaceType;
  offensiveFocus: OffensiveFocus;
  defense: DefenseType;
  offensiveAggression?: OffensiveAggression;
  reboundPolicy?: ReboundPolicy;
  pnrCoverage?: PickAndRollCoverage;
  defensiveIntensity?: DefensiveIntensity;
  opponentFocus?: OpponentDefensiveFocus;
  goToPlayerId?: string | null;
  secondaryOptionPlayerId?: string | null;
  playbook?: OffensivePlayId[];
  customPlays?: CustomPlay[];
  opponentGamePlan?: OpponentGamePlan;
  presets?: TacticsPreset[];
  delegateToAssistant?: boolean;
}

export interface ClubFacilities {
  arenaLevel: number; // 1..5
  youthLevel: number; // 1..5
  medicalLevel: number; // 1..5
  sponsorName?: string;
  sponsorAnnualBonus?: number;
}

export interface SeasonAwardRecord {
  seasonLabel: string;
  leagueName: string;
  championTeamName: string;
  mvpName: string;
  bestYoungName: string;
  sixthManName: string;
  coachOfTheYearName: string;
}

export type LeagueId =
  | 'ITA_LBA'
  | 'ITA_A2'
  | 'ITA_B'
  | 'ITA_B2'
  | 'ITA_B_INT';

export type EuropeanCupId = 'EL' | 'EC';

export interface LeagueConfig {
  id: LeagueId;
  name: string;
  shortName: string;
  tier: string;
  avgOverall: number;
  teamsCount: number;
  totalRounds: number;
  playoffStartRank?: number;
  playoffTeams: number;
  directPromotionSpots?: number;
  relegationSpots: number;
  promotionSpots: number;
}

export interface CupMatch {
  id: string;
  stage: 'Quarti' | 'Semifinali' | 'Finale';
  homeTeamId: string;
  homeTeamName: string;
  homeShort: string;
  awayTeamId: string;
  awayTeamName: string;
  awayShort: string;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  winnerId?: string;
}

export interface CoppaItaliaState {
  seasonYear: number;
  started: boolean;
  finished: boolean;
  matches: CupMatch[];
  winnerId?: string;
  winnerName?: string;
}

export interface EuroStandingRow {
  teamId: string;
  teamName: string;
  shortName: string;
  country: string;
  isItalian: boolean;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  rating: number;
}

export interface EuroCompetitionState {
  id: EuropeanCupId;
  name: string;
  roundsPlayed: number;
  totalRounds: number;
  standings: EuroStandingRow[];
  championName?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  city: string;
  arena: string;
  arenaCapacity: number;
  primaryColor: string;
  secondaryColor: string;
  leagueId?: LeagueId;
  lbaRosterFormat?: LbaRosterFormat;
  euroCup?: EuropeanCupId;
  /** Budget monte ingaggi annuale in Euro */
  budget: number;
  prestige: number;
  facilities?: ClubFacilities;
  tactics: Tactics;
  roster: Player[];
  youthRoster?: Player[];
  staff: Record<StaffRole, StaffMember | null>;
  training: TrainingPlan;
  /** Chimica di spogliatoio 0-100 */
  chemistry: number;
}

export interface StandingRow {
  teamId: string;
  teamName: string;
  shortName: string;
  primaryColor: string;
  played: number;
  wins: number;
  losses: number;
  leaguePoints: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: number;
}

export interface CompactPlayerBoxScore {
  playerId: string;
  name: string;
  position: Position;
  isStarter: boolean;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  pir: number;
}

export interface CompactScoringPlay {
  q: number;
  clock: number;
  side: 'home' | 'away';
  pts: 1 | 2 | 3;
  scorer: string;
  hs: number;
  as: number;
}

export interface GameSummaryBox {
  homeTopScorer: { name: string; points: number };
  awayTopScorer: { name: string; points: number };
  homeQuarterScores?: number[];
  awayQuarterScores?: number[];
  homePlayers?: CompactPlayerBoxScore[];
  awayPlayers?: CompactPlayerBoxScore[];
  scoringPlays?: CompactScoringPlay[];
}

export interface ScheduledGame {
  id: string;
  leagueId?: LeagueId;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  summary?: GameSummaryBox;
}

export type PlayoffStage = 'Quarti' | 'Semifinali' | 'Finale';

export interface PlayoffSeries {
  id: string;
  stage: PlayoffStage;
  bestOf: number;
  higherSeedId: string;
  lowerSeedId: string;
  higherSeedWins: number;
  lowerSeedWins: number;
  winnerId?: string;
  games: {
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
  }[];
}

export type NewsCategory = 'Mercato' | 'Risultati' | 'Lega' | 'Infortunio';

export interface NewsItem {
  id: string;
  round: number;
  category: NewsCategory;
  title: string;
  body: string;
}

export type CourtActionType =
  | 'pass'
  | 'pick_and_roll'
  | 'drive'
  | 'three_shot'
  | 'two_shot'
  | 'post_up'
  | 'fastbreak'
  | 'steal'
  | 'turnover'
  | 'freethrow'
  | 'timeout';

export interface CourtVisualState {
  possessionTeamId: string;
  attackSide: 'home' | 'away';
  actionType: CourtActionType;
  ballX: number; // 0..100 (normalized court width)
  ballY: number; // 0..100 (normalized court height)
  shooterId?: string;
  passerId?: string;
  made?: boolean;
  blocked?: boolean;
  customPlayId?: string;
}

export interface PlayByPlayEvent {
  id: string;
  quarter: number;
  clockRemaining: number;
  teamId: string;
  type:
    | 'score2'
    | 'score3'
    | 'miss'
    | 'freethrow'
    | 'turnover'
    | 'steal'
    | 'block'
    | 'rebound'
    | 'foul'
    | 'timeout'
    | 'sub'
    | 'period';
  text: string;
  homeScore: number;
  awayScore: number;
  scorerId?: string;
  scorerName?: string;
  pointsScored?: 1 | 2 | 3;
  assistName?: string;
}

export interface PlayerBoxScore {
  playerId: string;
  name: string;
  position: Position;
  isItalianFormation: boolean;
  isStarter: boolean;
  onCourt: boolean;
  targetMinutes?: number;
  benchOrder?: number;
  secondsPlayed: number;
  points: number;
  rebounds: number;
  oreb: number;
  dreb: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fouledOut: boolean;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  pir: number;
  stamina: number;
}

export interface MatchTeamState {
  teamId: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  tactics: Tactics;
  score: number;
  quarterScores: number[];
  teamFoulsThisQuarter: number;
  timeoutsRemaining: number;
  momentum: number; // -10..+10
  goToPlayerId?: string | null;
  secondaryOptionPlayerId?: string | null;
  defensiveFocusPlayerId?: string | null;
  defensiveMatchups?: Record<string, string>;
  opponentPlayerRules?: Record<string, OpponentPlayerRule>;
  nextAtoPlayId?: string | null;
  players: PlayerBoxScore[];
}

export interface MatchState {
  gameId: string;
  round: number;
  isPlayoff: boolean;
  playoffSeriesId?: string;
  quarter: number; // 1..4, 5+ for OT
  clockRemaining: number; // seconds in current quarter (600 -> 0, 300 for OT)
  possession: 'home' | 'away';
  possessionCount: number;
  finished: boolean;
  home: MatchTeamState;
  away: MatchTeamState;
  playByPlay: PlayByPlayEvent[];
  visual: CourtVisualState;
}

export type SeasonPhase = 'offseason' | 'regular' | 'playoffs' | 'finished';

export type ManagerBackground = 'euroleague_star' | 'serie_a_pro' | 'youth_grinder';
export type ManagerPhilosophy =
  | 'balkan_sergeant'
  | 'pace_and_space'
  | 'pick_and_roll_master'
  | 'player_motivator';

export type ManagerHairStyle = 'short' | 'classic' | 'curly' | 'receding' | 'bald';
export type ManagerBeardStyle = 'none' | 'stubble' | 'full' | 'mustache';
export type ManagerOutfit = 'suit' | 'blazer' | 'polo';

export interface ManagerAvatarConfig {
  skinTone: string;
  hairStyle: ManagerHairStyle;
  hairColor: string;
  beardStyle: ManagerBeardStyle;
  glasses: boolean;
  outfit: ManagerOutfit;
  customPhotoDataUrl?: string;
  coachPresetId?: string;
}

export interface ManagerAttributes {
  offenseSpacing: number; // 1-20
  defenseOrg: number; // 1-20
  lockerRoom: number; // 1-20
  youthDev: number; // 1-20
  liveTactics: number; // 1-20
  scoutingMarket: number; // 1-20
}

export interface ManagerProfile {
  firstName: string;
  lastName: string;
  age: number;
  nationality: Nationality;
  avatar: ManagerAvatarConfig;
  background: ManagerBackground;
  philosophy: ManagerPhilosophy;
  reputation: number; // 0-100
  attributes: ManagerAttributes;
  allowFiring?: boolean;
}

export type BoardObjective =
  | 'Vincere lo Scudetto'
  | 'Semifinale Playoff'
  | 'Qualificazione Playoff'
  | 'Salvezza tranquilla';

export type FastSimAlertReason =
  | 'injury'
  | 'rule_6_6'
  | 'buyout_offer'
  | 'morale_warning'
  | 'coach_fired'
  | 'playoffs_start'
  | 'season_finished';

export interface FastSimAlert {
  reason: FastSimAlertReason;
  title: string;
  message: string;
  date: string;
}

export interface FastSimMatchSummary {
  date: string;
  roundLabel: string;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  userWon: boolean;
  userIsHome: boolean;
}

export interface FiringOfferContext {
  oldClubId: string;
  oldClubName: string;
  oldLeagueId: LeagueId;
  finalConfidence: number;
  dateStr: string;
  round: number;
  recommendedTeamIds: string[];
}

export type InboxMessageCategory =
  | 'dirigenza'
  | 'vice'
  | 'staff'
  | 'mercato'
  | 'lega';

export interface InboxMessageChoice {
  id: string;
  label: string;
  effectHint: string;
}

export interface InboxMessage {
  id: string;
  category: InboxMessageCategory;
  senderName: string;
  senderRole: string;
  subject: string;
  body: string;
  date: string;
  round: number;
  read: boolean;
  urgent?: boolean;
  actionTab?:
    | 'office'
    | 'roster'
    | 'rotations'
    | 'tactics'
    | 'training'
    | 'staff'
    | 'market'
    | 'calendar'
    | 'finances';
  actionLabel?: string;
  openRosterModal?: boolean;
  playerId?: string;
  jobOfferTeamId?: string;
  choices?: InboxMessageChoice[];
  resolvedChoiceId?: string;
  resolutionNote?: string;
}

export type ChatChannel = 'player' | 'board' | 'media';
export type ChatTone = 'encouraging' | 'demanding' | 'diplomatic';

export interface ChatMessageBubble {
  id: string;
  sender: 'coach' | 'npc' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  effects?: string[];
}

export interface ChatThreadLog {
  channelKey: string;
  lastInteractionDate: string;
  messages: ChatMessageBubble[];
}

export interface ActiveChatModalState {
  channel: ChatChannel;
  playerId?: string;
}

export interface CareerSave {
  version: number;
  slotId: string;
  slotName: string;
  savedAt: string;
  managerName: string;
  managerProfile?: ManagerProfile;
  allowFiring?: boolean;
  boardObjective?: BoardObjective;
  boardConfidence?: number; // 0-100
  userTeamId: string;
  seasonYear: number;
  currentRound: number; // 1..30 in regular season
  currentDate?: string; // ISO YYYY-MM-DD
  ignoreFastSimAlerts?: boolean;
  phase: SeasonPhase;
  teams: Team[];
  freeAgents: Player[];
  staffMarket: StaffMember[];
  scoutedPlayerIds: string[];
  shortlistPlayerIds?: string[];
  activeScouting: ScoutingAssignment[];
  incomingOffers: TransferOffer[];
  schedule: ScheduledGame[];
  playoffs: PlayoffSeries[];
  coppaItalia?: CoppaItaliaState;
  euroLeagues?: Record<EuropeanCupId, EuroCompetitionState>;
  news: NewsItem[];
  messages?: InboxMessage[];
  awardsHistory?: SeasonAwardRecord[];
  chatHistory?: Record<string, ChatThreadLog>;
  championTeamId?: string;
  regulationAlert?: string;
}

export interface SaveSlotMeta {
  slotId: string;
  slotName: string;
  savedAt: string;
  managerName: string;
  teamName: string;
  seasonYear: number;
  currentRound: number;
  phase: SeasonPhase;
}
