import { Team } from '../../types';
import { getRoundDate } from '../../engine/calendarUtils';
import { computeAssistantTactics } from '../../engine/assistantCoachTactics';
import { createIndividualTrainingProgram } from '../../engine/trainingProgramEngine';
import {
  appendChatBubbles,
  getChatChannelKey,
  getChatCooldownRemaining,
  resolveChatInteraction,
} from '../../engine/interactionChatEngine';
import { computeStandings } from '../../engine/seasonEngine';
import { GameStore, StoreGet, StoreSet } from '../storeTypes';

type TacticsAndTrainingSliceKeys =
  | 'updateTactics'
  | 'applyAssistantTacticsNow'
  | 'setDelegateTacticsToAssistant'
  | 'updateTrainingPlan'
  | 'updatePlayerIndividualFocus'
  | 'startPlayerTrainingProgram'
  | 'cancelPlayerTrainingProgram'
  | 'openChatModal'
  | 'closeChatModal'
  | 'sendChatInteraction'
  | 'hireStaffMember'
  | 'fireStaffMember';

export function createTacticsAndTrainingSlice(
  set: StoreSet,
  get: StoreGet
): Pick<GameStore, TacticsAndTrainingSliceKeys> {
  return {
    updateTactics: (patch) => {
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        return { ...t, tactics: { ...t.tactics, ...patch } };
      });
      set({ career: { ...career, teams } });
    },

    applyAssistantTacticsNow: () => {
      const { career } = get();
      if (!career) return;
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return;

      let opponentTeam: Team | undefined;
      if (career.phase === 'playoffs') {
        const series = career.playoffs.find(
          (s) =>
            !s.winnerId &&
            (s.higherSeedId === userTeam.id || s.lowerSeedId === userTeam.id)
        );
        if (series) {
          const oppId =
            series.higherSeedId === userTeam.id
              ? series.lowerSeedId
              : series.higherSeedId;
          opponentTeam = career.teams.find((t) => t.id === oppId);
        }
      } else {
        const nextGame = career.schedule.find(
          (g) =>
            !g.played &&
            g.round >= career.currentRound &&
            (g.homeTeamId === userTeam.id || g.awayTeamId === userTeam.id)
        );
        if (nextGame) {
          const oppId =
            nextGame.homeTeamId === userTeam.id
              ? nextGame.awayTeamId
              : nextGame.homeTeamId;
          opponentTeam = career.teams.find((t) => t.id === oppId);
        }
      }

      const { tactics, summary } = computeAssistantTactics(userTeam, opponentTeam);
      const teams = career.teams.map((t) =>
        t.id === career.userTeamId ? { ...t, tactics } : t
      );
      set({
        career: { ...career, teams },
        toast: summary,
      });
    },

    setDelegateTacticsToAssistant: (enabled) => {
      const { career } = get();
      if (!career) return;
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return;

      if (!enabled) {
        const teams = career.teams.map((t) =>
          t.id === career.userTeamId
            ? { ...t, tactics: { ...t.tactics, delegateToAssistant: false } }
            : t
        );
        set({
          career: { ...career, teams },
          toast: 'Delega tattica disattivata: controlli tu la lavagna.',
        });
        return;
      }

      const nextGame = career.schedule.find(
        (g) =>
          !g.played &&
          g.round >= career.currentRound &&
          (g.homeTeamId === userTeam.id || g.awayTeamId === userTeam.id)
      );
      const oppId = nextGame
        ? nextGame.homeTeamId === userTeam.id
          ? nextGame.awayTeamId
          : nextGame.homeTeamId
        : undefined;
      const oppTeam = oppId ? career.teams.find((t) => t.id === oppId) : undefined;
      const { tactics, summary } = computeAssistantTactics(userTeam, oppTeam);
      const teams = career.teams.map((t) =>
        t.id === career.userTeamId
          ? { ...t, tactics: { ...tactics, delegateToAssistant: true } }
          : t
      );
      set({
        career: { ...career, teams },
        toast: `Delega al Vice Allenatore attiva. ${summary}`,
      });
    },

    updateTrainingPlan: (patch) => {
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        return { ...t, training: { ...t.training, ...patch } };
      });
      set({ career: { ...career, teams } });
    },

    updatePlayerIndividualFocus: (playerId, focus) => {
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        return {
          ...t,
          roster: t.roster.map((p) =>
            p.id === playerId ? { ...p, individualFocus: focus } : p
          ),
        };
      });
      set({ career: { ...career, teams } });
    },

    startPlayerTrainingProgram: ({
      playerId,
      focus,
      intensity,
      duration,
      targetPosition,
    }) => {
      const { career } = get();
      if (!career) {
        return { ok: false, message: 'Nessuna carriera attiva.' };
      }
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      const player = userTeam?.roster.find((p) => p.id === playerId);
      if (!userTeam || !player) {
        return { ok: false, message: 'Giocatore non trovato.' };
      }

      const startDate =
        career.currentDate ?? getRoundDate(career.seasonYear, career.currentRound);
      const created = createIndividualTrainingProgram(player, {
        focus,
        intensity,
        duration,
        startDate,
        targetPosition,
      });
      if (!created.ok || !created.program) {
        set({ toast: created.message });
        return { ok: false, message: created.message };
      }

      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        return {
          ...t,
          roster: t.roster.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  individualFocus: focus,
                  trainingProgram: created.program,
                }
              : p
          ),
        };
      });

      set({
        career: { ...career, teams },
        toast: `${player.firstName[0]}. ${player.lastName}: ${created.message}`,
      });
      return { ok: true, message: created.message };
    },

    cancelPlayerTrainingProgram: (playerId) => {
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        return {
          ...t,
          roster: t.roster.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  individualFocus: 'Nessuno' as const,
                  trainingProgram: null,
                }
              : p
          ),
        };
      });
      set({
        career: { ...career, teams },
        toast: 'Programma di allenamento individuale annullato.',
      });
    },

    openChatModal: (target) => set({ activeChatModal: target }),

    closeChatModal: () => set({ activeChatModal: null }),

    sendChatInteraction: ({ channel, playerId, topicId, tone }) => {
      const { career } = get();
      if (!career) {
        return { ok: false, message: 'Nessuna carriera attiva.' };
      }
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) {
        return { ok: false, message: 'Squadra non trovata.' };
      }

      const currentDate =
        career.currentDate ?? getRoundDate(career.seasonYear, career.currentRound);
      const cooldown = getChatCooldownRemaining(
        career.chatHistory,
        channel,
        currentDate,
        playerId
      );
      if (cooldown > 0) {
        const msg = `Colloquio in cooldown: attendi ancora ${cooldown} giorn${
          cooldown === 1 ? 'o' : 'i'
        }.`;
        set({ toast: msg });
        return { ok: false, message: msg };
      }

      const targetPlayer =
        channel === 'player'
          ? userTeam.roster.find((p) => p.id === playerId)
          : undefined;
      if (channel === 'player' && !targetPlayer) {
        return { ok: false, message: 'Seleziona un giocatore del roster.' };
      }

      const leagueId = userTeam.leagueId ?? 'ITA_LBA';
      const standings = computeStandings(
        career.teams.filter((t) => (t.leagueId ?? 'ITA_LBA') === leagueId),
        career.schedule.filter((g) => (g.leagueId ?? 'ITA_LBA') === leagueId)
      );
      const userRank = Math.max(
        1,
        standings.findIndex((s) => s.teamId === userTeam.id) + 1
      );

      const outcome = resolveChatInteraction({
        career,
        userTeam,
        channel,
        topicId,
        tone,
        currentDate,
        player: targetPlayer,
        userRank,
      });

      const teams = career.teams.map((t) => {
        if (t.id !== userTeam.id) return t;
        return {
          ...t,
          chemistry: Math.max(15, Math.min(100, t.chemistry + outcome.chemistryDelta)),
          budget: Math.max(100000, t.budget + outcome.budgetDelta),
          roster: t.roster.map((p) => {
            const isTarget = targetPlayer && p.id === targetPlayer.id;
            const delta =
              (isTarget ? outcome.playerMoraleDelta : 0) + outcome.teamMoraleDelta;
            if (delta === 0) return p;
            return {
              ...p,
              morale: Math.max(15, Math.min(99, p.morale + delta)),
            };
          }),
        };
      });

      const nextConfidence = Math.max(
        5,
        Math.min(100, (career.boardConfidence ?? 75) + outcome.confidenceDelta)
      );
      const nextManagerProfile = career.managerProfile
        ? {
            ...career.managerProfile,
            reputation: Math.max(
              10,
              Math.min(99, career.managerProfile.reputation + outcome.reputationDelta)
            ),
          }
        : undefined;

      const channelKey = getChatChannelKey(channel, playerId);
      const nextThread = appendChatBubbles(
        career.chatHistory?.[channelKey],
        channelKey,
        currentDate,
        career.managerName,
        outcome
      );

      const nextNews = outcome.newsItem
        ? [outcome.newsItem, ...career.news].slice(0, 40)
        : career.news;

      set({
        career: {
          ...career,
          teams,
          boardConfidence: nextConfidence,
          managerProfile: nextManagerProfile,
          news: nextNews,
          chatHistory: {
            ...(career.chatHistory ?? {}),
            [channelKey]: nextThread,
          },
        },
        toast:
          outcome.effects.length > 0
            ? `Colloquio concluso: ${outcome.effects.join(' • ')}`
            : 'Colloquio completato.',
      });

      return { ok: true, message: outcome.npcLine, effects: outcome.effects };
    },

    hireStaffMember: (staffId) => {
      const { career } = get();
      if (!career) return;
      const candidate = career.staffMarket.find((s) => s.id === staffId);
      if (!candidate) return;
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return;

      const currentHolder = userTeam.staff[candidate.role];
      const nextMarket = career.staffMarket.filter((s) => s.id !== staffId);
      if (currentHolder) {
        nextMarket.push(currentHolder);
      }

      const teams = career.teams.map((t) =>
        t.id === userTeam.id
          ? { ...t, staff: { ...t.staff, [candidate.role]: candidate } }
          : t
      );

      set({
        career: {
          ...career,
          teams,
          staffMarket: nextMarket.sort((a, b) => b.rating - a.rating),
        },
        toast: `${candidate.firstName} ${candidate.lastName} assunto nello staff tecnico!`,
      });
    },

    fireStaffMember: (role) => {
      const { career } = get();
      if (!career) return;
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return;
      const current = userTeam.staff[role];
      if (!current) return;

      const teams = career.teams.map((t) =>
        t.id === userTeam.id ? { ...t, staff: { ...t.staff, [role]: null } } : t
      );

      set({
        career: {
          ...career,
          teams,
          staffMarket: [current, ...career.staffMarket].sort(
            (a, b) => b.rating - a.rating
          ),
        },
        toast: `${current.firstName} ${current.lastName} sollevato dall'incarico.`,
      });
    },
  };
}
