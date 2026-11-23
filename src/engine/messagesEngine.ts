import { InboxMessage, Player, Team, TransferOffer } from '../types';
import { formatEuro, getForeignLimitForLeague } from './ratings';

export function createInitialCareerMessages(params: {
  team: Team;
  managerName: string;
  boardObjective: string;
  seasonYear: number;
  startDate: string;
}): InboxMessage[] {
  const { team, managerName, boardObjective, seasonYear, startDate } = params;
  const limits = getForeignLimitForLeague(team.leagueId, team.lbaRosterFormat);
  const seasonLabel = `${seasonYear}/${String(seasonYear + 1).slice(-2)}`;

  const boardMsg: InboxMessage = {
    id: `msg_init_board_${seasonYear}`,
    category: 'dirigenza',
    senderName: 'Presidenza Club',
    senderRole: 'Dirigenza',
    subject: `Benvenuto a ${team.name} — Obiettivi Stagione ${seasonLabel}`,
    body: `Gentile Coach ${managerName},\n\nla società è lieta di affidarti la guida tecnica di ${team.name} per la stagione ${seasonLabel}.\n\n• Obiettivo stagionale: ${boardObjective}\n• Budget totale a disposizione: ${formatEuro(team.budget)}\n• Regolamento rosa attivo: ${limits.ruleLabel} (max ${limits.maxForeign} stranier${limits.maxForeign === 1 ? 'o' : 'i'}, min ${limits.minIta} ITA)\n\nLavoriamo insieme per dare continuità al progetto tecnico e soddisfare i tifosi.`,
    date: startDate,
    round: 1,
    read: false,
    urgent: false,
    actionTab: 'finances',
    actionLabel: 'Verifica Budget & Contratti',
  };

  const assistant = team.staff.assistant_coach;
  const viceName = assistant
    ? `${assistant.firstName} ${assistant.lastName}`
    : 'Vice Allenatore';

  const viceMsg: InboxMessage = {
    id: `msg_init_vice_${seasonYear}`,
    category: 'vice',
    senderName: viceName,
    senderRole: 'Vice Allenatore',
    subject: 'Briefing Tecnico: Roster, Quintetto e Rotazioni',
    body: `Coach,\n\nho analizzato la rosa prima dell'esordio. Al momento abbiamo ${team.roster.length} giocatori sotto contratto.\n\nTi consiglio di controllare il quintetto base, la distribuzione dei 200 minuti in Rotazioni e la Lavagna Tattica prima della 1ª giornata.\n\nIn caso di infortuni durante la stagione ti avviserò subito per adattare il minutaggio.`,
    date: startDate,
    round: 1,
    read: false,
    actionTab: 'rotations',
    actionLabel: 'Apri Rotazioni',
  };

  return [boardMsg, viceMsg];
}

export function createInjuryAlertMessage(params: {
  player: Player;
  date: string;
  round: number;
  isStarter: boolean;
}): InboxMessage {
  const { player, date, round, isStarter } = params;
  return {
    id: `msg_inj_${player.id}_${round}_${Date.now()}`,
    category: 'staff',
    senderName: 'Staff Medico & Preparatore',
    senderRole: 'Area Medica',
    subject: `Bollettino Medico: infortunio per ${player.firstName} ${player.lastName}`,
    body: `${player.firstName} ${player.lastName} (${player.primaryPosition}, OVR ${player.overall}) ha riportato ${player.injuryDescription ?? 'un problema fisico'} e resterà fermo circa ${player.injuryWeeks} settiman${player.injuryWeeks === 1 ? 'a' : 'e'}.\n\n${
      isStarter
        ? 'Essendo nel quintetto titolare, è necessario aggiornare subito le rotazioni prima della prossima gara.'
        : 'Valuta se adattare la panchina o convocare un giocatore dalle riserve.'
    }`,
    date,
    round,
    read: false,
    urgent: isStarter,
    actionTab: 'rotations',
    actionLabel: 'Adatta Rotazioni',
    playerId: player.id,
  };
}

export function createScoutingCompletedMessage(params: {
  player: Player;
  date: string;
  round: number;
}): InboxMessage {
  const { player, date, round } = params;
  return {
    id: `msg_scout_${player.id}_${round}_${Date.now()}`,
    category: 'staff',
    senderName: 'Resp. Scouting',
    senderRole: 'Area Scouting',
    subject: `Report completato: ${player.firstName} ${player.lastName}`,
    body: `Lo scouting su ${player.firstName} ${player.lastName} (${player.primaryPosition}, ${player.age} anni) è stato completato.\n\n• Overall reale: ${player.overall}\n• Stipendio richiesto: ${formatEuro(player.salary)}\n• Formazione: ${player.isItalianFormation ? 'Italiana (ITA)' : 'Straniero'}\n\nPuoi ora consultare tutti i parametri reali nel suo profilo o avviare una trattativa.`,
    date,
    round,
    read: false,
    actionTab: 'market',
    actionLabel: 'Apri Mercato',
    playerId: player.id,
  };
}

export function createIncomingOfferMessage(params: {
  offer: TransferOffer;
  date: string;
  round: number;
}): InboxMessage {
  const { offer, date, round } = params;
  return {
    id: `msg_offer_${offer.id}`,
    category: 'mercato',
    senderName: 'Direttore Sportivo / Agenti',
    senderRole: 'Area Mercato',
    subject: `Offerta Buyout: ${offer.fromTeamName} su ${offer.playerName}`,
    body: `Il club ${offer.fromTeamName} ha presentato un'offerta ufficiale di buyout per ${offer.playerName} pari a ${formatEuro(offer.buyoutAmount)}.\n\n${
      offer.reason ? `Nota: ${offer.reason}.\n\n` : ''
    }Puoi accettare (incassando subito la clausola nel budget) oppure rifiutare dalla scheda Mercato → Offerte.`,
    date,
    round,
    read: false,
    urgent: true,
    actionTab: 'market',
    actionLabel: 'Valuta Offerta',
  };
}

export function createPlayerUnhappyMessage(params: {
  player: Player;
  date: string;
  round: number;
}): InboxMessage {
  const { player, date, round } = params;
  return {
    id: `msg_unhappy_${player.id}_${round}_${Date.now()}`,
    category: 'vice',
    senderName: `Agente di ${player.lastName}`,
    senderRole: 'Spogliatoio & Agenti',
    subject: `Malcontento di ${player.firstName} ${player.lastName} sul minutaggio`,
    body: `Coach,\n\n${player.firstName} ${player.lastName} (Morale ${player.morale}/100, ruolo contrattuale "${player.promisedRole}") è insoddisfatto dello spazio attuale in squadra e sta valutando altre destinazioni.\n\nCome vuoi gestire la situazione nello spogliatoio?`,
    date,
    round,
    read: false,
    urgent: true,
    playerId: player.id,
    choices: [
      {
        id: 'promise_minutes',
        label: 'Prometti più minuti nelle rotazioni',
        effectHint: '+10 Morale al giocatore',
      },
      {
        id: 'keep_line',
        label: 'Difendi le scelte tecniche attuali',
        effectHint: '-4 Morale, nessuna promessa vincolante',
      },
    ],
  };
}

export function createSeasonTransitionMessages(params: {
  team: Team;
  seasonYear: number;
  date: string;
  promoted: boolean;
  relegated: boolean;
  regulationNotice?: string;
  endOfSeasonOffers: TransferOffer[];
}): InboxMessage[] {
  const {
    team,
    seasonYear,
    date,
    promoted,
    relegated,
    regulationNotice,
    endOfSeasonOffers,
  } = params;
  const seasonLabel = `${seasonYear}/${String(seasonYear + 1).slice(-2)}`;
  const msgs: InboxMessage[] = [];

  if (promoted || relegated || regulationNotice) {
    msgs.push({
      id: `msg_transition_reg_${seasonYear}`,
      category: 'lega',
      senderName: 'Lega & Dirigenza',
      senderRole: 'Segreteria Federale',
      subject: promoted
        ? `Promozione & Regolamento ${seasonLabel}`
        : relegated
        ? `Retrocessione & Adeguamento Rosa ${seasonLabel}`
        : `Apertura Offseason ${seasonLabel}`,
      body: `${
        promoted
          ? `Complimenti per la promozione! Il budget di ${team.name} è stato adeguato a ${formatEuro(team.budget)}.`
          : relegated
          ? `Dopo la retrocessione il budget è stato ridimensionato a ${formatEuro(team.budget)}.`
          : `Si apre l'offseason ${seasonLabel}.`
      }\n\n${regulationNotice ?? 'Verifica il roster prima dell’inizio della Regular Season.'}`,
      date,
      round: 1,
      read: false,
      urgent: true,
      openRosterModal: true,
      actionLabel: 'Apri Costruttore Roster',
    });
  }

  for (const off of endOfSeasonOffers) {
    msgs.push(createIncomingOfferMessage({ offer: off, date, round: 1 }));
  }

  return msgs;
}
