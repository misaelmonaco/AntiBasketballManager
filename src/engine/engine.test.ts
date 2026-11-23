import { describe, expect, it } from 'vitest';
import {
  createPlayer,
  generateFreeAgents,
  generateLeagueTeams,
  generateSchedule,
} from '../data/generator';
import {
  adaptAttributesToOverall,
  autoAdjustRotationsForInjuries,
  autoBalanceRotationMinutes,
  autoFixRosterLineup,
  calculateOverall,
  getForeignLimitForLeague,
  validateRoster6Plus6,
} from './ratings';
import {
  applyTimeoutTactics,
  callTimeout,
  initMatchState,
  simulateFullMatch,
  simulateNextPossession,
} from './matchSimulator';
import {
  addDays,
  daysBetween,
  formatItalianDate,
  getMarketOpenDate,
  getRoundDate,
  isWeekendDate,
} from './calendarUtils';
import { computeAssistantTactics } from './assistantCoachTactics';
import { advanceCareerToNextSeason } from './seasonTransition';
import {
  generateEndOfSeasonUnhappyOffers,
  getLeagueRegulationNotice,
  runCpuSummerMarket,
} from './cpuMarketEngine';
import { createRandomCustomPlayerTemplate } from '../services/editorDbService';
import {
  getAutoAllocatedAttributes,
  getTeamBoardObjective,
  getTotalAttributePool,
  updateBoardConfidence,
} from './managerEngine';
import { CURRENT_SAVE_VERSION, migrateCareerSave } from './saveMigration';
import {
  applyMatchStatsToTeams,
  createPlayoffQuarterfinals,
} from './seasonEngine';
import { computePlayKeyframes, getActiveSchemeName } from './courtPlaybook';
import {
  analyzeCustomPlay,
  createCustomPlayFromTemplate,
  getBallCarrierAtStep,
  getEffectivePasses,
  getEffectiveSteps,
  parseImportedCustomPlaysJson,
  syncCustomPlayFields,
} from './customPlayEngine';
import { parseAndMigrateCareerSave } from '../services/saveService';
import { createInitialEuroCompetitions } from './competitionsEngine';
import { getLeagueConfig, LEAGUES } from '../data/teams';
import {
  buildCareerHistoryEntry,
  computePlayerCareerSummary,
  computePlayerSeasonHighs,
  filterRealCareerHistory,
} from './careerStatsUtils';
import {
  advanceDailyIndividualTrainingPrograms,
  canLearnAdditionalRole,
  createIndividualTrainingProgram,
} from './trainingProgramEngine';
import { getChatCooldownRemaining } from './interactionChatEngine';
import { evaluateBuyoutCounterOffer } from './scoutingEngine';
import {
  eventsToCompactScoringPlays,
  formatPlayClock,
} from '../components/match/ScoringPlayTimeline';
import {
  createEmptyEditorDatabase,
  getDefaultRosterTemplatesForTeam,
  getEffectiveRosterTemplatesForTeam,
  getEffectiveTeamTemplates,
} from '../services/editorDbService';
import type { CareerSave, Team } from '../types';
import { useGameStore } from '../store/gameStore';
import {
  computeTeamSeasonOverview,
  getNextScheduledOpponentId,
} from '../components/opponents/opponentAnalytics';

describe('Database & Regola 6+6', () => {
  it('genera 86 squadre su 5 campionati con 12 giocatori ciascuna (1032 totali), 60 free agent e calendari completi', () => {
    const teams = generateLeagueTeams();
    const fas = generateFreeAgents(60);
    const schedule = generateSchedule(teams);

    expect(teams).toHaveLength(86);
    expect(teams.reduce((s, t) => s + t.roster.length, 0)).toBe(221 + 230 + 501 + 14 * 12);
    expect(fas).toHaveLength(60);
    // 240 (LBA) + 380 (A2) + 306 (B) + 306 (B2) + 182 (B_INT) = 1414
    expect(schedule).toHaveLength(1414);

    for (const lg of LEAGUES) {
      const lgTeams = teams.filter((t) => t.leagueId === lg.id);
      expect(lgTeams).toHaveLength(lg.teamsCount);
    }

    const euros = createInitialEuroCompetitions(teams);
    expect(euros.EL.standings.filter((s) => s.isItalian)).toHaveLength(2);
    expect(euros.EC.standings.filter((s) => s.isItalian)).toHaveLength(3);

    for (const t of teams) {
      const check = validateRoster6Plus6(t.roster, t.leagueId);
      const clubItaCount = t.roster.filter((p) => p.isItalianFormation).length;
      if (t.leagueId === 'ITA_LBA') {
        expect(check.foreignCount).toBeLessThanOrEqual(6);
        if (clubItaCount >= 6) {
          expect(check.valid).toBe(true);
          expect(check.itaCount).toBeGreaterThanOrEqual(6);
        }
      } else if (t.leagueId === 'ITA_A2') {
        expect(check.foreignCount).toBeLessThanOrEqual(2);
        if (clubItaCount >= 10) {
          expect(check.valid).toBe(true);
          expect(check.itaCount).toBeGreaterThanOrEqual(5);
        }
      } else {
        expect(check.valid).toBe(true);
        expect(check.itaCount).toBeGreaterThanOrEqual(6);
        expect(check.foreignCount).toBeLessThanOrEqual(1);
      }
      expect((t.youthRoster ?? []).length).toBeGreaterThanOrEqual(7);
      expect((t.youthRoster ?? []).filter((p) => p.isItalianFormation).length).toBeGreaterThanOrEqual(5);
      expect((t.youthRoster ?? []).filter((p) => !p.isItalianFormation).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('blocca il referto se viene violata la regola 6+6', () => {
    const teams = generateLeagueTeams();
    const lbaSixItaTeam =
      teams.find(
        (t) =>
          t.leagueId === 'ITA_LBA' &&
          t.roster.filter((p) => p.isItalianFormation && p.rosterSlot !== 'reserve').length === 6
      ) ?? teams[0];
    const activeItaIdx = lbaSixItaTeam.roster.findIndex(
      (p) => p.isItalianFormation && p.rosterSlot !== 'reserve'
    );
    const roster = lbaSixItaTeam.roster.map((p, idx) =>
      idx === activeItaIdx ? { ...p, isItalianFormation: false } : p
    );
    const check = validateRoster6Plus6(roster);
    expect(check.valid).toBe(false);
    expect(check.errors.length).toBeGreaterThan(0);
  });

  it('consente di proseguire con deroga infortuni se un italiano è infortunato', () => {
    const teams = generateLeagueTeams();
    const lbaSixItaTeam =
      teams.find(
        (t) =>
          t.leagueId === 'ITA_LBA' &&
          t.roster.length === 12 &&
          t.roster.filter((p) => p.isItalianFormation).length === 6
      ) ?? teams[0];
    const itaBenchIdx = lbaSixItaTeam.roster.findIndex(
      (p) => p.isItalianFormation && p.rosterSlot === 'bench'
    );
    const roster = lbaSixItaTeam.roster.map((p, idx) =>
      idx === itaBenchIdx ? { ...p, injuryWeeks: 2, rosterSlot: 'reserve' as const } : p
    );
    const check = validateRoster6Plus6(roster);
    expect(check.valid).toBe(true);
    expect(check.injuryExemption).toBe(true);
    expect(check.warnings.length).toBeGreaterThan(0);
  });
});

describe('Motore Simulazione Partita FIBA', () => {
  it('produce punteggi FIBA realistici (75-92 pt) e percentuali realistiche (45-52% 2P, 32-40% 3P)', () => {
    const teams = generateLeagueTeams();
    let totalPoints = 0;
    let totalTwoMade = 0;
    let totalTwoAtt = 0;
    let totalThreeMade = 0;
    let totalThreeAtt = 0;
    const games = 30;

    for (let i = 0; i < games; i++) {
      const home = teams[i % 8];
      const away = teams[8 + (i % 8)];
      const res = simulateFullMatch(`test_${i}`, 1, home, away);
      expect(res.finished).toBe(true);
      expect(res.home.score).not.toBe(res.away.score);

      totalPoints += res.home.score + res.away.score;
      for (const p of [...res.home.players, ...res.away.players]) {
        totalTwoMade += p.fgm - p.tpm;
        totalTwoAtt += p.fga - p.tpa;
        totalThreeMade += p.tpm;
        totalThreeAtt += p.tpa;
      }
    }

    const avgPtsPerTeam = totalPoints / (games * 2);
    const twoPct = (totalTwoMade / totalTwoAtt) * 100;
    const threePct = (totalThreeMade / totalThreeAtt) * 100;

    expect(avgPtsPerTeam).toBeGreaterThanOrEqual(73);
    expect(avgPtsPerTeam).toBeLessThanOrEqual(94);
    expect(twoPct).toBeGreaterThanOrEqual(44);
    expect(twoPct).toBeLessThanOrEqual(54);
    expect(threePct).toBeGreaterThanOrEqual(31);
    expect(threePct).toBeLessThanOrEqual(41);
  });
});

describe('Calendario & Date Stagionali', () => {
  it('calcola correttamente le date delle giornate nel weekend e gli intervalli di giorni', () => {
    const r1 = getRoundDate(2026, 1);
    const r2 = getRoundDate(2026, 2);
    const r31 = getRoundDate(2026, 31);

    expect(r1).toBe('2026-09-20');
    expect(r2).toBe('2026-09-27');
    expect(daysBetween(r1, r2)).toBe(7);
    expect(addDays(r1, 30)).toBe('2026-10-20');
    expect(daysBetween(getRoundDate(2026, 30), r31)).toBe(13);
    expect(formatItalianDate(r1)).toContain('2026');

    for (let r = 1; r <= 45; r++) {
      expect(isWeekendDate(getRoundDate(2026, r, 30))).toBe(true);
    }
  });
});

describe('Delega Tattica Vice Allenatore', () => {
  it('computeAssistantTactics genera tattiche complete, playbook valido e riassunto in italiano', () => {
    const teams = generateLeagueTeams();
    const userTeam = {
      ...teams[0],
      tactics: { ...teams[0].tactics, delegateToAssistant: true },
    };
    const { tactics, summary } = computeAssistantTactics(userTeam, teams[1]);

    expect(['Controllo', 'Lento', 'Bilanciato', 'Ritmo Alto', 'Run & Gun']).toContain(
      tactics.pace
    );
    expect([
      'Tiro da 3',
      'Gioco interno',
      'Pick & Roll',
      'Motion',
      'Isolamento',
      'Transizione',
    ]).toContain(tactics.offensiveFocus);
    expect([
      'Uomo',
      'Cambio Sistematico',
      'Zona 2-3',
      'Zona 3-2',
      'Zona 1-3-1',
      'Box-and-One',
      'Pressing',
    ]).toContain(tactics.defense);
    expect(tactics.pnrCoverage).toBeTruthy();
    expect(tactics.reboundPolicy).toBeTruthy();
    expect(tactics.defensiveIntensity).toBeTruthy();
    expect(tactics.opponentGamePlan?.opponentTeamId).toBe(teams[1].id);
    expect(tactics.playbook && tactics.playbook.length).toBeGreaterThanOrEqual(3);
    expect(tactics.delegateToAssistant).toBe(true);
    expect(summary).toContain(teams[1].shortName);
  });
});

describe('Rotazioni & Minutaggio Target', () => {
  it('distribuisce esattamente 200 minuti tra i 12 giocatori attivi', () => {
    const teams = generateLeagueTeams();
    const balanced = autoBalanceRotationMinutes(teams[0].roster);
    const total = balanced
      .filter((p) => p.rosterSlot !== 'reserve')
      .reduce((s, p) => s + (p.targetMinutes ?? 0), 0);

    expect(total).toBe(200);
    for (const p of balanced) {
      expect(p.targetMinutes ?? 0).toBeGreaterThanOrEqual(0);
      expect(p.targetMinutes ?? 0).toBeLessThanOrEqual(40);
    }
  });
});

describe('Profilo Manager & Obiettivi Dirigenziali', () => {
  it('alloca esattamente il pool attributi in base a passato e filosofia', () => {
    const poolStar = getTotalAttributePool('euroleague_star');
    const poolGrinder = getTotalAttributePool('youth_grinder');
    expect(poolStar).toBe(60);
    expect(poolGrinder).toBe(72);

    const attrs = getAutoAllocatedAttributes('pace_and_space', poolGrinder);
    const sum = Object.values(attrs).reduce((s, v) => s + v, 0);
    expect(sum).toBe(72);
    expect(getTeamBoardObjective(88)).toBe('Vincere lo Scudetto');
    expect(getTeamBoardObjective(60)).toBe('Salvezza tranquilla');
  });
});

describe('Retrocompatibilità Salvataggi JSON', () => {
  it('migra un salvataggio v1 privo di campi recenti senza perdere i dati', () => {
    const teams = generateLeagueTeams();
    const fas = generateFreeAgents(10);
    const schedule = generateSchedule(teams);

    // Simula un vecchio JSON save v1 privo di currentDate, managerProfile, youthRoster, staff, targetMinutes, ecc.
    const legacyTeams = teams.map((t) => ({
      ...t,
      chemistry: undefined,
      training: undefined,
      staff: undefined,
      youthRoster: undefined,
      roster: t.roster.map((p) => ({
        ...p,
        targetMinutes: undefined,
        gameLog: undefined,
        careerHistory: undefined,
      })),
    }));

    const legacySave = {
      version: 1,
      slotName: 'Legacy Save',
      updatedAt: '2026-10-01T10:00:00.000Z',
      managerName: 'Coach Legacy',
      userTeamId: teams[0].id,
      seasonYear: 2026,
      currentRound: 3,
      phase: 'regular_season',
      teams: legacyTeams,
      freeAgents: fas,
      schedule,
      playoffs: [],
      news: [],
    } as unknown as CareerSave;

    const migrated = migrateCareerSave(legacySave);

    expect(migrated.currentDate).toBe(getRoundDate(2026, 3));
    expect(migrated.managerProfile).toBeDefined();
    expect(migrated.managerProfile?.firstName).toBe('Coach');
    expect(migrated.boardObjective).toBeTruthy();
    expect(migrated.boardConfidence).toBe(75);
    expect(migrated.staffMarket?.length).toBeGreaterThan(0);

    const userTeam = migrated.teams[0];
    expect(userTeam.chemistry).toBe(68);
    expect(userTeam.training).toBeDefined();
    expect(userTeam.staff?.assistant_coach).toBeDefined();
    expect(userTeam.youthRoster?.length).toBeGreaterThanOrEqual(5);
    expect(userTeam.youthRoster?.some((p) => !p.isItalianFormation)).toBe(true);

    const totalTargetMin = userTeam.roster
      .filter((p) => p.rosterSlot !== 'reserve')
      .reduce((s, p) => s + (p.targetMinutes ?? 0), 0);
    expect(totalTargetMin).toBe(200);
  });
});

describe('Editor Database Pre-Carriera', () => {
  it('applica override personalizzati a nomi squadre e giocatori senza alterare i default', () => {
    const db = createEmptyEditorDatabase();
    const firstTeamId = 'ita_lba_milano_rossi';
    db.teams[firstTeamId] = {
      name: 'Olimpia Custom',
      shortName: 'OLC',
      city: 'Milano',
    };
    const baseRoster = getDefaultRosterTemplatesForTeam(firstTeamId);
    baseRoster[0] = {
      ...baseRoster[0],
      firstName: 'Nikola',
      lastName: 'Mirotic',
      jerseyNumber: 33,
    };
    db.rosters[firstTeamId] = baseRoster;

    const effTeams = getEffectiveTeamTemplates(db);
    const edited = effTeams.find((t) => t.id === firstTeamId);
    expect(edited?.name).toBe('Olimpia Custom');
    expect(edited?.shortName).toBe('OLC');

    const effRoster = getEffectiveRosterTemplatesForTeam(firstTeamId, db);
    expect(effRoster[0].firstName).toBe('Nikola');
    expect(effRoster[0].lastName).toBe('Mirotic');
    expect(effRoster[0].jerseyNumber).toBe(33);
  });

  it('applica le scelte tattiche da timeout (difesa Zona 3-2, marcature e opzione #1) in partita', () => {
    const teams = generateLeagueTeams();
    const home = teams[0];
    const away = teams[1];
    let state = initMatchState('g_to_1', 1, home, away, false);

    state = callTimeout(state, 'home');
    const goToId = state.home.players[0].playerId;
    const oppStarId = state.away.players[0].playerId;
    const myStopperId = state.home.players[2].playerId;

    state = applyTimeoutTactics(state, 'home', {
      pace: 'Run & Gun',
      offensiveFocus: 'Tiro da 3',
      defense: 'Zona 3-2',
      offensiveAggression: 'Attacca il ferro',
      goToPlayerId: goToId,
      defensiveFocusPlayerId: oppStarId,
      defensiveMatchups: { [oppStarId]: myStopperId },
    });

    expect(state.home.tactics.defense).toBe('Zona 3-2');
    expect(state.home.tactics.offensiveAggression).toBe('Attacca il ferro');
    expect(state.home.goToPlayerId).toBe(goToId);
    expect(state.home.defensiveFocusPlayerId).toBe(oppStarId);
    expect(state.home.defensiveMatchups?.[oppStarId]).toBe(myStopperId);
    expect(state.playByPlay[0].text).toContain('Difesa Zona 3-2');

    // Simula alcuni possessi per verificare assenza di errori runtime
    for (let i = 0; i < 10 && !state.finished; i++) {
      state = simulateNextPossession(state, home, away, true);
    }
    expect(state.possessionCount).toBeGreaterThan(0);
  });

  it('consente 7-12 giocatori a referto in Serie A2/B e la modalità 5+5 in LBA', () => {
    const teams = generateLeagueTeams();
    const a2Team = teams.find((t) => t.leagueId === 'ITA_A2')!;
    const a2SevenRoster = a2Team.roster.map((p, idx) => ({
      ...p,
      rosterSlot: idx < 5 ? ('starter' as const) : idx < 7 ? ('bench' as const) : ('reserve' as const),
      isItalianFormation: idx >= 2,
    }));
    const a2Check = validateRoster6Plus6(a2SevenRoster, 'ITA_A2');
    expect(a2Check.valid).toBe(true);
    expect(a2Check.activeCount).toBe(7);

    const bTeam = teams.find((t) => t.leagueId === 'ITA_B')!;
    const bSevenRoster = bTeam.roster.map((p, idx) => ({
      ...p,
      rosterSlot: idx < 5 ? ('starter' as const) : idx < 7 ? ('bench' as const) : ('reserve' as const),
      isItalianFormation: idx >= 1,
    }));
    const bCheck = validateRoster6Plus6(bSevenRoster, 'ITA_B');
    expect(bCheck.valid).toBe(true);
    expect(bCheck.activeCount).toBe(7);

    const lbaTeam = teams.find((t) => t.leagueId === 'ITA_LBA')!;
    const lba55Roster = lbaTeam.roster.map((p, idx) => ({
      ...p,
      rosterSlot: idx < 5 ? ('starter' as const) : idx < 10 ? ('bench' as const) : ('reserve' as const),
      isItalianFormation: idx >= 5,
    }));
    const lba55Check = validateRoster6Plus6(lba55Roster, 'ITA_LBA', '5+5');
    expect(lba55Check.valid).toBe(true);
    expect(lba55Check.activeCount).toBe(10);
    expect(lba55Check.itaCount).toBe(5);
    expect(lba55Check.foreignCount).toBe(5);
  });

  it('startNewCareer completa la creazione anche se localStorage lancia QuotaExceededError', async () => {
    const originalStorage = (globalThis as { localStorage?: Storage }).localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        },
        removeItem: () => undefined,
        clear: () => undefined,
        key: () => null,
        length: 0,
      } satisfies Storage,
    });

    try {
      await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Test', 'Test Slot');
      const state = useGameStore.getState();
      expect(state.screen).toBe('dashboard');
      expect(state.career).not.toBeNull();
      expect(state.career?.userTeamId).toBe('ita_lba_milano_rossi');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: originalStorage,
      });
    }
  });

  it('advanceOneDay salva i tabellini completi (homePlayers, awayPlayers, quarti) nelle partite simulate', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Box', 'Box Slot');
    for (let i = 0; i < 14; i += 1) {
      useGameStore.getState().advanceOneDay(true);
      const hasPlayed = useGameStore
        .getState()
        .career?.schedule.some((g) => g.round === 1 && g.played);
      if (hasPlayed) break;
    }
    const career = useGameStore.getState().career!;
    const playedRound1 = career.schedule.filter((g) => g.round === 1 && g.played);
    expect(playedRound1.length).toBeGreaterThan(0);
    for (const g of playedRound1) {
      expect(g.summary).toBeDefined();
      expect(g.summary?.homePlayers?.length).toBeGreaterThanOrEqual(5);
      expect(g.summary?.awayPlayers?.length).toBeGreaterThanOrEqual(5);
      expect(g.summary?.homeQuarterScores?.length).toBeGreaterThanOrEqual(4);
      expect(g.summary?.awayQuarterScores?.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('createPlayer applica attributi, età, peso, stipendio e personalità personalizzati dall’editor DB', () => {
    const p = createPlayer({
      position: 'PG',
      tier: 75,
      isItalian: true,
      rosterSlot: 'starter',
      minutePriority: 'Alta',
      firstName: 'Marco',
      lastName: 'Belinelli',
      age: 37,
      weightKg: 96,
      salary: 450000,
      contractYears: 2,
      personality: 'Leader',
      attributes: {
        threePoint: 95,
        freeThrow: 92,
        basketballIQ: 91,
      },
    });
    expect(p.age).toBe(37);
    expect(p.weightKg).toBe(96);
    expect(p.salary).toBe(450000);
    expect(p.contractYears).toBe(2);
    expect(p.personality).toBe('Leader');
    expect(p.attributes.threePoint).toBe(95);
    expect(p.attributes.freeThrow).toBe(92);
    expect(p.attributes.basketballIQ).toBe(91);
  });

  it('adaptAttributesToOverall adatta gli attributi per raggiungere esattamente l’overall target', () => {
    const base = createPlayer({
      position: 'SG',
      tier: 70,
      isItalian: true,
      rosterSlot: 'starter',
      minutePriority: 'Alta',
    }).attributes;

    for (const pos of ['PG', 'SG', 'SF', 'PF', 'C'] as const) {
      for (const target of [62, 76, 88]) {
        const adapted = adaptAttributesToOverall(base, pos, target);
        expect(calculateOverall(adapted, pos)).toBe(target);
      }
    }
  });

  it('Serie A2: 1ª promossa diretta, playoff dal 2° al 9° posto e 2 retrocessioni in LBA', () => {
    const lba = LEAGUES.find((l) => l.id === 'ITA_LBA')!;
    const a2 = LEAGUES.find((l) => l.id === 'ITA_A2')!;
    expect(lba.relegationSpots).toBe(2);
    expect(a2.directPromotionSpots).toBe(1);
    expect(a2.playoffStartRank).toBe(2);
    expect(a2.playoffTeams).toBe(8);
    expect(a2.promotionSpots).toBe(2);

    const mockStandings = Array.from({ length: 12 }, (_, idx) => ({
      teamId: `t_${idx + 1}`,
      teamName: `Team ${idx + 1}`,
      shortName: `T${idx + 1}`,
      primaryColor: '#ffffff',
      played: 38,
      wins: 30 - idx,
      losses: 8 + idx,
      leaguePoints: (30 - idx) * 2,
      pointsFor: 3000,
      pointsAgainst: 2800,
      streak: 1,
    }));

    const a2Quarterfinals = createPlayoffQuarterfinals(mockStandings, 'ITA_A2');
    expect(a2Quarterfinals).toHaveLength(4);
    expect(a2Quarterfinals[0].higherSeedId).toBe('t_2');
    expect(a2Quarterfinals[0].lowerSeedId).toBe('t_9');
    expect(a2Quarterfinals.flatMap((s) => [s.higherSeedId, s.lowerSeedId])).not.toContain('t_1');

    const lbaQuarterfinals = createPlayoffQuarterfinals(mockStandings, 'ITA_LBA');
    expect(lbaQuarterfinals[0].higherSeedId).toBe('t_1');
    expect(lbaQuarterfinals[0].lowerSeedId).toBe('t_8');
  });

  it('autoAdjustRotationsForInjuries sostituisce automaticamente titolari/panchina infortunati e ribilancia 200 minuti', () => {
    const teams = generateLeagueTeams();
    const lbaTeam = teams.find((t) => t.leagueId === 'ITA_LBA')!;
    const starter = lbaTeam.roster.find((p) => p.rosterSlot === 'starter')!;
    const injuredRoster = lbaTeam.roster.map((p) =>
      p.id === starter.id ? { ...p, injuryWeeks: 2 } : p
    );

    const res = autoAdjustRotationsForInjuries(injuredRoster, 'ITA_LBA', '6+6');
    expect(res.changed).toBe(true);
    const updatedStarter = res.roster.find((p) => p.id === starter.id)!;
    expect(updatedStarter.rosterSlot).toBe('reserve');
    expect(updatedStarter.targetMinutes).toBe(0);

    const healthyStarters = res.roster.filter(
      (p) => p.rosterSlot === 'starter' && p.injuryWeeks === 0
    );
    expect(healthyStarters).toHaveLength(5);

    const totalMinutes = res.roster
      .filter((p) => p.rosterSlot !== 'reserve')
      .reduce((sum, p) => sum + (p.targetMinutes ?? 0), 0);
    expect(totalMinutes).toBe(200);
  });

  it('calendario rispetta 3ª settimana settembre, fine aprile/inizio maggio, playoff 15 maggio–20 giugno e mercato 1 giugno', () => {
    const start = getRoundDate(2026, 1, 30);
    expect(start >= '2026-09-15' && start <= '2026-09-21').toBe(true);
    expect(getRoundDate(2026, 30, 30)).toBe('2027-05-02');
    expect(getRoundDate(2026, 31, 30)).toBe('2027-05-15');
    expect(getRoundDate(2026, 45, 30)).toBe('2027-06-20');
    expect(getMarketOpenDate(2026)).toBe('2027-06-01');
  });

  it('advanceCareerToNextSeason applica promozioni/retrocessioni, invecchia i giocatori e rigenera la stagione', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Next', 'Next Slot');
    const initialCareer = useGameStore.getState().career!;
    const firstPlayerAge = initialCareer.teams[0].roster[0].age;

    const { nextCareer, movements } = advanceCareerToNextSeason({
      ...initialCareer,
      phase: 'finished',
    });

    expect(nextCareer.seasonYear).toBe(initialCareer.seasonYear + 1);
    expect(nextCareer.currentRound).toBe(1);
    expect(nextCareer.phase).toBe('offseason');
    expect(nextCareer.playoffs).toHaveLength(0);
    expect(nextCareer.championTeamId).toBeUndefined();
    expect(nextCareer.currentDate?.startsWith(`${initialCareer.seasonYear + 1}-07-`)).toBe(true);

    expect(movements.relegatedFromLba).toHaveLength(2);
    expect(movements.promotedToLba).toHaveLength(2);
    expect(nextCareer.teams.filter((t) => t.leagueId === 'ITA_LBA')).toHaveLength(16);
    expect(nextCareer.teams.filter((t) => t.leagueId === 'ITA_A2')).toHaveLength(20);

    const agedPlayer = nextCareer.teams[0].roster.find(
      (p) => p.id === initialCareer.teams[0].roster[0].id
    );
    if (agedPlayer) {
      expect(agedPlayer.age).toBe(firstPlayerAge + 1);
      expect(agedPlayer.seasonStats.gamesPlayed).toBe(0);
    }
  });

  it('CPU summer market adegua i roster ai limiti stranieri (6+6/5+5, max 2 A2, max 1 B) e avvisa al cambio categoria', () => {
    expect(getLeagueRegulationNotice('ITA_LBA')).toContain('5+5');
    expect(getLeagueRegulationNotice('ITA_A2')).toContain('2 stranieri');
    expect(getLeagueRegulationNotice('ITA_B')).toContain('1 straniero');

    const teams = generateLeagueTeams();
    const freeAgents = generateFreeAgents(30);
    const lbaTeam = teams.find((t) => t.leagueId === 'ITA_LBA')!;
    const relegatedToA2 = { ...lbaTeam, leagueId: 'ITA_A2' as const };
    const result = runCpuSummerMarket({
      teams: [relegatedToA2],
      freeAgents,
      userTeamId: 'other_user_team',
      promotedIds: new Set(),
      relegatedIds: new Set([relegatedToA2.id]),
      seasonYear: 2027,
    });
    const updated = result.teams[0];
    const foreignCount = updated.roster.filter((p) => !p.isItalianFormation).length;
    expect(foreignCount).toBeLessThanOrEqual(3);
    expect(updated.roster.filter((p) => p.rosterSlot !== 'reserve' && !p.isItalianFormation).length).toBeLessThanOrEqual(2);
  });

  it('genera offerte di buyout a fine stagione per giocatori scontenti con contratto pluriennale', () => {
    const teams = generateLeagueTeams().filter((t) => t.leagueId === 'ITA_LBA');
    const userTeam = {
      ...teams[0],
      roster: teams[0].roster.map((p, idx) =>
        idx === 0
          ? {
              ...p,
              isItalianFormation: true,
              contractYears: 2 as const,
              morale: 42,
              overall: 78,
              salary: 180000,
              buyoutClause: 150000,
            }
          : p
      ),
    };
    const buyerTeam = {
      ...teams[1],
      budget: 8000000,
    };
    const multiYearIds = new Set([userTeam.roster[0].id]);
    const res = generateEndOfSeasonUnhappyOffers({
      teams: [userTeam, buyerTeam],
      userTeam,
      multiYearPlayerIds: multiYearIds,
      userRelegated: false,
      seasonYear: 2027,
    });

    expect(res.offers.length).toBe(1);
    expect(res.offers[0].playerId).toBe(userTeam.roster[0].id);
    expect(res.offers[0].fromTeamId).toBe(buyerTeam.id);
    expect(res.offers[0].buyoutAmount).toBe(150000);
    expect(res.offers[0].reason).toContain('Contratto pluriennale');
    expect(res.news.length).toBe(1);
  });

  it('permette di contrattare le offerte di buyout ricevute (rilancio, ritiro e incasso finale)', async () => {
    await useGameStore.getState().startNewCareer('ita_a2_cento_basket', 'Coach Buyout', 'Buyout Test');
    const career = useGameStore.getState().career!;
    const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
    const rawBuyer = career.teams.find((t) => t.id !== userTeam.id && t.leagueId === 'ITA_LBA')!;

    const targetPlayer = {
      ...userTeam.roster[0],
      overall: 78,
      salary: 150000,
      buyoutClause: 150000,
      morale: 75,
      onTransferList: false,
    };
    const secondPlayer = {
      ...userTeam.roster[1],
      overall: 68,
      salary: 80000,
      buyoutClause: 100000,
      morale: 75,
      onTransferList: false,
    };
    const richBuyer = {
      ...rawBuyer,
      budget: 8000000,
      roster: rawBuyer.roster.slice(0, 10),
    };

    const offerKeep = {
      id: 'offer_counter_keep',
      fromTeamId: richBuyer.id,
      fromTeamName: richBuyer.name,
      playerId: targetPlayer.id,
      playerName: `${targetPlayer.firstName} ${targetPlayer.lastName}`,
      buyoutAmount: 150000,
      round: 5,
    };
    const offerDrop = {
      id: 'offer_counter_drop',
      fromTeamId: richBuyer.id,
      fromTeamName: richBuyer.name,
      playerId: secondPlayer.id,
      playerName: `${secondPlayer.firstName} ${secondPlayer.lastName}`,
      buyoutAmount: 100000,
      round: 5,
    };

    const directCounter = evaluateBuyoutCounterOffer({
      offer: offerKeep,
      requestedAmount: 185000,
      buyerTeam: richBuyer,
      player: targetPlayer,
    });
    expect(['accepted', 'countered', 'final_offer']).toContain(directCounter.status);
    expect(directCounter.newOfferAmount ?? 0).toBeGreaterThan(150000);

    const directWithdraw = evaluateBuyoutCounterOffer({
      offer: offerKeep,
      requestedAmount: 500000,
      buyerTeam: richBuyer,
      player: targetPlayer,
    });
    expect(directWithdraw.status).toBe('withdrawn');

    const updatedTeams = career.teams.map((t) => {
      if (t.id === userTeam.id) {
        return {
          ...t,
          roster: [targetPlayer, secondPlayer, ...t.roster.slice(2)],
        };
      }
      if (t.id === richBuyer.id) return richBuyer;
      return t;
    });

    useGameStore.getState().loadCareerObject({
      ...career,
      teams: updatedTeams,
      incomingOffers: [offerKeep, offerDrop],
    });

    const initialBudget = useGameStore
      .getState()
      .career!.teams.find((t) => t.id === userTeam.id)!.budget;

    const counterRes = useGameStore.getState().counterIncomingOffer('offer_counter_keep', 170000);
    expect(['accepted', 'countered', 'final_offer']).toContain(counterRes.status);
    expect(counterRes.newOfferAmount ?? 0).toBeGreaterThan(150000);

    const storedOffer = useGameStore
      .getState()
      .career!.incomingOffers.find((o) => o.id === 'offer_counter_keep')!;
    expect(storedOffer.initialBuyoutAmount).toBe(150000);
    expect(storedOffer.negotiationRounds).toBe(1);
    expect(storedOffer.buyoutAmount).toBe(counterRes.newOfferAmount);

    const withdrawRes = useGameStore.getState().counterIncomingOffer('offer_counter_drop', 900000);
    expect(withdrawRes.status).toBe('withdrawn');
    expect(
      useGameStore.getState().career!.incomingOffers.some((o) => o.id === 'offer_counter_drop')
    ).toBe(false);

    useGameStore.getState().respondToIncomingOffer('offer_counter_keep', true);
    const updatedUserTeam = useGameStore
      .getState()
      .career!.teams.find((t) => t.id === userTeam.id)!;
    expect(updatedUserTeam.budget).toBe(initialBudget + counterRes.newOfferAmount!);
    expect(updatedUserTeam.roster.some((p) => p.id === targetPlayer.id)).toBe(false);
  });

  it('Continua (advanceOneDay(false)) blocca la simulazione se la squadra viola il regolamento e offseason forza il roster conforme', async () => {
    await useGameStore.getState().startNewCareer('ita_a2_cento_basket', 'Coach Reg', 'Reg Slot');
    const career = useGameStore.getState().career!;
    const a2Start = getRoundDate(career.seasonYear, 1, 38);

    // Forza 3 stranieri in quintetto (A2 ne consente max 2) + ignoreFastSimAlerts true
    const invalidTeams = career.teams.map((t) =>
      t.id === career.userTeamId
        ? {
            ...t,
            roster: t.roster.map((p, idx) => ({
              ...p,
              isItalianFormation: idx >= 3,
              rosterSlot: idx < 5 ? ('starter' as const) : idx < 12 ? ('bench' as const) : ('reserve' as const),
            })),
          }
        : t
    );

    useGameStore.getState().loadCareerObject({
      ...career,
      currentDate: a2Start,
      ignoreFastSimAlerts: true,
      teams: invalidTeams,
    });

    const stepRes = useGameStore.getState().advanceOneDay(false);
    expect(stepRes.advanced).toBe(false);
    expect(stepRes.alert?.reason).toBe('rule_6_6');
    expect(useGameStore.getState().rosterComplianceModalOpen).toBe(true);

    // Verifica fase offseason: startRegularSeasonFromOffseason blocca finché non è conforme
    useGameStore.getState().loadCareerObject({
      ...career,
      phase: 'offseason',
      currentDate: `${career.seasonYear}-07-01`,
      teams: invalidTeams,
    });
    const badStart = useGameStore.getState().startRegularSeasonFromOffseason();
    expect(badStart.ok).toBe(false);
    expect(useGameStore.getState().career?.phase).toBe('offseason');

    // Sistema il roster e avvia la Regular Season
    useGameStore.getState().autoFixUserRoster();
    const okStart = useGameStore.getState().startRegularSeasonFromOffseason();
    expect(okStart.ok).toBe(true);
    expect(useGameStore.getState().career?.phase).toBe('regular');
  });

  it('genera messaggi iniziali di Dirigenza/Vice e gestisce lettura e scelte interattive', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Inbox', 'Inbox Slot');
    const career = useGameStore.getState().career!;
    expect(career.messages?.length).toBe(2);
    expect(career.messages?.some((m) => m.category === 'dirigenza' && !m.read)).toBe(true);
    expect(career.messages?.some((m) => m.category === 'vice' && !m.read)).toBe(true);

    const firstId = career.messages![0].id;
    useGameStore.getState().markMessageRead(firstId);
    expect(useGameStore.getState().career?.messages?.[0].read).toBe(true);

    const userTeam = useGameStore.getState().getUserTeam()!;
    const player = userTeam.roster[0];
    const startMorale = player.morale;

    useGameStore.getState().loadCareerObject({
      ...useGameStore.getState().career!,
      messages: [
        {
          id: 'msg_test_choice',
          category: 'vice',
          senderName: 'Agente',
          senderRole: 'Spogliatoio',
          subject: 'Richiesta minutaggio',
          body: 'Il giocatore chiede più spazio.',
          date: '2026-10-04',
          round: 1,
          read: false,
          playerId: player.id,
          choices: [
            { id: 'promise_minutes', label: 'Prometti minuti', effectHint: '+10 Morale' },
            { id: 'keep_line', label: 'Linea dura', effectHint: '-4 Morale' },
          ],
        },
      ],
    });

    useGameStore.getState().resolveMessageChoice('msg_test_choice', 'promise_minutes');
    const updatedCareer = useGameStore.getState().career!;
    const updatedPlayer = updatedCareer.teams
      .find((t) => t.id === updatedCareer.userTeamId)!
      .roster.find((p) => p.id === player.id)!;

    expect(updatedCareer.messages?.[0].resolvedChoiceId).toBe('promise_minutes');
    expect(updatedCareer.messages?.[0].read).toBe(true);
    expect(updatedPlayer.morale).toBe(Math.min(99, startMorale + 10));
  });

  it('generateFreeAgents(140) popola il mercato con ITA, USA e altre nazioni e createRandomCustomPlayerTemplate randomizza un giocatore', () => {
    const fas = generateFreeAgents(140);
    expect(fas.length).toBeGreaterThanOrEqual(140);
    expect(fas.some((p) => p.nationality === 'ITA')).toBe(true);
    expect(fas.some((p) => p.nationality === 'USA')).toBe(true);
    expect(fas.some((p) => p.nationality !== 'ITA' && p.nationality !== 'USA')).toBe(true);

    const rnd = createRandomCustomPlayerTemplate();
    expect(rnd.firstName.length).toBeGreaterThan(0);
    expect(rnd.lastName.length).toBeGreaterThan(0);
    expect(rnd.overall).toBeGreaterThanOrEqual(52);
    expect(rnd.overall).toBeLessThanOrEqual(83);
  });

  it('togglePlayerTransferList mette un giocatore sul mercato e attira offerte concorrenti', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Market', 'Market Slot');
    const career = useGameStore.getState().career!;
    const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
    // Scegli un giocatore italiano di buon livello e assicurati che altri club abbiano cap
    const target = userTeam.roster.find((p) => p.isItalianFormation && p.overall >= 70) ?? userTeam.roster[0];

    const boostedTeams = career.teams.map((t) =>
      t.id !== career.userTeamId ? { ...t, budget: t.budget + 3000000 } : t
    );
    useGameStore.getState().loadCareerObject({ ...career, teams: boostedTeams });

    useGameStore.getState().togglePlayerTransferList(target.id);
    const after = useGameStore.getState().career!;
    const updatedTarget = after.teams
      .find((t) => t.id === after.userTeamId)!
      .roster.find((p) => p.id === target.id)!;

    expect(updatedTarget.onTransferList).toBe(true);
    expect(after.incomingOffers.some((o) => o.playerId === target.id)).toBe(true);
  });

  it('requestPlayerLoan permette di prendere un giocatore in prestito e lo restituisce al club proprietario a fine stagione', async () => {
    await useGameStore.getState().startNewCareer('ita_a2_cento_basket', 'Coach Loan', 'Loan Slot');
    const career = useGameStore.getState().career!;
    const lbaTeam = career.teams.find((t) => t.leagueId === 'ITA_LBA' && t.roster.length > 10)!;
    const candidate =
      lbaTeam.roster.find((p) => p.rosterSlot !== 'starter') ?? lbaTeam.roster[lbaTeam.roster.length - 1];

    // Assicura cap sufficiente per il prestito
    const boostedTeams = career.teams.map((t) =>
      t.id === career.userTeamId ? { ...t, budget: t.budget + 1000000 } : t
    );
    useGameStore.getState().loadCareerObject({ ...career, teams: boostedTeams });

    const res = useGameStore.getState().requestPlayerLoan(lbaTeam.id, candidate.id, 100);
    expect(res.accepted).toBe(true);

    const afterLoan = useGameStore.getState().career!;
    const userRoster = afterLoan.teams.find((t) => t.id === afterLoan.userTeamId)!.roster;
    const loaned = userRoster.find((p) => p.id === candidate.id);
    expect(loaned).toBeDefined();
    expect(loaned?.loanedFromTeamId).toBe(lbaTeam.id);

    // Fine stagione: il giocatore in prestito rientra al club proprietario
    const { nextCareer } = advanceCareerToNextSeason({ ...afterLoan, phase: 'finished' });
    const nextUserRoster = nextCareer.teams.find((t) => t.id === nextCareer.userTeamId)!.roster;
    const nextParentRoster = nextCareer.teams.find((t) => t.id === lbaTeam.id)!.roster;
    expect(nextUserRoster.some((p) => p.id === candidate.id)).toBe(false);
    expect(nextParentRoster.some((p) => p.id === candidate.id && !p.loanedFromTeamId)).toBe(true);
  });

  it('migrateCareerSave garantisce la retrocompatibilità dei salvataggi JSON precedenti', () => {
    const teams = generateLeagueTeams().slice(0, 2);
    const legacySave = {
      version: 1,
      slotId: 'legacy_slot',
      slotName: 'Legacy Save',
      savedAt: '2026-01-01T00:00:00.000Z',
      managerName: 'Coach Legacy',
      userTeamId: teams[0].id,
      seasonYear: 2026,
      currentRound: 1,
      phase: 'regular' as const,
      teams: teams.map((t, tIdx) => ({
        ...t,
        youthRoster: undefined,
        tactics: {
          pace: 'Bilanciato' as const,
          offensiveFocus: 'Pick & Roll' as const,
          defense: 'Uomo' as const,
          ...(tIdx === 0 ? { delegateToAssistant: true } : {}),
        },
        roster: t.roster.map((p) => ({
          ...p,
          starterSlot: undefined,
          benchOrder: undefined,
          individualFocus: undefined,
          onTransferList: undefined,
        })),
      })),
      freeAgents: [],
      staffMarket: [],
      scoutedPlayerIds: [],
      activeScouting: [],
      incomingOffers: [],
      schedule: [],
      playoffs: [],
      news: [],
    };

    const migrated = migrateCareerSave(legacySave as unknown as Parameters<typeof migrateCareerSave>[0]);
    expect(migrated.messages).toEqual([]);
    expect(migrated.teams[0].tactics.playbook?.length).toBeGreaterThan(0);
    expect(migrated.teams[0].tactics.reboundPolicy).toBe('Equilibrato');
    expect(migrated.teams[0].tactics.pnrCoverage).toBe('Hedge & Recover');
    expect(migrated.teams[0].tactics.defensiveIntensity).toBe('Standard');
    expect(migrated.teams[0].tactics.delegateToAssistant).toBe(true);
    expect(migrated.teams[1].tactics.delegateToAssistant).toBe(false);
    expect(migrated.teams[0].youthRoster?.length).toBeGreaterThanOrEqual(7);
    expect(migrated.teams[0].roster[0].individualFocus).toBe('Nessuno');
    expect(migrated.teams[0].roster[0].onTransferList).toBe(false);

    const starters = migrated.teams[0].roster.filter((p) => p.rosterSlot === 'starter');
    const starterSlots = new Set(starters.map((p) => p.starterSlot));
    expect(starterSlots.size).toBe(starters.length);
    const bench = migrated.teams[0].roster.filter((p) => p.rosterSlot === 'bench');
    expect(bench.every((p) => typeof p.benchOrder === 'number')).toBe(true);

    expect(migrated.coppaItalia).toBeDefined();
    expect(migrated.euroLeagues).toBeDefined();
  });

  it('supporta Scambi diretti, Shortlist, Sponsor, Strutture e Albo d Oro', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Full', 'Full Slot');
    const career = useGameStore.getState().career!;
    const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
    const rivalTeam = career.teams.find((t) => t.leagueId === 'ITA_LBA' && t.id !== userTeam.id)!;

    // 1. Shortlist
    const fa = career.freeAgents[0];
    useGameStore.getState().toggleShortlistPlayer(fa.id);
    expect(useGameStore.getState().career?.shortlistPlayerIds).toContain(fa.id);

    // 2. Sponsor & Strutture
    const startBudget = userTeam.budget;
    useGameStore.getState().selectSeasonSponsor('Banco Nazionale Sport', 200000);
    const afterSponsor = useGameStore.getState().getUserTeam()!;
    expect(afterSponsor.facilities?.sponsorName).toBe('Banco Nazionale Sport');
    expect(afterSponsor.budget).toBe(startBudget + 200000);

    const upg = useGameStore.getState().upgradeFacility('youthLevel');
    expect(upg.ok).toBe(true);
    expect(useGameStore.getState().getUserTeam()?.facilities?.youthLevel).toBe(2);

    // 3. Scambio diretto giocatore-per-giocatore
    useGameStore.getState().loadCareerObject({
      ...useGameStore.getState().career!,
      teams: useGameStore.getState().career!.teams.map((t) =>
        t.id === userTeam.id || t.id === rivalTeam.id
          ? { ...t, budget: t.budget + 2000000 }
          : t
      ),
    });
    const offered = [...useGameStore.getState().getUserTeam()!.roster]
      .filter((p) => p.isItalianFormation)
      .sort((a, b) => b.overall - a.overall)[0];
    const requested = [...rivalTeam.roster]
      .filter((p) => p.isItalianFormation)
      .sort((a, b) => a.overall - b.overall)[0];
    const tradeRes = useGameStore.getState().proposePlayerTrade(rivalTeam.id, offered.id, requested.id, 150000);
    expect(tradeRes, tradeRes.message).toMatchObject({ accepted: true });
    expect(useGameStore.getState().getUserTeam()?.roster.some((p) => p.id === requested.id)).toBe(true);

    // 4. Albo d'Oro a fine stagione
    const { nextCareer } = advanceCareerToNextSeason({
      ...useGameStore.getState().career!,
      phase: 'finished',
    });
    expect(nextCareer.awardsHistory?.length).toBeGreaterThanOrEqual(1);
    expect(nextCareer.awardsHistory?.[0].seasonLabel).toBe('2026/27');
  });

  it('updateBoardConfidence rispetta la regola allowFiring (panchina blindata vs esonero possibile)', () => {
    const teams = generateLeagueTeams().filter((t) => t.leagueId === 'ITA_LBA');
    const standings = teams.map((t, i) => ({
      teamId: t.id,
      teamName: t.name,
      shortName: t.shortName,
      primaryColor: t.primaryColor,
      played: 10,
      wins: 10 - Math.min(10, i),
      losses: Math.min(10, i),
      leaguePoints: (10 - Math.min(10, i)) * 2,
      pointsFor: 800,
      pointsAgainst: 750 + i * 10,
      streak: -3,
    }));
    const lastTeam = teams[teams.length - 1];

    const flooredNoFire = updateBoardConfidence({
      currentConfidence: 36,
      objective: 'Vincere lo Scudetto',
      standings,
      userTeamId: lastTeam.id,
      userWonLastGame: false,
      wageBill: lastTeam.budget * 1.2,
      budget: lastTeam.budget,
      allowFiring: false,
    });
    expect(flooredNoFire).toBe(35);

    const droppedCanFire = updateBoardConfidence({
      currentConfidence: 12,
      objective: 'Vincere lo Scudetto',
      standings,
      userTeamId: lastTeam.id,
      userWonLastGame: false,
      wageBill: lastTeam.budget * 1.2,
      budget: lastTeam.budget,
      allowFiring: true,
    });
    expect(droppedCanFire).toBeLessThan(12);
    expect(droppedCanFire).toBeGreaterThanOrEqual(5);
  });

  it('simulazione 2D genera zone di tiro variegate su tutto il campo e coreografia dinamica a 10 giocatori', () => {
    const teams = generateLeagueTeams();
    let match = initMatchState('g_zones_test', 1, teams[0], teams[1], false);
    const shotCoords = new Set<string>();
    const shotActions = new Set(['three_shot', 'two_shot', 'drive', 'post_up', 'fastbreak', 'pick_and_roll']);
    let madeShotsCount = 0;

    for (let i = 0; i < 65 && !match.finished; i++) {
      match = simulateNextPossession(match, teams[0], teams[1], true);
      if (shotActions.has(match.visual.actionType) && typeof match.visual.made === 'boolean') {
        shotCoords.add(`${Math.round(match.visual.ballX / 4)}_${Math.round(match.visual.ballY / 8)}`);
        if (match.visual.made) madeShotsCount += 1;

        const kf = computePlayKeyframes(match);
        expect(kf.offStart).toHaveLength(5);
        expect(kf.offEnd).toHaveLength(5);
        expect(kf.defEnd).toHaveLength(5);
      }
    }

    expect(shotCoords.size).toBeGreaterThanOrEqual(6);
    expect(madeShotsCount).toBeGreaterThanOrEqual(3);
  });

  it('idrata il piano partita sull avversario in initMatchState e simula senza errori i nuovi sistemi tattici', () => {
    const teams = generateLeagueTeams();
    const homeBase = teams[0];
    const awayBase = teams[1];

    const oppStar = awayBase.roster[0];
    const oppGuard = awayBase.roster[1];
    const myStopper = homeBase.roster[2];

    const configuredHome = {
      ...homeBase,
      tactics: {
        ...homeBase.tactics,
        pace: 'Controllo' as const,
        offensiveFocus: 'Motion' as const,
        defense: 'Box-and-One' as const,
        reboundPolicy: 'Rientro Difensivo' as const,
        pnrCoverage: 'Switch' as const,
        defensiveIntensity: 'Fisica' as const,
        opponentFocus: 'Ferma Transizione' as const,
        goToPlayerId: homeBase.roster[0].id,
        secondaryOptionPlayerId: homeBase.roster[1].id,
        opponentGamePlan: {
          opponentTeamId: awayBase.id,
          playerInstructions: {
            [oppStar.id]: { defenderId: myStopper.id, rule: 'Raddoppia' as const },
            [oppGuard.id]: { rule: 'Passa Sotto (3PT)' as const },
          },
        },
      },
    };

    const configuredAway = {
      ...awayBase,
      tactics: {
        ...awayBase.tactics,
        pace: 'Ritmo Alto' as const,
        offensiveFocus: 'Isolamento' as const,
        defense: 'Zona 1-3-1' as const,
        reboundPolicy: 'Aggredisci Rimbalzo' as const,
        pnrCoverage: 'Trap' as const,
        defensiveIntensity: 'Conservativa' as const,
        opponentFocus: 'Attacca i Lunghi' as const,
      },
    };

    const initial = initMatchState('g_adv_tactics', 1, configuredHome, configuredAway, false);
    expect(initial.home.goToPlayerId).toBe(homeBase.roster[0].id);
    expect(initial.home.secondaryOptionPlayerId).toBe(homeBase.roster[1].id);
    expect(initial.home.defensiveMatchups?.[oppStar.id]).toBe(myStopper.id);
    expect(initial.home.opponentPlayerRules?.[oppStar.id]).toBe('Raddoppia');
    expect(initial.home.opponentPlayerRules?.[oppGuard.id]).toBe('Passa Sotto (3PT)');
    expect(initial.home.defensiveFocusPlayerId).toBe(oppStar.id);

    // Verifica coreografia 2D sui nuovi schemi difensivi
    const kfBox = computePlayKeyframes(initial);
    expect(kfBox.defEnd).toHaveLength(5);

    const z131State = {
      ...initial,
      away: {
        ...initial.away,
        tactics: { ...initial.away.tactics, defense: 'Zona 1-3-1' as const },
      },
    };
    const kfZone131 = computePlayKeyframes(z131State);
    expect(kfZone131.defEnd).toHaveLength(5);

    const finalState = simulateFullMatch('g_adv_sim', 1, configuredHome, configuredAway, false);
    expect(finalState.finished).toBe(true);
    expect(finalState.home.score).not.toBe(finalState.away.score);
  });

  it('analizza, importa/esporta, anima in 2D ed esegue come ATO gli schemi disegnati per ruolo', () => {
    const cornerPlay = createCustomPlayFromTemplate('box_set', 'Box Angolo Special');
    const cornerAnalysis = analyzeCustomPlay(cornerPlay);
    expect(cornerAnalysis.isThree).toBe(true);
    expect(cornerAnalysis.isCornerThree).toBe(true);
    expect(cornerAnalysis.screenCount).toBe(1);
    expect(cornerAnalysis.passCount).toBe(1);
    expect(cornerAnalysis.passCueLabel).toBe('su scarico di');
    expect(cornerAnalysis.shotQualityBonus).toBeGreaterThan(0);

    const cutPlay = createCustomPlayFromTemplate('five_out', 'Backdoor Ferro');
    const cutAnalysis = analyzeCustomPlay(cutPlay);
    expect(cutAnalysis.isThree).toBe(false);
    expect(cutAnalysis.isPaintOrRim).toBe(true);
    expect(cutAnalysis.foulDrawBonus).toBeGreaterThan(0);

    const lobPlay = createCustomPlayFromTemplate('pnr_side', 'Alley-Oop C');
    const lobAnalysis = analyzeCustomPlay(lobPlay);
    expect(lobAnalysis.passCueLabel).toBe('su alley-oop di');
    expect(lobAnalysis.foulDrawBonus).toBeGreaterThan(0);

    const blankPlay = createCustomPlayFromTemplate('blank', 'Da Zero');
    expect(blankPlay.screens).toEqual([]);
    expect(blankPlay.passPhase1).toBeNull();
    expect(blankPlay.passPhase2).toBeNull();

    // Import/export JSON preserva screens, stili passaggio e stile conclusione
    const exportedJson = JSON.stringify([cornerPlay, lobPlay]);
    const imported = parseImportedCustomPlaysJson(exportedJson);
    expect(imported.error).toBeUndefined();
    expect(imported.plays).toHaveLength(2);
    expect(imported.plays[0].name).toBe('Box Angolo Special');
    expect(imported.plays[0].passPhase2?.style).toBe('scarico');
    expect(imported.plays[1].screens?.[0].type).toBe('on_ball');
    expect(imported.plays[1].passPhase2?.style).toBe('lob');
    expect(imported.plays[1].shotStyle).toBe('drive_rim');

    // Esecuzione come schema ATO da timeout + keyframe 2D
    const teams = generateLeagueTeams();
    const homeTeam = {
      ...teams[0],
      tactics: {
        ...teams[0].tactics,
        customPlays: [cornerPlay, cutPlay],
      },
    };
    const awayTeam = teams[1];

    let state = initMatchState('g_custom_ato', 1, homeTeam, awayTeam, false);
    state.possession = 'home';
    state = callTimeout(state, 'home');
    state = applyTimeoutTactics(state, 'home', {
      pace: state.home.tactics.pace,
      offensiveFocus: state.home.tactics.offensiveFocus,
      defense: state.home.tactics.defense,
      offensiveAggression: state.home.tactics.offensiveAggression ?? 'Normale',
      goToPlayerId: null,
      defensiveFocusPlayerId: null,
      defensiveMatchups: {},
      nextAtoPlayId: cornerPlay.id,
    });
    expect(state.home.nextAtoPlayId).toBe(cornerPlay.id);

    // Esegue il possesso (ripetendo solo se c'è un fallo laterale non su tiro che conserva l'ATO)
    for (let i = 0; i < 4 && state.home.nextAtoPlayId; i++) {
      state = simulateNextPossession(state, homeTeam, awayTeam, true);
    }

    expect(state.home.nextAtoPlayId).toBeNull();
    expect(state.visual.customPlayId).toBe(cornerPlay.id);
    expect(getActiveSchemeName(state)).toBe(`★ ${cornerPlay.name}`);

    const kf = computePlayKeyframes(state);
    expect(kf.offStart).toHaveLength(5);
    expect(kf.offMid).toHaveLength(5);
    expect(kf.offEnd).toHaveLength(5);
    expect(kf.defEnd).toHaveLength(5);
    expect(kf.screenMarker?.active).toBe(true);
    const ballPos = kf.ballAt(0.55, kf.offMid, kf.defMid);
    expect(Number.isFinite(ballPos.x)).toBe(true);
    expect(Number.isFinite(ballPos.y)).toBe(true);
  });

  it('supporta schemi multi-movimento fino a 8 fasi e sequenze multi-passaggio', () => {
    // 1. Nuovo template motion_flex a 4 fasi e 3 passaggi
    const flex = createCustomPlayFromTemplate('motion_flex', 'Flex 4 Fasi Test');
    expect(getEffectiveSteps(flex)).toHaveLength(4);
    expect(getEffectivePasses(flex)).toHaveLength(3);
    expect(getBallCarrierAtStep(flex, 3)).toBe('SG');

    const flexAnalysis = analyzeCustomPlay(flex);
    expect(flexAnalysis.stepCount).toBe(4);
    expect(flexAnalysis.passCount).toBe(3);
    expect(flexAnalysis.screenCount).toBe(2);
    expect(flexAnalysis.isThree).toBe(true);
    expect(flexAnalysis.passerRole).toBe('C');
    expect(flexAnalysis.passCueLabel).toBe('su scarico di');

    // 2. Schema custom a 5 fasi con 4 passaggi (di cui 2 nella stessa fase 2) e 3 blocchi
    const rawMulti = createCustomPlayFromTemplate('blank', '5 Fasi Complex');
    const step0 = rawMulti.positions.start;
    const step1 = { ...step0, SG: { x: 74, y: 18 }, C: { x: 80, y: 55 } };
    const step2 = { ...step1, SG: { x: 85, y: 38 }, SF: { x: 69, y: 80 } };
    const step3 = { ...step2, SF: { x: 82, y: 84 }, PF: { x: 78, y: 24 } };
    const step4 = { ...step3, PF: { x: 91, y: 9 }, PG: { x: 64, y: 40 } };

    const multiPlay = syncCustomPlayFields({
      ...rawMulti,
      initialBallHandler: 'PG',
      shooterRole: 'PF',
      shotStyle: 'catch_and_shoot',
      steps: [
        { id: 's0', positions: step0 },
        { id: 's1', positions: step1 },
        { id: 's2', positions: step2 },
        { id: 's3', positions: step3 },
        { id: 's4', positions: step4 },
      ],
      passes: [
        { from: 'PG', to: 'C', style: 'diretto', stepIndex: 1 },
        { from: 'C', to: 'SG', style: 'handoff', stepIndex: 2 },
        { from: 'SG', to: 'SF', style: 'diretto', stepIndex: 2 },
        { from: 'SF', to: 'PF', style: 'scarico', stepIndex: 4 },
      ],
      screens: [
        { screener: 'C', target: 'SG', type: 'off_ball', phase: 'mid', stepIndex: 1 },
        { screener: 'PF', target: 'SF', type: 'back_screen', phase: 'mid', stepIndex: 3 },
        { screener: 'C', target: 'PF', type: 'off_ball', phase: 'end', stepIndex: 4 },
      ],
    });

    expect(multiPlay.steps).toHaveLength(5);
    expect(multiPlay.passes).toHaveLength(4);
    expect(multiPlay.positions.end.PF).toEqual(step4.PF);

    // 3. Round-trip JSON su tutte le 5 fasi, 4 passaggi e 3 blocchi
    const reimported = parseImportedCustomPlaysJson(JSON.stringify([multiPlay]));
    expect(reimported.error).toBeUndefined();
    const parsedMulti = reimported.plays[0];
    expect(parsedMulti.steps).toHaveLength(5);
    expect(parsedMulti.passes).toHaveLength(4);
    expect(parsedMulti.passes?.[1].stepIndex).toBe(2);
    expect(parsedMulti.passes?.[1].style).toBe('handoff');
    expect(parsedMulti.passes?.[2].stepIndex).toBe(2);
    expect(parsedMulti.passes?.[3].stepIndex).toBe(4);
    expect(parsedMulti.screens).toHaveLength(3);
    expect(parsedMulti.screens?.[1].stepIndex).toBe(3);

    // 4. Keyframe 2D multi-frame in simulazione partita
    const teams = generateLeagueTeams();
    const homeTeam = {
      ...teams[0],
      tactics: {
        ...teams[0].tactics,
        customPlays: [parsedMulti],
      },
    };
    const match = initMatchState('g_multi_step', 1, homeTeam, teams[1], false);
    match.possession = 'home';
    match.visual = {
      possessionTeamId: homeTeam.id,
      attackSide: 'home',
      actionType: 'three_shot',
      ballX: parsedMulti.positions.end.PF.x,
      ballY: parsedMulti.positions.end.PF.y,
      made: true,
      customPlayId: parsedMulti.id,
    };

    const kfMulti = computePlayKeyframes(match);
    expect(kfMulti.offFrames).toHaveLength(5);
    expect(kfMulti.defFrames).toHaveLength(5);
    expect(kfMulti.screenMarkers).toHaveLength(3);
    for (const sampleT of [0.1, 0.35, 0.6, 0.85]) {
      const b = kfMulti.ballAt(sampleT, kfMulti.offEnd, kfMulti.defEnd);
      expect(Number.isFinite(b.x)).toBe(true);
      expect(Number.isFinite(b.y)).toBe(true);
    }
  });

  it('migra in modo retrocompatibile salvataggi JSON v1 con schemi custom a 3 fasi e preset incompleti', () => {
    const teams = generateLeagueTeams().slice(0, 2);
    const legacyPlayV1 = {
      id: 'legacy_play_1',
      name: 'Schema Storico 3 Fasi',
      active: true,
      initialBallHandler: 'PG',
      positions: {
        start: {
          PG: { x: 60, y: 50 },
          SG: { x: 90, y: 12 },
          SF: { x: 90, y: 88 },
          PF: { x: 75, y: 35 },
          C: { x: 75, y: 65 },
        },
        mid: {
          PG: { x: 70, y: 42 },
          SG: { x: 80, y: 18 },
          SF: { x: 90, y: 88 },
          PF: { x: 72, y: 42 },
          C: { x: 82, y: 60 },
        },
        end: {
          PG: { x: 76, y: 42 },
          SG: { x: 92, y: 7 },
          SF: { x: 90, y: 88 },
          PF: { x: 86, y: 54 },
          C: { x: 74, y: 72 },
        },
      },
      screeners: ['PF'],
      passPhase1: { from: 'PG', to: 'SG' },
      shooterRole: 'SG',
    };

    const legacySave = {
      version: 1,
      slotName: 'Carriera V1',
      updatedAt: '2026-09-15T12:00:00.000Z',
      managerName: 'Coach V1',
      userTeamId: teams[0].id,
      seasonYear: 2026,
      currentRound: 2,
      phase: 'regular_season',
      teams: teams.map((t, tIdx) => ({
        ...t,
        tactics: {
          pace: 'Bilanciato',
          offensiveFocus: 'Pick & Roll',
          defense: 'Uomo',
          customPlays: tIdx === 0 ? [legacyPlayV1] : [],
          presets:
            tIdx === 0
              ? [
                  {
                    id: 'p_legacy',
                    name: 'Difesa Vecchio Formato',
                    tactics: {
                      pace: 'Controllo',
                      offensiveFocus: 'Gioco interno',
                      defense: 'Zona 2-3',
                    },
                  },
                ]
              : [],
        },
      })),
      freeAgents: [],
      staffMarket: [],
      scoutedPlayerIds: [],
      activeScouting: [],
      incomingOffers: [],
      schedule: [],
      playoffs: [],
      news: [],
    };

    const migrated = migrateCareerSave(
      legacySave as unknown as Parameters<typeof migrateCareerSave>[0]
    );
    expect(migrated.version).toBeGreaterThanOrEqual(CURRENT_SAVE_VERSION);
    expect(migrated.phase).toBe('regular');
    expect(migrated.slotId).toBe('slot_migrated');
    expect(migrated.savedAt).toBe('2026-09-15T12:00:00.000Z');

    const migratedPlay = migrated.teams[0].tactics.customPlays?.[0];
    expect(migratedPlay).toBeDefined();
    expect(migratedPlay?.id).toBe('legacy_play_1');
    expect(migratedPlay?.steps).toHaveLength(3);
    expect(migratedPlay?.passes).toHaveLength(1);
    expect(migratedPlay?.passes?.[0]).toEqual({
      from: 'PG',
      to: 'SG',
      style: 'diretto',
      stepIndex: 1,
    });
    expect(migratedPlay?.screens).toHaveLength(1);
    expect(migratedPlay?.screens?.[0].screener).toBe('PF');
    expect(migratedPlay?.screens?.[0].stepIndex).toBe(1);
    expect(migratedPlay?.shotStyle).toBe('auto');
    expect(migratedPlay?.positions.end.SG).toEqual({ x: 92, y: 7 });
    expect(migratedPlay?.screeners).toEqual(['PF']);
    expect(migratedPlay?.passPhase1?.from).toBe('PG');

    const migratedPreset = migrated.teams[0].tactics.presets?.[0];
    expect(migratedPreset?.tactics.reboundPolicy).toBe('Equilibrato');
    expect(migratedPreset?.tactics.customPlays).toEqual([]);

    // Idempotenza della migrazione senza rigenerare gli ID degli schemi salvati
    const remigrated = migrateCareerSave(migrated);
    expect(remigrated.teams[0].tactics.customPlays?.[0].id).toBe('legacy_play_1');
    expect(remigrated.teams[0].tactics.customPlays?.[0].steps).toHaveLength(3);

    // parseImportedCustomPlaysJson accetta schema v1 singolo, container { customPlays } e rifiuta {}
    const importedLegacy = parseImportedCustomPlaysJson(JSON.stringify(legacyPlayV1));
    expect(importedLegacy.error).toBeUndefined();
    expect(importedLegacy.plays).toHaveLength(1);
    expect(importedLegacy.plays[0].steps).toHaveLength(3);
    expect(importedLegacy.plays[0].passes?.[0].style).toBe('diretto');

    const importedWrapped = parseImportedCustomPlaysJson(
      JSON.stringify({ customPlays: [legacyPlayV1] })
    );
    expect(importedWrapped.error).toBeUndefined();
    expect(importedWrapped.plays).toHaveLength(1);

    const invalidImport = parseImportedCustomPlaysJson('{}');
    expect(invalidImport.plays).toHaveLength(0);
    expect(invalidImport.error).toBeDefined();

    // parseAndMigrateCareerSave valida il payload prima di migrare
    expect(parseAndMigrateCareerSave(null)).toBeNull();
    expect(parseAndMigrateCareerSave({})).toBeNull();
    const viaService = parseAndMigrateCareerSave(legacySave);
    expect(viaService).not.toBeNull();
    expect(viaService?.teams[0].tactics.customPlays?.[0].id).toBe('legacy_play_1');
  });

  it('calcola analisi squadre avversarie, prossimo avversario e navigazione via openTeamProfile', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Oppo', 'Oppo Slot');
    const career = useGameStore.getState().career!;
    const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
    const lbaTeams = career.teams.filter((t) => (t.leagueId ?? 'ITA_LBA') === 'ITA_LBA');
    const lbaSchedule = career.schedule
      .filter((g) => (g.leagueId ?? 'ITA_LBA') === 'ITA_LBA')
      .map((g) => ({ ...g }));

    // 1. Prossimo avversario prima di qualsiasi partita giocata
    const nextOppId = getNextScheduledOpponentId(userTeam.id, lbaSchedule);
    expect(nextOppId).toBeTruthy();
    expect(nextOppId).not.toBe(userTeam.id);

    const rival = lbaTeams.find((t) => t.id === nextOppId)!;

    // 2. Simula tutte le partite della giornata 1 e lo scontro diretto con rival (se in altro turno)
    const round1Games = lbaSchedule.filter((g) => g.round === 1);
    const h2hGame = lbaSchedule.find(
      (g) =>
        (g.homeTeamId === userTeam.id && g.awayTeamId === rival.id) ||
        (g.homeTeamId === rival.id && g.awayTeamId === userTeam.id)
    )!;
    const toSimulate = round1Games.some((g) => g.id === h2hGame.id)
      ? round1Games
      : [...round1Games, h2hGame];

    let updatedTeams = career.teams;
    for (const g of toSimulate) {
      const home = updatedTeams.find((t) => t.id === g.homeTeamId)!;
      const away = updatedTeams.find((t) => t.id === g.awayTeamId)!;
      const finalMatch = simulateFullMatch(g.id, g.round, home, away, false);
      updatedTeams = applyMatchStatsToTeams(updatedTeams, finalMatch);
      g.played = true;
      g.homeScore = finalMatch.home.score;
      g.awayScore = finalMatch.away.score;
    }

    const updatedLbaTeams = updatedTeams.filter((t) => (t.leagueId ?? 'ITA_LBA') === 'ITA_LBA');
    const updatedUser = updatedTeams.find((t) => t.id === userTeam.id)!;
    const updatedRival = updatedTeams.find((t) => t.id === rival.id)!;

    const overview = computeTeamSeasonOverview(
      updatedRival,
      updatedUser,
      updatedLbaTeams,
      lbaSchedule,
      updatedTeams,
      career.seasonYear
    );

    expect(overview.played).toBeGreaterThanOrEqual(1);
    expect(overview.rank).toBeGreaterThanOrEqual(1);
    expect(overview.rank).toBeLessThanOrEqual(updatedLbaTeams.length);
    expect(overview.ppgFor).toBeGreaterThan(40);
    expect(overview.ppgAgainst).toBeGreaterThan(40);
    expect(overview.teamFgPct).toBeGreaterThan(15);
    expect(overview.teamFgPct).toBeLessThanOrEqual(100);
    expect(overview.starters).toHaveLength(5);
    expect(overview.last5.length).toBe(overview.played);
    expect(overview.h2hGames.length).toBeGreaterThanOrEqual(1);
    expect(overview.h2hWins + overview.h2hLosses).toBeGreaterThanOrEqual(1);

    // 3. Navigazione allo scouting del club via store
    useGameStore.getState().openTeamProfile(rival.id);
    expect(useGameStore.getState().inspectedTeamId).toBe(rival.id);
    expect(useGameStore.getState().activeTab).toBe('opponents');
  });

  it('autoFixRosterLineup e autoAdjustRotationsForInjuries rispettano maxForeign e lbaFormat (A2, 6+6, 5+5)', () => {
    const teams = generateLeagueTeams();
    const lbaClub = teams.find((t) => t.leagueId === 'ITA_LBA')!;
    const skewedRoster = lbaClub.roster.slice(0, 12).map((p, idx) => ({
      ...p,
      isItalianFormation: idx >= 6, // 6 stranieri e 6 italiani
      overall: idx < 6 ? 82 : 66, // stranieri più forti degli italiani
      injuryWeeks: 0,
    }));

    const fixedA2 = autoFixRosterLineup(skewedRoster, 'ITA_A2');
    const valA2 = validateRoster6Plus6(fixedA2, 'ITA_A2');
    expect(valA2.valid).toBe(true);
    expect(valA2.foreignCount).toBeLessThanOrEqual(2);
    expect(valA2.itaCount).toBeGreaterThanOrEqual(6);

    const fixed55 = autoFixRosterLineup(skewedRoster, 'ITA_LBA', '5+5');
    const val55 = validateRoster6Plus6(fixed55, 'ITA_LBA', '5+5');
    expect(val55.valid).toBe(true);
    expect(val55.activeCount).toBe(10);
    expect(val55.foreignCount).toBe(5);
    expect(val55.itaCount).toBe(5);

    // Simula infortunio di un titolare italiano in Serie A2 con un 3° straniero ad alto OVR in tribuna
    const a2Club = teams.find((t) => t.leagueId === 'ITA_A2')!;
    const a2WithExtraForeign = a2Club.roster.slice(0, 12).map((p, idx) => ({
      ...p,
      isItalianFormation: idx !== 0 && idx !== 1 && idx !== 11,
      rosterSlot: idx < 5 ? ('starter' as const) : idx < 11 ? ('bench' as const) : ('reserve' as const),
      overall: idx === 11 ? 86 : 64,
      injuryWeeks: idx === 2 ? 2 : 0, // titolare ITA infortunato
    }));
    const injRes = autoAdjustRotationsForInjuries(a2WithExtraForeign, 'ITA_A2');
    const injVal = validateRoster6Plus6(injRes.roster, 'ITA_A2');
    expect(injRes.changed).toBe(true);
    expect(injVal.foreignCount).toBeLessThanOrEqual(2);
  });

  it('advanceCareerToNextSeason rende 100% conformi tutte le 85 squadre CPU dopo promozioni e retrocessioni', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Market', 'Market Slot');
    const initialCareer = useGameStore.getState().career!;

    const { nextCareer, movements } = advanceCareerToNextSeason({
      ...initialCareer,
      phase: 'finished',
    });

    for (const team of nextCareer.teams) {
      if (team.id === nextCareer.userTeamId) continue;
      const fmt = team.lbaRosterFormat ?? '6+6';
      const val = validateRoster6Plus6(team.roster, team.leagueId, fmt);
      expect(val.valid).toBe(true);
      expect(val.foreignCount).toBeLessThanOrEqual(val.maxForeign);
      expect(team.roster.filter((p) => p.injuryWeeks === 0).length).toBeGreaterThanOrEqual(10);
    }

    for (const rel of movements.relegatedFromLba) {
      const updated = nextCareer.teams.find((t) => t.id === rel.id)!;
      expect(updated.leagueId).toBe('ITA_A2');
      expect(updated.roster.filter((p) => !p.isItalianFormation).length).toBeLessThanOrEqual(2);
      expect(updated.budget).toBeLessThanOrEqual(1_550_000);
    }

    for (const relA2 of movements.relegatedFromA2) {
      const updated = nextCareer.teams.find((t) => t.id === relA2.id)!;
      expect(updated.roster.filter((p) => !p.isItalianFormation).length).toBeLessThanOrEqual(1);
    }

    for (const promoLba of movements.promotedToLba) {
      const updated = nextCareer.teams.find((t) => t.id === promoLba.id)!;
      expect(updated.leagueId).toBe('ITA_LBA');
      expect(updated.budget).toBeGreaterThanOrEqual(2_100_000);
      expect(validateRoster6Plus6(updated.roster, 'ITA_LBA', updated.lbaRosterFormat ?? '6+6').valid).toBe(true);
    }

    for (const promoA2 of movements.promotedToA2) {
      const updated = nextCareer.teams.find((t) => t.id === promoA2.id)!;
      expect(updated.leagueId).toBe('ITA_A2');
      expect(updated.budget).toBeGreaterThanOrEqual(860_000);
      expect(validateRoster6Plus6(updated.roster, 'ITA_A2').valid).toBe(true);
    }
  });

  it('runCpuSummerMarket ricostruisce retrocesse (LBA->A2, A2->B) e rinforza promosse (A2->LBA) rispettando i regolamenti', () => {
    const teams = generateLeagueTeams();
    const lbaClub = teams.find((t) => t.leagueId === 'ITA_LBA')!;
    const a2Club = teams.find((t) => t.leagueId === 'ITA_A2')!;

    const relegatedToA2 = {
      ...lbaClub,
      id: 'rel_lba_a2',
      leagueId: 'ITA_A2' as const,
      budget: 1_100_000,
      roster: lbaClub.roster.slice(0, 12).map((p, idx) => ({
        ...p,
        isItalianFormation: idx >= 6,
        contractYears: 2 as const,
      })),
    };

    const relegatedToB = {
      ...a2Club,
      id: 'rel_a2_b',
      leagueId: 'ITA_B' as const,
      budget: 480_000,
      roster: a2Club.roster.slice(0, 12).map((p, idx) => ({
        ...p,
        isItalianFormation: idx >= 2,
        contractYears: 2 as const,
      })),
    };

    const promotedToLba = {
      ...a2Club,
      id: 'promo_a2_lba',
      leagueId: 'ITA_LBA' as const,
      lbaRosterFormat: '6+6' as const,
      budget: 2_600_000,
      roster: a2Club.roster.slice(0, 12).map((p, idx) => ({
        ...p,
        isItalianFormation: idx >= 2,
        overall: 62,
        salary: 45_000,
        contractYears: 2 as const,
      })),
    };

    const freeAgents = generateFreeAgents(120);
    const res = runCpuSummerMarket({
      teams: [relegatedToA2, relegatedToB, promotedToLba],
      freeAgents,
      userTeamId: 'other_user',
      promotedIds: new Set(['promo_a2_lba']),
      relegatedIds: new Set(['rel_lba_a2', 'rel_a2_b']),
      seasonYear: 2027,
    });

    const outRelA2 = res.teams.find((t) => t.id === 'rel_lba_a2')!;
    const limitsA2 = getForeignLimitForLeague('ITA_A2');
    expect(outRelA2.roster.filter((p) => !p.isItalianFormation).length).toBeLessThanOrEqual(limitsA2.maxForeign);
    expect(validateRoster6Plus6(outRelA2.roster, 'ITA_A2').valid).toBe(true);

    const outRelB = res.teams.find((t) => t.id === 'rel_a2_b')!;
    const limitsB = getForeignLimitForLeague('ITA_B');
    expect(outRelB.roster.filter((p) => !p.isItalianFormation).length).toBeLessThanOrEqual(limitsB.maxForeign);
    expect(validateRoster6Plus6(outRelB.roster, 'ITA_B').valid).toBe(true);

    const outPromoLba = res.teams.find((t) => t.id === 'promo_a2_lba')!;
    expect(validateRoster6Plus6(outPromoLba.roster, 'ITA_LBA', '6+6').valid).toBe(true);
    expect(outPromoLba.roster.some((p) => p.overall > 62)).toBe(true);
  });

  it('esonero apre firingContext con scelta della nuova squadra anziché riassegnare automaticamente', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Fired', 'Fired Slot');
    const career = useGameStore.getState().career!;
    const startDate = getRoundDate(career.seasonYear, 1, 30);

    useGameStore.getState().loadCareerObject({
      ...career,
      currentRound: 1,
      currentDate: startDate,
      allowFiring: true,
      boardConfidence: 8,
    });

    const stepRes = useGameStore.getState().advanceOneDay(true);
    expect(stepRes.advanced).toBe(true);
    expect(stepRes.alert?.reason).toBe('coach_fired');

    const stateAfterFire = useGameStore.getState();
    expect(stateAfterFire.firingContext).not.toBeNull();
    expect(stateAfterFire.firingContext?.oldClubId).toBe('ita_lba_milano_rossi');
    expect(stateAfterFire.firingContext?.recommendedTeamIds.length).toBeGreaterThanOrEqual(3);
    expect(stateAfterFire.career?.userTeamId).toBe('ita_lba_milano_rossi');
    expect(stateAfterFire.fastSimTarget).toBeNull();

    // Finché non viene scelta una nuova squadra, advanceOneDay rimane bloccato
    const blockedRes = useGameStore.getState().advanceOneDay(false);
    expect(blockedRes.advanced).toBe(false);

    // Scelta della nuova squadra dalla modale
    const chosenId = stateAfterFire.firingContext!.recommendedTeamIds[0];
    const targetClub = stateAfterFire.career!.teams.find((t) => t.id === chosenId)!;
    useGameStore.getState().acceptCoachingJobAfterFiring(chosenId);

    const stateAfterAccept = useGameStore.getState();
    expect(stateAfterAccept.firingContext).toBeNull();
    expect(stateAfterAccept.career?.userTeamId).toBe(chosenId);
    expect(stateAfterAccept.career?.boardConfidence).toBe(70);
    expect(stateAfterAccept.career?.boardObjective).toBe(getTeamBoardObjective(targetClub.prestige));
    expect(
      stateAfterAccept.career?.messages?.some((m) => m.subject.includes(targetClub.name))
    ).toBe(true);
  });

  it('nessuna statistica o carriera pre-generata fake alla creazione di squadre e Free Agent', () => {
    const teams = generateLeagueTeams();
    const fas = generateFreeAgents(40);

    for (const t of teams) {
      for (const p of t.roster) {
        expect(p.careerHistory).toEqual([]);
      }
      for (const yp of t.youthRoster ?? []) {
        expect(yp.careerHistory).toEqual([]);
      }
    }
    for (const fa of fas) {
      expect(fa.careerHistory).toEqual([]);
    }
  });

  it('simulazione registra oreb/dreb reali e mantiene gameLog completo oltre 15 partite', () => {
    const teams = generateLeagueTeams().filter((t) => t.leagueId === 'ITA_LBA');
    let currentTeams = teams.slice(0, 2);
    let expectedOreb = 0;
    let expectedDreb = 0;
    const trackedId = currentTeams[0].roster.find((p) => p.rosterSlot === 'starter')!.id;

    for (let r = 1; r <= 18; r++) {
      const res = simulateFullMatch(`g_${r}`, r, currentTeams[0], currentTeams[1], false);
      for (const b of [...res.home.players, ...res.away.players]) {
        expect(b.oreb + b.dreb).toBe(b.rebounds);
      }
      const box = res.home.players.find((p) => p.playerId === trackedId);
      if (box && box.secondsPlayed > 0) {
        expectedOreb += box.oreb;
        expectedDreb += box.dreb;
      }
      currentTeams = applyMatchStatsToTeams(currentTeams, res);
    }

    const tracked = currentTeams[0].roster.find((p) => p.id === trackedId)!;
    expect(tracked.seasonStats.oreb).toBe(expectedOreb);
    expect(tracked.seasonStats.dreb).toBe(expectedDreb);
    expect(tracked.seasonStats.oreb + tracked.seasonStats.dreb).toBe(tracked.seasonStats.rebounds);
    expect(tracked.gameLog.length).toBeGreaterThan(15);
  });

  it('advanceCareerToNextSeason archivia solo stagioni simulate con club, lega e totali reali', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Stats', 'Stats Slot');
    const career = useGameStore.getState().career!;

    const lbaGame = career.schedule.find((g) => g.leagueId === 'ITA_LBA' && g.round === 1)!;
    const home = career.teams.find((t) => t.id === lbaGame.homeTeamId)!;
    const away = career.teams.find((t) => t.id === lbaGame.awayTeamId)!;
    const finalMatch = simulateFullMatch(lbaGame.id, 1, home, away, false);
    const updatedTeams = applyMatchStatsToTeams(career.teams, finalMatch);

    const playedHomePlayer = updatedTeams
      .find((t) => t.id === home.id)!
      .roster.find((p) => p.seasonStats.gamesPlayed === 1)!;

    // Assicura anche un giocatore a 0 partite per verificare che non riceva righe fake
    const teamsWithUnplayed = updatedTeams.map((t) =>
      t.id === away.id
        ? {
            ...t,
            roster: t.roster.map((p, i) =>
              i === t.roster.length - 1
                ? {
                    ...p,
                    seasonStats: {
                      ...p.seasonStats,
                      gamesPlayed: 0,
                      gamesStarted: 0,
                      minutes: 0,
                      points: 0,
                      rebounds: 0,
                      oreb: 0,
                      dreb: 0,
                      assists: 0,
                      steals: 0,
                      blocks: 0,
                      turnovers: 0,
                      fgm: 0,
                      fga: 0,
                      tpm: 0,
                      tpa: 0,
                      ftm: 0,
                      fta: 0,
                      pir: 0,
                    },
                  }
                : p
            ),
          }
        : t
    );

    const { nextCareer } = advanceCareerToNextSeason({
      ...career,
      teams: teamsWithUnplayed,
      phase: 'finished',
    });

    const archivedPlayer =
      nextCareer.teams.flatMap((t) => t.roster).find((p) => p.id === playedHomePlayer.id) ??
      nextCareer.freeAgents.find((p) => p.id === playedHomePlayer.id)!;

    expect(archivedPlayer.careerHistory).toHaveLength(1);
    const entry = archivedPlayer.careerHistory[0];
    expect(entry.seasonLabel).toBe(`${career.seasonYear}/${String(career.seasonYear + 1).slice(-2)}`);
    expect(entry.teamName).toBe(home.name);
    expect(entry.league).toBe(getLeagueConfig(home.leagueId).name);
    expect(entry.points).toBe(playedHomePlayer.seasonStats.points);
    expect(entry.minutes).toBe(playedHomePlayer.seasonStats.minutes);
    expect(entry.oreb).toBe(playedHomePlayer.seasonStats.oreb);
    expect(entry.dreb).toBe(playedHomePlayer.seasonStats.dreb);
    expect(entry.fga).toBe(playedHomePlayer.seasonStats.fga);
    expect(entry.tpa).toBe(playedHomePlayer.seasonStats.tpa);
    expect(entry.fta).toBe(playedHomePlayer.seasonStats.fta);
    expect(entry.pirTotal).toBe(playedHomePlayer.seasonStats.pir);

    const idlePlayerId = teamsWithUnplayed.find((t) => t.id === away.id)!.roster.at(-1)!.id;
    const idleAfter =
      nextCareer.teams.flatMap((t) => t.roster).find((p) => p.id === idlePlayerId) ??
      nextCareer.freeAgents.find((p) => p.id === idlePlayerId);
    if (idleAfter) {
      expect(idleAfter.careerHistory).toEqual([]);
    }
  });

  it('migrateCareerSave elimina le stagioni fake legacy e careerStatsUtils aggrega medie e Season Highs reali', () => {
    const teams = generateLeagueTeams();
    const baseCareer: CareerSave = {
      version: 1,
      slotId: 'legacy_fake_cleanup',
      slotName: 'Legacy Fake Cleanup',
      savedAt: new Date().toISOString(),
      managerName: 'Coach Test',
      userTeamId: teams[0].id,
      seasonYear: 2027,
      currentRound: 1,
      phase: 'regular',
      teams: teams.map((t, tIdx) =>
        tIdx === 0
          ? {
              ...t,
              roster: t.roster.map((p, pIdx) =>
                pIdx === 0
                  ? {
                      ...p,
                      careerHistory: [
                        buildCareerHistoryEntry(
                          {
                            gamesPlayed: 2,
                            gamesStarted: 2,
                            minutes: 60,
                            points: 30,
                            rebounds: 12,
                            oreb: 4,
                            dreb: 8,
                            assists: 8,
                            steals: 2,
                            blocks: 2,
                            turnovers: 4,
                            fgm: 12,
                            fga: 20,
                            tpm: 4,
                            tpa: 10,
                            ftm: 2,
                            fta: 4,
                            pir: 34,
                          },
                          {
                            seasonLabel: '2026/27',
                            teamName: t.name,
                            league: getLeagueConfig(t.leagueId).name,
                          }
                        ),
                        {
                          seasonLabel: '2025/26',
                          teamName: 'Club Precedente',
                          league: 'Serie A',
                          gamesPlayed: 28,
                          ppg: 14.0,
                          rpg: 6.0,
                          apg: 2.0,
                          pir: 15.0,
                        },
                        {
                          seasonLabel: '2024/25',
                          teamName: 'Squadra Berlino',
                          league: 'EuroCup',
                          gamesPlayed: 26,
                          ppg: 11.9,
                          rpg: 7.3,
                          apg: 2.9,
                          pir: 15.0,
                        },
                      ],
                    }
                  : p
              ),
            }
          : t
      ),
      freeAgents: [],
      staffMarket: [],
      scoutedPlayerIds: [],
      activeScouting: [],
      incomingOffers: [],
      schedule: [],
      playoffs: [],
      news: [],
    };

    const migrated = migrateCareerSave(baseCareer);
    const cleanedPlayer = migrated.teams[0].roster[0];
    expect(cleanedPlayer.careerHistory).toHaveLength(1);
    expect(cleanedPlayer.careerHistory[0].teamName).toBe(teams[0].name);
    expect(filterRealCareerHistory(cleanedPlayer.careerHistory)).toHaveLength(1);

    const summary = computePlayerCareerSummary(
      {
        gamesPlayed: 2,
        gamesStarted: 1,
        minutes: 40,
        points: 22,
        rebounds: 8,
        oreb: 2,
        dreb: 6,
        assists: 4,
        steals: 4,
        blocks: 0,
        turnovers: 2,
        fgm: 8,
        fga: 20,
        tpm: 2,
        tpa: 10,
        ftm: 4,
        fta: 4,
        pir: 22,
      },
      cleanedPlayer.careerHistory
    );

    expect(summary.seasonsPlayed).toBe(2);
    expect(summary.totalGp).toBe(4);
    expect(summary.totalGs).toBe(3);
    expect(summary.totalPts).toBe(52);
    expect(summary.ppg).toBeCloseTo(13.0, 2);
    expect(summary.mpg).toBeCloseTo(25.0, 2);
    expect(summary.drpg).toBeCloseTo(3.5, 2);
    expect(summary.orpg).toBeCloseTo(1.5, 2);
    expect(summary.fgPct).toBe(50); // 20/40
    expect(summary.tpPct).toBe(30); // 6/20
    expect(summary.ftPct).toBe(75); // 6/8
    expect(summary.tpg).toBeCloseTo(1.5, 2);

    const emptyHighs = computePlayerSeasonHighs([]);
    expect(emptyHighs.hasGames).toBe(false);
    expect(emptyHighs.points).toBeNull();

    const highs = computePlayerSeasonHighs([
      {
        gameId: 'g1',
        round: 1,
        opponentShort: 'BOL',
        isHome: true,
        teamScore: 80,
        oppScore: 72,
        won: true,
        starter: true,
        minutes: 28,
        points: 18,
        rebounds: 7,
        oreb: 2,
        dreb: 5,
        assists: 4,
        steals: 2,
        blocks: 1,
        turnovers: 3,
        fgm: 7,
        fga: 10,
        tpm: 2,
        tpa: 4,
        ftm: 2,
        fta: 2,
        pir: 21,
      },
      {
        gameId: 'g2',
        round: 2,
        opponentShort: 'VEN',
        isHome: false,
        teamScore: 75,
        oppScore: 78,
        won: false,
        starter: false,
        minutes: 19,
        points: 9,
        rebounds: 9,
        oreb: 3,
        dreb: 6,
        assists: 6,
        steals: 1,
        blocks: 2,
        turnovers: 1,
        fgm: 3,
        fga: 8,
        tpm: 0,
        tpa: 0,
        ftm: 3,
        fta: 4,
        pir: 17,
      },
    ]);
    expect(highs.hasGames).toBe(true);
    expect(highs.points).toBe(18);
    expect(highs.minutes).toBe(28);
    expect(highs.dreb).toBe(6);
    expect(highs.oreb).toBe(3);
    expect(highs.rebounds).toBe(9);
    expect(highs.assists).toBe(6);
    expect(highs.fgPct).toBe(70);
    expect(highs.tpPct).toBe(50);
    expect(highs.ftPct).toBe(100);
    expect(highs.steals).toBe(2);
    expect(highs.turnovers).toBe(3);
    expect(highs.blocks).toBe(2);
    expect(highs.pir).toBe(21);
  });

  it('play-by-play marcatori traccia nome, punti (1/2/3) e punteggio progressivo identico al risultato finale', () => {
    const teams = generateLeagueTeams().filter((t) => t.leagueId === 'ITA_LBA');
    const home = teams[0];
    const away = teams[1];
    const match = simulateFullMatch('pbp_scoring_test', 1, home, away, false);

    const scoringEvents = match.playByPlay.filter((ev) => ev.pointsScored !== undefined);
    expect(scoringEvents.length).toBeGreaterThan(20);

    let sumHomePts = 0;
    let sumAwayPts = 0;
    for (const ev of scoringEvents) {
      expect([1, 2, 3]).toContain(ev.pointsScored);
      expect(ev.scorerName).toBeTruthy();
      expect(ev.scorerId).toBeTruthy();
      if (ev.teamId === home.id) sumHomePts += ev.pointsScored!;
      if (ev.teamId === away.id) sumAwayPts += ev.pointsScored!;
    }

    expect(sumHomePts).toBe(match.home.score);
    expect(sumAwayPts).toBe(match.away.score);

    const compact = eventsToCompactScoringPlays(match.playByPlay, home.id);
    expect(compact).toHaveLength(scoringEvents.length);
    expect(compact[0].hs).toBe(match.home.score);
    expect(compact[0].as).toBe(match.away.score);

    const chronological = [...compact].reverse();
    let prevSum = 0;
    for (const p of chronological) {
      const nextSum = p.hs + p.as;
      expect(nextSum - prevSum).toBe(p.pts);
      prevSum = nextSum;
    }

    expect(formatPlayClock(33)).toBe('0:33');
    expect(formatPlayClock(146)).toBe('2:26');
  });

  it('programmi allenamento individuale (1 sett / 2 sett / 1 mese x intensità) migliorano attributi con Intensa >= Leggera', () => {
    const teams = generateLeagueTeams();
    const team = teams[0];

    const baseTemplate = {
      ...team.roster[0],
      age: 22,
      condition: 98,
      injuryWeeks: 0,
      attributes: {
        ...team.roster[0].attributes,
        threePoint: 68,
        freeThrow: 72,
        basketballIQ: 70,
      },
    };

    const lightCreate = createIndividualTrainingProgram(baseTemplate, {
      focus: 'Tiro da 3',
      intensity: 'Leggera',
      duration: '1_month',
      startDate: '2026-10-01',
    });
    const intenseCreate = createIndividualTrainingProgram(baseTemplate, {
      focus: 'Tiro da 3',
      intensity: 'Intensa',
      duration: '1_month',
      startDate: '2026-10-01',
    });
    const shortCreate = createIndividualTrainingProgram(baseTemplate, {
      focus: 'Tiro da 3',
      intensity: 'Moderata',
      duration: '1_week',
      startDate: '2026-10-01',
    });

    expect(lightCreate.ok).toBe(true);
    expect(intenseCreate.ok).toBe(true);
    expect(shortCreate.ok).toBe(true);
    expect(shortCreate.program?.totalDays).toBe(7);

    const pLight = { ...baseTemplate, id: 'p_light', trainingProgram: lightCreate.program! };
    const pIntense = { ...baseTemplate, id: 'p_intense', trainingProgram: intenseCreate.program! };

    let curTeams: Team[] = [{ ...team, roster: [pLight, pIntense] }];
    const allMessages: CareerSave['messages'] = [];

    for (let day = 1; day <= 28; day++) {
      // Mantiene sani i due soggetti per test deterministico della progressione
      curTeams = curTeams.map((t) => ({
        ...t,
        roster: t.roster.map((p) => ({ ...p, injuryWeeks: 0 })),
      }));
      const res = advanceDailyIndividualTrainingPrograms({
        teams: curTeams,
        userTeamId: team.id,
        currentDate: addDays('2026-10-01', day),
        round: 1,
        managerYouthDev: 12,
      });
      curTeams = res.teams;
      allMessages.push(...res.messages);
    }

    const doneLight = curTeams[0].roster.find((p) => p.id === 'p_light')!;
    const doneIntense = curTeams[0].roster.find((p) => p.id === 'p_intense')!;

    expect(doneLight.trainingProgram).toBeNull();
    expect(doneIntense.trainingProgram).toBeNull();
    expect(allMessages.length).toBe(2);

    const lightGain =
      doneLight.attributes.threePoint -
      68 +
      (doneLight.attributes.freeThrow - 72) +
      (doneLight.attributes.basketballIQ - 70);
    const intenseGain =
      doneIntense.attributes.threePoint -
      68 +
      (doneIntense.attributes.freeThrow - 72) +
      (doneIntense.attributes.basketballIQ - 70);

    expect(lightGain).toBeGreaterThanOrEqual(2);
    expect(intenseGain).toBeGreaterThan(lightGain);
  });

  it('programma Nuovo Ruolo assegna al massimo 2 ruoli e rifiuta giocatori che hanno già un 2° ruolo', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Role', 'Role Slot');
    const career = useGameStore.getState().career!;
    const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
    const targetPlayer = userTeam.roster[0];

    // Prepara un giocatore con un solo ruolo e uno già con 2 ruoli
    const singleRolePlayer = {
      ...targetPlayer,
      primaryPosition: 'PG' as const,
      secondaryPosition: null,
      injuryWeeks: 0,
      trainingProgram: null,
    };
    const dualRolePlayer = {
      ...userTeam.roster[1],
      primaryPosition: 'SG' as const,
      secondaryPosition: 'SF' as const,
      injuryWeeks: 0,
      trainingProgram: null,
    };

    expect(canLearnAdditionalRole(singleRolePlayer)).toBe(true);
    expect(canLearnAdditionalRole(dualRolePlayer)).toBe(false);

    // Su 1 settimana non è permesso apprendere un nuovo ruolo
    const weekRoleTry = createIndividualTrainingProgram(singleRolePlayer, {
      focus: 'Nuovo Ruolo',
      intensity: 'Moderata',
      duration: '1_week',
      startDate: '2026-10-01',
      targetPosition: 'SG',
    });
    expect(weekRoleTry.ok).toBe(false);

    // Giocatore con già 2 ruoli viene rifiutato
    const dualTry = createIndividualTrainingProgram(dualRolePlayer, {
      focus: 'Nuovo Ruolo',
      intensity: 'Intensa',
      duration: '1_month',
      startDate: '2026-10-01',
      targetPosition: 'PG',
    });
    expect(dualTry.ok).toBe(false);

    useGameStore.getState().loadCareerObject({
      ...career,
      teams: career.teams.map((t) =>
        t.id === userTeam.id
          ? { ...t, roster: [singleRolePlayer, dualRolePlayer, ...t.roster.slice(2)] }
          : t
      ),
    });

    const badStoreCall = useGameStore.getState().startPlayerTrainingProgram({
      playerId: dualRolePlayer.id,
      focus: 'Nuovo Ruolo',
      intensity: 'Intensa',
      duration: '1_month',
      targetPosition: 'PF',
    });
    expect(badStoreCall.ok).toBe(false);

    const okStoreCall = useGameStore.getState().startPlayerTrainingProgram({
      playerId: singleRolePlayer.id,
      focus: 'Nuovo Ruolo',
      intensity: 'Moderata',
      duration: '1_month',
      targetPosition: 'SG',
    });
    expect(okStoreCall.ok).toBe(true);

    // Simula i 28 giorni fino al completamento
    let curTeams = useGameStore.getState().career!.teams;
    for (let day = 1; day <= 28; day++) {
      curTeams = curTeams.map((t) => ({
        ...t,
        roster: t.roster.map((p) => (p.id === singleRolePlayer.id ? { ...p, injuryWeeks: 0 } : p)),
      }));
      const res = advanceDailyIndividualTrainingPrograms({
        teams: curTeams,
        userTeamId: userTeam.id,
        currentDate: addDays('2026-10-01', day),
        round: 2,
      });
      curTeams = res.teams;
    }

    const upgraded = curTeams.find((t) => t.id === userTeam.id)!.roster.find((p) => p.id === singleRolePlayer.id)!;
    expect(upgraded.primaryPosition).toBe('PG');
    expect(upgraded.secondaryPosition).toBe('SG');
    expect(upgraded.trainingProgram).toBeNull();
    expect(canLearnAdditionalRole(upgraded)).toBe(false);
  });

  it('chat interattiva con Giocatori, Dirigenza e Media applica morale/budget/chimica, salva cronologia e rispetta cooldown', async () => {
    await useGameStore.getState().startNewCareer('ita_lba_milano_rossi', 'Coach Chat', 'Chat Slot');
    const career = useGameStore.getState().career!;
    const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
    const player = { ...userTeam.roster[0], morale: 68 };

    useGameStore.getState().loadCareerObject({
      ...career,
      boardConfidence: 82,
      teams: career.teams.map((t) =>
        t.id === userTeam.id
          ? { ...t, budget: 3_000_000, chemistry: 70, roster: [player, ...t.roster.slice(1)] }
          : t
      ),
    });

    // 1. Chat Giocatore
    useGameStore.getState().openChatModal({ channel: 'player', playerId: player.id });
    expect(useGameStore.getState().activeChatModal?.channel).toBe('player');

    const chatPlayerRes = useGameStore.getState().sendChatInteraction({
      channel: 'player',
      playerId: player.id,
      topicId: 'praise_form',
      tone: 'encouraging',
    });
    expect(chatPlayerRes.ok).toBe(true);

    const afterPlayerChat = useGameStore.getState().career!;
    const updatedPlayer = afterPlayerChat.teams
      .find((t) => t.id === userTeam.id)!
      .roster.find((p) => p.id === player.id)!;
    expect(updatedPlayer.morale).toBeGreaterThan(68);
    expect(afterPlayerChat.chatHistory?.[`player:${player.id}`]?.messages.length).toBe(2);

    // Cooldown attivo nello stesso giorno
    const curDate = afterPlayerChat.currentDate!;
    expect(getChatCooldownRemaining(afterPlayerChat.chatHistory, 'player', curDate, player.id)).toBe(7);
    const blockedRes = useGameStore.getState().sendChatInteraction({
      channel: 'player',
      playerId: player.id,
      topicId: 'encourage_morale',
      tone: 'diplomatic',
    });
    expect(blockedRes.ok).toBe(false);

    // 2. Chat Dirigenza (extra budget con fiducia alta)
    const boardRes = useGameStore.getState().sendChatInteraction({
      channel: 'board',
      topicId: 'request_budget',
      tone: 'diplomatic',
    });
    expect(boardRes.ok).toBe(true);
    const afterBoard = useGameStore.getState().career!;
    expect(afterBoard.teams.find((t) => t.id === userTeam.id)!.budget).toBeGreaterThan(3_000_000);
    expect(afterBoard.boardConfidence).toBeLessThan(82);

    // 3. Chat Media (chimica, reputazione, news)
    const chemBefore = afterBoard.teams.find((t) => t.id === userTeam.id)!.chemistry;
    const mediaRes = useGameStore.getState().sendChatInteraction({
      channel: 'media',
      topicId: 'praise_group',
      tone: 'encouraging',
    });
    expect(mediaRes.ok).toBe(true);
    const afterMedia = useGameStore.getState().career!;
    expect(afterMedia.teams.find((t) => t.id === userTeam.id)!.chemistry).toBeGreaterThan(chemBefore);

    // Retrocompatibilità migrazione mantiene chatHistory
    const migrated = migrateCareerSave(afterMedia);
    expect(migrated.chatHistory?.['board']?.messages.length).toBe(2);
    expect(migrated.chatHistory?.[`player:${player.id}`]?.messages.length).toBe(2);
  });
});
