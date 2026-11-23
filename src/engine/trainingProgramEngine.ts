import {
  InboxMessage,
  IndividualTrainingDuration,
  IndividualTrainingFocus,
  IndividualTrainingProgram,
  NewsItem,
  Player,
  PlayerAttributes,
  Position,
  Team,
  TrainingIntensity,
} from '../types';
import { calculateOverall } from './ratings';

export const ALL_POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export const TRAINING_DURATION_META: Record<
  IndividualTrainingDuration,
  { label: string; shortLabel: string; days: number; desc: string }
> = {
  '1_week': {
    label: '1 Settimana (7 gg)',
    shortLabel: '7 gg',
    days: 7,
    desc: 'Micro-ciclo rapido per ritocchi immediati',
  },
  '2_weeks': {
    label: '2 Settimane (14 gg)',
    shortLabel: '14 gg',
    days: 14,
    desc: 'Ciclo standard con progressione bilanciata',
  },
  '1_month': {
    label: '1 Mese (28 gg)',
    shortLabel: '28 gg',
    days: 28,
    desc: 'Sviluppo profondo e apprendimento nuovo ruolo',
  },
};

export const TRAINING_INTENSITY_META: Record<
  TrainingIntensity,
  {
    label: string;
    efficacyMultiplier: number;
    weeklyConditionLabel: string;
    weeklyInjuryRisk: number;
    desc: string;
  }
> = {
  Leggera: {
    label: 'Leggera',
    efficacyMultiplier: 0.72,
    weeklyConditionLabel: '-1% cond./sett.',
    weeklyInjuryRisk: 0.002,
    desc: '0.72x efficacia • carico dolce ideale per i titolari',
  },
  Moderata: {
    label: 'Moderata',
    efficacyMultiplier: 1.0,
    weeklyConditionLabel: '-3% cond./sett.',
    weeklyInjuryRisk: 0.009,
    desc: '1.0x efficacia • equilibrio tra progressi e stamina',
  },
  Intensa: {
    label: 'Intensa',
    efficacyMultiplier: 1.45,
    weeklyConditionLabel: '-5% cond./sett.',
    weeklyInjuryRisk: 0.025,
    desc: '1.45x efficacia • crescita rapida, consumo forma più alto',
  },
};

export const TECHNICAL_FOCUS_OPTIONS: Exclude<
  IndividualTrainingFocus,
  'Nessuno' | 'Nuovo Ruolo'
>[] = [
  'Tiro da 3',
  'Tiro da 2 & Finalizzazione',
  'Difesa & Rimbalzi',
  'Palleggio & Passaggio',
  'Atletismo & Resistenza',
];

const FOCUS_ATTR_PRIORITY: Record<
  Exclude<IndividualTrainingFocus, 'Nessuno' | 'Nuovo Ruolo'>,
  (keyof PlayerAttributes)[]
> = {
  'Tiro da 3': ['threePoint', 'freeThrow', 'basketballIQ'],
  'Tiro da 2 & Finalizzazione': ['twoPoint', 'finishing', 'freeThrow'],
  'Difesa & Rimbalzi': ['perimeterDef', 'postDef', 'rebounding', 'steals', 'blocks'],
  'Palleggio & Passaggio': ['ballHandling', 'passing', 'basketballIQ'],
  'Atletismo & Resistenza': ['athleticism', 'stamina', 'finishing'],
};

const ROLE_BONUS_ATTR: Record<Position, (keyof PlayerAttributes)[]> = {
  PG: ['passing', 'ballHandling', 'basketballIQ'],
  SG: ['threePoint', 'twoPoint', 'perimeterDef'],
  SF: ['perimeterDef', 'athleticism', 'threePoint'],
  PF: ['rebounding', 'postDef', 'finishing'],
  C: ['rebounding', 'postDef', 'blocks'],
};

const ATTRIBUTE_LABELS: Record<keyof PlayerAttributes, string> = {
  threePoint: 'Tiro da 3',
  twoPoint: 'Tiro da 2',
  freeThrow: 'Tiri Liberi',
  passing: 'Passaggio',
  ballHandling: 'Palleggio',
  finishing: 'Finalizzazione',
  perimeterDef: 'Dif. Perimetrale',
  postDef: 'Dif. in Post',
  blocks: 'Stoppate',
  steals: 'Rubate',
  athleticism: 'Atletismo',
  rebounding: 'Rimbalzi',
  stamina: 'Resistenza',
  basketballIQ: 'QI Cestistico',
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function canLearnAdditionalRole(player: Player): boolean {
  return player.secondaryPosition === null;
}

export function getAvailableTargetPositions(player: Player): Position[] {
  if (!canLearnAdditionalRole(player)) return [];
  return ALL_POSITIONS.filter((pos) => pos !== player.primaryPosition);
}

export function getAgeDevMultiplier(age: number): number {
  if (age <= 21) return 1.25;
  if (age <= 24) return 1.12;
  if (age <= 28) return 0.95;
  if (age <= 32) return 0.72;
  return 0.48;
}

export function getStaffDevMultiplier(
  scoutRating: number,
  managerYouthDev: number,
  age: number
): number {
  const scoutFactor = 0.8 + (scoutRating - 50) * 0.01;
  const coachFactor =
    age <= 24
      ? 1 + (managerYouthDev - 10) * 0.025
      : 1 + (managerYouthDev - 10) * 0.01;
  return clamp(scoutFactor * coachFactor, 0.7, 1.45);
}

export function createIndividualTrainingProgram(
  player: Player,
  params: {
    focus: Exclude<IndividualTrainingFocus, 'Nessuno'>;
    intensity: TrainingIntensity;
    duration: IndividualTrainingDuration;
    startDate: string;
    targetPosition?: Position;
  }
): {
  ok: boolean;
  message: string;
  program?: IndividualTrainingProgram;
} {
  const { focus, intensity, duration, startDate, targetPosition } = params;

  if (focus === 'Nuovo Ruolo') {
    if (!canLearnAdditionalRole(player)) {
      return {
        ok: false,
        message: `${player.firstName} ${player.lastName} ricopre già 2 ruoli (${player.primaryPosition}/${player.secondaryPosition}): limite massimo di 2 ruoli raggiunto.`,
      };
    }
    if (!targetPosition || targetPosition === player.primaryPosition) {
      return {
        ok: false,
        message: 'Seleziona un ruolo secondario valido diverso dal ruolo primario.',
      };
    }
    if (duration === '1_week' || (duration === '2_weeks' && intensity !== 'Intensa')) {
      return {
        ok: false,
        message:
          'Per apprendere un nuovo ruolo serve un programma da 1 Mese (28 gg) oppure 2 Settimane a intensità Intensa.',
      };
    }
  }

  const durMeta = TRAINING_DURATION_META[duration];
  const program: IndividualTrainingProgram = {
    focus,
    intensity,
    duration,
    totalDays: durMeta.days,
    daysCompleted: 0,
    startedAt: startDate,
    targetPosition: focus === 'Nuovo Ruolo' ? targetPosition : undefined,
    accumulatedWork: 0,
  };

  return {
    ok: true,
    message:
      focus === 'Nuovo Ruolo'
        ? `Avviato programma ${durMeta.label} (${intensity}) per apprendere il ruolo di ${targetPosition}.`
        : `Avviato programma "${focus}" (${durMeta.label} • ${intensity}).`,
    program,
  };
}

export function estimateProgramOutcome(
  player: Player,
  params: {
    focus: Exclude<IndividualTrainingFocus, 'Nessuno'>;
    intensity: TrainingIntensity;
    duration: IndividualTrainingDuration;
    scoutRating: number;
    managerYouthDev: number;
    targetPosition?: Position;
  }
): {
  totalDays: number;
  expectedWork: number;
  expectedPoints: number;
  efficacyMultiplier: number;
  weeklyConditionLabel: string;
  riskLabel: string;
  summaryText: string;
} {
  const durMeta = TRAINING_DURATION_META[params.duration];
  const intMeta = TRAINING_INTENSITY_META[params.intensity];
  const ageMult = getAgeDevMultiplier(player.age);
  const staffMult = getStaffDevMultiplier(
    params.scoutRating,
    params.managerYouthDev,
    player.age
  );
  const effectiveDailyRate = intMeta.efficacyMultiplier * ageMult * staffMult;
  const expectedWork = Number((effectiveDailyRate * durMeta.days).toFixed(1));
  const expectedPoints = Math.max(1, Math.min(6, Math.round(expectedWork / 5.2)));

  const riskLabel =
    params.intensity === 'Intensa'
      ? 'Moderato-Alto'
      : params.intensity === 'Moderata'
      ? 'Basso'
      : 'Trascurabile';

  const summaryText =
    params.focus === 'Nuovo Ruolo'
      ? `Sblocca ${params.targetPosition ?? '?'} come 2° ruolo + 1/2 pt nelle skill chiave del ruolo`
      : `+${expectedPoints} pt stimati distribuiti tra le skill di "${params.focus}"`;

  return {
    totalDays: durMeta.days,
    expectedWork,
    expectedPoints,
    efficacyMultiplier: intMeta.efficacyMultiplier,
    weeklyConditionLabel: intMeta.weeklyConditionLabel,
    riskLabel,
    summaryText,
  };
}

function getDailyConditionDrain(intensity: TrainingIntensity, nextDay: number): number {
  if (intensity === 'Leggera') {
    return nextDay % 7 === 0 ? 1 : 0;
  }
  if (intensity === 'Moderata') {
    return nextDay % 3 === 0 ? 1 : 0;
  }
  // Intensa: -4/-5% circa a settimana
  return nextDay % 2 === 0 || nextDay % 7 === 0 ? 1 : 0;
}

function completeProgramOnPlayer(
  player: Player,
  program: IndividualTrainingProgram
): {
  updatedPlayer: Player;
  changeNotes: string[];
  headline: string;
} {
  const attr = { ...player.attributes };
  const prevOverall = player.overall;
  const changeNotes: string[] = [];

  if (program.focus === 'Nuovo Ruolo' && program.targetPosition) {
    const canAssign =
      player.secondaryPosition === null &&
      program.targetPosition !== player.primaryPosition;
    const nextSecondary = canAssign ? program.targetPosition : player.secondaryPosition;
    const bonusPool = ROLE_BONUS_ATTR[program.targetPosition];
    const bonusPoints =
      program.intensity === 'Intensa' && (player.age <= 24 || program.duration === '1_month')
        ? 2
        : 1;

    for (let i = 0; i < bonusPoints; i++) {
      const key = bonusPool[i % bonusPool.length];
      if (attr[key] < 98) {
        const before = attr[key];
        attr[key] = Math.min(98, before + 1);
        changeNotes.push(`${ATTRIBUTE_LABELS[key]} ${before}→${attr[key]}`);
      }
    }

    const nextOverall = calculateOverall(attr, player.primaryPosition);
    const updatedPlayer: Player = {
      ...player,
      secondaryPosition: nextSecondary,
      attributes: attr,
      overall: nextOverall,
      individualFocus: 'Nessuno',
      trainingProgram: null,
    };

    const roleMsg = canAssign
      ? `Nuovo ruolo appreso: ${player.primaryPosition} / ${nextSecondary}`
      : `Adattamento tattico completato`;
    const headline =
      changeNotes.length > 0 ? `${roleMsg} (${changeNotes.join(', ')})` : roleMsg;
    return { updatedPlayer, changeNotes: [roleMsg, ...changeNotes], headline };
  }

  const technicalFocus =
    program.focus === 'Nuovo Ruolo' ? 'Atletismo & Resistenza' : program.focus;
  const keys = FOCUS_ATTR_PRIORITY[technicalFocus];
  const pointsBudget = clamp(Math.round(program.accumulatedWork / 5.2), 1, 6);

  const deltas = new Map<keyof PlayerAttributes, { before: number; after: number }>();
  let remaining = pointsBudget;
  let guard = 0;
  let cursor = 0;
  while (remaining > 0 && guard < keys.length * 6) {
    const key = keys[cursor % keys.length];
    cursor += 1;
    guard += 1;
    if (attr[key] < 98) {
      const prevEntry = deltas.get(key);
      const before = prevEntry ? prevEntry.before : attr[key];
      attr[key] = Math.min(98, attr[key] + 1);
      deltas.set(key, { before, after: attr[key] });
      remaining -= 1;
    }
  }

  for (const [key, diff] of deltas.entries()) {
    changeNotes.push(
      `${ATTRIBUTE_LABELS[key]} ${diff.before}→${diff.after} (+${diff.after - diff.before})`
    );
  }

  const nextOverall = calculateOverall(attr, player.primaryPosition);
  if (nextOverall > prevOverall) {
    changeNotes.push(`OVR ${prevOverall}→${nextOverall}`);
  }

  const updatedPlayer: Player = {
    ...player,
    attributes: attr,
    overall: nextOverall,
    individualFocus: 'Nessuno',
    trainingProgram: null,
  };

  const headline =
    changeNotes.length > 0
      ? changeNotes.join(' • ')
      : 'Sessione completata (attributi già al massimo)';

  return { updatedPlayer, changeNotes, headline };
}

export function advanceDailyIndividualTrainingPrograms(params: {
  teams: Team[];
  userTeamId: string;
  currentDate: string;
  round: number;
  managerYouthDev?: number;
}): {
  teams: Team[];
  messages: InboxMessage[];
  news: NewsItem[];
  completedSummaries: string[];
} {
  const { teams, userTeamId, currentDate, round, managerYouthDev = 10 } = params;
  const messages: InboxMessage[] = [];
  const news: NewsItem[] = [];
  const completedSummaries: string[] = [];

  const updatedTeams = teams.map((team) => {
    const scoutRating = team.staff?.scout_director?.rating ?? 60;
    const fitnessRating = team.staff?.fitness_coach?.rating ?? 60;
    const preventionFactor = clamp(1 - (fitnessRating - 50) * 0.012, 0.45, 1.1);
    const isUser = team.id === userTeamId;

    let anyChanged = false;
    const updatedRoster = team.roster.map((player) => {
      const prog = player.trainingProgram;
      if (!prog || player.injuryWeeks > 0) {
        return player;
      }

      anyChanged = true;
      const nextDays = prog.daysCompleted + 1;
      const intMeta = TRAINING_INTENSITY_META[prog.intensity];
      const dailyWork =
        intMeta.efficacyMultiplier *
        getAgeDevMultiplier(player.age) *
        getStaffDevMultiplier(scoutRating, isUser ? managerYouthDev : 10, player.age);
      const nextAccumulatedWork = prog.accumulatedWork + dailyWork;

      const drain = getDailyConditionDrain(prog.intensity, nextDays);
      let nextCondition = clamp(player.condition - drain, 55, 100);
      let nextInjuryWeeks = player.injuryWeeks;
      let nextInjuryDescription = player.injuryDescription;

      // Piccolo rischio sovraccarico solo sui cicli Intensa
      if (prog.intensity === 'Intensa' && nextDays < prog.totalDays) {
        const fatigueMult = nextCondition < 74 ? 1.8 : 0.7;
        const dailyRisk = (intMeta.weeklyInjuryRisk / 7) * preventionFactor * fatigueMult;
        if (Math.random() < dailyRisk) {
          nextInjuryWeeks = 1;
          nextInjuryDescription = 'Sovraccarico muscolare da allenamento individuale intenso';
          nextCondition = Math.max(55, nextCondition - 8);
          if (isUser) {
            news.push({
              id: `news_prog_inj_${player.id}_${currentDate}`,
              round,
              category: 'Infortunio',
              title: `Affaticamento in palestra per ${player.firstName[0]}. ${player.lastName}`,
              body: `Il programma intenso "${prog.focus}" ha causato un lieve sovraccarico a ${player.firstName} ${player.lastName} (1 settimana di stop).`,
            });
          }
          return {
            ...player,
            condition: nextCondition,
            injuryWeeks: nextInjuryWeeks,
            injuryDescription: nextInjuryDescription,
            trainingProgram: {
              ...prog,
              daysCompleted: nextDays,
              accumulatedWork: nextAccumulatedWork,
            },
          };
        }
      }

      const advancedProg: IndividualTrainingProgram = {
        ...prog,
        daysCompleted: nextDays,
        accumulatedWork: nextAccumulatedWork,
      };

      if (nextDays < prog.totalDays) {
        return {
          ...player,
          condition: nextCondition,
          trainingProgram: advancedProg,
        };
      }

      const completion = completeProgramOnPlayer(
        { ...player, condition: nextCondition },
        advancedProg
      );

      if (isUser) {
        const durLabel = TRAINING_DURATION_META[prog.duration].label;
        const summary = `${player.firstName} ${player.lastName}: ${completion.headline}`;
        completedSummaries.push(summary);

        messages.push({
          id: `msg_train_done_${player.id}_${currentDate}_${Date.now()}`,
          category: 'staff',
          senderName: team.staff?.scout_director
            ? `${team.staff.scout_director.firstName} ${team.staff.scout_director.lastName}`
            : 'Staff Tecnico',
          senderRole: 'Report Allenamento Individuale',
          subject: `Programma completato: ${player.firstName[0]}. ${player.lastName} (${prog.focus})`,
          body: `${player.firstName} ${player.lastName} ha terminato il programma "${prog.focus}" (${durLabel} • intensità ${prog.intensity}).\n\nMiglioramenti registrati: ${completion.headline}.`,
          date: currentDate,
          round,
          read: false,
          playerId: player.id,
          actionTab: 'training',
          actionLabel: 'Apri Allenamento',
        });

        news.push({
          id: `news_train_done_${player.id}_${currentDate}`,
          round,
          category: 'Lega',
          title: `Progresso tecnico per ${player.firstName[0]}. ${player.lastName}`,
          body: `Concluso il ciclo ${durLabel} (${prog.intensity}) di ${prog.focus}: ${completion.headline}.`,
        });
      }

      return completion.updatedPlayer;
    });

    if (!anyChanged) return team;
    return {
      ...team,
      roster: updatedRoster,
    };
  });

  return { teams: updatedTeams, messages, news, completedSummaries };
}
