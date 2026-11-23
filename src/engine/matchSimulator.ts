import {
  CourtActionType,
  CustomPlay,
  DefenseType,
  DefensiveIntensity,
  MatchState,
  MatchTeamState,
  OffensiveAggression,
  OffensiveFocus,
  OpponentDefensiveFocus,
  OpponentPlayerRule,
  PaceType,
  PickAndRollCoverage,
  PlayByPlayEvent,
  Player,
  PlayerBoxScore,
  Position,
  ReboundPolicy,
  Team,
} from '../types';
import { calculatePIR, formatClock } from './ratings';
import { analyzeCustomPlay, getFinalStepPositions } from './customPlayEngine';

let pbpId = 1;
function nextPbpId(): string {
  pbpId += 1;
  return `pbp_${pbpId}_${Math.random().toString(36).slice(2, 6)}`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + Math.max(0.01, b), 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0.01, weights[i]);
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function buildTeamState(team: Team, opponentTeamId?: string): MatchTeamState {
  // Prendi i 12 a referto (5 starter + 7 bench), fallback se roster diverso
  const starters = team.roster.filter((p) => p.rosterSlot === 'starter' && p.injuryWeeks === 0).slice(0, 5);
  const bench = team.roster.filter((p) => p.rosterSlot === 'bench' && p.injuryWeeks === 0).slice(0, 7);
  let active = [...starters, ...bench];

  if (active.length < 10) {
    const others = team.roster.filter(
      (p) => p.injuryWeeks === 0 && !active.some((a) => a.id === p.id)
    );
    active = [...active, ...others].slice(0, 12);
  }

  const starterIds = new Set(starters.map((s) => s.id));
  if (starterIds.size < 5) {
    for (const p of active) {
      if (starterIds.size >= 5) break;
      starterIds.add(p.id);
    }
  }

  const players: PlayerBoxScore[] = active.map((p, idx) => {
    const isStarter = starterIds.has(p.id);
    const defaultTarget = isStarter ? 28 : Math.max(4, 14 - idx);
    return {
      playerId: p.id,
      name: `${p.firstName[0]}. ${p.lastName}`,
      position: p.primaryPosition,
      isItalianFormation: p.isItalianFormation,
      isStarter,
      onCourt: isStarter,
      targetMinutes: p.targetMinutes ?? defaultTarget,
      benchOrder: p.benchOrder ?? idx,
      secondsPlayed: 0,
      points: 0,
      rebounds: 0,
      oreb: 0,
      dreb: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      fouledOut: false,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      pir: 0,
      stamina: p.condition,
    };
  });

  const matchingGamePlan =
    opponentTeamId && team.tactics.opponentGamePlan?.opponentTeamId === opponentTeamId
      ? team.tactics.opponentGamePlan
      : undefined;
  const defensiveMatchups: Record<string, string> = {};
  const opponentPlayerRules: Record<string, OpponentPlayerRule> = {};
  let defensiveFocusPlayerId: string | null = null;

  if (matchingGamePlan) {
    for (const [oppPlayerId, inst] of Object.entries(matchingGamePlan.playerInstructions ?? {})) {
      if (inst.defenderId) {
        defensiveMatchups[oppPlayerId] = inst.defenderId;
      }
      if (inst.rule && inst.rule !== 'Standard') {
        opponentPlayerRules[oppPlayerId] = inst.rule;
        if (!defensiveFocusPlayerId && (inst.rule === 'Nega Ricezione' || inst.rule === 'Raddoppia')) {
          defensiveFocusPlayerId = oppPlayerId;
        }
      }
    }
  }

  return {
    teamId: team.id,
    name: team.name,
    shortName: team.shortName,
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
    tactics: { ...team.tactics },
    score: 0,
    quarterScores: [0, 0, 0, 0],
    teamFoulsThisQuarter: 0,
    timeoutsRemaining: 5,
    momentum: 0,
    goToPlayerId: team.tactics.goToPlayerId ?? null,
    secondaryOptionPlayerId: team.tactics.secondaryOptionPlayerId ?? null,
    defensiveFocusPlayerId,
    defensiveMatchups,
    opponentPlayerRules,
    players,
  };
}

export function initMatchState(
  gameId: string,
  round: number,
  homeTeam: Team,
  awayTeam: Team,
  isPlayoff = false,
  playoffSeriesId?: string
): MatchState {
  const home = buildTeamState(homeTeam, awayTeam.id);
  const away = buildTeamState(awayTeam, homeTeam.id);
  const firstPossession = Math.random() < 0.5 ? 'home' : 'away';

  return {
    gameId,
    round,
    isPlayoff,
    playoffSeriesId,
    quarter: 1,
    clockRemaining: 600,
    possession: firstPossession,
    possessionCount: 0,
    finished: false,
    home,
    away,
    playByPlay: [
      {
        id: nextPbpId(),
        quarter: 1,
        clockRemaining: 600,
        teamId: firstPossession === 'home' ? home.teamId : away.teamId,
        type: 'period',
        text: `Palla a due! Primo possesso per ${firstPossession === 'home' ? home.name : away.name}.`,
        homeScore: 0,
        awayScore: 0,
      },
    ],
    visual: {
      possessionTeamId: firstPossession === 'home' ? home.teamId : away.teamId,
      attackSide: firstPossession,
      actionType: 'pass',
      ballX: 50,
      ballY: 50,
    },
  };
}

function getPlayerMap(team: Team): Map<string, Player> {
  const map = new Map<string, Player>();
  for (const p of team.roster) {
    map.set(p.id, p);
  }
  return map;
}

function performAutoSubstitutions(
  teamState: MatchTeamState,
  rosterMap: Map<string, Player>,
  quarter: number,
  clockRemaining: number
): string[] {
  const events: string[] = [];
  const onCourt = teamState.players.filter((p) => p.onCourt);
  const bench = teamState.players.filter((p) => !p.onCourt && !p.fouledOut);

  if (bench.length === 0) return events;

  const elapsedMinutes = Math.min(
    40,
    Math.max(0, (Math.min(quarter, 4) - 1) * 10 + (600 - clockRemaining) / 60)
  );
  const progressRatio = elapsedMinutes / 40;
  const isCrunchTime = quarter >= 4 && clockRemaining <= 210;

  // 1. Sostituisci chi ha commesso 5 falli, è in crisi di falli, stanco o oltre il proprio minutaggio target
  for (const p of onCourt) {
    const foulTrouble =
      p.fouledOut ||
      (quarter === 1 && p.fouls >= 2) ||
      (quarter === 2 && p.fouls >= 3) ||
      (quarter === 3 && p.fouls >= 4);
    const lowStamina = p.stamina < 46;
    const targetMins = p.targetMinutes ?? (p.isStarter ? 28 : 10);
    const playedMins = p.secondsPlayed / 60;
    const expectedNow = targetMins * progressRatio;
    const overMinutes =
      !isCrunchTime &&
      elapsedMinutes >= 3.5 &&
      targetMins < 38 &&
      playedMins > expectedNow + 2.2;

    if (foulTrouble || lowStamina || overMinutes) {
      const candidates = bench
        .filter((b) => !b.onCourt && !b.fouledOut && b.stamina > (lowStamina ? p.stamina + 8 : 35))
        .sort((a, b) => {
          const targetA = a.targetMinutes ?? (a.isStarter ? 28 : 10);
          const targetB = b.targetMinutes ?? (b.isStarter ? 28 : 10);
          const deficitA = targetA * progressRatio - a.secondsPlayed / 60;
          const deficitB = targetB * progressRatio - b.secondsPlayed / 60;
          const samePosA = a.position === p.position ? 3.5 : 0;
          const samePosB = b.position === p.position ? 3.5 : 0;
          const orderBonusA = a.isStarter ? 1.5 : Math.max(0, 2 - (a.benchOrder ?? 6) * 0.3);
          const orderBonusB = b.isStarter ? 1.5 : Math.max(0, 2 - (b.benchOrder ?? 6) * 0.3);
          const ovrA = ((rosterMap.get(a.playerId)?.overall ?? 65) - 65) * 0.05;
          const ovrB = ((rosterMap.get(b.playerId)?.overall ?? 65) - 65) * 0.05;
          return deficitB + samePosB + orderBonusB + ovrB - (deficitA + samePosA + orderBonusA + ovrA);
        });

      if (candidates.length > 0) {
        const subIn = candidates[0];
        const subInTarget = subIn.targetMinutes ?? (subIn.isStarter ? 28 : 10);
        // Evita di far entrare giocatori con 0 minuti target salvo emergenza falli/stamina
        if (foulTrouble || lowStamina || subInTarget > 0) {
          p.onCourt = false;
          subIn.onCourt = true;
          events.push(`Cambio ${teamState.shortName}: esce ${p.name}, entra ${subIn.name}.`);
        }
      }
    }
  }

  // 2. Nei momenti decisivi (Q4 <= 3.5 min), rimetti i titolari riposati con target >= 20m
  if (isCrunchTime) {
    const nonStartersOnCourt = teamState.players.filter((p) => p.onCourt && !p.isStarter);
    const restedStarters = teamState.players
      .filter(
        (p) =>
          !p.onCourt &&
          !p.fouledOut &&
          p.isStarter &&
          p.stamina >= 40 &&
          (p.targetMinutes ?? 28) >= 18
      )
      .sort((a, b) => (b.targetMinutes ?? 28) - (a.targetMinutes ?? 28));
    for (let i = 0; i < Math.min(nonStartersOnCourt.length, restedStarters.length); i++) {
      const outP = nonStartersOnCourt[i];
      const inP = restedStarters[i];
      outP.onCourt = false;
      inP.onCourt = true;
      events.push(`Cambio ${teamState.shortName}: rientra il titolare ${inP.name} per ${outP.name}.`);
    }
  }

  // Garantisci sempre 5 giocatori in campo se possibile
  const currentOnCourt = teamState.players.filter((p) => p.onCourt && !p.fouledOut);
  if (currentOnCourt.length < 5) {
    const needed = 5 - currentOnCourt.length;
    const fill = teamState.players
      .filter((p) => !p.onCourt && !p.fouledOut)
      .sort((a, b) => b.stamina - a.stamina)
      .slice(0, needed);
    for (const f of fill) {
      f.onCourt = true;
    }
  }

  return events;
}

export function callTimeout(state: MatchState, side: 'home' | 'away'): MatchState {
  if (state.finished) return state;
  const team = side === 'home' ? state.home : state.away;
  const opp = side === 'home' ? state.away : state.home;

  if (team.timeoutsRemaining <= 0) return state;

  team.timeoutsRemaining -= 1;
  opp.momentum = Math.max(0, opp.momentum - 5);
  team.momentum = Math.min(4, team.momentum + 2);

  for (const p of team.players) {
    if (!p.fouledOut) {
      p.stamina = clamp(p.stamina + 11, 0, 100);
    }
  }
  for (const p of opp.players) {
    if (!p.fouledOut) {
      p.stamina = clamp(p.stamina + 4, 0, 100);
    }
  }

  state.playByPlay.unshift({
    id: nextPbpId(),
    quarter: state.quarter,
    clockRemaining: state.clockRemaining,
    teamId: team.teamId,
    type: 'timeout',
    text: `TIMEOUT chiamato da ${team.name}! La squadra recupera energie e spezza il ritmo avversario.`,
    homeScore: state.home.score,
    awayScore: state.away.score,
  });

  state.visual = {
    possessionTeamId: team.teamId,
    attackSide: state.possession,
    actionType: 'timeout',
    ballX: 50,
    ballY: 88,
  };

  return { ...state };
}

export interface TimeoutTacticalPlan {
  pace: PaceType;
  offensiveFocus: OffensiveFocus;
  defense: DefenseType;
  offensiveAggression: OffensiveAggression;
  reboundPolicy?: ReboundPolicy;
  pnrCoverage?: PickAndRollCoverage;
  defensiveIntensity?: DefensiveIntensity;
  opponentFocus?: OpponentDefensiveFocus;
  goToPlayerId: string | null;
  secondaryOptionPlayerId?: string | null;
  defensiveFocusPlayerId: string | null;
  defensiveMatchups: Record<string, string>;
  opponentPlayerRules?: Record<string, OpponentPlayerRule>;
  nextAtoPlayId?: string | null;
}

export function applyTimeoutTactics(
  state: MatchState,
  side: 'home' | 'away',
  plan: TimeoutTacticalPlan
): MatchState {
  const team = side === 'home' ? state.home : state.away;
  const opp = side === 'home' ? state.away : state.home;

  team.tactics = {
    ...team.tactics,
    pace: plan.pace,
    offensiveFocus: plan.offensiveFocus,
    defense: plan.defense,
    offensiveAggression: plan.offensiveAggression,
    ...(plan.reboundPolicy ? { reboundPolicy: plan.reboundPolicy } : {}),
    ...(plan.pnrCoverage ? { pnrCoverage: plan.pnrCoverage } : {}),
    ...(plan.defensiveIntensity ? { defensiveIntensity: plan.defensiveIntensity } : {}),
    ...(plan.opponentFocus ? { opponentFocus: plan.opponentFocus } : {}),
  };
  team.goToPlayerId = plan.goToPlayerId;
  if (plan.secondaryOptionPlayerId !== undefined) {
    team.secondaryOptionPlayerId = plan.secondaryOptionPlayerId;
  }
  team.defensiveFocusPlayerId = plan.defensiveFocusPlayerId;
  team.defensiveMatchups = { ...plan.defensiveMatchups };
  if (plan.opponentPlayerRules) {
    team.opponentPlayerRules = { ...plan.opponentPlayerRules };
  }
  if (plan.nextAtoPlayId !== undefined) {
    team.nextAtoPlayId = plan.nextAtoPlayId;
  }

  const parts: string[] = [
    `${plan.pace}`,
    `${plan.offensiveFocus}`,
    `Difesa ${plan.defense}`,
  ];
  if (plan.offensiveAggression !== 'Normale') {
    parts.push(plan.offensiveAggression);
  }
  if (plan.pnrCoverage && plan.pnrCoverage !== 'Hedge & Recover') {
    parts.push(`P&R ${plan.pnrCoverage}`);
  }
  if (plan.defensiveIntensity && plan.defensiveIntensity !== 'Standard') {
    parts.push(`Intensità ${plan.defensiveIntensity}`);
  }
  if (plan.nextAtoPlayId) {
    const atoPlay = team.tactics.customPlays?.find((cp) => cp.id === plan.nextAtoPlayId);
    if (atoPlay) parts.push(`Schema ATO: "${atoPlay.name}"`);
  }
  if (plan.goToPlayerId) {
    const goTo = team.players.find((p) => p.playerId === plan.goToPlayerId);
    if (goTo) parts.push(`+Tiri: ${goTo.name}`);
  }
  if (plan.defensiveFocusPlayerId) {
    const target = opp.players.find((p) => p.playerId === plan.defensiveFocusPlayerId);
    if (target) parts.push(`Marcatura stretta su ${target.name}`);
  }

  state.playByPlay.unshift({
    id: nextPbpId(),
    quarter: state.quarter,
    clockRemaining: state.clockRemaining,
    teamId: team.teamId,
    type: 'timeout',
    text: `Indicazioni tattiche ${team.shortName}: ${parts.join(' • ')}.`,
    homeScore: state.home.score,
    awayScore: state.away.score,
  });

  return { ...state };
}

export function substitutePlayer(
  state: MatchState,
  side: 'home' | 'away',
  outPlayerId: string,
  inPlayerId: string
): MatchState {
  const team = side === 'home' ? state.home : state.away;
  const outP = team.players.find((p) => p.playerId === outPlayerId);
  const inP = team.players.find((p) => p.playerId === inPlayerId);

  if (!outP || !inP || inP.fouledOut || outP.playerId === inP.playerId) return state;

  outP.onCourt = false;
  inP.onCourt = true;

  state.playByPlay.unshift({
    id: nextPbpId(),
    quarter: state.quarter,
    clockRemaining: state.clockRemaining,
    teamId: team.teamId,
    type: 'sub',
    text: `Sostituzione ${team.shortName}: esce ${outP.name}, entra ${inP.name}.`,
    homeScore: state.home.score,
    awayScore: state.away.score,
  });

  return { ...state };
}

function addPoints(team: MatchTeamState, scorer: PlayerBoxScore, pts: number, quarter: number) {
  team.score += pts;
  const qIdx = Math.min(quarter - 1, team.quarterScores.length - 1);
  team.quarterScores[qIdx] += pts;
  scorer.points += pts;
}

function updatePIRForTeam(team: MatchTeamState) {
  for (const p of team.players) {
    p.pir = calculatePIR(p);
  }
}

interface ShotZoneSpec {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  weight: number;
  zoneLabel: string;
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickShotLocation(params: {
  isThree: boolean;
  actionType: CourtActionType;
  shooterPos: Position;
  isAttackLeft: boolean;
}): { x: number; y: number; zoneLabel: string } {
  const { isThree, actionType, shooterPos, isAttackLeft } = params;
  const isGuard = shooterPos === 'PG' || shooterPos === 'SG';
  const isBig = shooterPos === 'PF' || shooterPos === 'C';

  let zones: ShotZoneSpec[];
  if (isThree) {
    zones = [
      { xMin: 88, xMax: 93, yMin: 6, yMax: 12, weight: isGuard ? 1.1 : isBig ? 0.5 : 1.35, zoneLabel: "dall'angolo" },
      { xMin: 88, xMax: 93, yMin: 88, yMax: 94, weight: isGuard ? 1.1 : isBig ? 0.5 : 1.35, zoneLabel: "dall'angolo" },
      { xMin: 70, xMax: 76, yMin: 14, yMax: 24, weight: isGuard ? 1.3 : 1.0, zoneLabel: 'a 45°' },
      { xMin: 70, xMax: 76, yMin: 76, yMax: 86, weight: isGuard ? 1.3 : 1.0, zoneLabel: 'a 45°' },
      { xMin: 66, xMax: 71, yMin: 27, yMax: 38, weight: isGuard ? 1.25 : 0.9, zoneLabel: 'dallo slot' },
      { xMin: 66, xMax: 71, yMin: 62, yMax: 73, weight: isGuard ? 1.25 : 0.9, zoneLabel: 'dallo slot' },
      { xMin: 64, xMax: 69, yMin: 42, yMax: 58, weight: shooterPos === 'PG' || isBig ? 1.4 : 0.85, zoneLabel: 'dalla punta' },
    ];
  } else if (actionType === 'drive' || actionType === 'fastbreak') {
    zones = [
      { xMin: 89, xMax: 94, yMin: 43, yMax: 57, weight: 1.5, zoneLabel: 'al ferro' },
      { xMin: 85, xMax: 91, yMin: 34, yMax: 43, weight: 1.0, zoneLabel: 'dal lato sinistro' },
      { xMin: 85, xMax: 91, yMin: 57, yMax: 66, weight: 1.0, zoneLabel: 'dal lato destro' },
      { xMin: 81, xMax: 86, yMin: 41, yMax: 59, weight: isGuard ? 1.1 : 0.7, zoneLabel: 'in floater' },
    ];
  } else if (actionType === 'post_up') {
    zones = [
      { xMin: 86, xMax: 92, yMin: 32, yMax: 42, weight: 1.15, zoneLabel: 'dal post basso' },
      { xMin: 86, xMax: 92, yMin: 58, yMax: 68, weight: 1.15, zoneLabel: 'dal post basso' },
      { xMin: 84, xMax: 89, yMin: 44, yMax: 56, weight: 0.9, zoneLabel: 'a centro area' },
    ];
  } else if (actionType === 'pick_and_roll') {
    zones = [
      { xMin: 88, xMax: 93, yMin: 43, yMax: 57, weight: isBig ? 1.6 : 0.9, zoneLabel: 'sul roll al ferro' },
      { xMin: 79, xMax: 85, yMin: 42, yMax: 58, weight: 1.0, zoneLabel: 'sullo short roll' },
      { xMin: 75, xMax: 81, yMin: 30, yMax: 41, weight: isGuard ? 1.25 : 0.45, zoneLabel: 'dal gomito' },
      { xMin: 75, xMax: 81, yMin: 59, yMax: 70, weight: isGuard ? 1.25 : 0.45, zoneLabel: 'dal gomito' },
    ];
  } else {
    zones = [
      { xMin: 75, xMax: 80, yMin: 28, yMax: 39, weight: 1.15, zoneLabel: 'dal gomito' },
      { xMin: 75, xMax: 80, yMin: 61, yMax: 72, weight: 1.15, zoneLabel: 'dal gomito' },
      { xMin: 74, xMax: 79, yMin: 43, yMax: 57, weight: 1.05, zoneLabel: 'dalla lunetta' },
      { xMin: 85, xMax: 91, yMin: 17, yMax: 28, weight: 0.9, zoneLabel: 'dalla linea di fondo' },
      { xMin: 85, xMax: 91, yMin: 72, yMax: 83, weight: 0.9, zoneLabel: 'dalla linea di fondo' },
    ];
  }

  const chosen = pickWeighted(
    zones,
    zones.map((z) => z.weight)
  );
  const rawX = randBetween(chosen.xMin, chosen.xMax);
  const x = Number((isAttackLeft ? rawX : 100 - rawX).toFixed(1));
  const y = Number(randBetween(chosen.yMin, chosen.yMax).toFixed(1));
  return { x, y, zoneLabel: chosen.zoneLabel };
}

/**
 * Simula UN singolo possesso e restituisce il nuovo MatchState mutato/clonato.
 */
export function simulateNextPossession(
  state: MatchState,
  homeTeam: Team,
  awayTeam: Team,
  autoSubHome = true
): MatchState {
  if (state.finished) return state;

  const homeMap = getPlayerMap(homeTeam);
  const awayMap = getPlayerMap(awayTeam);

  const offSide = state.possession;
  const offTeam = offSide === 'home' ? state.home : state.away;
  const defTeam = offSide === 'home' ? state.away : state.home;
  const offRoster = offSide === 'home' ? homeMap : awayMap;
  const defRoster = offSide === 'home' ? awayMap : homeMap;

  // Eventuale schema disegnato dall'utente (ATO da timeout oppure chiamata random dal Playbook attivo)
  let activeCustomPlay: CustomPlay | undefined;
  let wasAtoCall = false;
  if (offTeam.nextAtoPlayId) {
    activeCustomPlay = offTeam.tactics.customPlays?.find((p) => p.id === offTeam.nextAtoPlayId);
    wasAtoCall = Boolean(activeCustomPlay);
    offTeam.nextAtoPlayId = null;
  } else {
    const enabledCustom = (offTeam.tactics.customPlays ?? []).filter((p) => p.active);
    if (enabledCustom.length > 0 && Math.random() < 0.34) {
      activeCustomPlay = enabledCustom[Math.floor(Math.random() * enabledCustom.length)];
    }
  }
  const customAnalysis = activeCustomPlay ? analyzeCustomPlay(activeCustomPlay) : null;

  // Durata possesso in base al ritmo (5 livelli), focus e intensità
  let baseDuration = 14.8;
  switch (offTeam.tactics.pace) {
    case 'Controllo':
      baseDuration = 19.2;
      break;
    case 'Lento':
      baseDuration = 17.5;
      break;
    case 'Ritmo Alto':
      baseDuration = 13.5;
      break;
    case 'Run & Gun':
      baseDuration = 12.4;
      break;
    default:
      baseDuration = 14.8;
  }
  if (offTeam.tactics.offensiveFocus === 'Transizione') baseDuration -= 1.1;
  if (offTeam.tactics.offensiveFocus === 'Motion') baseDuration += 0.8;
  if (offTeam.tactics.offensiveAggression === 'Tiro rapido') baseDuration -= 2.2;
  if (offTeam.tactics.offensiveAggression === 'Gestione cronometro') baseDuration += 3.2;
  if (defTeam.tactics.defense === 'Pressing') baseDuration -= 1.5;
  if (defTeam.tactics.defense === 'Zona 1-3-1') baseDuration -= 0.7;
  if (defTeam.tactics.opponentFocus === 'Ferma Transizione') baseDuration += 1.0;
  if (customAnalysis) baseDuration += customAnalysis.extraDurationSec * 0.45;

  const elapsed = Math.min(
    state.clockRemaining,
    Math.max(4, Math.round(baseDuration + (Math.random() * 8 - 4)))
  );

  state.clockRemaining -= elapsed;
  state.possessionCount += 1;

  // Aggiorna secondi giocati e fatica per i 10 giocatori in campo
  const paceDrain =
    offTeam.tactics.pace === 'Run & Gun'
      ? 0.54
      : offTeam.tactics.pace === 'Ritmo Alto'
      ? 0.46
      : offTeam.tactics.pace === 'Lento'
      ? 0.36
      : offTeam.tactics.pace === 'Controllo'
      ? 0.33
      : 0.4;
  const defDrain =
    (defTeam.tactics.defense === 'Pressing'
      ? 0.16
      : defTeam.tactics.defense === 'Zona 1-3-1'
      ? 0.08
      : 0) +
    (defTeam.tactics.defensiveIntensity === 'Fisica'
      ? 0.09
      : defTeam.tactics.defensiveIntensity === 'Conservativa'
      ? -0.05
      : 0) +
    (defTeam.tactics.pnrCoverage === 'Trap' ? 0.05 : 0);
  const fatigueDrain = Math.max(0.24, paceDrain + defDrain);

  for (const p of state.home.players) {
    if (p.onCourt) {
      p.secondsPlayed += elapsed;
      const staminaAttr = homeMap.get(p.playerId)?.attributes.stamina ?? 75;
      const drain = fatigueDrain * (1.28 - staminaAttr / 220);
      p.stamina = clamp(p.stamina - drain, 15, 100);
    } else {
      p.stamina = clamp(p.stamina + 0.65, 0, 100);
    }
  }
  for (const p of state.away.players) {
    if (p.onCourt) {
      p.secondsPlayed += elapsed;
      const staminaAttr = awayMap.get(p.playerId)?.attributes.stamina ?? 75;
      const drain = fatigueDrain * (1.28 - staminaAttr / 220);
      p.stamina = clamp(p.stamina - drain, 15, 100);
    } else {
      p.stamina = clamp(p.stamina + 0.65, 0, 100);
    }
  }

  const offOnCourt = offTeam.players.filter((p) => p.onCourt && !p.fouledOut);
  const defOnCourt = defTeam.players.filter((p) => p.onCourt && !p.fouledOut);

  // Scegli tiratore / portatore di palla pesato per tattica, gerarchie e regole individuali
  const defTopStar = [...defOnCourt].sort(
    (a, b) => (defRoster.get(b.playerId)?.overall ?? 70) - (defRoster.get(a.playerId)?.overall ?? 70)
  )[0];
  const offFocus = offTeam.tactics.offensiveFocus;

  const shooterWeights = offOnCourt.map((p) => {
    const attr = offRoster.get(p.playerId);
    const ovr = attr?.overall ?? 70;
    let w = Math.pow(ovr - 45, 1.35);
    if (offFocus === 'Tiro da 3' && attr) {
      w *= 0.8 + attr.attributes.threePoint / 180;
    } else if (offFocus === 'Gioco interno' && (p.position === 'PF' || p.position === 'C')) {
      w *= 1.45;
    } else if (offFocus === 'Pick & Roll' && (p.position === 'PG' || p.position === 'C')) {
      w *= 1.32;
    } else if (offFocus === 'Motion' && attr) {
      w *= 0.86 + (attr.attributes.basketballIQ + attr.attributes.passing) / 420;
    } else if (offFocus === 'Isolamento' && attr) {
      w *= 0.82 + (attr.attributes.ballHandling + attr.attributes.finishing) / 320;
    } else if (offFocus === 'Transizione' && attr) {
      w *= 0.84 + attr.attributes.athleticism / 240;
    }

    if (offTeam.goToPlayerId === p.playerId) {
      w *= 1.85;
    } else if (offTeam.secondaryOptionPlayerId === p.playerId) {
      w *= 1.35;
    }

    const oppRuleOnShooter = defTeam.opponentPlayerRules?.[p.playerId];
    if (oppRuleOnShooter === 'Nega Ricezione') {
      w *= 0.68;
    } else if (oppRuleOnShooter === 'Raddoppia') {
      w *= 0.82;
    }

    // Caccia Mismatch: aumenta i possessi per chi affronta il bersaglio designato
    const posMatchOpp = defOnCourt.find((d) => d.position === p.position);
    if (posMatchOpp && offTeam.opponentPlayerRules?.[posMatchOpp.playerId] === 'Caccia Mismatch') {
      w *= 1.42;
    }
    if (
      offTeam.tactics.opponentFocus === 'Attacca i Lunghi' &&
      (p.position === 'PF' || p.position === 'C' || p.position === 'SG' || p.position === 'PG') &&
      posMatchOpp &&
      (posMatchOpp.position === 'PF' || posMatchOpp.position === 'C')
    ) {
      w *= 1.2;
    }

    if (p.stamina < 45) w *= 0.78;
    if (activeCustomPlay) {
      if (p.position === activeCustomPlay.shooterRole) w *= 12;
      else w *= 0.18;
    }
    return w;
  });

  const shooter = pickWeighted(offOnCourt, shooterWeights);
  const shooterData = offRoster.get(shooter.playerId);
  const shooterAttr = shooterData?.attributes;

  // Difensore primario: marcatura personalizzata (se in campo) o stesso ruolo
  const assignedDefId = defTeam.defensiveMatchups?.[shooter.playerId];
  const assignedDefender = assignedDefId
    ? defOnCourt.find((d) => d.playerId === assignedDefId)
    : undefined;
  const defender =
    assignedDefender ??
    defOnCourt.find((d) => d.position === shooter.position) ??
    defOnCourt[Math.floor(Math.random() * defOnCourt.length)];
  const defAttr = defRoster.get(defender.playerId)?.attributes;
  const defRuleOnShooter = defTeam.opponentPlayerRules?.[shooter.playerId] ?? 'Standard';
  const offRuleOnDefender = offTeam.opponentPlayerRules?.[defender.playerId] ?? 'Standard';
  const isBoxOneTarget =
    defTeam.tactics.defense === 'Box-and-One' &&
    (defTeam.defensiveFocusPlayerId
      ? defTeam.defensiveFocusPlayerId === shooter.playerId
      : defTopStar?.playerId === shooter.playerId || shooter.isStarter);
  const isTightMarked =
    defTeam.defensiveFocusPlayerId === shooter.playerId ||
    defRuleOnShooter === 'Nega Ricezione' ||
    isBoxOneTarget;
  const isDoubleTeamed = defRuleOnShooter === 'Raddoppia';

  // 1. Check Palla Persa / Rubata (~14.5% base)
  const offClub = offSide === 'home' ? homeTeam : awayTeam;
  const defClub = offSide === 'home' ? awayTeam : homeTeam;
  const chemistryToMod = -((offClub.chemistry ?? 68) - 68) * 0.0007;
  const trainingToMod = offClub.training?.focus === 'Tattica Pre-Partita' ? -0.01 : 0;

  const ballHandling = shooterAttr?.ballHandling ?? 72;
  const defSteal = defAttr?.steals ?? 68;
  const pressingBonus =
    defTeam.tactics.defense === 'Pressing'
      ? 0.032
      : defTeam.tactics.defense === 'Zona 1-3-1'
      ? 0.022
      : 0;
  const zonePenalty =
    defTeam.tactics.defense === 'Zona 2-3' ||
    defTeam.tactics.defense === 'Zona 3-2' ||
    defTeam.tactics.defense === 'Box-and-One'
      ? -0.01
      : 0;
  const clockControlToBonus =
    offTeam.tactics.offensiveAggression === 'Gestione cronometro' ? -0.015 : 0;
  const motionToMod =
    offFocus === 'Motion' ? -0.014 : offFocus === 'Isolamento' ? -0.006 : 0;
  const paceToMod =
    offTeam.tactics.pace === 'Controllo'
      ? -0.012
      : offTeam.tactics.pace === 'Run & Gun'
      ? 0.01
      : 0;
  const pnrTrapToBonus = defTeam.tactics.pnrCoverage === 'Trap' ? 0.014 : 0;
  const tightMarkToBonus = isTightMarked ? 0.02 : isDoubleTeamed ? 0.03 : 0;
  const fatigueTo = shooter.stamina < 45 ? 0.025 : 0;
  const customToMod = customAnalysis ? customAnalysis.turnoverRiskMod : 0;
  const turnoverProb = clamp(
    0.142 +
      (defSteal - ballHandling) * 0.0014 +
      pressingBonus +
      zonePenalty +
      clockControlToBonus +
      motionToMod +
      paceToMod +
      pnrTrapToBonus +
      tightMarkToBonus +
      fatigueTo +
      chemistryToMod +
      trainingToMod +
      customToMod,
    0.07,
    0.25
  );

  const isAttackLeft = offSide === 'home';
  const playPrefix = activeCustomPlay ? `[${activeCustomPlay.name}] ` : '';

  if (Math.random() < turnoverProb) {
    shooter.turnovers += 1;
    const isSteal = Math.random() < 0.56;
    if (isSteal) {
      defender.steals += 1;
      addPlayByPlay(
        state,
        offTeam.teamId,
        'steal',
        `${playPrefix}${defender.name} ruba palla a ${shooter.name}! Contropiede ${defTeam.shortName}.`
      );
    } else {
      addPlayByPlay(
        state,
        offTeam.teamId,
        'turnover',
        `${playPrefix}Palla persa da ${shooter.name} (${offTeam.shortName}) per infrazione di passi.`
      );
    }
    state.visual = {
      possessionTeamId: defTeam.teamId,
      attackSide: offSide,
      actionType: isSteal ? 'steal' : 'turnover',
      ballX: isAttackLeft ? 68 : 32,
      ballY: 30 + Math.random() * 40,
      shooterId: shooter.playerId,
      customPlayId: activeCustomPlay?.id,
    };
    switchPossessionAndCheckQuarter(state, homeTeam, awayTeam, autoSubHome);
    return { ...state };
  }

  // 2. Check Fallo non su tiro (Bonus dopo 4 falli di squadra)
  const intensityFoulDelta =
    defTeam.tactics.defensiveIntensity === 'Fisica'
      ? 0.022
      : defTeam.tactics.defensiveIntensity === 'Conservativa'
      ? -0.022
      : 0;
  const nonShootingFoulProb = clamp(
    (defTeam.tactics.defense === 'Pressing' ? 0.095 : 0.068) + intensityFoulDelta,
    0.035,
    0.14
  );
  if (Math.random() < nonShootingFoulProb) {
    const fouler = defOnCourt[Math.floor(Math.random() * defOnCourt.length)];
    fouler.fouls += 1;
    defTeam.teamFoulsThisQuarter += 1;
    if (fouler.fouls >= 5) {
      fouler.fouledOut = true;
      fouler.onCourt = false;
    }

    if (defTeam.teamFoulsThisQuarter > 4) {
      // Bonus! 2 Tiri Liberi
      addPlayByPlay(
        state,
        defTeam.teamId,
        'foul',
        `Fallo di ${fouler.name} in situazione di BONUS: ${shooter.name} va in lunetta (2 liberi).${
          fouler.fouledOut ? ` ${fouler.name} esce per 5 falli!` : ''
        }`
      );
      const ftPct = clamp(0.58 + ((shooterAttr?.freeThrow ?? 75) - 55) * 0.0065, 0.52, 0.94);
      const made = shootFreeThrows({
        state,
        offTeam,
        shooter,
        numFT: 2,
        ftPct,
      });
      state.visual = {
        possessionTeamId: offTeam.teamId,
        attackSide: offSide,
        actionType: 'freethrow',
        ballX: isAttackLeft ? 78 : 22,
        ballY: 50,
        shooterId: shooter.playerId,
        made: made > 0,
        customPlayId: activeCustomPlay?.id,
      };
      switchPossessionAndCheckQuarter(state, homeTeam, awayTeam, autoSubHome);
      return { ...state };
    } else {
      addPlayByPlay(
        state,
        defTeam.teamId,
        'foul',
        `Fallo di ${fouler.name} (${defTeam.shortName}, ${fouler.fouls}° fallo). Rimessa laterale.`
      );
      if (fouler.fouledOut) {
        addPlayByPlay(
          state,
          defTeam.teamId,
          'foul',
          `USCITA PER 5 FALLI: ${fouler.name} deve abbandonare il parquet!`
        );
      }
      // Rimessa: prosegue possesso senza cambio palla (conserva eventuale ATO)
      if (wasAtoCall && activeCustomPlay) {
        offTeam.nextAtoPlayId = activeCustomPlay.id;
      }
      checkQuarterEnd(state, homeTeam, awayTeam, autoSubHome);
      return { ...state };
    }
  }

  // 3. Decisione tiro: da 3 punti vs da 2 punti
  const playbook = offTeam.tactics.playbook ?? [];
  let threeRate = 0.36;
  if (offFocus === 'Tiro da 3') threeRate += 0.1;
  if (offFocus === 'Gioco interno') threeRate -= 0.1;
  if (offFocus === 'Isolamento') threeRate -= 0.05;
  if (offFocus === 'Motion') threeRate += 0.03;
  if (offTeam.tactics.offensiveAggression === 'Attacca il ferro') threeRate -= 0.06;
  if (offTeam.tactics.offensiveAggression === 'Tiro rapido') threeRate += 0.05;
  if (playbook.includes('floppy') || playbook.includes('drive_kick_3pt')) threeRate += 0.015;
  if (playbook.includes('high_low')) threeRate -= 0.015;
  if (defTeam.tactics.defense === 'Zona 2-3') threeRate += 0.06;
  if (defTeam.tactics.defense === 'Zona 3-2') threeRate -= 0.06;
  if (defTeam.tactics.defense === 'Zona 1-3-1') threeRate += 0.04;
  if (defTeam.tactics.defense === 'Cambio Sistematico') threeRate -= 0.03;
  if (defTeam.tactics.pnrCoverage === 'Drop' || defTeam.tactics.pnrCoverage === 'Switch') {
    threeRate -= 0.025;
  }
  if (defRuleOnShooter === 'Passa Sotto (3PT)') threeRate += 0.09;
  if (shooter.position === 'C') threeRate -= 0.2;
  if (shooter.position === 'SG' || shooter.position === 'PG') threeRate += 0.05;
  threeRate = clamp(threeRate, 0.1, 0.58);

  const isThree = customAnalysis ? customAnalysis.isThree : Math.random() < threeRate;

  // Possibile Assistman
  const teammates = offOnCourt.filter((p) => p.playerId !== shooter.playerId);
  const passer =
    teammates.length > 0
      ? pickWeighted(
          teammates,
          teammates.map((t) => {
            const passBase = offRoster.get(t.playerId)?.attributes.passing ?? 65;
            if (customAnalysis?.passerRole && t.position === customAnalysis.passerRole) {
              return passBase * 8;
            }
            return passBase;
          })
        )
      : null;

  // Check Fallo sul tiro (~11% sui tiri da 2, ~2.5% sui tiri da 3)
  let shootingFoulProb = isThree ? 0.025 : 0.115;
  if (offTeam.tactics.offensiveAggression === 'Attacca il ferro') shootingFoulProb += 0.035;
  if (offFocus === 'Isolamento') shootingFoulProb += 0.028;
  if (
    offTeam.tactics.opponentFocus === 'Attacca i Lunghi' &&
    (defender.position === 'PF' || defender.position === 'C')
  ) {
    shootingFoulProb += 0.045;
  }
  if (
    defTeam.tactics.defense === 'Zona 2-3' ||
    defTeam.tactics.defense === 'Zona 3-2' ||
    defTeam.tactics.defense === 'Zona 1-3-1'
  ) {
    shootingFoulProb -= 0.015;
  }
  shootingFoulProb += intensityFoulDelta + (customAnalysis ? customAnalysis.foulDrawBonus : 0);
  if (isTightMarked || isDoubleTeamed) shootingFoulProb += 0.02;
  shootingFoulProb = clamp(shootingFoulProb, 0.01, 0.24);
  const isShootingFoul = Math.random() < shootingFoulProb;

  if (isShootingFoul) {
    defender.fouls += 1;
    defTeam.teamFoulsThisQuarter += 1;
    if (defender.fouls >= 5) {
      defender.fouledOut = true;
      defender.onCourt = false;
    }

    const numFT = isThree ? 3 : 2;
    addPlayByPlay(
      state,
      defTeam.teamId,
      'foul',
      `Fallo di ${defender.name} sul tiro di ${shooter.name}! (${numFT} tiri liberi).${
        defender.fouledOut ? ` ${defender.name} esce per 5 falli!` : ''
      }`
    );
    const ftPct = clamp(0.58 + ((shooterAttr?.freeThrow ?? 75) - 55) * 0.0065, 0.52, 0.94);
    const made = shootFreeThrows({
      state,
      offTeam,
      shooter,
      numFT,
      ftPct,
    });
    state.visual = {
      possessionTeamId: offTeam.teamId,
      attackSide: offSide,
      actionType: 'freethrow',
      ballX: isAttackLeft ? 78 : 22,
      ballY: 50,
      shooterId: shooter.playerId,
      made: made > 0,
      customPlayId: activeCustomPlay?.id,
    };
    switchPossessionAndCheckQuarter(state, homeTeam, awayTeam, autoSubHome);
    return { ...state };
  }

  // 4. Risoluzione Tiro da 3 o da 2
  const homeCourtBonus = offSide === 'home' ? 0.015 : 0;
  const staminaPenalty = shooter.stamina < 45 ? -0.045 : 0;
  const momentumBonus = clamp(offTeam.momentum * 0.003, -0.02, 0.025);
  const assistantEdge =
    ((offClub.staff?.assistant_coach?.rating ?? 70) -
      (defClub.staff?.assistant_coach?.rating ?? 70)) *
    0.0005;
  const trainingEdge =
    (offClub.training?.focus === 'Tiro e Spaziature' ? 0.008 : 0) +
    (defClub.training?.focus === 'Difesa di Squadra' ? -0.008 : 0);
  const assistChemistryBonus =
    clamp(((offClub.chemistry ?? 68) - 65) * 0.0025, -0.08, 0.12) +
    (offFocus === 'Motion' ? 0.12 : offFocus === 'Isolamento' ? -0.18 : 0);
  const intensityShotMod =
    defTeam.tactics.defensiveIntensity === 'Fisica'
      ? -0.014
      : defTeam.tactics.defensiveIntensity === 'Conservativa'
      ? 0.012
      : 0;
  const motionIQEdge =
    offFocus === 'Motion' && ((shooterAttr?.basketballIQ ?? 70) >= 72) ? 0.014 : 0;
  const mismatchAttackEdge = offRuleOnDefender === 'Caccia Mismatch' ? 0.03 : 0;
  const customShotBonus = customAnalysis ? customAnalysis.shotQualityBonus : 0;
  const customZoneBonus = customAnalysis
    ? (customAnalysis.isCornerThree && defTeam.tactics.defense === 'Zona 2-3') ||
      (customAnalysis.isPaintOrRim &&
        (defTeam.tactics.defense === 'Zona 3-2' ||
          defTeam.tactics.defense === 'Cambio Sistematico'))
      ? 0.025
      : 0
    : 0;

  let actionType: CourtActionType = isThree ? 'three_shot' : 'two_shot';

  if (isThree) {
    const customEndPt = activeCustomPlay
      ? getFinalStepPositions(activeCustomPlay)[activeCustomPlay.shooterRole]
      : undefined;
    const shotLoc =
      customEndPt && customAnalysis
        ? {
            x: isAttackLeft ? customEndPt.x : 100 - customEndPt.x,
            y: customEndPt.y,
            zoneLabel: customAnalysis.shotZoneLabel,
          }
        : pickShotLocation({
            isThree: true,
            actionType: 'three_shot',
            shooterPos: shooter.position,
            isAttackLeft,
          });
    shooter.fga += 1;
    shooter.tpa += 1;

    const threeSkill = shooterAttr?.threePoint ?? 72;
    const perimDef = defAttr?.perimeterDef ?? 70;
    const zone32ThreeMod =
      defTeam.tactics.defense === 'Zona 3-2'
        ? -0.025
        : defTeam.tactics.defense === 'Zona 1-3-1'
        ? shotLoc.y <= 15 || shotLoc.y >= 85
          ? 0.02
          : -0.018
        : 0;
    const oppFocus = defTeam.tactics.opponentFocus ?? 'Equilibrata';
    const oppThreeMod =
      oppFocus === 'Chiudi Arco 3PT'
        ? -0.032
        : oppFocus === 'Proteggi Area'
        ? 0.015
        : oppFocus === 'Raddoppia Stella' && shooter.isStarter && threeSkill >= 74
        ? -0.035
        : 0;
    const goUnderMod =
      defRuleOnShooter === 'Passa Sotto (3PT)'
        ? threeSkill >= 75
          ? 0.04
          : 0.015
        : 0;
    const tightMarkShotMod = isDoubleTeamed
      ? -0.045
      : isBoxOneTarget
      ? -0.038
      : isTightMarked
      ? -0.032
      : 0;
    // Target realistico FIBA: 32-40% (media ~35.5%)
    const makeProb = clamp(
      0.332 +
        (threeSkill - 72) * 0.004 -
        (perimDef - 72) * 0.0022 +
        homeCourtBonus +
        staminaPenalty +
        momentumBonus +
        assistantEdge +
        trainingEdge +
        zone32ThreeMod +
        oppThreeMod +
        goUnderMod +
        tightMarkShotMod +
        intensityShotMod +
        motionIQEdge +
        mismatchAttackEdge +
        customShotBonus +
        customZoneBonus,
      0.2,
      0.47
    );

    const made = Math.random() < makeProb;
    if (made) {
      shooter.fgm += 1;
      shooter.tpm += 1;
      addPoints(offTeam, shooter, 3, state.quarter);
      offTeam.momentum = clamp(offTeam.momentum + 2, -10, 10);
      defTeam.momentum = clamp(defTeam.momentum - 1, -10, 10);

      let assistText = '';
      let assistName: string | undefined;
      if (passer && Math.random() < 0.68 + assistChemistryBonus + (customAnalysis && customAnalysis.passCount > 0 ? 0.14 : 0)) {
        passer.assists += 1;
        assistName = passer.name;
        assistText = customAnalysis
          ? ` (${customAnalysis.passCueLabel} ${passer.name})`
          : ` (assist di ${passer.name})`;
      }
      addPlayByPlay(
        state,
        offTeam.teamId,
        'score3',
        `${playPrefix}TRIPLA! ${shooter.name} punisce ${shotLoc.zoneLabel}${assistText}!`,
        {
          scorerId: shooter.playerId,
          scorerName: shooter.name,
          pointsScored: 3,
          assistName,
        }
      );
      if (Math.random() < 0.015) {
        const ftPct = clamp(0.58 + ((shooterAttr?.freeThrow ?? 75) - 55) * 0.0065, 0.52, 0.94);
        resolveAndOneFreeThrow({ state, offTeam, defTeam, shooter, defender, ftPct });
      }
      state.visual = {
        possessionTeamId: offTeam.teamId,
        attackSide: offSide,
        actionType: 'three_shot',
        ballX: shotLoc.x,
        ballY: shotLoc.y,
        shooterId: shooter.playerId,
        passerId: passer?.playerId,
        made: true,
        customPlayId: activeCustomPlay?.id,
      };
      switchPossessionAndCheckQuarter(state, homeTeam, awayTeam, autoSubHome);
      return { ...state };
    } else {
      addPlayByPlay(
        state,
        offTeam.teamId,
        'miss',
        `${playPrefix}${shooter.name} ci prova da tre punti ${shotLoc.zoneLabel}, ferro!`
      );
      state.visual = {
        possessionTeamId: offTeam.teamId,
        attackSide: offSide,
        actionType: 'three_shot',
        ballX: shotLoc.x,
        ballY: shotLoc.y,
        shooterId: shooter.playerId,
        passerId: passer?.playerId,
        made: false,
        customPlayId: activeCustomPlay?.id,
      };
    }
  } else {
    // Tiro da 2 (Pick & Roll, contropiede, penetrazione o gioco interno/midrange)
    const pnrBoost = playbook.includes('pick_and_roll_centrale') || playbook.includes('spain_pnr') ? 0.04 : 0;
    const isPickAndRoll =
      offFocus !== 'Isolamento' &&
      ((offFocus === 'Pick & Roll' && Math.random() < 0.58 + pnrBoost) ||
        Math.random() < 0.22);
    const fastbreakChance = clamp(
      (offFocus === 'Transizione' ? 0.38 : 0.14) +
        (offTeam.tactics.pace === 'Run & Gun'
          ? 0.18
          : offTeam.tactics.pace === 'Ritmo Alto'
          ? 0.08
          : offTeam.tactics.pace === 'Controllo'
          ? -0.06
          : 0) +
        (defTeam.tactics.reboundPolicy === 'Aggredisci Rimbalzo'
          ? 0.07
          : defTeam.tactics.reboundPolicy === 'Rientro Difensivo'
          ? -0.07
          : 0) +
        (defTeam.tactics.opponentFocus === 'Ferma Transizione' ? -0.09 : 0),
      0.04,
      0.52
    );
    const isFastbreak = !activeCustomPlay && !isPickAndRoll && Math.random() < fastbreakChance;
    const isDriveOrPost = customAnalysis
      ? customAnalysis.isPaintOrRim || customAnalysis.actionType === 'pick_and_roll'
      : isPickAndRoll || isFastbreak || Math.random() < 0.62;

    actionType = customAnalysis
      ? customAnalysis.actionType
      : isPickAndRoll
      ? 'pick_and_roll'
      : isFastbreak
      ? 'fastbreak'
      : isDriveOrPost
      ? offFocus === 'Gioco interno'
        ? 'post_up'
        : 'drive'
      : 'two_shot';

    const customEndPt2 = activeCustomPlay
      ? getFinalStepPositions(activeCustomPlay)[activeCustomPlay.shooterRole]
      : undefined;
    const shotLoc =
      customEndPt2 && customAnalysis
        ? {
            x: isAttackLeft ? customEndPt2.x : 100 - customEndPt2.x,
            y: customEndPt2.y,
            zoneLabel: customAnalysis.shotZoneLabel,
          }
        : pickShotLocation({
            isThree: false,
            actionType,
            shooterPos: shooter.position,
            isAttackLeft,
          });

    // Check Stoppata
    const blkSkill = defAttr?.blocks ?? 65;
    const blockProb = clamp(0.038 + (blkSkill - 68) * 0.0014, 0.02, 0.095);
    if (Math.random() < blockProb) {
      shooter.fga += 1;
      defender.blocks += 1;
      addPlayByPlay(
        state,
        defTeam.teamId,
        'block',
        `${playPrefix}STOPPATA! ${defender.name} cancella il tentativo di ${shooter.name} ${shotLoc.zoneLabel}!`
      );
      // Rimbalzo dopo stoppata
      const defReb = pickWeighted(
        defOnCourt,
        defOnCourt.map((p) => defRoster.get(p.playerId)?.attributes.rebounding ?? 68)
      );
      defReb.rebounds += 1;
      defReb.dreb += 1;
      state.visual = {
        possessionTeamId: defTeam.teamId,
        attackSide: offSide,
        actionType,
        ballX: shotLoc.x,
        ballY: shotLoc.y,
        shooterId: shooter.playerId,
        passerId: passer?.playerId,
        made: false,
        blocked: true,
        customPlayId: activeCustomPlay?.id,
      };
      switchPossessionAndCheckQuarter(state, homeTeam, awayTeam, autoSubHome);
      return { ...state };
    }

    shooter.fga += 1;
    const twoSkill = isDriveOrPost
      ? shooterAttr?.finishing ?? 74
      : shooterAttr?.twoPoint ?? 74;
    const defSkill = isDriveOrPost
      ? defAttr?.postDef ?? 70
      : defAttr?.perimeterDef ?? 70;

    // Target realistico FIBA 2PT: 45-52% (media ~49%)
    const zoneTwoMod =
      defTeam.tactics.defense === 'Zona 2-3' && isDriveOrPost
        ? -0.022
        : defTeam.tactics.defense === 'Zona 3-2' && isDriveOrPost
        ? 0.025
        : (defTeam.tactics.defense === 'Cambio Sistematico' || defTeam.tactics.pnrCoverage === 'Switch') &&
          (shooter.position === 'PF' || shooter.position === 'C') &&
          !isFastbreak
        ? 0.018
        : 0;
    const pnrCoverageTwoMod =
      actionType === 'pick_and_roll'
        ? defTeam.tactics.pnrCoverage === 'Drop'
          ? -0.02
          : defTeam.tactics.pnrCoverage === 'Trap'
          ? shooter.position === 'C' || shooter.position === 'PF'
            ? 0.022
            : -0.02
          : 0
        : 0;
    const oppFocusTwo = defTeam.tactics.opponentFocus ?? 'Equilibrata';
    const oppTwoMod =
      oppFocusTwo === 'Proteggi Area' && isDriveOrPost
        ? -0.032
        : oppFocusTwo === 'Chiudi Arco 3PT' && isDriveOrPost
        ? 0.015
        : oppFocusTwo === 'Raddoppia Stella' && shooter.isStarter && twoSkill >= 74
        ? -0.035
        : oppFocusTwo === 'Ferma Transizione' && isFastbreak
        ? -0.04
        : 0;
    const goUnderDriveMod =
      defRuleOnShooter === 'Passa Sotto (3PT)' && (actionType === 'drive' || actionType === 'pick_and_roll')
        ? -0.032
        : 0;
    const tightMarkTwoMod = isDoubleTeamed
      ? -0.045
      : isBoxOneTarget
      ? -0.038
      : isTightMarked
      ? -0.032
      : 0;
    const makeProb = clamp(
      0.478 +
        (twoSkill - 73) * 0.0045 -
        (defSkill - 72) * 0.0028 +
        homeCourtBonus +
        staminaPenalty +
        momentumBonus +
        assistantEdge +
        trainingEdge +
        zoneTwoMod +
        pnrCoverageTwoMod +
        oppTwoMod +
        goUnderDriveMod +
        tightMarkTwoMod +
        intensityShotMod +
        motionIQEdge +
        mismatchAttackEdge +
        customShotBonus +
        customZoneBonus,
      0.34,
      0.68
    );

    const made = Math.random() < makeProb;
    if (made) {
      shooter.fgm += 1;
      addPoints(offTeam, shooter, 2, state.quarter);
      offTeam.momentum = clamp(offTeam.momentum + 1, -10, 10);

      let assistText = '';
      let assistName: string | undefined;
      if (passer && Math.random() < 0.56 + assistChemistryBonus + (customAnalysis && customAnalysis.passCount > 0 ? 0.14 : 0)) {
        passer.assists += 1;
        assistName = passer.name;
        assistText = ` ${customAnalysis?.passCueLabel ?? 'su assist di'} ${passer.name}`;
      }
      const desc =
        actionType === 'pick_and_roll'
          ? `Pick & Roll perfetto! ${shooter.name} chiude ${shotLoc.zoneLabel}${assistText}!`
          : actionType === 'fastbreak'
          ? `Contropiede fulmineo! ${shooter.name} appoggia ${shotLoc.zoneLabel}${assistText}!`
          : actionType === 'post_up'
          ? `Canestro di forza (${shotLoc.zoneLabel}) di ${shooter.name}${assistText}!`
          : actionType === 'drive'
          ? `Penetrazione vincente (${shotLoc.zoneLabel}) di ${shooter.name}${assistText}!`
          : `Tiro dalla media (${shotLoc.zoneLabel}) a bersaglio per ${shooter.name}${assistText}!`;

      addPlayByPlay(state, offTeam.teamId, 'score2', `${playPrefix}${desc}`, {
        scorerId: shooter.playerId,
        scorerName: shooter.name,
        pointsScored: 2,
        assistName,
      });

      const andOneProb =
        actionType === 'drive' ||
        actionType === 'post_up' ||
        actionType === 'pick_and_roll' ||
        actionType === 'fastbreak'
          ? 0.06
          : 0.02;
      if (Math.random() < andOneProb) {
        const ftPct = clamp(0.58 + ((shooterAttr?.freeThrow ?? 75) - 55) * 0.0065, 0.52, 0.94);
        resolveAndOneFreeThrow({ state, offTeam, defTeam, shooter, defender, ftPct });
      }
      state.visual = {
        possessionTeamId: offTeam.teamId,
        attackSide: offSide,
        actionType,
        ballX: shotLoc.x,
        ballY: shotLoc.y,
        shooterId: shooter.playerId,
        passerId: passer?.playerId,
        made: true,
        customPlayId: activeCustomPlay?.id,
      };
      switchPossessionAndCheckQuarter(state, homeTeam, awayTeam, autoSubHome);
      return { ...state };
    } else {
      addPlayByPlay(
        state,
        offTeam.teamId,
        'miss',
        `${playPrefix}${shooter.name} sbaglia la conclusione ${shotLoc.zoneLabel}.`
      );
      state.visual = {
        possessionTeamId: offTeam.teamId,
        attackSide: offSide,
        actionType,
        ballX: shotLoc.x,
        ballY: shotLoc.y,
        shooterId: shooter.playerId,
        passerId: passer?.playerId,
        made: false,
        customPlayId: activeCustomPlay?.id,
      };
    }
  }

  // 5. Rimbalzo su tiro sbagliato (~76% difensivo, ~24% offensivo modulato da ReboundPolicy)
  const offRebProb = clamp(
    0.24 +
      (offTeam.tactics.reboundPolicy === 'Aggredisci Rimbalzo'
        ? 0.06
        : offTeam.tactics.reboundPolicy === 'Rientro Difensivo'
        ? -0.06
        : 0),
    0.15,
    0.34
  );
  const isOffReb = Math.random() < offRebProb;
  if (isOffReb) {
    const offReb = pickWeighted(
      offOnCourt,
      offOnCourt.map((p) => offRoster.get(p.playerId)?.attributes.rebounding ?? 68)
    );
    offReb.rebounds += 1;
    offReb.oreb += 1;
    addPlayByPlay(
      state,
      offTeam.teamId,
      'rebound',
      `Rimbalzo offensivo di ${offReb.name}! Nuovo possesso per ${offTeam.shortName}.`
    );
    checkQuarterEnd(state, homeTeam, awayTeam, autoSubHome);
  } else {
    const defReb = pickWeighted(
      defOnCourt,
      defOnCourt.map((p) => defRoster.get(p.playerId)?.attributes.rebounding ?? 68)
    );
    defReb.rebounds += 1;
    defReb.dreb += 1;
    switchPossessionAndCheckQuarter(state, homeTeam, awayTeam, autoSubHome);
  }

  return { ...state };
}

function shootFreeThrows(params: {
  state: MatchState;
  offTeam: MatchTeamState;
  shooter: PlayerBoxScore;
  numFT: number;
  ftPct: number;
  labelPrefix?: string;
}): number {
  const { state, offTeam, shooter, numFT, ftPct, labelPrefix } = params;
  let made = 0;
  for (let i = 0; i < numFT; i++) {
    shooter.fta += 1;
    const countLabel = numFT === 1 ? 'Libero aggiuntivo' : `Libero ${i + 1}/${numFT}`;
    const prefix = labelPrefix ? `${labelPrefix} ` : '';
    if (Math.random() < ftPct) {
      shooter.ftm += 1;
      made += 1;
      addPoints(offTeam, shooter, 1, state.quarter);
      addPlayByPlay(
        state,
        offTeam.teamId,
        'freethrow',
        `${prefix}${countLabel} realizzato da ${shooter.name}.`,
        {
          scorerId: shooter.playerId,
          scorerName: shooter.name,
          pointsScored: 1,
        }
      );
    } else {
      addPlayByPlay(
        state,
        offTeam.teamId,
        'miss',
        `${prefix}${countLabel} sbagliato da ${shooter.name}.`
      );
    }
  }
  return made;
}

function resolveAndOneFreeThrow(params: {
  state: MatchState;
  offTeam: MatchTeamState;
  defTeam: MatchTeamState;
  shooter: PlayerBoxScore;
  defender: PlayerBoxScore;
  ftPct: number;
}): void {
  const { state, offTeam, defTeam, shooter, defender, ftPct } = params;
  defender.fouls += 1;
  defTeam.teamFoulsThisQuarter += 1;
  if (defender.fouls >= 5) {
    defender.fouledOut = true;
    defender.onCourt = false;
  }

  addPlayByPlay(
    state,
    defTeam.teamId,
    'foul',
    `Fallo di ${defender.name} sul canestro di ${shooter.name}! Tiro libero supplementare.${
      defender.fouledOut ? ` ${defender.name} esce per 5 falli!` : ''
    }`
  );

  shootFreeThrows({
    state,
    offTeam,
    shooter,
    numFT: 1,
    ftPct,
    labelPrefix: 'AND-1!',
  });
}

function addPlayByPlay(
  state: MatchState,
  teamId: string,
  type: PlayByPlayEvent['type'],
  text: string,
  meta?: {
    scorerId?: string;
    scorerName?: string;
    pointsScored?: 1 | 2 | 3;
    assistName?: string;
  }
) {
  state.playByPlay.unshift({
    id: nextPbpId(),
    quarter: state.quarter,
    clockRemaining: state.clockRemaining,
    teamId,
    type,
    text,
    homeScore: state.home.score,
    awayScore: state.away.score,
    ...(meta ?? {}),
  });
  if (state.playByPlay.length > 450) {
    state.playByPlay.length = 450;
  }
}

function switchPossessionAndCheckQuarter(
  state: MatchState,
  homeTeam: Team,
  awayTeam: Team,
  autoSubHome: boolean
) {
  state.possession = state.possession === 'home' ? 'away' : 'home';
  checkQuarterEnd(state, homeTeam, awayTeam, autoSubHome);
}

function checkQuarterEnd(
  state: MatchState,
  homeTeam: Team,
  awayTeam: Team,
  autoSubHome: boolean
) {
  const homeMap = getPlayerMap(homeTeam);
  const awayMap = getPlayerMap(awayTeam);

  // Sostituzioni AI (e utente se autoSubHome è attivo)
  if (autoSubHome) {
    const subs = performAutoSubstitutions(state.home, homeMap, state.quarter, state.clockRemaining);
    for (const msg of subs) {
      addPlayByPlay(state, state.home.teamId, 'sub', msg);
    }
  }
  const awaySubs = performAutoSubstitutions(state.away, awayMap, state.quarter, state.clockRemaining);
  for (const msg of awaySubs) {
    addPlayByPlay(state, state.away.teamId, 'sub', msg);
  }

  updatePIRForTeam(state.home);
  updatePIRForTeam(state.away);

  if (state.clockRemaining <= 0) {
    if (state.quarter >= 4 && state.home.score !== state.away.score) {
      state.finished = true;
      addPlayByPlay(
        state,
        state.home.score > state.away.score ? state.home.teamId : state.away.teamId,
        'period',
        `SIRENA FINALE! ${state.home.name} ${state.home.score} - ${state.away.score} ${state.away.name}.`
      );
      return;
    }

    // Fine quarto o inizio Overtime
    state.quarter += 1;
    state.clockRemaining = state.quarter <= 4 ? 600 : 300;
    state.home.teamFoulsThisQuarter = 0;
    state.away.teamFoulsThisQuarter = 0;

    if (state.quarter > 4) {
      state.home.quarterScores.push(0);
      state.away.quarterScores.push(0);
      addPlayByPlay(
        state,
        state.home.teamId,
        'period',
        `PARITÀ AL ${formatClock(0)}! Si va al Tempo Supplementare (${state.quarter - 4}° OT)!`
      );
    } else {
      addPlayByPlay(
        state,
        state.home.teamId,
        'period',
        `Inizia il ${state.quarter}° Quarto!`
      );
    }

    // Recupero stamina tra i quarti
    for (const p of [...state.home.players, ...state.away.players]) {
      if (!p.fouledOut) {
        p.stamina = clamp(p.stamina + 8, 0, 100);
      }
    }
  }
}

/**
 * Simula una partita completa istantaneamente (per le partite di giornata in background o "Simula fino alla fine").
 */
export function simulateFullMatch(
  gameId: string,
  round: number,
  homeTeam: Team,
  awayTeam: Team,
  isPlayoff = false,
  playoffSeriesId?: string
): MatchState {
  const state = initMatchState(gameId, round, homeTeam, awayTeam, isPlayoff, playoffSeriesId);
  let safety = 0;
  while (!state.finished && safety < 500) {
    simulateNextPossession(state, homeTeam, awayTeam, true);
    safety += 1;
  }
  return state;
}
