import {
  DefenseType,
  DefensiveIntensity,
  MatchTeamState,
  OffensiveAggression,
  OffensiveFocus,
  OffensivePlayId,
  OpponentDefensiveFocus,
  OpponentGamePlan,
  OpponentPlayerInstruction,
  OpponentPlayerRule,
  PaceType,
  PickAndRollCoverage,
  Player,
  Position,
  ReboundPolicy,
  Tactics,
  Team,
} from '../types';
import { TimeoutTacticalPlan } from './matchSimulator';

function avgAttr(players: Player[], getter: (p: Player) => number): number {
  if (players.length === 0) return 65;
  return players.reduce((sum, p) => sum + getter(p), 0) / players.length;
}

function getActiveRoster(team: Team): Player[] {
  const healthyActive = team.roster.filter(
    (p) => p.rosterSlot !== 'reserve' && p.injuryWeeks === 0
  );
  if (healthyActive.length >= 5) return healthyActive;
  const healthyAll = team.roster.filter((p) => p.injuryWeeks === 0);
  return healthyAll.length > 0 ? healthyAll : team.roster;
}

function posGroup(pos: Position): number {
  return pos === 'PG' || pos === 'SG' ? 0 : pos === 'SF' ? 1 : 2;
}

/**
 * Calcola le scelte tattiche ottimali (ritmo, attacco, difesa, coperture, piano avversario e playbook)
 * per il Vice Allenatore in base al roster disponibile e alle caratteristiche avversarie.
 */
export function computeAssistantTactics(
  userTeam: Team,
  opponentTeam?: Team
): { tactics: Tactics; summary: string } {
  const active = getActiveRoster(userTeam);
  const bigs = active.filter(
    (p) => p.primaryPosition === 'PF' || p.primaryPosition === 'C'
  );
  const guards = active.filter(
    (p) => p.primaryPosition === 'PG' || p.primaryPosition === 'SG'
  );

  const avg3PT = avgAttr(active, (p) => p.attributes.threePoint);
  const avgBigOff = avgAttr(
    bigs.length > 0 ? bigs : active,
    (p) => (p.attributes.twoPoint + p.attributes.finishing + p.attributes.rebounding) / 3
  );
  const avgPnr = avgAttr(
    guards.length > 0 ? guards : active,
    (p) => (p.attributes.passing + p.attributes.ballHandling) / 2
  );
  const avgAthletics = avgAttr(
    active,
    (p) => (p.attributes.athleticism + p.attributes.stamina) / 2
  );
  const avgIQ = avgAttr(active, (p) => (p.attributes.basketballIQ + p.attributes.passing) / 2);
  const avgReb = avgAttr(active, (p) => p.attributes.rebounding);
  const avgPerimDef = avgAttr(
    active,
    (p) => (p.attributes.perimeterDef + p.attributes.steals) / 2
  );
  const avgPostDef = avgAttr(
    active,
    (p) => (p.attributes.postDef + p.attributes.blocks) / 2
  );
  const sortedStars = [...active].sort((a, b) => b.overall - a.overall);
  const topStar = sortedStars[0];
  const secondStar = sortedStars[1];

  // 1. Pace (5 livelli)
  let pace: PaceType = 'Bilanciato';
  if (avgAthletics >= 78 && active.length >= 10) {
    pace = 'Run & Gun';
  } else if (avgAthletics >= 73 && active.length >= 9) {
    pace = 'Ritmo Alto';
  } else if (active.length <= 7 || avgAthletics <= 61) {
    pace = 'Controllo';
  } else if (avgAthletics <= 67) {
    pace = 'Lento';
  }

  // 2. Focus Offensivo (6 opzioni)
  const pnrScore = avgPnr * 0.6 + avgBigOff * 0.4;
  let offensiveFocus: OffensiveFocus = 'Pick & Roll';
  if (pace === 'Run & Gun' && avgAthletics >= 79) {
    offensiveFocus = 'Transizione';
  } else if (topStar && topStar.overall >= 79 && (!secondStar || topStar.overall - secondStar.overall >= 5) && topStar.attributes.ballHandling >= 74) {
    offensiveFocus = 'Isolamento';
  } else if (avgIQ >= 76 && avgPnr >= 73) {
    offensiveFocus = 'Motion';
  } else if (avg3PT >= avgBigOff + 2 && avg3PT >= pnrScore) {
    offensiveFocus = 'Tiro da 3';
  } else if (avgBigOff >= avg3PT + 2 && avgBigOff >= pnrScore) {
    offensiveFocus = 'Gioco interno';
  }

  // 3. Sistema Difensivo, Copertura P&R, Intensità & Piano Avversario
  let defense: DefenseType = 'Uomo';
  let opponentFocus: OpponentDefensiveFocus = 'Equilibrata';
  let pnrCoverage: PickAndRollCoverage = 'Hedge & Recover';
  let defensiveIntensity: DefensiveIntensity =
    avgAthletics >= 74 && active.length >= 10 ? 'Fisica' : active.length <= 8 ? 'Conservativa' : 'Standard';
  let opponentGamePlan: OpponentGamePlan | undefined = userTeam.tactics.opponentGamePlan;

  if (opponentTeam) {
    const oppActive = getActiveRoster(opponentTeam);
    const opp3PT = avgAttr(oppActive, (p) => p.attributes.threePoint);
    const oppBigs = oppActive.filter(
      (p) => p.primaryPosition === 'PF' || p.primaryPosition === 'C'
    );
    const oppInside = avgAttr(
      oppBigs.length > 0 ? oppBigs : oppActive,
      (p) => (p.attributes.twoPoint + p.attributes.finishing) / 2
    );
    const oppSorted = [...oppActive].sort((a, b) => b.overall - a.overall);
    const oppStar = oppSorted[0];
    const oppSecond = oppSorted[1];
    const oppBigDef = avgAttr(oppBigs.length > 0 ? oppBigs : oppActive, (p) => p.attributes.postDef);

    if (opponentTeam.tactics.pace === 'Run & Gun' || opponentTeam.tactics.offensiveFocus === 'Transizione') {
      opponentFocus = 'Ferma Transizione';
    } else if (oppStar && oppStar.overall >= 74 && (!oppSecond || oppStar.overall - oppSecond.overall >= 4)) {
      opponentFocus = 'Raddoppia Stella';
    } else if (opp3PT >= oppInside + 3) {
      opponentFocus = 'Chiudi Arco 3PT';
    } else if (oppInside >= opp3PT + 3) {
      opponentFocus = 'Proteggi Area';
    } else if (avgBigOff >= oppBigDef + 4) {
      opponentFocus = 'Attacca i Lunghi';
    }

    if (avgPerimDef >= 77 && avgAthletics >= 76 && pace === 'Run & Gun') {
      defense = 'Pressing';
    } else if (oppStar && oppStar.overall >= 79 && oppSecond && oppStar.overall - oppSecond.overall >= 6) {
      defense = 'Box-and-One';
    } else if (avgPerimDef >= 72 && avgPostDef >= 70 && opponentTeam.tactics.offensiveFocus === 'Pick & Roll') {
      defense = 'Cambio Sistematico';
    } else if (avgPerimDef >= 73 && avgAthletics >= 72 && opp3PT < 73) {
      defense = 'Zona 1-3-1';
    } else if (opponentFocus === 'Chiudi Arco 3PT') {
      defense = avgPerimDef >= 70 ? 'Uomo' : 'Zona 3-2';
    } else if (opponentFocus === 'Proteggi Area' && avgPostDef < oppInside) {
      defense = 'Zona 2-3';
    } else {
      defense = avgPerimDef >= avgPostDef + 3 ? 'Uomo' : 'Zona 2-3';
    }

    if (defense === 'Cambio Sistematico' || (avgPerimDef >= 73 && avgPostDef >= 71)) {
      pnrCoverage = 'Switch';
    } else if (avgPerimDef >= 76 && oppStar && oppStar.overall >= 76) {
      pnrCoverage = 'Trap';
    } else if (avgPostDef >= avgPerimDef + 4) {
      pnrCoverage = 'Drop';
    } else {
      pnrCoverage = 'Hedge & Recover';
    }

    // Genera piano matchup individuale automatico sull'avversario
    const instructions: Record<string, OpponentPlayerInstruction> = {};
    const myStarters = active.slice(0, 5);
    const usedDefenders = new Set<string>();

    for (const oppP of oppActive.slice(0, 8)) {
      const defCand = myStarters
        .filter((m) => !usedDefenders.has(m.id))
        .sort((a, b) => {
          const posDiff = Math.abs(posGroup(a.primaryPosition) - posGroup(oppP.primaryPosition));
          const posDiffB = Math.abs(posGroup(b.primaryPosition) - posGroup(oppP.primaryPosition));
          if (posDiff !== posDiffB) return posDiff - posDiffB;
          const defScoreA = a.attributes.perimeterDef + a.attributes.postDef;
          const defScoreB = b.attributes.perimeterDef + b.attributes.postDef;
          return defScoreB - defScoreA;
        })[0];

      if (defCand) usedDefenders.add(defCand.id);

      let rule: OpponentPlayerRule = 'Standard';
      if (oppStar && oppP.id === oppStar.id) {
        rule = oppStar.overall >= 78 ? 'Raddoppia' : 'Nega Ricezione';
      } else if (oppP.attributes.threePoint <= 63 && oppP.primaryPosition !== 'C') {
        rule = 'Passa Sotto (3PT)';
      } else if ((oppP.attributes.perimeterDef + oppP.attributes.postDef) / 2 <= 64) {
        rule = 'Caccia Mismatch';
      }

      if (defCand || rule !== 'Standard') {
        instructions[oppP.id] = {
          ...(defCand ? { defenderId: defCand.id } : {}),
          rule,
        };
      }
    }

    opponentGamePlan = {
      opponentTeamId: opponentTeam.id,
      playerInstructions: instructions,
    };
  } else {
    if (avgPerimDef >= 77 && avgAthletics >= 76) {
      defense = 'Pressing';
    } else if (avgPostDef >= avgPerimDef + 4) {
      defense = 'Zona 2-3';
    } else if (avgPerimDef >= avgPostDef + 4) {
      defense = 'Zona 3-2';
    } else if (avgPerimDef >= 73 && avgPostDef >= 71) {
      defense = 'Cambio Sistematico';
    } else {
      defense = 'Uomo';
    }

    if (defense === 'Cambio Sistematico') {
      pnrCoverage = 'Switch';
    } else if (avgPostDef >= avgPerimDef + 4) {
      pnrCoverage = 'Drop';
    }
  }

  // 4. Atteggiamento & Rimbalzo
  let offensiveAggression: OffensiveAggression = 'Normale';
  if ((pace === 'Run & Gun' || pace === 'Ritmo Alto') && avg3PT >= 72) {
    offensiveAggression = 'Tiro rapido';
  } else if (avgBigOff >= 74 || offensiveFocus === 'Gioco interno' || offensiveFocus === 'Isolamento') {
    offensiveAggression = 'Attacca il ferro';
  } else if (pace === 'Controllo' || pace === 'Lento') {
    offensiveAggression = 'Gestione cronometro';
  }

  const reboundPolicy: ReboundPolicy =
    opponentFocus === 'Ferma Transizione' || pace === 'Controllo'
      ? 'Rientro Difensivo'
      : avgReb >= 74
      ? 'Aggredisci Rimbalzo'
      : 'Equilibrato';

  // 5. Playbook (3-4 schemi coerenti)
  const playbookSet = new Set<OffensivePlayId>();
  if (offensiveFocus === 'Pick & Roll') {
    playbookSet.add('pick_and_roll_centrale');
    playbookSet.add('spain_pnr');
    playbookSet.add('horns');
  } else if (offensiveFocus === 'Tiro da 3') {
    playbookSet.add('floppy');
    playbookSet.add('drive_kick_3pt');
    playbookSet.add('horns');
  } else if (offensiveFocus === 'Motion') {
    playbookSet.add('horns');
    playbookSet.add('floppy');
    playbookSet.add('drive_kick_3pt');
  } else if (offensiveFocus === 'Isolamento') {
    playbookSet.add('drive_kick_3pt');
    playbookSet.add('pick_and_roll_centrale');
    playbookSet.add('horns');
  } else if (offensiveFocus === 'Transizione') {
    playbookSet.add('transizione');
    playbookSet.add('drive_kick_3pt');
    playbookSet.add('pick_and_roll_centrale');
  } else {
    playbookSet.add('high_low');
    playbookSet.add('horns');
    playbookSet.add('pick_and_roll_centrale');
  }
  if (pace === 'Run & Gun' || pace === 'Ritmo Alto') {
    playbookSet.add('transizione');
  } else if (playbookSet.size < 4 && avg3PT >= 70) {
    playbookSet.add('drive_kick_3pt');
  }

  const tactics: Tactics = {
    pace,
    offensiveFocus,
    defense,
    offensiveAggression,
    reboundPolicy,
    pnrCoverage,
    defensiveIntensity,
    opponentFocus,
    goToPlayerId: topStar?.id ?? null,
    secondaryOptionPlayerId: secondStar?.id ?? null,
    playbook: Array.from(playbookSet),
    customPlays: userTeam.tactics.customPlays,
    opponentGamePlan,
    presets: userTeam.tactics.presets,
    delegateToAssistant: userTeam.tactics.delegateToAssistant,
  };

  const assistant = userTeam.staff?.assistant_coach;
  const coachLabel = assistant
    ? `Vice ${assistant.firstName} ${assistant.lastName} (VAL ${assistant.rating})`
    : 'Vice Allenatore';
  const oppText = opponentTeam ? ` contro ${opponentTeam.shortName}` : '';
  const summary = `${coachLabel}${oppText}: Ritmo ${pace}, Attacco ${offensiveFocus} (${offensiveAggression}), Difesa ${defense} [${pnrCoverage}] (${opponentFocus}).`;

  return { tactics, summary };
}

/**
 * Piano tattico rapido suggerito/applicato dal Vice Allenatore durante la partita live o in Timeout.
 */
export function computeAssistantTimeoutPlan(
  userTeam: MatchTeamState,
  opponentTeam: MatchTeamState,
  quarter: number,
  clockRemaining: number,
  assistantName = 'Vice Allenatore'
): { plan: TimeoutTacticalPlan; summary: string } {
  const scoreDiff = userTeam.score - opponentTeam.score; // + avanti, - sotto
  const onCourt = userTeam.players.filter((p) => !p.fouledOut && p.onCourt);
  const allActive = userTeam.players.filter((p) => !p.fouledOut);
  const pool = onCourt.length > 0 ? onCourt : allActive;

  const oppOnCourt = opponentTeam.players.filter((p) => !p.fouledOut && p.onCourt);
  const oppAll = opponentTeam.players.filter((p) => !p.fouledOut);
  const oppPool = oppOnCourt.length > 0 ? oppOnCourt : oppAll;

  // Pace & Offensive Aggression in base al punteggio e cronometro
  let pace: PaceType = userTeam.tactics.pace;
  let offensiveAggression: OffensiveAggression = userTeam.tactics.offensiveAggression ?? 'Normale';
  let defense: DefenseType = userTeam.tactics.defense;
  let reboundPolicy: ReboundPolicy = userTeam.tactics.reboundPolicy ?? 'Equilibrato';
  let pnrCoverage: PickAndRollCoverage = userTeam.tactics.pnrCoverage ?? 'Hedge & Recover';
  let defensiveIntensity: DefensiveIntensity = userTeam.tactics.defensiveIntensity ?? 'Standard';
  const offensiveFocus: OffensiveFocus = userTeam.tactics.offensiveFocus;

  const isLate = quarter >= 4 && clockRemaining <= 180;
  if (scoreDiff <= -8 || (isLate && scoreDiff <= -4)) {
    pace = 'Run & Gun';
    offensiveAggression = 'Tiro rapido';
    reboundPolicy = 'Aggredisci Rimbalzo';
    pnrCoverage = 'Trap';
    defensiveIntensity = 'Fisica';
    defense = opponentTeam.teamFoulsThisQuarter < 4 ? 'Pressing' : 'Zona 1-3-1';
  } else if (scoreDiff >= 8 && quarter >= 4) {
    pace = 'Controllo';
    offensiveAggression = 'Gestione cronometro';
    reboundPolicy = 'Rientro Difensivo';
    pnrCoverage = 'Switch';
    defensiveIntensity = 'Conservativa';
    defense = 'Cambio Sistematico';
  } else if (userTeam.teamFoulsThisQuarter >= 4) {
    defense = 'Zona 2-3';
    defensiveIntensity = 'Conservativa';
  }

  // Go-to-guy & 2a opzione: miglior realizzatore/PIR in campo con meno problemi di falli
  const sortedScorers = [...pool].sort(
    (a, b) =>
      b.points + b.pir * 0.5 - b.fouls * 1.5 - (a.points + a.pir * 0.5 - a.fouls * 1.5)
  );
  const goToPlayerId = sortedScorers[0]?.playerId ?? null;
  const secondaryOptionPlayerId = sortedScorers[1]?.playerId ?? null;

  // Opp star da limitare: miglior realizzatore avversario
  const sortedOppThreats = [...oppPool].sort(
    (a, b) => b.points * 1.2 + b.pir - (a.points * 1.2 + a.pir)
  );
  const defensiveFocusPlayerId = sortedOppThreats[0]?.playerId ?? null;

  // Abbinamenti difensivi diretti sui 5 in campo per posizione compatibile e regole individuali
  const defensiveMatchups: Record<string, string> = {};
  const opponentPlayerRules: Record<string, OpponentPlayerRule> = {
    ...(userTeam.opponentPlayerRules ?? {}),
  };
  const usedMyIds = new Set<string>();

  for (const oppP of oppOnCourt) {
    const candidates = onCourt
      .filter((m) => !usedMyIds.has(m.playerId))
      .sort((a, b) => {
        const diffA = Math.abs(posGroup(a.position) - posGroup(oppP.position));
        const diffB = Math.abs(posGroup(b.position) - posGroup(oppP.position));
        if (diffA !== diffB) return diffA - diffB;
        return a.fouls - b.fouls || b.stamina - a.stamina;
      });
    if (candidates[0]) {
      defensiveMatchups[oppP.playerId] = candidates[0].playerId;
      usedMyIds.add(candidates[0].playerId);
    }
    if (oppP.playerId === defensiveFocusPlayerId) {
      opponentPlayerRules[oppP.playerId] =
        oppP.points >= 14 ? 'Raddoppia' : 'Nega Ricezione';
    } else if (oppP.fouls >= 4) {
      opponentPlayerRules[oppP.playerId] = 'Caccia Mismatch';
    }
  }

  const goToName = sortedScorers[0]?.name ?? 'squadra';
  const stopName = sortedOppThreats[0]?.name ?? 'attacco avversario';

  return {
    plan: {
      pace,
      offensiveFocus,
      defense,
      offensiveAggression,
      reboundPolicy,
      pnrCoverage,
      defensiveIntensity,
      opponentFocus: userTeam.tactics.opponentFocus ?? 'Equilibrata',
      goToPlayerId,
      secondaryOptionPlayerId,
      defensiveFocusPlayerId,
      defensiveMatchups,
      opponentPlayerRules,
    },
    summary: `${assistantName}: Ritmo ${pace}, "${offensiveAggression}", Difesa ${defense} [${pnrCoverage}]. Terminale ${goToName}; focus su ${stopName}.`,
  };
}
