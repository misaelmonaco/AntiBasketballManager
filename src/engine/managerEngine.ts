import {
  BoardObjective,
  ManagerAttributes,
  ManagerAvatarConfig,
  ManagerBackground,
  ManagerPhilosophy,
  ManagerProfile,
  StandingRow,
  Tactics,
} from '../types';

export interface BackgroundDef {
  id: ManagerBackground;
  title: string;
  subtitle: string;
  description: string;
  reputation: number;
  bonusPoints: number;
}

export const MANAGER_BACKGROUNDS: BackgroundDef[] = [
  {
    id: 'euroleague_star',
    title: 'Ex Stella Eurolega / Nazionale',
    subtitle: 'Reputazione Alta (82) • Pool Base 60 pt',
    description:
      'Rispetto immediato da parte di veterani e stelle del roster, minor rischio di ammutinamenti nello spogliatoio.',
    reputation: 82,
    bonusPoints: 0,
  },
  {
    id: 'serie_a_pro',
    title: 'Ex Giocatore Serie A / Leghe Minori',
    subtitle: 'Reputazione Media (58) • +6 pt Attributi',
    description:
      'Buon equilibrio tra credibilità in spogliatoio e conoscenze tattiche maturate sul parquet.',
    reputation: 58,
    bonusPoints: 6,
  },
  {
    id: 'youth_grinder',
    title: 'Allenatore "Gavetta" (Settore Giovanile)',
    subtitle: 'Reputazione Bassa (35) • +12 pt Attributi',
    description:
      'Nessun passato da pro: le stelle potrebbero metterti alla prova all’inizio, ma hai +12 punti extra sugli attributi tecnici.',
    reputation: 35,
    bonusPoints: 12,
  },
];

export interface PhilosophyDef {
  id: ManagerPhilosophy;
  title: string;
  tagline: string;
  description: string;
  tactics: Tactics;
  weights: Record<keyof ManagerAttributes, number>;
}

export const MANAGER_PHILOSOPHIES: PhilosophyDef[] = [
  {
    id: 'balkan_sergeant',
    title: 'Scuola Balcanica (Il Sergente)',
    tagline: 'Difesa aggressiva, disciplina ferrea, ritmi controllati',
    description:
      'Massima attenzione alla metà campo difensiva, esecuzione rigorosa dei giochi e pressione sulla palla.',
    tactics: { pace: 'Lento', offensiveFocus: 'Gioco interno', defense: 'Pressing' },
    weights: {
      offenseSpacing: 9,
      defenseOrg: 17,
      lockerRoom: 12,
      youthDev: 10,
      liveTactics: 15,
      scoutingMarket: 9,
    },
  },
  {
    id: 'pace_and_space',
    title: 'Pace & Space (Basket Moderno)',
    tagline: 'Ritmo alto, transizione rapida, alto volume da 3 punti',
    description:
      'Spaziature aperte, tiri rapidi nei primi secondi dell’azione e grande libertà per tiratori e guardie.',
    tactics: { pace: 'Run & Gun', offensiveFocus: 'Tiro da 3', defense: 'Uomo' },
    weights: {
      offenseSpacing: 17,
      defenseOrg: 9,
      lockerRoom: 10,
      youthDev: 13,
      liveTactics: 14,
      scoutingMarket: 9,
    },
  },
  {
    id: 'pick_and_roll_master',
    title: 'Maestro del Pick & Roll',
    tagline: 'Gioco ragionato a metà campo sull’asse play-lungo',
    description:
      'Letture offensive pulite, blocchi continui e sfruttamento dei mismatch tra portatore di palla e lunghi.',
    tactics: { pace: 'Bilanciato', offensiveFocus: 'Pick & Roll', defense: 'Uomo' },
    weights: {
      offenseSpacing: 15,
      defenseOrg: 12,
      lockerRoom: 10,
      youthDev: 9,
      liveTactics: 15,
      scoutingMarket: 11,
    },
  },
  {
    id: 'player_motivator',
    title: 'Il Gestore / Motivatore',
    tagline: 'Tattica flessibile, focus su morale, chimica e stelle',
    description:
      'Gestione umana impeccabile dello spogliatoio, valorizzazione dei talenti e grande fiuto sul mercato.',
    tactics: { pace: 'Bilanciato', offensiveFocus: 'Tiro da 3', defense: 'Zona 2-3' },
    weights: {
      offenseSpacing: 10,
      defenseOrg: 10,
      lockerRoom: 17,
      youthDev: 14,
      liveTactics: 10,
      scoutingMarket: 11,
    },
  },
];

export const DEFAULT_AVATAR: ManagerAvatarConfig = {
  skinTone: '#e8be9e',
  hairStyle: 'classic',
  hairColor: '#94a3b8',
  beardStyle: 'none',
  glasses: true,
  outfit: 'suit',
  coachPresetId: 'veteran_maestro',
};

export interface CoachFacePreset {
  id: string;
  label: string;
  subtitle: string;
  imagePath: string;
  thumbPath: string;
  avatar: ManagerAvatarConfig;
}

export const COACH_FACE_PRESETS: CoachFacePreset[] = [
  {
    id: 'veteran_maestro',
    label: 'Il Maestro Esperto',
    subtitle: 'Brizzolato • Occhiali • Completo',
    imagePath: '/images/coaches/coach-1.png',
    thumbPath: '/images/coaches/coach-1-thumb.jpg',
    avatar: {
      skinTone: '#e8be9e',
      hairStyle: 'classic',
      hairColor: '#94a3b8',
      beardStyle: 'none',
      glasses: true,
      outfit: 'suit',
      coachPresetId: 'veteran_maestro',
    },
  },
  {
    id: 'modern_tactician',
    label: 'Il Tattico Moderno',
    subtitle: 'Barba corta • Occhiali • Polo',
    imagePath: '/images/coaches/coach-2.png',
    thumbPath: '/images/coaches/coach-2-thumb.jpg',
    avatar: {
      skinTone: '#f5d0b5',
      hairStyle: 'short',
      hairColor: '#1c1917',
      beardStyle: 'stubble',
      glasses: true,
      outfit: 'polo',
      coachPresetId: 'modern_tactician',
    },
  },
  {
    id: 'balkan_sergeant',
    label: 'Il Sergente',
    subtitle: 'Stempiato • Barba • Tuta',
    imagePath: '/images/coaches/coach-3.png',
    thumbPath: '/images/coaches/coach-3-thumb.jpg',
    avatar: {
      skinTone: '#e8be9e',
      hairStyle: 'receding',
      hairColor: '#78350f',
      beardStyle: 'full',
      glasses: false,
      outfit: 'blazer',
      coachPresetId: 'balkan_sergeant',
    },
  },
  {
    id: 'young_prodigy',
    label: 'Il Giovane Emergente',
    subtitle: 'Capelli mossi • Blazer casual',
    imagePath: '/images/coaches/coach-4.png',
    thumbPath: '/images/coaches/coach-4-thumb.jpg',
    avatar: {
      skinTone: '#f5d0b5',
      hairStyle: 'curly',
      hairColor: '#2c1e16',
      beardStyle: 'stubble',
      glasses: false,
      outfit: 'blazer',
      coachPresetId: 'young_prodigy',
    },
  },
  {
    id: 'iron_leader',
    label: 'Il Carismatico',
    subtitle: 'Calvo • Barba folta • Completo',
    imagePath: '/images/coaches/coach-5.png',
    thumbPath: '/images/coaches/coach-5-thumb.jpg',
    avatar: {
      skinTone: '#d2996c',
      hairStyle: 'bald',
      hairColor: '#1c1917',
      beardStyle: 'full',
      glasses: false,
      outfit: 'suit',
      coachPresetId: 'iron_leader',
    },
  },
  {
    id: 'us_mentor',
    label: 'L’Ex Stella USA',
    subtitle: 'Stile USA • Pizzetto • Giacca',
    imagePath: '/images/coaches/coach-6.png',
    thumbPath: '/images/coaches/coach-6-thumb.jpg',
    avatar: {
      skinTone: '#6e4228',
      hairStyle: 'short',
      hairColor: '#1c1917',
      beardStyle: 'mustache',
      glasses: false,
      outfit: 'polo',
      coachPresetId: 'us_mentor',
    },
  },
];

export function getCoachPreset(presetId?: string): CoachFacePreset {
  return COACH_FACE_PRESETS.find((p) => p.id === presetId) ?? COACH_FACE_PRESETS[0];
}

export function getTotalAttributePool(background: ManagerBackground): number {
  const def = MANAGER_BACKGROUNDS.find((b) => b.id === background);
  return 60 + (def?.bonusPoints ?? 0);
}

export function getAutoAllocatedAttributes(
  philosophy: ManagerPhilosophy,
  totalPool: number
): ManagerAttributes {
  const def =
    MANAGER_PHILOSOPHIES.find((p) => p.id === philosophy) ?? MANAGER_PHILOSOPHIES[0];
  const keys = Object.keys(def.weights) as (keyof ManagerAttributes)[];
  const sumWeights = keys.reduce((s, k) => s + def.weights[k], 0);

  const result: ManagerAttributes = {
    offenseSpacing: 10,
    defenseOrg: 10,
    lockerRoom: 10,
    youthDev: 10,
    liveTactics: 10,
    scoutingMarket: 10,
  };

  let currentSum = 0;
  for (const k of keys) {
    const val = Math.max(1, Math.min(20, Math.round((def.weights[k] / sumWeights) * totalPool)));
    result[k] = val;
    currentSum += val;
  }

  const ordered = [...keys].sort((a, b) => def.weights[b] - def.weights[a]);
  let guard = 0;
  while (currentSum !== totalPool && guard < 100) {
    guard += 1;
    for (const k of ordered) {
      if (currentSum === totalPool) break;
      if (currentSum < totalPool && result[k] < 20) {
        result[k] += 1;
        currentSum += 1;
      } else if (currentSum > totalPool && result[k] > 1) {
        result[k] -= 1;
        currentSum -= 1;
      }
    }
  }

  return result;
}

export function getTeamBoardObjective(prestige: number): BoardObjective {
  if (prestige >= 82) return 'Vincere lo Scudetto';
  if (prestige >= 74) return 'Semifinale Playoff';
  if (prestige >= 66) return 'Qualificazione Playoff';
  return 'Salvezza tranquilla';
}

export function createDefaultManagerProfile(managerName: string): ManagerProfile {
  const parts = managerName.trim().split(/\s+/);
  const firstName = parts[0] || 'Coach';
  const lastName = parts.slice(1).join(' ') || 'Rossi';
  return {
    firstName,
    lastName,
    age: 42,
    nationality: 'ITA',
    avatar: { ...DEFAULT_AVATAR },
    background: 'serie_a_pro',
    philosophy: 'pick_and_roll_master',
    reputation: 58,
    attributes: getAutoAllocatedAttributes('pick_and_roll_master', 66),
    allowFiring: true,
  };
}

export function updateBoardConfidence(params: {
  currentConfidence: number;
  objective: BoardObjective;
  standings: StandingRow[];
  userTeamId: string;
  userWonLastGame: boolean;
  wageBill: number;
  budget: number;
  allowFiring?: boolean;
}): number {
  const rank = params.standings.findIndex((s) => s.teamId === params.userTeamId) + 1;
  const targetMaxRank =
    params.objective === 'Vincere lo Scudetto'
      ? 2
      : params.objective === 'Semifinale Playoff'
      ? 4
      : params.objective === 'Qualificazione Playoff'
      ? 8
      : 14;

  let delta = params.userWonLastGame ? 2 : -2;
  if (rank > 0) {
    if (rank <= targetMaxRank) delta += 1;
    else if (rank > targetMaxRank + 3) delta -= 2;
  }
  if (params.wageBill > params.budget * 1.05) {
    delta -= 1;
  }

  const floor = params.allowFiring === false ? 35 : 5;
  return Math.max(floor, Math.min(100, Math.round(params.currentConfidence + delta)));
}
