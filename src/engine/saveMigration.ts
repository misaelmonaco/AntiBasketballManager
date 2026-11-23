import {
  createStaffMember,
  generateStaffMarket,
  generateYouthRoster,
} from '../data/generator';
import { A2_REAL_BIRTHDATES_BY_NAME } from '../data/a2RealRosters';
import { LBA_REAL_BIRTHDATES_BY_NAME } from '../data/lbaRealRosters';
import { SERIE_B_REAL_BIRTHDATES_BY_NAME } from '../data/serieBRealRosters';

const REAL_BIRTHDATES_BY_NAME: Record<string, string> = {
  ...SERIE_B_REAL_BIRTHDATES_BY_NAME,
  ...A2_REAL_BIRTHDATES_BY_NAME,
  ...LBA_REAL_BIRTHDATES_BY_NAME,
};
import {
  CareerSave,
  CustomPlay,
  OpponentGamePlan,
  OpponentPlayerInstruction,
  OpponentPlayerRule,
  Player,
  SeasonPhase,
  Tactics,
  TacticsPreset,
} from '../types';
import {
  computeAgeFromBirthDate,
  getRoundDate,
  getSeasonAgeReferenceDate,
} from './calendarUtils';
import { filterRealCareerHistory } from './careerStatsUtils';
import {
  createInitialCoppaItalia,
  createInitialEuroCompetitions,
} from './competitionsEngine';
import { migrateCustomPlay } from './customPlayEngine';
import { createDefaultManagerProfile, getTeamBoardObjective } from './managerEngine';
import {
  autoBalanceRotationMinutes,
  normalizeTeamRotationSlots,
} from './ratings';

export const CURRENT_SAVE_VERSION = 2;

function normalizeSeasonPhase(raw: unknown): SeasonPhase {
  if (raw === 'offseason' || raw === 'regular' || raw === 'playoffs' || raw === 'finished') {
    return raw;
  }
  return 'regular';
}

function migrateOpponentGamePlan(raw?: OpponentGamePlan): OpponentGamePlan | undefined {
  if (
    !raw ||
    typeof raw !== 'object' ||
    typeof raw.opponentTeamId !== 'string' ||
    !raw.opponentTeamId.trim()
  ) {
    return undefined;
  }
  const instructions: Record<string, OpponentPlayerInstruction> = {};
  if (raw.playerInstructions && typeof raw.playerInstructions === 'object') {
    for (const [playerId, entry] of Object.entries(raw.playerInstructions)) {
      if (!entry || typeof entry !== 'object') continue;
      const legacyEntry = entry as Partial<OpponentPlayerInstruction> & {
        defensiveRule?: OpponentPlayerRule;
      };
      instructions[playerId] = {
        rule: legacyEntry.rule ?? legacyEntry.defensiveRule ?? 'Standard',
        defenderId:
          typeof entry.defenderId === 'string' && entry.defenderId ? entry.defenderId : undefined,
      };
    }
  }
  return {
    opponentTeamId: raw.opponentTeamId,
    playerInstructions: instructions,
  };
}

function migrateTacticsBase(
  raw?: Partial<Tactics>
): Omit<Tactics, 'presets' | 'opponentGamePlan' | 'delegateToAssistant'> {
  const rawPlays = Array.isArray(raw?.customPlays) ? raw.customPlays : [];
  const customPlays = rawPlays
    .filter((cp): cp is CustomPlay => Boolean(cp && typeof cp === 'object'))
    .map((cp, idx) => migrateCustomPlay(cp, idx, true));

  return {
    pace: raw?.pace ?? 'Bilanciato',
    offensiveFocus: raw?.offensiveFocus ?? 'Pick & Roll',
    defense: raw?.defense ?? 'Uomo',
    offensiveAggression: raw?.offensiveAggression ?? 'Normale',
    reboundPolicy: raw?.reboundPolicy ?? 'Equilibrato',
    pnrCoverage: raw?.pnrCoverage ?? 'Hedge & Recover',
    defensiveIntensity: raw?.defensiveIntensity ?? 'Standard',
    opponentFocus: raw?.opponentFocus ?? 'Equilibrata',
    goToPlayerId: raw?.goToPlayerId ?? null,
    secondaryOptionPlayerId: raw?.secondaryOptionPlayerId ?? null,
    playbook:
      Array.isArray(raw?.playbook) && raw.playbook.length > 0
        ? raw.playbook
        : ['pick_and_roll_centrale', 'horns', 'floppy'],
    customPlays,
  };
}

function migrateTactics(raw?: Partial<Tactics>): Tactics {
  const base = migrateTacticsBase(raw);
  const rawPresets = Array.isArray(raw?.presets) ? raw.presets : [];
  const presets: TacticsPreset[] = rawPresets
    .filter((pr): pr is TacticsPreset => Boolean(pr && typeof pr === 'object'))
    .map((pr, idx) => ({
      id: typeof pr.id === 'string' && pr.id.trim() ? pr.id : `preset_${idx + 1}`,
      name: typeof pr.name === 'string' && pr.name.trim() ? pr.name.trim() : `Preset ${idx + 1}`,
      tactics: migrateTacticsBase(pr.tactics),
    }));

  return {
    ...base,
    opponentGamePlan: migrateOpponentGamePlan(raw?.opponentGamePlan),
    presets,
    delegateToAssistant: raw?.delegateToAssistant ?? false,
  };
}

function migratePlayer(p: Player, idx: number, seasonYear: number): Player {
  const defaultHeight =
    p.primaryPosition === 'C'
      ? 211
      : p.primaryPosition === 'PF'
      ? 205
      : p.primaryPosition === 'SF'
      ? 200
      : p.primaryPosition === 'SG'
      ? 195
      : 188;
  const defaultWeight =
    p.primaryPosition === 'C'
      ? 115
      : p.primaryPosition === 'PF'
      ? 106
      : p.primaryPosition === 'SF'
      ? 98
      : p.primaryPosition === 'SG'
      ? 90
      : 84;

  const knownBirthDate =
    REAL_BIRTHDATES_BY_NAME[`${p.firstName} ${p.lastName}`.trim().toLowerCase()];
  const resolvedBirthDate =
    knownBirthDate ?? p.birthDate ?? `15/05/${seasonYear - p.age}`;
  const resolvedAge =
    knownBirthDate && p.birthDate !== knownBirthDate
      ? (computeAgeFromBirthDate(
          knownBirthDate,
          getSeasonAgeReferenceDate(seasonYear)
        ) ?? p.age)
      : p.age;

  return {
    ...p,
    age: resolvedAge,
    jerseyNumber: p.jerseyNumber ?? ((idx * 7 + 4) % 55),
    birthDate: resolvedBirthDate,
    heightCm: p.heightCm ?? defaultHeight,
    weightKg: p.weightKg ?? defaultWeight,
    secondaryPosition: p.secondaryPosition ?? null,
    morale: p.morale ?? 78,
    personality: p.personality ?? 'Professionista',
    injuryProneness: p.injuryProneness ?? 35,
    promisedRole:
      p.promisedRole ?? (p.rosterSlot === 'starter' ? 'Titolare fisso' : 'Sesto uomo'),
    buyoutClause: p.buyoutClause ?? Math.round(p.salary * p.contractYears * 0.65),
    attributes: {
      threePoint: p.attributes?.threePoint ?? 65,
      twoPoint: p.attributes?.twoPoint ?? 65,
      freeThrow: p.attributes?.freeThrow ?? 70,
      passing: p.attributes?.passing ?? 62,
      ballHandling: p.attributes?.ballHandling ?? 62,
      finishing: p.attributes?.finishing ?? 65,
      perimeterDef: p.attributes?.perimeterDef ?? 64,
      postDef: p.attributes?.postDef ?? 62,
      blocks: p.attributes?.blocks ?? 55,
      steals: p.attributes?.steals ?? 60,
      athleticism: p.attributes?.athleticism ?? 66,
      rebounding: p.attributes?.rebounding ?? 62,
      stamina: p.attributes?.stamina ?? 72,
      basketballIQ: p.attributes?.basketballIQ ?? 68,
    },
    seasonStats: {
      ...p.seasonStats,
      gamesStarted: p.seasonStats?.gamesStarted ?? 0,
      oreb: p.seasonStats?.oreb ?? 0,
      dreb: p.seasonStats?.dreb ?? 0,
    },
    gameLog: p.gameLog ?? [],
    careerHistory: filterRealCareerHistory(p.careerHistory),
    onTransferList: p.onTransferList ?? false,
    individualFocus: p.individualFocus ?? 'Nessuno',
    trainingProgram: p.trainingProgram ?? undefined,
  };
}

/**
 * Garantisce la piena retrocompatibilità dei salvataggi JSON provenienti da versioni precedenti.
 */
export function migrateCareerSave(save: CareerSave): CareerSave {
  const rawTeams = save.teams ?? [];
  const userTeam = rawTeams.find((t) => t.id === save.userTeamId) ?? rawTeams[0];
  const seasonYear = save.seasonYear ?? 2026;
  const currentRound = save.currentRound ?? 1;
  const legacySave = save as CareerSave & { updatedAt?: string };

  const migratedTeams = rawTeams.map((t) => {
    const migratedRoster = (t.roster ?? []).map((p, idx) =>
      migratePlayer(p, idx, seasonYear)
    );
    const needsMinutesInit = migratedRoster.every((p) => p.targetMinutes === undefined);

    const existingYouth = t.youthRoster;
    let youthRoster: Player[];
    if (!existingYouth) {
      youthRoster = generateYouthRoster(t.prestige);
    } else if (!existingYouth.some((p) => !p.isItalianFormation)) {
      const foreignProspects = generateYouthRoster(t.prestige).filter(
        (p) => !p.isItalianFormation
      );
      youthRoster = [...existingYouth, ...foreignProspects].map((p, idx) =>
        migratePlayer(p, idx, seasonYear)
      );
    } else {
      youthRoster = existingYouth.map((p, idx) => migratePlayer(p, idx, seasonYear));
    }

    return {
      ...t,
      leagueId: t.leagueId ?? ('ITA_LBA' as const),
      lbaRosterFormat:
        t.lbaRosterFormat ?? ((t.leagueId ?? 'ITA_LBA') === 'ITA_LBA' ? '6+6' : undefined),
      chemistry: t.chemistry ?? 68,
      tactics: migrateTactics(t.tactics),
      facilities: t.facilities ?? {
        arenaLevel: 1,
        youthLevel: 1,
        medicalLevel: 1,
      },
      training: t.training ?? { focus: 'Tattica Pre-Partita' as const, intensity: 'Moderata' as const },
      staff: t.staff ?? {
        assistant_coach: createStaffMember(
          'assistant_coach',
          Math.round(52 + t.prestige * 0.35)
        ),
        fitness_coach: createStaffMember('fitness_coach', Math.round(50 + t.prestige * 0.35)),
        scout_director: createStaffMember('scout_director', Math.round(50 + t.prestige * 0.35)),
      },
      roster: normalizeTeamRotationSlots(
        needsMinutesInit ? autoBalanceRotationMinutes(migratedRoster) : migratedRoster
      ),
      youthRoster,
    };
  });

  return {
    ...save,
    version: Math.max(CURRENT_SAVE_VERSION, save.version ?? 1),
    slotId: save.slotId?.trim() || 'slot_migrated',
    slotName: save.slotName?.trim() || 'Carriera',
    savedAt: save.savedAt || legacySave.updatedAt || new Date().toISOString(),
    managerName: save.managerName?.trim() || 'Coach',
    phase: normalizeSeasonPhase(save.phase),
    managerProfile: save.managerProfile ?? createDefaultManagerProfile(save.managerName || 'Coach'),
    allowFiring: save.allowFiring ?? save.managerProfile?.allowFiring ?? true,
    boardObjective: save.boardObjective ?? getTeamBoardObjective(userTeam?.prestige ?? 72),
    boardConfidence: save.boardConfidence ?? 75,
    currentDate: save.currentDate ?? getRoundDate(seasonYear, currentRound),
    ignoreFastSimAlerts: save.ignoreFastSimAlerts ?? false,
    staffMarket: save.staffMarket ?? generateStaffMarket(4),
    freeAgents: (save.freeAgents ?? []).map((p, idx) =>
      migratePlayer(p, idx, seasonYear)
    ),
    scoutedPlayerIds: save.scoutedPlayerIds ?? [],
    shortlistPlayerIds: save.shortlistPlayerIds ?? [],
    activeScouting: save.activeScouting ?? [],
    incomingOffers: (save.incomingOffers ?? []).map((o) => ({
      ...o,
      initialBuyoutAmount: o.initialBuyoutAmount ?? o.buyoutAmount,
      negotiationRounds: o.negotiationRounds ?? 0,
    })),
    playoffs: save.playoffs ?? [],
    coppaItalia: save.coppaItalia ?? createInitialCoppaItalia(seasonYear),
    euroLeagues: save.euroLeagues ?? createInitialEuroCompetitions(migratedTeams),
    schedule: (save.schedule ?? []).map((g) => ({
      ...g,
      leagueId: g.leagueId ?? 'ITA_LBA',
    })),
    news: save.news ?? [],
    messages: save.messages ?? [],
    awardsHistory: save.awardsHistory ?? [],
    chatHistory: save.chatHistory ?? {},
    teams: migratedTeams,
  };
}
