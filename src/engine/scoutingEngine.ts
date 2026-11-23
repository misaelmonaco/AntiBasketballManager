import { getLeagueConfig } from '../data/teams';
import { ContractRole, Player, Team, TransferOffer } from '../types';
import { calculateWageBill, getForeignLimitForLeague } from './ratings';

function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getScoutingDurationDays(scoutRating: number, managerScouting = 10): number {
  let days = 7;
  if (scoutRating >= 82) days = 4;
  else if (scoutRating >= 72) days = 5;
  else if (scoutRating >= 62) days = 6;
  if (managerScouting >= 14) days = Math.max(3, days - 1);
  return days;
}

/**
 * Calcola un intervallo di stima deterministico (Fog of War) basato sul livello dello scout.
 */
export function getAttributeEstimate(
  trueVal: number,
  playerId: string,
  attrKey: string,
  scoutRating: number
): { min: number; max: number } {
  const spread = Math.max(3, Math.round(14 - (scoutRating - 45) * 0.22)); // 4..13
  const h = hashStr(`${playerId}_${attrKey}`);
  const offset = (h % (spread + 1)) - Math.floor(spread / 2);
  const center = Math.max(35, Math.min(98, trueVal + Math.round(offset * 0.45)));
  const half = Math.ceil(spread / 2);
  return {
    min: Math.max(35, center - half),
    max: Math.min(99, center + half),
  };
}

export function getSalaryEstimate(
  trueSalary: number,
  playerId: string,
  scoutRating: number
): { min: number; max: number } {
  const pctSpread = Math.max(0.08, 0.28 - (scoutRating - 50) * 0.004);
  const min = Math.max(40000, Math.round((trueSalary * (1 - pctSpread)) / 5000) * 5000);
  const max = Math.round((trueSalary * (1 + pctSpread)) / 5000) * 5000;
  // Usa hash per evitare che la media sia sempre esatta
  const h = (hashStr(playerId) % 3) - 1;
  return {
    min: Math.max(40000, min + h * 5000),
    max: Math.max(min + 10000, max + h * 5000),
  };
}

export function getPlayerBuyoutClause(player: Player): number {
  return (
    player.buyoutClause ??
    Math.round(player.salary * player.contractYears * 0.65)
  );
}

export function evaluateContractOffer(params: {
  player: Player;
  team: Team;
  offeredSalary: number;
  contractYears: 1 | 2;
  promisedRole: ContractRole;
  isRenewal?: boolean;
}): { accepted: boolean; message: string } {
  const { player, team, offeredSalary, contractYears, promisedRole, isRenewal } = params;

  // 1. Verifica congruità ruolo garantito
  if (player.overall >= 78 && promisedRole === 'Giocatore di rotazione') {
    return {
      accepted: false,
      message: `L'agente di ${player.lastName} rifiuta categoricamente: "Un giocatore di questo calibro pretende almeno un ruolo da Sesto uomo o Titolare."`,
    };
  }
  if (
    player.overall >= 74 &&
    player.personality === 'Egocentrico' &&
    (promisedRole === 'Sesto uomo' || promisedRole === 'Giocatore di rotazione')
  ) {
    return {
      accepted: false,
      message: `${player.lastName} non accetta un ruolo dalla panchina: vuole garanzie da Titolare fisso o Stella della squadra.`,
    };
  }

  // 2. Calcolo richiesta salariale minima
  let roleMultiplier = 1.0;
  if (promisedRole === 'Stella della squadra') roleMultiplier = 0.91;
  else if (promisedRole === 'Titolare fisso') roleMultiplier = 0.95;
  else if (promisedRole === 'Giocatore di rotazione') roleMultiplier = 1.14;

  const prestigeDiscount = (team.prestige - 72) * 0.004;
  const durationDiscount = contractYears === 2 && player.age >= 29 ? 0.04 : 0;
  const renewalLoyalty = isRenewal && player.morale >= 75 ? 0.05 : 0;

  const baseTarget = isRenewal ? player.salary * 1.04 : player.salary * 0.95;
  const minAcceptable = Math.max(
    45000,
    Math.round(
      (baseTarget *
        roleMultiplier *
        (1 - prestigeDiscount - durationDiscount - renewalLoyalty)) /
        5000
    ) * 5000
  );

  if (offeredSalary < minAcceptable) {
    return {
      accepted: false,
      message: `L'agente di ${player.lastName} chiede di più: "Con il ruolo di ${promisedRole}, la nostra richiesta minima è €${minAcceptable.toLocaleString('it-IT')}."`,
    };
  }

  return {
    accepted: true,
    message: `${player.firstName} ${player.lastName} accetta il contratto (${promisedRole}, ${
      contractYears === 1 ? '1 anno' : '2 anni'
    } a €${offeredSalary.toLocaleString('it-IT')})!`,
  };
}

export function generateIncomingTransferOffer(
  teams: Team[],
  userTeam: Team,
  round: number,
  existingOffers: TransferOffer[] = [],
  forceListed = false
): TransferOffer | null {
  const listedPlayers = userTeam.roster.filter((p) => p.onTransferList);
  const hasListed = listedPlayers.length > 0;
  const minRosterKeep = hasListed ? 7 : 10;
  const triggerChance = forceListed && hasListed ? 1 : hasListed ? 0.8 : 0.34;
  if (Math.random() > triggerChance || userTeam.roster.length <= minRosterKeep) return null;

  const existingPairs = new Set(existingOffers.map((o) => `${o.fromTeamId}_${o.playerId}`));

  const eligibleBuyers = teams.filter((t) => {
    if (t.id === userTeam.id) return false;
    const freeCap = t.budget - calculateWageBill(t.roster);
    return freeCap >= 45000;
  });
  if (eligibleBuyers.length === 0) return null;

  // Se ci sono giocatori in lista trasferimenti, cerca direttamente un club interessato a loro
  const targetPool =
    hasListed && (forceListed || Math.random() < 0.85) ? listedPlayers : userTeam.roster;

  const shuffledTargets = [...targetPool].sort(() => Math.random() - 0.5);
  for (const target of shuffledTargets) {
    const baseBuyout = getPlayerBuyoutClause(target);
    const matchingBuyers = eligibleBuyers.filter((buyer) => {
      if (existingPairs.has(`${buyer.id}_${target.id}`)) return false;
      const buyerLeagueId = buyer.leagueId ?? 'ITA_LBA';
      const buyerCfg = getLeagueConfig(buyerLeagueId);
      if (target.overall < buyerCfg.avgOverall - (target.onTransferList ? 3 : 1)) {
        return false;
      }
      const { maxForeign } = getForeignLimitForLeague(
        buyerLeagueId,
        buyer.lbaRosterFormat ?? '6+6'
      );
      const buyerForeignCount = buyer.roster.filter((p) => !p.isItalianFormation).length;
      if (!target.isItalianFormation && buyerForeignCount >= maxForeign) return false;

      const buyerFreeCap = buyer.budget - calculateWageBill(buyer.roster);
      if (target.salary > buyerFreeCap * 1.25 || baseBuyout > buyerFreeCap * 1.15) {
        return false;
      }
      return true;
    });

    if (matchingBuyers.length === 0) continue;

    const buyer = matchingBuyers[Math.floor(Math.random() * matchingBuyers.length)];
    const buyoutAmount = target.onTransferList
      ? Math.max(
          15000,
          Math.round((baseBuyout * (0.9 + Math.random() * 0.25)) / 5000) * 5000
        )
      : baseBuyout;

    const reason = target.onTransferList
      ? 'Giocatore sul mercato (Lista Trasferimenti)'
      : target.contractYears >= 2 && target.morale < 60
      ? `Contratto pluriennale • Giocatore scontento (Morale ${target.morale})`
      : undefined;

    return {
      id: `offer_${round}_${target.id}_${buyer.id}_${Date.now()}`,
      fromTeamId: buyer.id,
      fromTeamName: buyer.name,
      playerId: target.id,
      playerName: `${target.firstName} ${target.lastName}`,
      buyoutAmount,
      round,
      reason,
    };
  }

  return null;
}

/**
 * Genera fino a `maxOffers` offerte concorrenti per i giocatori messi in lista trasferimenti.
 */
export function generateOffersForTransferList(
  teams: Team[],
  userTeam: Team,
  round: number,
  existingOffers: TransferOffer[] = [],
  maxOffers = 2
): TransferOffer[] {
  const listed = userTeam.roster.filter((p) => p.onTransferList);
  if (listed.length === 0 || userTeam.roster.length <= 7) return [];

  const created: TransferOffer[] = [];
  let runningOffers = [...existingOffers];

  for (let i = 0; i < maxOffers; i++) {
    const offer = generateIncomingTransferOffer(teams, userTeam, round, runningOffers, true);
    if (offer) {
      created.push(offer);
      runningOffers = [offer, ...runningOffers];
    }
  }
  return created;
}

export function evaluateLoanRequest(params: {
  player: Player;
  fromTeam: Team;
  toTeam: Team;
  salarySharePct: number;
}): { accepted: boolean; loanSalary: number; message: string } {
  const { player, fromTeam, toTeam, salarySharePct } = params;
  const share = Math.max(50, Math.min(100, salarySharePct));
  const loanSalary = Math.max(15000, Math.round((player.salary * (share / 100)) / 5000) * 5000);

  if (player.loanedFromTeamId) {
    return {
      accepted: false,
      loanSalary,
      message: `${player.lastName} è già in prestito da ${player.loanedFromTeamName ?? 'un altro club'} e non può essere girato.`,
    };
  }

  if (fromTeam.roster.length <= 10) {
    return {
      accepted: false,
      loanSalary,
      message: `${fromTeam.shortName} ha una rosa troppo corta (${fromTeam.roster.length} giocatori) per cedere ${player.lastName} in prestito.`,
    };
  }

  const toFreeCap = toTeam.budget - calculateWageBill(toTeam.roster);
  if (toFreeCap < loanSalary) {
    return {
      accepted: false,
      loanSalary,
      message: `Spazio salariale insufficiente per coprire la quota prestito (€${loanSalary.toLocaleString('it-IT')}).`,
    };
  }

  const fromCfg = getLeagueConfig(fromTeam.leagueId ?? 'ITA_LBA');
  const toCfg = getLeagueConfig(toTeam.leagueId ?? 'ITA_LBA');
  const sameTier = fromCfg.id === toCfg.id;

  // I titolari chiave della stessa categoria non vengono ceduti in prestito facilmente
  if (sameTier && player.rosterSlot === 'starter' && player.overall >= fromCfg.avgOverall + 2) {
    return {
      accepted: false,
      loanSalary,
      message: `${fromTeam.shortName} rifiuta: "${player.lastName} è un titolare fondamentale per la nostra stagione."`,
    };
  }

  let score = 0;
  if (fromCfg.avgOverall > toCfg.avgOverall) score += 35; // Categoria superiore presta più volentieri
  if (player.age <= 23) score += 28; // Giovane in cerca di minuti
  if (player.rosterSlot === 'reserve') score += 30;
  else if (player.rosterSlot === 'bench') score += 14;
  if (player.morale < 62) score += 18;
  if (share >= 100) score += 25;
  else if (share >= 75) score += 14;
  if (sameTier) score -= 12;

  if (score < 32) {
    return {
      accepted: false,
      loanSalary,
      message: `${fromTeam.shortName} rifiuta il prestito di ${player.lastName}: prova ad aumentare la quota ingaggio coperta.`,
    };
  }

  return {
    accepted: true,
    loanSalary,
    message: `${fromTeam.shortName} accetta il prestito di ${player.firstName} ${player.lastName} (quota ingaggio €${loanSalary.toLocaleString('it-IT')})!`,
  };
}

export function evaluatePlayerTrade(params: {
  userTeam: Team;
  rivalTeam: Team;
  offeredPlayer: Player;
  requestedPlayer: Player;
  cashAdjustment: number; // positivo = user paga a rival, negativo = rival paga a user
}): { accepted: boolean; message: string } {
  const { userTeam, rivalTeam, offeredPlayer, requestedPlayer, cashAdjustment } = params;

  if (offeredPlayer.loanedFromTeamId || requestedPlayer.loanedFromTeamId) {
    return {
      accepted: false,
      message: 'Non è possibile includere giocatori attualmente in prestito in uno scambio.',
    };
  }

  const userFreeCap = userTeam.budget - calculateWageBill(userTeam.roster);
  const rivalFreeCap = rivalTeam.budget - calculateWageBill(rivalTeam.roster);

  // Controllo budget/cap post-scambio
  const userCapAfter =
    userFreeCap + offeredPlayer.salary - requestedPlayer.salary - Math.max(0, cashAdjustment);
  if (userCapAfter < 0) {
    return {
      accepted: false,
      message: 'Spazio salariale o budget insufficiente per completare questo scambio.',
    };
  }
  if (cashAdjustment < 0 && rivalFreeCap < Math.abs(cashAdjustment)) {
    return {
      accepted: false,
      message: `${rivalTeam.shortName} non ha abbastanza liquidità per aggiungere il conguaglio richiesto.`,
    };
  }

  // Controllo limite stranieri per entrambi i club
  const userLimits = getForeignLimitForLeague(
    userTeam.leagueId ?? 'ITA_LBA',
    userTeam.lbaRosterFormat ?? '6+6'
  );
  const rivalLimits = getForeignLimitForLeague(
    rivalTeam.leagueId ?? 'ITA_LBA',
    rivalTeam.lbaRosterFormat ?? '6+6'
  );

  const rivalForeignBefore = rivalTeam.roster.filter((p) => !p.isItalianFormation).length;
  const rivalForeignAfter =
    rivalForeignBefore -
    (requestedPlayer.isItalianFormation ? 0 : 1) +
    (offeredPlayer.isItalianFormation ? 0 : 1);
  if (rivalForeignAfter > rivalForeignBefore && rivalForeignAfter > rivalLimits.maxForeign + 1) {
    return {
      accepted: false,
      message: `${rivalTeam.shortName} rifiuta: troppi giocatori stranieri rispetto ai limiti della lega.`,
    };
  }

  const userForeignBefore = userTeam.roster.filter((p) => !p.isItalianFormation).length;
  const userForeignAfter =
    userForeignBefore -
    (offeredPlayer.isItalianFormation ? 0 : 1) +
    (requestedPlayer.isItalianFormation ? 0 : 1);
  if (userForeignAfter > userForeignBefore && userForeignAfter > userLimits.maxForeign + 2) {
    return {
      accepted: false,
      message: 'Attenzione: con questo scambio supereresti troppo il limite stranieri del campionato.',
    };
  }

  // Valutazione valore tecnico (OVR + età + conguaglio)
  const playerValue = (p: Player) =>
    p.overall * 10 + Math.max(0, 29 - p.age) * 4 - (p.injuryWeeks > 0 ? 18 : 0);

  const offeredVal = playerValue(offeredPlayer) + cashAdjustment / 12000;
  const requestedVal = playerValue(requestedPlayer);

  if (offeredVal + 8 < requestedVal) {
    return {
      accepted: false,
      message: `${rivalTeam.shortName} rifiuta: valuta ${requestedPlayer.lastName} superiore a ${offeredPlayer.lastName}. Aggiungi un conguaglio o proponi un giocatore più forte.`,
    };
  }

  return {
    accepted: true,
    message: `${rivalTeam.shortName} accetta lo scambio: ${requestedPlayer.lastName} passa a ${userTeam.shortName} per ${offeredPlayer.lastName}!`,
  };
}

export interface BuyoutCounterOfferResult {
  status: 'accepted' | 'countered' | 'final_offer' | 'withdrawn';
  newOfferAmount?: number;
  message: string;
  maxWillingAmount: number;
  nextRounds: number;
  isFinalOffer: boolean;
}

function stableHashVariance(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const normalized = ((Math.abs(hash) % 1000) / 999) * 2 - 1; // -1..+1
  return normalized * 0.03;
}

function computeMaxWillingBuyout(
  offer: TransferOffer,
  buyerTeam: Team,
  player: Player
): number {
  const currentOffer = offer.buyoutAmount;
  if (typeof offer.maxWillingAmount === 'number') {
    return Math.max(currentOffer, offer.maxWillingAmount);
  }

  const baseBuyout = getPlayerBuyoutClause(player);
  const initialOffer = offer.initialBuyoutAmount ?? currentOffer;
  const buyerFreeCap = Math.max(0, buyerTeam.budget - calculateWageBill(buyerTeam.roster));
  const affordableCeiling = Math.max(
    currentOffer,
    Math.floor(
      Math.min(Math.max(0, buyerTeam.budget - 500000), buyerFreeCap * 1.45) / 5000
    ) * 5000
  );

  let multiplier = 1.16;
  if (player.overall >= 78) multiplier += 0.12;
  else if (player.overall >= 72) multiplier += 0.07;

  if (player.age <= 23) multiplier += 0.08;
  if (buyerTeam.budget >= 4000000) multiplier += 0.06;
  if (player.onTransferList) multiplier -= 0.07;
  if (player.morale < 60 || offer.reason?.toLowerCase().includes('scontento')) {
    multiplier -= 0.05;
  }

  multiplier += stableHashVariance(offer.id);

  const rawMax =
    Math.round((Math.max(initialOffer, baseBuyout) * multiplier) / 5000) * 5000;
  return Math.max(currentOffer, Math.min(Math.max(currentOffer, affordableCeiling), rawMax));
}

/**
 * Valuta una controproposta al rialzo dell'utente su un'offerta di buyout ricevuta.
 * Fissa il massimale del club acquirente al primo round per prevenire reroll e gestisce fino a 3 round.
 */
export function evaluateBuyoutCounterOffer(params: {
  offer: TransferOffer;
  requestedAmount: number;
  buyerTeam: Team;
  player: Player;
}): BuyoutCounterOfferResult {
  const { offer, requestedAmount, buyerTeam, player } = params;
  const currentOffer = offer.buyoutAmount;
  const req = Math.round(requestedAmount / 5000) * 5000;
  const nextRounds = (offer.negotiationRounds ?? 0) + 1;
  const maxWillingAmount = computeMaxWillingBuyout(offer, buyerTeam, player);

  if (
    req > Math.round(maxWillingAmount * 1.38) ||
    (nextRounds >= 3 && req > Math.round(maxWillingAmount * 1.15))
  ) {
    return {
      status: 'withdrawn',
      message: `${buyerTeam.shortName} ritiene eccessiva la richiesta di €${req.toLocaleString('it-IT')} e si ritira dalla trattativa per ${offer.playerName}.`,
      maxWillingAmount,
      nextRounds,
      isFinalOffer: true,
    };
  }

  const instantAcceptThreshold =
    Math.round(((currentOffer + maxWillingAmount) / 2) / 5000) * 5000;
  if (
    req <= maxWillingAmount &&
    (req <= currentOffer + 10000 || req <= instantAcceptThreshold || nextRounds >= 3)
  ) {
    return {
      status: 'accepted',
      newOfferAmount: req,
      message: `${buyerTeam.shortName} accetta la tua controproposta di €${req.toLocaleString('it-IT')} per ${offer.playerName}! Clicca "Accetta e Incassa" per chiudere.`,
      maxWillingAmount,
      nextRounds,
      isFinalOffer: true,
    };
  }

  const target = Math.min(req, maxWillingAmount);
  const stepFraction = nextRounds === 1 ? 0.55 : nextRounds === 2 ? 0.78 : 1.0;
  const gap = Math.max(0, target - currentOffer);
  const step =
    gap > 0 ? Math.max(5000, Math.round((gap * stepFraction) / 5000) * 5000) : 0;
  const newOffer = Math.min(maxWillingAmount, currentOffer + step);

  if (newOffer <= currentOffer) {
    if (req > Math.round(maxWillingAmount * 1.2)) {
      return {
        status: 'withdrawn',
        message: `${buyerTeam.shortName} non ha margine per rilanciare oltre €${currentOffer.toLocaleString('it-IT')} e abbandona la trattativa per ${offer.playerName}.`,
        maxWillingAmount,
        nextRounds,
        isFinalOffer: true,
      };
    }
    return {
      status: 'final_offer',
      newOfferAmount: currentOffer,
      message: `${buyerTeam.shortName} non può spingersi oltre €${currentOffer.toLocaleString('it-IT')}: è la nostra offerta definitiva per ${offer.playerName}.`,
      maxWillingAmount,
      nextRounds,
      isFinalOffer: true,
    };
  }

  if (nextRounds >= 3 || newOffer >= maxWillingAmount) {
    return {
      status: 'final_offer',
      newOfferAmount: newOffer,
      message: `${buyerTeam.shortName} rilancia al massimo fino a €${newOffer.toLocaleString('it-IT')} per ${offer.playerName}: prendere o lasciare.`,
      maxWillingAmount,
      nextRounds,
      isFinalOffer: true,
    };
  }

  return {
    status: 'countered',
    newOfferAmount: newOffer,
    message: `${buyerTeam.shortName} risponde alzando l'offerta a €${newOffer.toLocaleString('it-IT')} per ${offer.playerName}.`,
    maxWillingAmount,
    nextRounds,
    isFinalOffer: false,
  };
}
