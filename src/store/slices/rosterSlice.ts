import { Player, RosterSlot } from '../../types';
import {
  autoAdjustRotationsForInjuries,
  autoBalanceRotationMinutes,
  autoFixRosterLineup,
  normalizeTeamRotationSlots,
} from '../../engine/ratings';
import { GameStore, StoreGet, StoreSet } from '../storeTypes';

type RosterSliceKeys =
  | 'autoFixUserRoster'
  | 'getUserTeam'
  | 'updatePlayerSlot'
  | 'updatePlayerMinutePriority'
  | 'togglePlayerMatchdaySquad'
  | 'swapRotationPlayers'
  | 'assignPlayerToStarterSlot'
  | 'moveBenchPlayerOrder'
  | 'updatePlayerTargetMinutes'
  | 'autoBalanceMinutes'
  | 'autoAdjustForInjuries'
  | 'zeroAllMinutes'
  | 'callUpYouthItalianPlayer'
  | 'promoteYouthPlayer'
  | 'demoteToYouthRoster'
  | 'setUserLbaRosterFormat';

export function createRosterSlice(
  set: StoreSet,
  get: StoreGet
): Pick<GameStore, RosterSliceKeys> {
  return {
    autoFixUserRoster: () => {
      const { career } = get();
      if (!career) return;
      const updatedTeams = career.teams.map((t) =>
        t.id === career.userTeamId
          ? {
              ...t,
              roster: autoBalanceRotationMinutes(
                autoFixRosterLineup(t.roster, t.leagueId, t.lbaRosterFormat ?? '6+6')
              ),
            }
          : t
      );
      set({
        career: { ...career, teams: updatedTeams },
        toast: 'Referto e quintetto adattati automaticamente.',
      });
    },

    getUserTeam: () => {
      const { career } = get();
      if (!career) return undefined;
      return career.teams.find((t) => t.id === career.userTeamId);
    },

    updatePlayerSlot: (playerId, slot) => {
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        const updated = t.roster.map((p) =>
          p.id === playerId ? { ...p, rosterSlot: slot } : p
        );
        return {
          ...t,
          roster: normalizeTeamRotationSlots(updated),
        };
      });
      set({ career: { ...career, teams } });
    },

    updatePlayerMinutePriority: (playerId, priority) => {
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        return {
          ...t,
          roster: t.roster.map((p) =>
            p.id === playerId ? { ...p, minutePriority: priority } : p
          ),
        };
      });
      set({ career: { ...career, teams } });
    },

    togglePlayerMatchdaySquad: (playerId) => {
      const { career } = get();
      if (!career) return { ok: false, message: 'Nessuna carriera attiva.' };
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return { ok: false, message: 'Squadra non trovata.' };
      const target = userTeam.roster.find((p) => p.id === playerId);
      if (!target) return { ok: false, message: 'Giocatore non trovato.' };

      const active = userTeam.roster.filter((p) => p.rosterSlot !== 'reserve');
      const startersCount = userTeam.roster.filter((p) => p.rosterSlot === 'starter').length;
      const isCurrentlyActive = target.rosterSlot !== 'reserve';

      if (!isCurrentlyActive && active.length >= 12) {
        return {
          ok: false,
          message: 'Massimo 12 giocatori possono essere selezionati A Referto.',
        };
      }

      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        let updatedRoster = t.roster.map((p) => {
          if (p.id !== playerId) return p;
          if (isCurrentlyActive) {
            return { ...p, rosterSlot: 'reserve' as RosterSlot, targetMinutes: 0 };
          }
          const nextSlot: RosterSlot = startersCount < 5 ? 'starter' : 'bench';
          return {
            ...p,
            rosterSlot: nextSlot,
            benchOrder: nextSlot === 'bench' ? 6 : undefined,
          };
        });

        const benchList = updatedRoster
          .filter((p) => p.rosterSlot === 'bench')
          .sort(
            (a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99) || b.overall - a.overall
          );
        const orderMap = new Map(benchList.map((p, i) => [p.id, i]));
        updatedRoster = updatedRoster.map((p) =>
          p.rosterSlot === 'bench' ? { ...p, benchOrder: orderMap.get(p.id) ?? 0 } : p
        );

        return { ...t, roster: updatedRoster };
      });

      set({ career: { ...career, teams } });
      return { ok: true };
    },

    swapRotationPlayers: (playerIdA, playerIdB) => {
      if (playerIdA === playerIdB) return;
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        const normalized = normalizeTeamRotationSlots(t.roster);
        const pA = normalized.find((p) => p.id === playerIdA);
        const pB = normalized.find((p) => p.id === playerIdB);
        if (!pA || !pB) return t;
        const involvesReserve = pA.rosterSlot === 'reserve' || pB.rosterSlot === 'reserve';
        const updated = normalized.map((p) => {
          if (p.id === playerIdA) {
            return {
              ...p,
              rosterSlot: pB.rosterSlot,
              starterSlot: pB.starterSlot,
              benchOrder: pB.benchOrder,
              targetMinutes: involvesReserve
                ? pB.rosterSlot === 'reserve'
                  ? 0
                  : pB.targetMinutes ?? p.targetMinutes
                : p.targetMinutes,
            };
          }
          if (p.id === playerIdB) {
            return {
              ...p,
              rosterSlot: pA.rosterSlot,
              starterSlot: pA.starterSlot,
              benchOrder: pA.benchOrder,
              targetMinutes: involvesReserve
                ? pA.rosterSlot === 'reserve'
                  ? 0
                  : pA.targetMinutes ?? p.targetMinutes
                : p.targetMinutes,
            };
          }
          return p;
        });
        return {
          ...t,
          roster: normalizeTeamRotationSlots(updated),
        };
      });
      set({ career: { ...career, teams } });
    },

    assignPlayerToStarterSlot: (playerId, pos) => {
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        const normalized = normalizeTeamRotationSlots(t.roster);
        const target = normalized.find((p) => p.id === playerId);
        if (!target) return t;
        const occupant = normalized.find(
          (p) => p.rosterSlot === 'starter' && p.starterSlot === pos
        );
        if (occupant && occupant.id === target.id) return t;

        let updated: Player[];
        if (occupant) {
          const targetWasReserve = target.rosterSlot === 'reserve';
          updated = normalized.map((p) => {
            if (p.id === target.id) {
              return {
                ...p,
                rosterSlot: 'starter' as RosterSlot,
                starterSlot: pos,
                benchOrder: undefined,
                targetMinutes: targetWasReserve
                  ? occupant.targetMinutes ?? 24
                  : p.targetMinutes,
              };
            }
            if (p.id === occupant.id) {
              return {
                ...p,
                rosterSlot: target.rosterSlot,
                starterSlot:
                  target.rosterSlot === 'starter' ? target.starterSlot : undefined,
                benchOrder: target.benchOrder,
                targetMinutes: targetWasReserve ? 0 : p.targetMinutes,
              };
            }
            return p;
          });
        } else {
          const startersCount = normalized.filter((p) => p.rosterSlot === 'starter').length;
          if (target.rosterSlot !== 'starter' && startersCount >= 5) return t;
          updated = normalized.map((p) => {
            if (p.id !== target.id) return p;
            return {
              ...p,
              rosterSlot: 'starter' as RosterSlot,
              starterSlot: pos,
              benchOrder: undefined,
              targetMinutes:
                target.rosterSlot === 'reserve' && (p.targetMinutes ?? 0) === 0
                  ? 24
                  : p.targetMinutes,
            };
          });
        }

        return {
          ...t,
          roster: normalizeTeamRotationSlots(updated),
        };
      });
      set({ career: { ...career, teams } });
    },

    moveBenchPlayerOrder: (playerId, direction) => {
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        const bench = t.roster
          .filter((p) => p.rosterSlot === 'bench')
          .sort(
            (a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99) || b.overall - a.overall
          );
        const idx = bench.findIndex((p) => p.id === playerId);
        if (idx === -1) return t;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= bench.length) return t;

        const reordered = [...bench];
        const [item] = reordered.splice(idx, 1);
        reordered.splice(swapIdx, 0, item);
        const orderMap = new Map(reordered.map((p, i) => [p.id, i]));

        return {
          ...t,
          roster: t.roster.map((p) =>
            p.rosterSlot === 'bench' ? { ...p, benchOrder: orderMap.get(p.id) ?? 0 } : p
          ),
        };
      });
      set({ career: { ...career, teams } });
    },

    updatePlayerTargetMinutes: (playerId, minutes) => {
      const { career } = get();
      if (!career) return;
      const clamped = Math.max(0, Math.min(40, Math.round(minutes)));
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        return {
          ...t,
          roster: t.roster.map((p) =>
            p.id === playerId ? { ...p, targetMinutes: clamped } : p
          ),
        };
      });
      set({ career: { ...career, teams } });
    },

    autoBalanceMinutes: () => {
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) =>
        t.id === career.userTeamId
          ? { ...t, roster: autoBalanceRotationMinutes(t.roster) }
          : t
      );
      set({
        career: { ...career, teams },
        toast: 'Minuti bilanciati automaticamente (200/200).',
      });
    },

    autoAdjustForInjuries: () => {
      const { career } = get();
      if (!career) return;
      let changed = false;
      let replaced: string[] = [];
      const teams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;
        const res = autoAdjustRotationsForInjuries(
          t.roster,
          t.leagueId,
          t.lbaRosterFormat ?? '6+6'
        );
        changed = res.changed;
        replaced = res.replacedNames;
        return { ...t, roster: res.roster };
      });
      set({
        career: { ...career, teams },
        toast: changed
          ? `Rotazioni adattate per infortuni (${replaced.join(', ') || 'quintetto aggiornato'}).`
          : 'Nessun giocatore infortunato nelle rotazioni attive.',
      });
    },

    zeroAllMinutes: () => {
      const { career } = get();
      if (!career) return;
      const teams = career.teams.map((t) =>
        t.id === career.userTeamId
          ? { ...t, roster: t.roster.map((p) => ({ ...p, targetMinutes: 0 })) }
          : t
      );
      set({ career: { ...career, teams }, toast: 'Minutaggi azzerati.' });
    },

    callUpYouthItalianPlayer: () => {
      const { career } = get();
      if (!career) return;
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return;

      const firstNames = [
        'Matteo',
        'Lorenzo',
        'Tommaso',
        'Riccardo',
        'Gabriele',
        'Samuele',
        'Filippo',
      ];
      const lastNames = [
        'Moretti',
        'Conti',
        'Rinaldi',
        'Ferrari',
        'Esposito',
        'Galli',
        'Lombardi',
      ];
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
      const pos = positions[Math.floor(Math.random() * positions.length)];
      const activeCount = userTeam.roster.filter((p) => p.rosterSlot !== 'reserve').length;

      const youthPlayer: Player = {
        id: `u19_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        firstName: fn,
        lastName: ln,
        jerseyNumber: 70 + Math.floor(Math.random() * 29),
        age: 18,
        birthDate: `12/03/${career.seasonYear - 18}`,
        heightCm:
          pos === 'C'
            ? 207
            : pos === 'PF'
            ? 202
            : pos === 'SF'
            ? 197
            : pos === 'SG'
            ? 191
            : 185,
        weightKg:
          pos === 'C'
            ? 104
            : pos === 'PF'
            ? 98
            : pos === 'SF'
            ? 91
            : pos === 'SG'
            ? 84
            : 78,
        nationality: 'ITA',
        isItalianFormation: true,
        primaryPosition: pos,
        secondaryPosition: null,
        salary: 20000,
        contractYears: 1,
        condition: 96,
        morale: 85,
        personality: 'Giovane ambizioso',
        injuryProneness: 20,
        promisedRole: 'Giocatore di rotazione',
        buyoutClause: 15000,
        injuryWeeks: 0,
        attributes: {
          twoPoint: 58,
          threePoint: 56,
          freeThrow: 68,
          passing: 56,
          ballHandling: 58,
          finishing: 57,
          perimeterDef: 59,
          postDef: 55,
          steals: 56,
          blocks: 52,
          athleticism: 66,
          rebounding: 56,
          stamina: 74,
          basketballIQ: 58,
        },
        overall: 57,
        rosterSlot: activeCount < 12 ? 'bench' : 'reserve',
        minutePriority: 'Bassa',
        targetMinutes: 0,
        benchOrder: activeCount < 12 ? 6 : undefined,
        seasonStats: {
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
        gameLog: [],
        careerHistory: [],
      };

      const teams = career.teams.map((t) =>
        t.id === career.userTeamId ? { ...t, roster: [...t.roster, youthPlayer] } : t
      );

      set({
        career: { ...career, teams },
        toast: `Aggregato dalle giovanili U19: ${fn} ${ln} (${pos}, ITA).`,
      });
    },

    promoteYouthPlayer: (playerId) => {
      const { career } = get();
      if (!career) return;
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return;
      const youthList = userTeam.youthRoster ?? [];
      const target = youthList.find((p) => p.id === playerId);
      if (!target) return;

      const activeCount = userTeam.roster.filter((p) => p.rosterSlot !== 'reserve').length;
      const promoted: Player = {
        ...target,
        rosterSlot: activeCount < 12 ? 'bench' : 'reserve',
        benchOrder: activeCount < 12 ? 6 : undefined,
        targetMinutes: 0,
      };

      const teams = career.teams.map((t) =>
        t.id === career.userTeamId
          ? {
              ...t,
              roster: [...t.roster, promoted],
              youthRoster: (t.youthRoster ?? []).filter((p) => p.id !== playerId),
            }
          : t
      );

      set({
        career: { ...career, teams },
        toast: `${target.firstName} ${target.lastName} (${target.primaryPosition}, ITA) convocato in Prima Squadra!`,
      });
    },

    demoteToYouthRoster: (playerId) => {
      const { career } = get();
      if (!career) return;
      const userTeam = career.teams.find((t) => t.id === career.userTeamId);
      if (!userTeam) return;
      if (userTeam.roster.length <= 10) {
        set({ toast: 'Devi mantenere almeno 10 giocatori in Prima Squadra.' });
        return;
      }
      const target = userTeam.roster.find((p) => p.id === playerId);
      if (!target) return;

      const demoted: Player = {
        ...target,
        rosterSlot: 'reserve',
        benchOrder: undefined,
        targetMinutes: 0,
      };

      const teams = career.teams.map((t) =>
        t.id === career.userTeamId
          ? {
              ...t,
              roster: t.roster.filter((p) => p.id !== playerId),
              youthRoster: [...(t.youthRoster ?? []), demoted],
            }
          : t
      );

      set({
        career: { ...career, teams },
        toast: `${target.firstName} ${target.lastName} rientra nel Settore Giovanile U19.`,
      });
    },

    setUserLbaRosterFormat: (format) => {
      const { career } = get();
      if (!career) return;
      const maxForeign = format === '5+5' ? 5 : 6;
      const maxActive = format === '5+5' ? 10 : 12;

      const updatedTeams = career.teams.map((t) => {
        if (t.id !== career.userTeamId) return t;

        let foreignUsed = 0;
        let activeUsed = 0;
        const ordered = [...t.roster].sort((a, b) => {
          const order = { starter: 0, bench: 1, reserve: 2 };
          if (order[a.rosterSlot] !== order[b.rosterSlot]) {
            return order[a.rosterSlot] - order[b.rosterSlot];
          }
          return b.overall - a.overall;
        });

        const slotMap = new Map<string, RosterSlot>();
        for (const p of ordered) {
          if (p.injuryWeeks > 0) {
            slotMap.set(p.id, 'reserve');
            continue;
          }
          if (
            activeUsed < maxActive &&
            (p.isItalianFormation || foreignUsed < maxForeign)
          ) {
            slotMap.set(p.id, activeUsed < 5 ? 'starter' : 'bench');
            activeUsed++;
            if (!p.isItalianFormation) foreignUsed++;
          } else {
            slotMap.set(p.id, 'reserve');
          }
        }

        return {
          ...t,
          lbaRosterFormat: format,
          roster: t.roster.map((p) => ({
            ...p,
            rosterSlot: slotMap.get(p.id) ?? p.rosterSlot,
          })),
        };
      });

      set({ career: { ...career, teams: updatedTeams } });
    },
  };
}
