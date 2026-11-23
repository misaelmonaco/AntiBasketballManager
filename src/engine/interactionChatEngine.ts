import { daysBetween } from './calendarUtils';
import { getLeagueConfig } from '../data/teams';
import {
  CareerSave,
  ChatChannel,
  ChatMessageBubble,
  ChatThreadLog,
  ChatTone,
  NewsItem,
  Player,
  Team,
} from '../types';

export const CHAT_COOLDOWN_DAYS: Record<ChatChannel, number> = {
  player: 7,
  board: 14,
  media: 7,
};

export interface ChatTopicOption {
  id: string;
  label: string;
  description: string;
}

export interface ChatOutcomeResult {
  coachLine: string;
  npcLine: string;
  npcName: string;
  effects: string[];
  playerMoraleDelta: number;
  teamMoraleDelta: number;
  chemistryDelta: number;
  confidenceDelta: number;
  budgetDelta: number;
  reputationDelta: number;
  newsItem?: NewsItem;
}

export function getChatChannelKey(channel: ChatChannel, playerId?: string): string {
  if (channel === 'player' && playerId) {
    return `player:${playerId}`;
  }
  return channel;
}

export function getChatCooldownRemaining(
  chatHistory: Record<string, ChatThreadLog> | undefined,
  channel: ChatChannel,
  currentDate: string,
  playerId?: string
): number {
  const key = getChatChannelKey(channel, playerId);
  const thread = chatHistory?.[key];
  if (!thread?.lastInteractionDate) return 0;
  const elapsed = daysBetween(thread.lastInteractionDate, currentDate);
  if (elapsed < 0) return 0;
  return Math.max(0, CHAT_COOLDOWN_DAYS[channel] - elapsed);
}

export function getChatTopicsForChannel(channel: ChatChannel): ChatTopicOption[] {
  if (channel === 'player') {
    return [
      {
        id: 'praise_form',
        label: 'Elogia prestazioni e atteggiamento',
        description: 'Riconosci il contributo recente per rafforzare fiducia e morale.',
      },
      {
        id: 'encourage_morale',
        label: 'Incoraggia e sostieni',
        description: 'Parla a tu per tu per sbloccare il giocatore nei momenti difficili.',
      },
      {
        id: 'discuss_role',
        label: 'Chiarisci ruolo e minutaggio',
        description: 'Allinea le aspettative tra minutaggio attuale e gerarchie di squadra.',
      },
      {
        id: 'push_training',
        label: 'Chiedi più intensità in allenamento',
        description: 'Stimola l’impegno in palestra per crescere nelle prossime settimane.',
      },
    ];
  }

  if (channel === 'board') {
    return [
      {
        id: 'request_patience',
        label: 'Chiedi fiducia sul progetto tecnico',
        description: 'Rassicura la società sul percorso di crescita del roster.',
      },
      {
        id: 'request_budget',
        label: 'Richiedi extra-budget mercato',
        description:
          'Con fiducia alta (≥72%) puoi ottenere un’integrazione salariale sacrificando un po’ di margine politico.',
      },
      {
        id: 'review_objectives',
        label: 'Confronto sugli obiettivi stagionali',
        description: 'Verifica lo stato dei risultati rispetto alle aspettative del club.',
      },
    ];
  }

  return [
    {
      id: 'praise_group',
      label: 'Elogia lo spogliatoio alla stampa',
      description: 'Compatta ambiente, tifosi e chimica di squadra davanti ai microfoni.',
    },
    {
      id: 'shield_team',
      label: 'Proteggi il gruppo e togli pressione',
      description: 'Assumi la responsabilità mediatica per sollevare morale ai giocatori.',
    },
    {
      id: 'bold_statement',
      label: 'Dichiarazione ambiziosa alle rivali',
      description: 'Alza la posta prima delle prossime sfide: effetto su reputazione e spogliatoio.',
    },
  ];
}

function targetMaxRankForObjective(career: CareerSave, userTeam: Team): number {
  const obj = career.boardObjective ?? 'Qualificazione Playoff';
  if (obj === 'Vincere lo Scudetto') return 3;
  if (obj === 'Semifinale Playoff') return 5;
  if (obj === 'Qualificazione Playoff') return 8;
  return Math.max(10, Math.round(userTeam.prestige >= 55 ? 12 : 14));
}

export function resolveChatInteraction(params: {
  career: CareerSave;
  userTeam: Team;
  channel: ChatChannel;
  topicId: string;
  tone: ChatTone;
  currentDate: string;
  player?: Player;
  userRank?: number;
}): ChatOutcomeResult {
  const { career, userTeam, channel, topicId, tone, currentDate, player, userRank = 6 } = params;
  const lockerSkill = career.managerProfile?.attributes.lockerRoom ?? 10;
  const reputation = career.managerProfile?.reputation ?? 58;
  const lockerBonus = lockerSkill >= 14 ? 2 : lockerSkill >= 11 ? 1 : 0;

  if (channel === 'player' && player) {
    const npcName = `${player.firstName} ${player.lastName}`;
    const lastGame = player.gameLog?.[0];
    const recentPts = lastGame?.points ?? 0;
    const isEgocentric = player.personality === 'Egocentrico';
    const isLeader = player.personality === 'Leader' || player.personality === 'Professionista';
    const targetMins = player.targetMinutes ?? 0;

    if (topicId === 'praise_form') {
      const coachLine =
        tone === 'encouraging'
          ? `Grande lavoro ultimamente ${player.firstName}, il tuo atteggiamento sta trascinando tutto il gruppo.`
          : tone === 'diplomatic'
          ? `Apprezzo molto la continuità che stai dando alla squadra nelle ultime uscite, continua così.`
          : `Stai facendo quello che mi aspetto da uno del tuo livello: non abbassare la guardia ora.`;

      const playedBadly = lastGame && recentPts <= 2 && lastGame.pir <= 1 && player.morale < 60;
      if (playedBadly && tone === 'encouraging') {
        return {
          coachLine,
          npcLine: `Coach, apprezzerei di più essere onesto: so che l’ultima gara non è andata bene, ma darò una risposta in campo.`,
          npcName,
          effects: [`+${2 + lockerBonus} Morale`],
          playerMoraleDelta: 2 + lockerBonus,
          teamMoraleDelta: 0,
          chemistryDelta: 0,
          confidenceDelta: 0,
          budgetDelta: 0,
          reputationDelta: 0,
        };
      }

      const moraleGain = (isEgocentric ? 8 : 6) + lockerBonus + (tone === 'encouraging' ? 2 : 0);
      return {
        coachLine,
        npcLine: isEgocentric
          ? `Fa sempre piacere quando il lavoro viene riconosciuto, Coach. Quando tocca a me la metto sempre dentro.`
          : `Grazie Coach, la tua fiducia è fondamentale. Continuerò a mettermi a disposizione dei compagni.`,
        npcName,
        effects: [`+${moraleGain} Morale`, '+1 Chimica'],
        playerMoraleDelta: moraleGain,
        teamMoraleDelta: 0,
        chemistryDelta: 1,
        confidenceDelta: 0,
        budgetDelta: 0,
        reputationDelta: 0,
      };
    }

    if (topicId === 'encourage_morale') {
      const coachLine =
        tone === 'encouraging'
          ? `So che non è un momento semplice, ma credo al 100% nelle tue qualità. Gioca libero.`
          : tone === 'diplomatic'
          ? `La stagione è lunga e i momenti di calo capitano a tutti. Ripartiamo dalle cose semplici in campo.`
          : `Hai mezzi tecnici troppo importanti per lasciarti condizionare: pretendo una reazione già dalla prossima gara.`;

      if (tone === 'demanding' && isEgocentric) {
        return {
          coachLine,
          npcLine: `Non è alzando la voce che mi metti nelle condizioni di rendere al meglio, Coach.`,
          npcName,
          effects: ['-3 Morale'],
          playerMoraleDelta: -3,
          teamMoraleDelta: 0,
          chemistryDelta: 0,
          confidenceDelta: 0,
          budgetDelta: 0,
          reputationDelta: 0,
        };
      }

      const moraleGain =
        (tone === 'demanding' && isLeader ? 7 : tone === 'encouraging' ? 8 : 6) + lockerBonus;
      return {
        coachLine,
        npcLine:
          tone === 'demanding'
            ? `Ricevuto Coach. Avevo bisogno di questa scossa, in partita si vedrà un altro giocatore.`
            : `Grazie davvero Coach, sentirmi sostenuto mi toglie parecchio peso dalle spalle.`,
        npcName,
        effects: [`+${moraleGain} Morale`],
        playerMoraleDelta: moraleGain,
        teamMoraleDelta: 0,
        chemistryDelta: 0,
        confidenceDelta: 0,
        budgetDelta: 0,
        reputationDelta: 0,
      };
    }

    if (topicId === 'discuss_role') {
      const coachLine =
        tone === 'encouraging'
          ? `Sei un tassello importante per noi: il minutaggio può oscillare ma il tuo ruolo resta centrale.`
          : tone === 'diplomatic'
          ? `Cerchiamo di trovare l’equilibrio migliore nelle rotazioni: in base agli avversari avrai i tuoi spazi.`
          : `I minuti in campo vanno conquistati ogni settimana con difesa ed esecuzione degli schemi.`;

      const isUnhappyBench =
        (player.promisedRole === 'Stella della squadra' || player.promisedRole === 'Titolare fisso') &&
        player.rosterSlot !== 'starter' &&
        targetMins < 18;

      if (isUnhappyBench && tone === 'demanding') {
        return {
          coachLine,
          npcLine: `Ho firmato con altre garanzie sul mio spazio in campo: così faccio fatica ad accettarlo.`,
          npcName,
          effects: ['-4 Morale'],
          playerMoraleDelta: -4,
          teamMoraleDelta: 0,
          chemistryDelta: 0,
          confidenceDelta: 0,
          budgetDelta: 0,
          reputationDelta: 0,
        };
      }

      const moraleGain = (isUnhappyBench ? 4 : 5) + lockerBonus;
      return {
        coachLine,
        npcLine: isUnhappyBench
          ? `Va bene Coach, apprezzo la franchezza. Aspetterò la mia occasione lavorando duro.`
          : `Tutto chiarissimo Coach, mi trovo bene nel sistema e so esattamente cosa chiede lo staff.`,
        npcName,
        effects: [`+${moraleGain} Morale`, '+1 Chimica'],
        playerMoraleDelta: moraleGain,
        teamMoraleDelta: 0,
        chemistryDelta: 1,
        confidenceDelta: 0,
        budgetDelta: 0,
        reputationDelta: 0,
      };
    }

    // push_training
    const coachLine =
      tone === 'encouraging'
        ? `Hai ancora tanto margine di crescita: con un po’ di lavoro extra in palestra puoi fare il salto di qualità.`
        : tone === 'diplomatic'
        ? `Lo staff ha preparato carichi mirati per te, concentriamoci su quei dettagli.`
        : `Voglio vederti al massimo in ogni singolo allenamento: è lì che si vincono le partite.`;

    if (isEgocentric && tone === 'demanding') {
      return {
        coachLine,
        npcLine: `Mi alleno già quanto basta, Coach. Non servono prediche continue.`,
        npcName,
        effects: ['-3 Morale'],
        playerMoraleDelta: -3,
        teamMoraleDelta: 0,
        chemistryDelta: 0,
        confidenceDelta: 0,
        budgetDelta: 0,
        reputationDelta: 0,
      };
    }

    const moraleGain =
      (player.personality === 'Giovane ambizioso' || isLeader ? 6 : 4) + lockerBonus;
    return {
      coachLine,
      npcLine:
        player.personality === 'Giovane ambizioso'
          ? `Non vedo l’ora Coach, voglio migliorare ogni aspetto del mio gioco!`
          : `Messaggio chiaro Coach, alzerò ancora l’attenzione negli allenamenti.`,
      npcName,
      effects: [`+${moraleGain} Morale`],
      playerMoraleDelta: moraleGain,
      teamMoraleDelta: 0,
      chemistryDelta: 0,
      confidenceDelta: 0,
      budgetDelta: 0,
      reputationDelta: 0,
    };
  }

  if (channel === 'board') {
    const npcName = `Presidenza ${userTeam.shortName}`;
    const conf = career.boardConfidence ?? 75;
    const targetRank = targetMaxRankForObjective(career, userTeam);
    const onTarget = userRank <= targetRank;

    if (topicId === 'request_budget') {
      const coachLine =
        tone === 'encouraging'
          ? `Con un piccolo sforzo economico possiamo aggiungere un tassello decisivo per centrare gli obiettivi.`
          : tone === 'diplomatic'
          ? `Chiedo alla proprietà di valutare una piccola integrazione al budget salari per cogliere eventuali occasioni.`
          : `Se vogliamo competere davvero fino in fondo servono risorse aggiuntive sul mercato adesso.`;

      const maxCapByLeague =
        userTeam.leagueId === 'ITA_LBA'
          ? 280000
          : userTeam.leagueId === 'ITA_A2'
          ? 100000
          : 45000;
      const bonusAmount = Math.min(
        maxCapByLeague,
        Math.round((userTeam.budget * 0.05) / 5000) * 5000
      );

      if (conf >= 72 && (onTarget || reputation >= 68)) {
        const confCost = tone === 'demanding' ? -6 : -4;
        return {
          coachLine,
          npcLine: `Apprezziamo il lavoro fatto finora. La proprietà ha approvato un’integrazione una tantum di €${bonusAmount.toLocaleString('it-IT')}, ma si aspetta risultati immediati.`,
          npcName,
          effects: [
            `+€${bonusAmount.toLocaleString('it-IT')} Budget`,
            `${confCost} Fiducia`,
          ],
          playerMoraleDelta: 0,
          teamMoraleDelta: 0,
          chemistryDelta: 0,
          confidenceDelta: confCost,
          budgetDelta: bonusAmount,
          reputationDelta: 0,
        };
      }

      const confDrop = tone === 'demanding' ? -4 : -1;
      return {
        coachLine,
        npcLine: `In questo momento non ci sono le condizioni né i risultati per ampliare il monte ingaggi. Lavora con il gruppo attuale e risali in classifica.`,
        npcName,
        effects: [`${confDrop} Fiducia`],
        playerMoraleDelta: 0,
        teamMoraleDelta: 0,
        chemistryDelta: 0,
        confidenceDelta: confDrop,
        budgetDelta: 0,
        reputationDelta: 0,
      };
    }

    if (topicId === 'request_patience') {
      const coachLine =
        tone === 'encouraging'
          ? `Il gruppo sta assimilando i nostri principi di gioco: chiedo compattezza societaria in questa fase.`
          : tone === 'diplomatic'
          ? `Stiamo costruendo basi solide per il medio periodo, presto la classifica ci darà ragione.`
          : `Non cerco alibi, ma serve stabilità per lavorare serenamente sul progetto tecnico.`;

      const gain = tone === 'diplomatic' ? 4 : tone === 'encouraging' ? 3 : 1;
      return {
        coachLine,
        npcLine:
          conf < 45
            ? `Comprendiamo le difficoltà, Coach. Ti accordiamo credito ma vogliamo vedere un cambio di passo concreto già dalle prossime partite.`
            : `Hai la nostra piena stima, Coach. Continua a lavorare con serenità insieme allo staff.`,
        npcName,
        effects: [`+${gain} Fiducia`],
        playerMoraleDelta: 0,
        teamMoraleDelta: 0,
        chemistryDelta: 0,
        confidenceDelta: gain,
        budgetDelta: 0,
        reputationDelta: 0,
      };
    }

    // review_objectives
    const coachLine = `Voglio fare il punto sugli obiettivi (${career.boardObjective ?? 'Playoff'}) considerando l'attuale ${userRank}° posto.`;
    const deltaConf = onTarget ? 3 : tone === 'diplomatic' ? 2 : -1;
    return {
      coachLine,
      npcLine: onTarget
        ? `Siamo in linea con l'obiettivo "${career.boardObjective ?? 'stagionale'}". Avanti così, la proprietà è soddisfatta.`
        : `Al momento il ${userRank}° posto non ci lascia tranquilli rispetto all'obiettivo "${career.boardObjective ?? 'stagionale'}": servono più vittorie.`,
      npcName,
      effects: [deltaConf >= 0 ? `+${deltaConf} Fiducia` : `${deltaConf} Fiducia`],
      playerMoraleDelta: 0,
      teamMoraleDelta: 0,
      chemistryDelta: 0,
      confidenceDelta: deltaConf,
      budgetDelta: 0,
      reputationDelta: 0,
    };
  }

  // channel === 'media'
  const leagueCfg = getLeagueConfig(userTeam.leagueId);
  const npcName = 'Sala Stampa';
  if (topicId === 'praise_group') {
    const coachLine =
      tone === 'encouraging'
        ? `Sono orgoglioso di questi ragazzi: in settimana sudano la maglia e meritano il sostegno del nostro palazzetto.`
        : tone === 'diplomatic'
        ? `Il merito della crescita è tutto del lavoro quotidiano dello spogliatoio e dello staff.`
        : `Questa squadra ha carattere da vendere e in ${leagueCfg.shortName} lo dimostreremo contro chiunque.`;

    const chemGain = tone === 'encouraging' ? 3 : 2;
    const teamMorale = 2;
    return {
      coachLine,
      npcLine: `Le tue parole di elogio vengono riprese dai principali portali sportivi locali e fanno sorridere lo spogliatoio.`,
      npcName,
      effects: [`+${chemGain} Chimica`, `+${teamMorale} Morale Squadra`, '+1 Reputazione'],
      playerMoraleDelta: 0,
      teamMoraleDelta: teamMorale,
      chemistryDelta: chemGain,
      confidenceDelta: 0,
      budgetDelta: 0,
      reputationDelta: 1,
      newsItem: {
        id: `news_media_${currentDate}_${Date.now()}`,
        round: career.currentRound,
        category: 'Lega',
        title: `${userTeam.shortName}, Coach ${career.managerName}: "Orgoglioso di questo gruppo"`,
        body: `Dichiarazioni distensive in sala stampa da parte del tecnico di ${userTeam.name}: entusiasmo alle stelle tra tifosi e spogliatoio.`,
      },
    };
  }

  if (topicId === 'shield_team') {
    const coachLine =
      tone === 'encouraging'
        ? `Se qualcosa non gira la responsabilità è mia, non dei ragazzi: lasciateli lavorare tranquilli.`
        : `Il gruppo è unito e giovane, giudicatemi pure sulle mie scelte tattiche ma proteggete chi scende sul parquet.`;

    return {
      coachLine,
      npcLine: `I giornalisti prendono nota: hai spostato l’attenzione mediatica su di te togliendo pressione alla squadra.`,
      npcName,
      effects: ['+3 Morale Squadra', '+1 Chimica'],
      playerMoraleDelta: 0,
      teamMoraleDelta: 3,
      chemistryDelta: 1,
      confidenceDelta: 0,
      budgetDelta: 0,
      reputationDelta: 0,
    };
  }

  // bold_statement
  const coachLine =
    tone === 'demanding'
      ? `Non guardiamo in faccia nessuno: chi viene nel nostro palazzetto dovrà faticare su ogni singolo possesso.`
      : `Puntiamo a stupire tutta la ${leagueCfg.shortName}: questo roster ha qualità per competere ai vertici.`;

  const highRiskSuccess = userRank <= 6 || lockerSkill >= 11;
  if (highRiskSuccess) {
    return {
      coachLine,
      npcLine: `Dichiarazione forte che infiamma i tifosi di ${userTeam.city} e carica l’ambiente prima delle prossime gare!`,
      npcName,
      effects: ['+2 Reputazione', '+3 Morale Squadra', '+1 Fiducia'],
      playerMoraleDelta: 0,
      teamMoraleDelta: 3,
      chemistryDelta: 0,
      confidenceDelta: 1,
      budgetDelta: 0,
      reputationDelta: 2,
      newsItem: {
        id: `news_media_bold_${currentDate}_${Date.now()}`,
        round: career.currentRound,
        category: 'Lega',
        title: `SCONTRO A DISTANZA: ${userTeam.shortName} alza l’asticella`,
        body: `Coach ${career.managerName} suona la carica davanti ai media: "Non temiamo nessuno in ${leagueCfg.name}."`,
      },
    };
  }

  return {
    coachLine,
    npcLine: `Qualche opinionista storce il naso vista l'attuale classifica (${userRank}° posto), aumentando leggermente la pressione.`,
    npcName,
    effects: ['-1 Fiducia', '+1 Reputazione'],
    playerMoraleDelta: 0,
    teamMoraleDelta: 0,
    chemistryDelta: 0,
    confidenceDelta: -1,
    budgetDelta: 0,
    reputationDelta: 1,
  };
}

export function appendChatBubbles(
  existing: ChatThreadLog | undefined,
  channelKey: string,
  currentDate: string,
  coachName: string,
  outcome: ChatOutcomeResult
): ChatThreadLog {
  const nowId = Date.now();
  const coachBubble: ChatMessageBubble = {
    id: `chat_${nowId}_c`,
    sender: 'coach',
    senderName: coachName,
    text: outcome.coachLine,
    timestamp: currentDate,
  };
  const npcBubble: ChatMessageBubble = {
    id: `chat_${nowId}_n`,
    sender: 'npc',
    senderName: outcome.npcName,
    text: outcome.npcLine,
    timestamp: currentDate,
    effects: outcome.effects,
  };

  return {
    channelKey,
    lastInteractionDate: currentDate,
    messages: [...(existing?.messages ?? []), coachBubble, npcBubble].slice(-12),
  };
}
