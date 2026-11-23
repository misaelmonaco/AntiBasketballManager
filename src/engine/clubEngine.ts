import { MatchState, NewsItem, Player, Team } from '../types';
import { autoAdjustRotationsForInjuries, calculateOverall } from './ratings';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Applica gli effetti dell'allenamento settimanale, il recupero stamina del Preparatore Atletico,
 * la crescita dei giovani (Responsabile Scouting/Sviluppo) e il rischio di piccoli infortuni.
 */
export function applyWeeklyTrainingAndRecovery(
  teams: Team[],
  round: number,
  userTeamId: string,
  managerYouthDev = 10
): { teams: Team[]; news: NewsItem[] } {
  const news: NewsItem[] = [];

  const updatedTeams = teams.map((team) => {
    const fitnessRating = team.staff?.fitness_coach?.rating ?? 60;
    const scoutRating = team.staff?.scout_director?.rating ?? 60;
    const training = team.training ?? { focus: 'Tattica Pre-Partita', intensity: 'Moderata' };

    const fitnessBonus = Math.round((fitnessRating - 60) * 0.18); // -2..+6
    const intensityConditionDelta =
      training.intensity === 'Leggera' ? 7 : training.intensity === 'Moderata' ? 2 : -4;
    const focusConditionDelta =
      training.focus === 'Scarico / Riposo'
        ? 10
        : training.focus === 'Condizione Fisica'
        ? -2
        : 0;

    const baseConditionRecovery =
      intensityConditionDelta + focusConditionDelta + fitnessBonus;

    // Rischio infortunio muscolare settimanale
    let injuryProb =
      training.intensity === 'Intensa'
        ? 0.032
        : training.intensity === 'Moderata'
        ? 0.011
        : 0.003;
    if (training.focus === 'Scarico / Riposo') injuryProb = 0.001;
    // Il Preparatore Atletico riduce il rischio infortuni fino al 55%
    const preventionFactor = clamp(1 - (fitnessRating - 50) * 0.012, 0.45, 1.1);
    injuryProb *= preventionFactor;

    const updatedRoster = team.roster.map((player) => {
      // 1. Recupero infortuni esistenti
      if (player.injuryWeeks > 0) {
        const nextWeeks = player.injuryWeeks - 1;
        return {
          ...player,
          injuryWeeks: nextWeeks,
          injuryDescription: nextWeeks === 0 ? undefined : player.injuryDescription,
          condition: Math.min(92, player.condition + 8),
        };
      }

      // 2. Aggiornamento condizione fisica
      let nextCondition = clamp(player.condition + baseConditionRecovery, 55, 100);

      // 3. Check nuovo infortunio muscolare (soprattutto se stanco e allenamento intenso)
      const fatigueMultiplier = player.condition < 74 ? 1.8 : 1.0;
      const pronenessMultiplier = 0.55 + (player.injuryProneness ?? 35) / 100;
      let injuryWeeks = 0;
      let injuryDescription: string | undefined = undefined;
      if (Math.random() < injuryProb * fatigueMultiplier * pronenessMultiplier) {
        injuryWeeks = Math.random() < 0.72 ? 1 : 2;
        injuryDescription = 'Affaticamento muscolare in allenamento';
        nextCondition = Math.max(55, nextCondition - 12);

        if (team.id === userTeamId) {
          news.push({
            id: `news_inj_${player.id}_${round}`,
            round,
            category: 'Infortunio',
            title: `Stop in allenamento per ${player.firstName} ${player.lastName}`,
            body: `${player.lastName} ha riportato un ${injuryDescription.toLowerCase()} e resterà fermo per ${injuryWeeks} ${
              injuryWeeks === 1 ? 'settimana' : 'settimane'
            }.`,
          });
        }
      }

      // 4. Crescita leggera in base al focus e al Responsabile Scouting/Sviluppo + Sviluppo Giovani manager
      const attr = { ...player.attributes };
      const isYoung = player.age <= 24;
      const youthManagerMult =
        team.id === userTeamId && player.age <= 22 ? 1 + (managerYouthDev - 10) * 0.04 : 1;
      const devChance =
        (isYoung ? 0.24 : 0.07) *
        (0.75 + (scoutRating - 50) * 0.014) *
        youthManagerMult *
        (training.intensity === 'Intensa' ? 1.35 : training.intensity === 'Moderata' ? 1.0 : 0.55);

      if (Math.random() < devChance) {
        if (training.focus === 'Tiro e Spaziature') {
          attr.threePoint = Math.min(98, attr.threePoint + 1);
          attr.twoPoint = Math.min(98, attr.twoPoint + 1);
        } else if (training.focus === 'Difesa di Squadra') {
          attr.perimeterDef = Math.min(98, attr.perimeterDef + 1);
          attr.postDef = Math.min(98, attr.postDef + 1);
        } else if (training.focus === 'Condizione Fisica') {
          attr.stamina = Math.min(98, attr.stamina + 1);
          attr.athleticism = Math.min(98, attr.athleticism + 1);
        } else if (training.focus === 'Tattica Pre-Partita') {
          attr.basketballIQ = Math.min(98, attr.basketballIQ + 1);
          attr.passing = Math.min(98, attr.passing + 1);
        }
      }

      // 4b. Allenamento individuale mirato (legacy solo se non è attivo un programma strutturato a durata)
      const indFocus = player.individualFocus;
      if (
        !player.trainingProgram &&
        indFocus &&
        indFocus !== 'Nessuno' &&
        indFocus !== 'Nuovo Ruolo' &&
        Math.random() < devChance * 1.15
      ) {
        if (indFocus === 'Tiro da 3') {
          attr.threePoint = Math.min(98, attr.threePoint + 1);
          attr.freeThrow = Math.min(98, attr.freeThrow + 1);
        } else if (indFocus === 'Tiro da 2 & Finalizzazione') {
          attr.twoPoint = Math.min(98, attr.twoPoint + 1);
          attr.finishing = Math.min(98, attr.finishing + 1);
        } else if (indFocus === 'Difesa & Rimbalzi') {
          attr.perimeterDef = Math.min(98, attr.perimeterDef + 1);
          attr.postDef = Math.min(98, attr.postDef + 1);
          attr.rebounding = Math.min(98, attr.rebounding + 1);
        } else if (indFocus === 'Palleggio & Passaggio') {
          attr.ballHandling = Math.min(98, attr.ballHandling + 1);
          attr.passing = Math.min(98, attr.passing + 1);
        } else if (indFocus === 'Atletismo & Resistenza') {
          attr.athleticism = Math.min(98, attr.athleticism + 1);
          attr.stamina = Math.min(98, attr.stamina + 1);
        }
      }

      const nextOverall = calculateOverall(attr, player.primaryPosition);
      const moraleDelta = training.focus === 'Scarico / Riposo' ? 2 : 0;

      return {
        ...player,
        condition: nextCondition,
        injuryWeeks,
        injuryDescription,
        attributes: attr,
        overall: nextOverall,
        morale: clamp((player.morale ?? 78) + moraleDelta, 1, 100),
      };
    });

    const adjusted = autoAdjustRotationsForInjuries(
      updatedRoster,
      team.leagueId,
      team.lbaRosterFormat ?? '6+6'
    );
    if (adjusted.changed && team.id === userTeamId && adjusted.replacedNames.length > 0) {
      news.push({
        id: `news_rot_inj_${team.id}_${round}`,
        round,
        category: 'Infortunio',
        title: 'Rotazioni adattate per infortunio',
        body: `Rotazione aggiornata automaticamente: ${adjusted.replacedNames.join(', ')} spostato/i in tribuna e sostituito/i nel minutaggio.`,
      });
    }

    return {
      ...team,
      roster: adjusted.roster,
    };
  });

  return { teams: updatedTeams, news };
}

/**
 * Aggiorna Morale individuale e Chimica di Squadra al termine di una partita.
 */
export function updateMoraleAndChemistryAfterMatch(
  teams: Team[],
  match: MatchState,
  userTeamId?: string,
  managerLockerRoom = 10,
  managerReputation = 60
): Team[] {
  const homeWon = match.home.score > match.away.score;
  const boxMap = new Map<string, MatchState['home']['players'][number]>();
  for (const p of match.home.players) boxMap.set(p.playerId, p);
  for (const p of match.away.players) boxMap.set(p.playerId, p);

  return teams.map((team) => {
    if (team.id !== match.home.teamId && team.id !== match.away.teamId) {
      return team;
    }

    const won =
      (team.id === match.home.teamId && homeWon) ||
      (team.id === match.away.teamId && !homeWon);

    const updatedRoster = team.roster.map((player) => {
      const box = boxMap.get(player.id);
      const mins = box ? box.secondsPlayed / 60 : 0;
      let delta = won ? 3 : -3;

      if (team.id === userTeamId) {
        if (managerLockerRoom >= 12) delta += 1;
        if (!won && managerReputation < 45 && player.overall >= 78) {
          // Bassa reputazione iniziale: le stelle possono spazientirsi se si perde
          delta -= 1;
        } else if (managerReputation >= 75) {
          delta += 1;
        }
      }

      // Impatto personalità su vittoria/sconfitta
      if (!won && player.personality === 'Egocentrico') delta -= 2;
      if (!won && player.personality === 'Leader') delta += 1; // più resiliente

      // Minuti promessi da contratto / rotazione vs minuti reali
      if (player.promisedRole === 'Stella della squadra' && mins < 22) {
        delta -= 5;
      } else if (player.promisedRole === 'Titolare fisso' && mins < 16) {
        delta -= 4;
      } else if (player.promisedRole === 'Sesto uomo' && mins < 10) {
        delta -= 3;
      } else if (player.minutePriority === 'Alta' && mins < 16) {
        delta -= player.personality === 'Egocentrico' ? 6 : 4;
      } else if (player.minutePriority === 'Alta' && mins >= 24) {
        delta += 2;
      } else if (player.minutePriority === 'Bassa' && mins >= 12) {
        delta += 3;
      } else if (player.rosterSlot === 'reserve' && player.overall >= 74) {
        delta -= 4;
      }

      return {
        ...player,
        morale: clamp((player.morale ?? 78) + delta, 10, 100),
      };
    });

    // Giocare insieme aumenta progressivamente la chimica di squadra
    const chemGain = won ? 2.5 : 1.2;
    const nextChemistry = clamp(Math.round((team.chemistry ?? 68) + chemGain), 15, 100);

    return {
      ...team,
      roster: updatedRoster,
      chemistry: nextChemistry,
    };
  });
}

export function applyRosterChangeChemistry(
  team: Team,
  action: 'cut' | 'sign',
  player: Player
): Team {
  const chemDrop =
    action === 'cut' ? (player.personality === 'Leader' ? 9 : 6) : 4;
  const moraleShift = action === 'cut' ? (player.personality === 'Leader' ? -5 : -2) : 1;

  return {
    ...team,
    chemistry: clamp((team.chemistry ?? 68) - chemDrop, 15, 100),
    roster: team.roster.map((p) => ({
      ...p,
      morale: clamp((p.morale ?? 78) + moraleShift, 10, 100),
    })),
  };
}
