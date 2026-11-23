import { MinutePriority, Player, RosterSlot } from '../../types';
import { getRoundDate } from '../../engine/calendarUtils';
import { createIncomingOfferMessage } from '../../engine/messagesEngine';
import {
  evaluateBuyoutCounterOffer,
  evaluateContractOffer,
  evaluateLoanRequest,
  evaluatePlayerTrade,
  generateOffersForTransferList,
  getPlayerBuyoutClause,
  getScoutingDurationDays,
} from '../../engine/scoutingEngine';
import { applyRosterChangeChemistry } from '../../engine/clubEngine';
import { calculateBuyout, calculateWageBill } from '../../engine/ratings';
import { GameStore, StoreGet, StoreSet } from '../storeTypes';

type MarketSliceKeys =
  | 'cutPlayer'
  | 'negotiateFreeAgent'
  | 'renewPlayerContract'
  | 'buyoutRivalPlayer'
  | 'requestPlayerLoan'
  | 'startScoutingPlayer'
  | 'advanceScoutingDays'
  | 'respondToIncomingOffer'
  | 'counterIncomingOffer'
  | 'togglePlayerTransferList'
  | 'toggleShortlistPlayer'
  | 'proposePlayerTrade'
  | 'upgradeFacility'
  | 'selectSeasonSponsor';

export function createMarketSlice(
  set: StoreSet,
  get: StoreGet
): Pick<GameStore, MarketSliceKeys> {
  return {
    cutPlayer: (playerId) => {
      const { career } = get();
      if (!career) return { ok: false, message: 'Nessuna carriera attiva.' };
      const team = career.teams.find((t) => t.id === career.userTeamId);
      if (!team) return { ok: false, message: 'Squadra non trovata.' };
      if (team.roster.length <= 7) {
        const msg = 'Impossibile tagliare: servono almeno 7 giocatori a roster.';
        set({ toast: msg });
        return { ok: false, message: msg };
      }
      const target = team.roster.find((p) => p.id === playerId);
      if (!target) return { ok: false, message: 'Giocatore non trovato.' };

      const buyout = calculateBuyout(target);
      const updatedRoster = team.roster.filter((p) => p.id !== playerId);
      const freedPlayer = { ...target, rosterSlot: 'bench' as const };

      const teams = career.teams.map((t) => {
        if (t.id !== team.id) return t;
        const updated = {
          ...t,
          budget: Math.max(500000, t.budget - buyout),
          roster: updatedRoster,
        };
        return applyRosterChangeChemistry(updated, 'cut', target);
      });

      const newsItem = {
        id: `news_cut_${Date.now()}`,
        round: career.currentRound,
        category: 'Mercato' as const,
        title: `${team.shortName}: risolto il contratto con ${target.lastName}`,
        body: `${team.name} ha tagliato ${target.firstName} ${target.lastName} pagando una buonuscita di €${buyout.toLocaleString('it-IT')}.`,
      };

      set({
        career: {
          ...career,
          teams,
          freeAgents: [freedPlayer, ...career.freeAgents],
          news: [newsItem, ...career.news].slice(0, 40),
        },
        toast: `${target.lastName} tagliato (buonuscita €${buyout.toLocaleString('it-IT')}).`,
      });

      return { ok: true, message: 'Giocatore tagliato con successo.' };
    },

    negotiateFreeAgent: (playerId, offeredSalary, contractYears, promisedRole) => {
      const { career } = get();
      if (!career) return { accepted: false, message: 'Nessuna carriera attiva.' };
      const team = career.teams.find((t) => t.id === career.userTeamId);
      const player = career.freeAgents.find((p) => p.id === playerId);
      if (!team || !player) {
        return { accepted: false, message: 'Giocatore o squadra non trovati.' };
      }

      const currentWage = calculateWageBill(team.roster);
      if (currentWage + offeredSalary > team.budget) {
        return {
          accepted: false,
          message: 'Budget insufficiente! Taglia un giocatore o riduci l’offerta.',
        };
      }

      const evaluation = evaluateContractOffer({
        player,
        team,
        offeredSalary,
        contractYears,
        promisedRole,
        isRenewal: false,
      });
      if (!evaluation.accepted) {
        return evaluation;
      }

      const activeCount = team.roster.filter((p) => p.rosterSlot !== 'reserve').length;
      const signedPlayer = {
        ...player,
        salary: offeredSalary,
        contractYears,
        promisedRole,
        buyoutClause: Math.round(offeredSalary * contractYears * 0.65),
        rosterSlot: (activeCount < 12 ? 'bench' : 'reserve') as RosterSlot,
        minutePriority: (promisedRole === 'Stella della squadra' ||
        promisedRole === 'Titolare fisso'
          ? 'Alta'
          : promisedRole === 'Sesto uomo'
          ? 'Media'
          : 'Bassa') as MinutePriority,
      };

      const teams = career.teams.map((t) => {
        if (t.id !== team.id) return t;
        return applyRosterChangeChemistry(
          { ...t, roster: [...t.roster, signedPlayer] },
          'sign',
          signedPlayer
        );
      });
      const freeAgents = career.freeAgents.filter((p) => p.id !== playerId);

      const newsItem = {
        id: `news_sign_${Date.now()}`,
        round: career.currentRound,
        category: 'Mercato' as const,
        title: `UFFICIALE: ${team.shortName} firma ${player.firstName} ${player.lastName}`,
        body: `Colpo di mercato per ${team.name}: accordo ${
          contractYears === 1 ? 'annuale' : 'biennale'
        } da €${offeredSalary.toLocaleString('it-IT')} (${promisedRole}).`,
      };

      set({
        career: {
          ...career,
          teams,
          freeAgents,
          scoutedPlayerIds: Array.from(new Set([...career.scoutedPlayerIds, player.id])),
          news: [newsItem, ...career.news].slice(0, 40),
        },
        toast: `${player.firstName} ${player.lastName} ha firmato!`,
      });

      return evaluation;
    },

    renewPlayerContract: (playerId, offeredSalary, contractYears, promisedRole) => {
      const { career } = get();
      if (!career) return { accepted: false, message: 'Nessuna carriera attiva.' };
      const team = career.teams.find((t) => t.id === career.userTeamId);
      const player = team?.roster.find((p) => p.id === playerId);
      if (!team || !player) return { accepted: false, message: 'Giocatore non trovato.' };

      const otherWages = calculateWageBill(team.roster) - player.salary;
      if (otherWages + offeredSalary > team.budget) {
        return {
          accepted: false,
          message: 'Budget salariale insufficiente per questo rinnovo.',
        };
      }

      const evaluation = evaluateContractOffer({
        player,
        team,
        offeredSalary,
        contractYears,
        promisedRole,
        isRenewal: true,
      });
      if (!evaluation.accepted) {
        return evaluation;
      }

      const teams = career.teams.map((t) => {
        if (t.id !== team.id) return t;
        return {
          ...t,
          roster: t.roster.map((p) =>
            p.id === player.id
              ? {
                  ...p,
                  salary: offeredSalary,
                  contractYears,
                  promisedRole,
                  buyoutClause: Math.round(offeredSalary * contractYears * 0.65),
                  morale: Math.min(100, (p.morale ?? 78) + 6),
                }
              : p
          ),
        };
      });

      set({
        career: { ...career, teams },
        toast: `Contratto di ${player.lastName} rinnovato!`,
      });

      return evaluation;
    },

    buyoutRivalPlayer: (
      fromTeamId,
      playerId,
      offeredSalary,
      contractYears,
      promisedRole
    ) => {
      const { career } = get();
      if (!career) return { accepted: false, message: 'Nessuna carriera attiva.' };
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      const rivalTeam = career.teams.find((t) => t.id === fromTeamId);
      const player = rivalTeam?.roster.find((p) => p.id === playerId);
      if (!userTeam || !rivalTeam || !player) {
        return { accepted: false, message: 'Giocatore o squadra non trovati.' };
      }
      if (rivalTeam.roster.length <= 10) {
        return {
          accepted: false,
          message: `${rivalTeam.shortName} non ha abbastanza giocatori per liberare ${player.lastName}.`,
        };
      }

      const buyout = getPlayerBuyoutClause(player);
      const currentWage = calculateWageBill(userTeam.roster);
      if (userTeam.budget - buyout < currentWage + offeredSalary) {
        return {
          accepted: false,
          message: `Budget insufficiente per coprire sia il buyout (€${buyout.toLocaleString(
            'it-IT'
          )}) che lo stipendio.`,
        };
      }

      const evaluation = evaluateContractOffer({
        player,
        team: userTeam,
        offeredSalary,
        contractYears,
        promisedRole,
        isRenewal: false,
      });
      if (!evaluation.accepted) {
        return evaluation;
      }

      const activeCount = userTeam.roster.filter((p) => p.rosterSlot !== 'reserve').length;
      const transferredPlayer = {
        ...player,
        salary: offeredSalary,
        contractYears,
        promisedRole,
        buyoutClause: Math.round(offeredSalary * contractYears * 0.65),
        rosterSlot: (activeCount < 12 ? 'bench' : 'reserve') as RosterSlot,
      };

      const teams = career.teams.map((t) => {
        if (t.id === userTeam.id) {
          return applyRosterChangeChemistry(
            {
              ...t,
              budget: t.budget - buyout,
              roster: [...t.roster, transferredPlayer],
            },
            'sign',
            transferredPlayer
          );
        }
        if (t.id === rivalTeam.id) {
          return {
            ...t,
            budget: t.budget + buyout,
            roster: t.roster.filter((p) => p.id !== playerId),
          };
        }
        return t;
      });

      const newsItem = {
        id: `news_buyout_${Date.now()}`,
        round: career.currentRound,
        category: 'Mercato' as const,
        title: `CLAMOROSO BUYOUT: ${userTeam.shortName} strappa ${player.lastName} a ${rivalTeam.shortName}`,
        body: `${userTeam.name} ha versato la clausola da €${buyout.toLocaleString(
          'it-IT'
        )} assicurandosi ${player.firstName} ${player.lastName}.`,
      };

      set({
        career: {
          ...career,
          teams,
          scoutedPlayerIds: Array.from(new Set([...career.scoutedPlayerIds, player.id])),
          news: [newsItem, ...career.news].slice(0, 40),
        },
        toast: `Buyout completato! ${player.lastName} è un nuovo giocatore di ${userTeam.shortName}!`,
      });

      return evaluation;
    },

    requestPlayerLoan: (fromTeamId, playerId, salarySharePct) => {
      const { career } = get();
      if (!career) return { accepted: false, message: 'Nessuna carriera attiva.' };
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      const rivalTeam = career.teams.find((t) => t.id === fromTeamId);
      const player = rivalTeam?.roster.find((p) => p.id === playerId);
      if (!userTeam || !rivalTeam || !player) {
        return { accepted: false, message: 'Giocatore o squadra non trovati.' };
      }

      const evaluation = evaluateLoanRequest({
        player,
        fromTeam: rivalTeam,
        toTeam: userTeam,
        salarySharePct,
      });
      if (!evaluation.accepted) {
        return evaluation;
      }

      const activeCount = userTeam.roster.filter((p) => p.rosterSlot !== 'reserve').length;
      const loanedPlayer: Player = {
        ...player,
        loanedFromTeamId: rivalTeam.id,
        loanedFromTeamName: rivalTeam.name,
        loanOriginalSalary: player.salary,
        salary: evaluation.loanSalary,
        contractYears: 1,
        morale: Math.max(75, player.morale + 10),
        rosterSlot: (activeCount < 12 ? 'bench' : 'reserve') as RosterSlot,
      };

      const teams = career.teams.map((t) => {
        if (t.id === userTeam.id) {
          return applyRosterChangeChemistry(
            { ...t, roster: [...t.roster, loanedPlayer] },
            'sign',
            loanedPlayer
          );
        }
        if (t.id === rivalTeam.id) {
          return {
            ...t,
            roster: t.roster.filter((p) => p.id !== playerId),
          };
        }
        return t;
      });

      const newsItem = {
        id: `news_loan_${Date.now()}`,
        round: career.currentRound,
        category: 'Mercato' as const,
        title: `PRESTITO: ${player.lastName} arriva a ${userTeam.shortName}`,
        body: `${userTeam.name} ha ottenuto ${player.firstName} ${
          player.lastName
        } in prestito fino a fine stagione da ${
          rivalTeam.name
        } (quota ingaggio €${evaluation.loanSalary.toLocaleString('it-IT')}).`,
      };

      set({
        career: {
          ...career,
          teams,
          scoutedPlayerIds: Array.from(new Set([...career.scoutedPlayerIds, player.id])),
          news: [newsItem, ...career.news].slice(0, 40),
        },
        toast: `Prestito completato! ${player.lastName} si unisce a ${userTeam.shortName}.`,
      });

      return evaluation;
    },

    startScoutingPlayer: (playerId, playerName, originLabel) => {
      const { career } = get();
      if (!career) return;
      if (career.scoutedPlayerIds.includes(playerId)) return;
      if (career.activeScouting.some((s) => s.playerId === playerId)) {
        set({ toast: `${playerName} è già sotto osservazione.` });
        return;
      }
      if (career.activeScouting.length >= 5) {
        set({ toast: 'Puoi osservare massimo 5 giocatori contemporaneamente.' });
        return;
      }

      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      const scoutRating = userTeam?.staff?.scout_director?.rating ?? 60;
      const managerScouting = career.managerProfile?.attributes.scoutingMarket ?? 10;
      const totalDays = getScoutingDurationDays(scoutRating, managerScouting);

      set({
        career: {
          ...career,
          activeScouting: [
            ...career.activeScouting,
            {
              playerId,
              playerName,
              originLabel,
              daysRemaining: totalDays,
              totalDays,
            },
          ],
        },
        toast: `Scouting avviato per ${playerName} (${totalDays} giorni).`,
      });
    },

    advanceScoutingDays: (days) => {
      const { career } = get();
      if (!career || career.activeScouting.length === 0) return;
      const remaining: typeof career.activeScouting = [];
      const unlocked: string[] = [];

      for (const item of career.activeScouting) {
        const nextDays = item.daysRemaining - days;
        if (nextDays <= 0) {
          unlocked.push(item.playerId);
        } else {
          remaining.push({ ...item, daysRemaining: nextDays });
        }
      }

      set({
        career: {
          ...career,
          activeScouting: remaining,
          scoutedPlayerIds: Array.from(new Set([...career.scoutedPlayerIds, ...unlocked])),
        },
        toast:
          unlocked.length > 0
            ? `Report completato per ${unlocked.length} ${
                unlocked.length === 1 ? 'giocatore' : 'giocatori'
              }!`
            : `Scouting avanzato di ${days} giorni.`,
      });
    },

    respondToIncomingOffer: (offerId, accept) => {
      const { career } = get();
      if (!career) return;
      const offer = career.incomingOffers.find((o) => o.id === offerId);
      if (!offer) return;

      const remainingOffers = career.incomingOffers.filter((o) => o.id !== offerId);
      if (!accept) {
        const updatedTeamsOnReject = offer.reason
          ? career.teams.map((t) =>
              t.id !== career.userTeamId
                ? t
                : {
                    ...t,
                    roster: t.roster.map((p) =>
                      p.id === offer.playerId
                        ? { ...p, morale: Math.max(25, p.morale - 6) }
                        : p
                    ),
                  }
            )
          : career.teams;
        set({
          career: {
            ...career,
            teams: updatedTeamsOnReject,
            incomingOffers: remainingOffers,
          },
          toast: `Offerta di ${offer.fromTeamName} rifiutata.${
            offer.reason ? ` ${offer.playerName} è deluso dal mancato trasferimento.` : ''
          }`,
        });
        return;
      }

      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      const targetPlayer = userTeam?.roster.find((p) => p.id === offer.playerId);
      if (!userTeam || !targetPlayer || userTeam.roster.length <= 7) {
        set({
          career: { ...career, incomingOffers: remainingOffers },
          toast: 'Impossibile completare la cessione (roster minimo 7 giocatori).',
        });
        return;
      }

      const teams = career.teams.map((t) => {
        if (t.id === userTeam.id) {
          return applyRosterChangeChemistry(
            {
              ...t,
              budget: t.budget + offer.buyoutAmount,
              roster: t.roster.filter((p) => p.id !== targetPlayer.id),
            },
            'cut',
            targetPlayer
          );
        }
        if (t.id === offer.fromTeamId) {
          return {
            ...t,
            budget: Math.max(500000, t.budget - offer.buyoutAmount),
            roster: [
              ...t.roster,
              {
                ...targetPlayer,
                onTransferList: false,
                morale: Math.max(72, targetPlayer.morale + 18),
                rosterSlot: 'bench' as RosterSlot,
              },
            ],
          };
        }
        return t;
      });

      const newsItem = {
        id: `news_sell_${Date.now()}`,
        round: career.currentRound,
        category: 'Mercato' as const,
        title: `CESSIONE: ${offer.playerName} passa a ${offer.fromTeamName}`,
        body: `${userTeam.name} incassa €${offer.buyoutAmount.toLocaleString(
          'it-IT'
        )} dal buyout pagato da ${offer.fromTeamName}.`,
      };

      set({
        career: {
          ...career,
          teams,
          incomingOffers: remainingOffers.filter((o) => o.playerId !== targetPlayer.id),
          news: [newsItem, ...career.news].slice(0, 40),
        },
        toast: `${offer.playerName} ceduto! Incassati €${offer.buyoutAmount.toLocaleString(
          'it-IT'
        )}.`,
      });
    },

    counterIncomingOffer: (offerId, requestedAmount) => {
      const { career } = get();
      if (!career) {
        return { status: 'error', message: 'Nessuna carriera attiva.' };
      }
      const offer = career.incomingOffers.find((o) => o.id === offerId);
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      const buyerTeam = offer
        ? career.teams.find((t) => t.id === offer.fromTeamId)
        : undefined;
      const targetPlayer =
        userTeam && offer
          ? userTeam.roster.find((p) => p.id === offer.playerId)
          : undefined;

      if (!offer || !userTeam || !buyerTeam || !targetPlayer) {
        return { status: 'error', message: 'Offerta o giocatore non più disponibile.' };
      }

      if (offer.isFinalOffer) {
        return {
          status: 'error',
          message: `${offer.fromTeamName} ha già presentato la sua offerta definitiva.`,
        };
      }

      const cleanRequested = Math.round(requestedAmount / 5000) * 5000;
      if (!Number.isFinite(cleanRequested) || cleanRequested <= offer.buyoutAmount) {
        return {
          status: 'error',
          message: "Inserisci una controproposta superiore all'offerta attuale.",
        };
      }

      const res = evaluateBuyoutCounterOffer({
        offer,
        requestedAmount: cleanRequested,
        buyerTeam,
        player: targetPlayer,
      });

      if (res.status === 'withdrawn') {
        const remainingOffers = career.incomingOffers.filter((o) => o.id !== offerId);
        const updatedTeamsOnWithdraw = offer.reason
          ? career.teams.map((t) =>
              t.id !== career.userTeamId
                ? t
                : {
                    ...t,
                    roster: t.roster.map((p) =>
                      p.id === offer.playerId
                        ? { ...p, morale: Math.max(25, p.morale - 4) }
                        : p
                    ),
                  }
            )
          : career.teams;

        set({
          career: {
            ...career,
            teams: updatedTeamsOnWithdraw,
            incomingOffers: remainingOffers,
          },
          toast: res.message,
        });

        return {
          status: res.status,
          message: res.message,
        };
      }

      const nextOffers = career.incomingOffers.map((o) =>
        o.id !== offerId
          ? o
          : {
              ...o,
              initialBuyoutAmount: o.initialBuyoutAmount ?? o.buyoutAmount,
              buyoutAmount: res.newOfferAmount ?? o.buyoutAmount,
              maxWillingAmount: res.maxWillingAmount,
              negotiationRounds: res.nextRounds,
              lastClubResponse: res.message,
              isFinalOffer: res.isFinalOffer,
            }
      );

      set({
        career: {
          ...career,
          incomingOffers: nextOffers,
        },
        toast: res.message,
      });

      return {
        status: res.status,
        newOfferAmount: res.newOfferAmount,
        message: res.message,
      };
    },

    togglePlayerTransferList: (playerId) => {
      const { career } = get();
      if (!career) return;
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      const target = userTeam?.roster.find((p) => p.id === playerId);
      if (!userTeam || !target) return;

      const nextListed = !target.onTransferList;
      const updatedTeams = career.teams.map((t) =>
        t.id !== career.userTeamId
          ? t
          : {
              ...t,
              roster: t.roster.map((p) =>
                p.id === playerId ? { ...p, onTransferList: nextListed } : p
              ),
            }
      );

      let nextOffers = career.incomingOffers;
      let nextNews = career.news;
      let nextMessages = career.messages ?? [];

      if (nextListed) {
        const updatedUserTeam = updatedTeams.find((t) => t.id === career.userTeamId)!;
        const newOffers = generateOffersForTransferList(
          updatedTeams,
          updatedUserTeam,
          career.currentRound,
          career.incomingOffers,
          2
        );
        if (newOffers.length > 0) {
          nextOffers = [...newOffers, ...career.incomingOffers].slice(0, 10);
          const dateStr =
            career.currentDate ?? getRoundDate(career.seasonYear, career.currentRound);
          const offerNews = newOffers.map((off) => ({
            id: `news_tl_${off.id}`,
            round: career.currentRound,
            category: 'Mercato' as const,
            title: `OFFERTA DI MERCATO: ${off.fromTeamName} su ${off.playerName}`,
            body: `${off.fromTeamName} ha risposto alla lista trasferimenti offrendo ${off.buyoutAmount.toLocaleString(
              'it-IT'
            )} € per ${off.playerName}.`,
          }));
          const offerMsgs = newOffers.map((off) =>
            createIncomingOfferMessage({
              offer: off,
              date: dateStr,
              round: career.currentRound,
            })
          );
          nextNews = [...offerNews, ...nextNews].slice(0, 40);
          nextMessages = [...offerMsgs, ...nextMessages].slice(0, 60);
        }
      }

      set({
        career: {
          ...career,
          teams: updatedTeams,
          incomingOffers: nextOffers,
          news: nextNews,
          messages: nextMessages,
        },
        toast: nextListed
          ? `${target.lastName} messo sul mercato${
              nextOffers.length > career.incomingOffers.length
                ? ` (${nextOffers.length - career.incomingOffers.length} nuove offerte ricevute!)`
                : '.'
            }`
          : `${target.lastName} rimosso dalla lista trasferimenti.`,
      });
    },

    toggleShortlistPlayer: (playerId) => {
      const { career } = get();
      if (!career) return;
      const current = career.shortlistPlayerIds ?? [];
      const exists = current.includes(playerId);
      const next = exists
        ? current.filter((id) => id !== playerId)
        : [playerId, ...current];
      set({
        career: { ...career, shortlistPlayerIds: next },
        toast: exists
          ? 'Giocatore rimosso dalla Lista di Monitoraggio.'
          : 'Giocatore aggiunto alla Lista di Monitoraggio!',
      });
    },

    proposePlayerTrade: (
      rivalTeamId,
      offeredPlayerId,
      requestedPlayerId,
      cashAdjustment
    ) => {
      const { career } = get();
      if (!career) return { accepted: false, message: 'Nessuna carriera attiva.' };
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      const rivalTeam = career.teams.find((t) => t.id === rivalTeamId);
      const offered = userTeam?.roster.find((p) => p.id === offeredPlayerId);
      const requested = rivalTeam?.roster.find((p) => p.id === requestedPlayerId);
      if (!userTeam || !rivalTeam || !offered || !requested) {
        return { accepted: false, message: 'Giocatori o squadre non trovati.' };
      }

      const evaluation = evaluatePlayerTrade({
        userTeam,
        rivalTeam,
        offeredPlayer: offered,
        requestedPlayer: requested,
        cashAdjustment,
      });
      if (!evaluation.accepted) {
        return evaluation;
      }

      const teams = career.teams.map((t) => {
        if (t.id === userTeam.id) {
          const nextRoster = [
            ...t.roster.filter((p) => p.id !== offered.id),
            {
              ...requested,
              onTransferList: false,
              rosterSlot: offered.rosterSlot,
            },
          ];
          return {
            ...t,
            budget: Math.max(500000, t.budget - cashAdjustment),
            roster: nextRoster,
          };
        }
        if (t.id === rivalTeam.id) {
          const nextRoster = [
            ...t.roster.filter((p) => p.id !== requested.id),
            {
              ...offered,
              onTransferList: false,
              rosterSlot: requested.rosterSlot,
            },
          ];
          return {
            ...t,
            budget: Math.max(500000, t.budget + cashAdjustment),
            roster: nextRoster,
          };
        }
        return t;
      });

      const newsItem = {
        id: `news_trade_${Date.now()}`,
        round: career.currentRound,
        category: 'Mercato' as const,
        title: `SCAMBIO UFFICIALE: ${userTeam.shortName} ↔ ${rivalTeam.shortName}`,
        body: `${userTeam.name} acquisisce ${requested.firstName} ${
          requested.lastName
        } cedendo ${offered.firstName} ${offered.lastName}${
          cashAdjustment !== 0
            ? ` con conguaglio di €${Math.abs(cashAdjustment).toLocaleString('it-IT')}`
            : ''
        }.`,
      };

      set({
        career: {
          ...career,
          teams,
          scoutedPlayerIds: Array.from(
            new Set([...career.scoutedPlayerIds, requested.id])
          ),
          news: [newsItem, ...career.news].slice(0, 40),
        },
        toast: `Scambio completato! ${requested.lastName} è arrivato a ${userTeam.shortName}.`,
      });

      return evaluation;
    },

    upgradeFacility: (facility) => {
      const { career } = get();
      if (!career) return { ok: false, message: 'Nessuna carriera attiva.' };
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return { ok: false, message: 'Squadra non trovata.' };

      const curFacilities = userTeam.facilities ?? {
        arenaLevel: 1,
        youthLevel: 1,
        medicalLevel: 1,
      };
      const currentLvl = curFacilities[facility];
      if (currentLvl >= 5) {
        return { ok: false, message: 'Struttura già al livello massimo (5/5).' };
      }

      const upgradeCost = currentLvl * 180000;
      const freeCap = userTeam.budget - calculateWageBill(userTeam.roster);
      if (freeCap < upgradeCost) {
        const msg = `Budget libero insufficiente (€${upgradeCost.toLocaleString(
          'it-IT'
        )} richiesti).`;
        set({ toast: msg });
        return { ok: false, message: msg };
      }

      const nextLvl = currentLvl + 1;
      const teams = career.teams.map((t) => {
        if (t.id !== userTeam.id) return t;
        return {
          ...t,
          budget: t.budget - upgradeCost,
          arenaCapacity:
            facility === 'arenaLevel'
              ? Math.round(t.arenaCapacity * 1.12)
              : t.arenaCapacity,
          facilities: {
            ...curFacilities,
            [facility]: nextLvl,
          },
        };
      });

      const label =
        facility === 'arenaLevel'
          ? 'Palazzetto'
          : facility === 'youthLevel'
          ? 'Settore Giovanile'
          : 'Centro Medico';
      const msg = `${label} potenziato al livello ${nextLvl}/5!`;
      set({
        career: { ...career, teams },
        toast: msg,
      });
      return { ok: true, message: msg };
    },

    selectSeasonSponsor: (sponsorName, annualBonus) => {
      const { career } = get();
      if (!career) return;
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return;
      if (userTeam.facilities?.sponsorName) {
        set({ toast: 'Sponsor già selezionato per questa stagione.' });
        return;
      }

      const teams = career.teams.map((t) => {
        if (t.id !== userTeam.id) return t;
        const curFac = t.facilities ?? {
          arenaLevel: 1,
          youthLevel: 1,
          medicalLevel: 1,
        };
        return {
          ...t,
          budget: t.budget + annualBonus,
          facilities: {
            ...curFac,
            sponsorName,
            sponsorAnnualBonus: annualBonus,
          },
        };
      });

      set({
        career: { ...career, teams },
        toast: `Accordo con ${sponsorName} firmato (+€${annualBonus.toLocaleString(
          'it-IT'
        )} al budget)!`,
      });
    },
  };
}
