import { createPlayer } from '../data/generator';
import { getLeagueConfig } from '../data/teams';
import {
  LbaRosterFormat,
  LeagueId,
  NewsItem,
  Player,
  Position,
  Team,
  TransferOffer,
} from '../types';
import {
  autoBalanceRotationMinutes,
  autoFixRosterLineup,
  calculateWageBill,
  formatEuro,
  getForeignLimitForLeague,
  validateRoster6Plus6,
} from './ratings';
import { getPlayerBuyoutClause } from './scoutingEngine';

const ALL_POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export function getLeagueRegulationNotice(leagueId: LeagueId): string {
  if (leagueId === 'ITA_LBA') {
    return 'Regolamento Serie A LBA: puoi schierare 6+6 (max 6 stranieri, min 6 ITA) oppure 5+5 (5 ITA + 5 USA). Adatta il roster ai nuovi limiti!';
  }
  if (leagueId === 'ITA_A2') {
    return 'Regolamento Serie A2: massimo 2 stranieri a referto (minimo 5 ITA, 7–12 giocatori a referto). Verifica gli stranieri in rosa!';
  }
  return 'Regolamento Serie B: massimo 1 straniero a referto (minimo 6 ITA, 7–12 giocatori a referto). Adegua il roster al regolamento!';
}

function getLeagueRosterProfile(leagueId: LeagueId, lbaFormat: LbaRosterFormat) {
  const leagueCfg = getLeagueConfig(leagueId);
  const limits = getForeignLimitForLeague(leagueId, lbaFormat);
  const salaryScale =
    leagueId === 'ITA_LBA'
      ? 0.85
      : leagueId === 'ITA_A2'
      ? 0.3
      : leagueId === 'ITA_B_INT'
      ? 0.07
      : 0.13;
  const minClubIta =
    leagueId === 'ITA_LBA'
      ? limits.minIta
      : Math.max(limits.minIta, 12 - limits.maxForeign);
  const minSalaryFloor =
    leagueId === 'ITA_LBA' ? 40000 : leagueId === 'ITA_A2' ? 14000 : 3500;

  return {
    ...limits,
    leagueCfg,
    salaryScale,
    minClubIta,
    minSalaryFloor,
    targetRosterSize: 12,
  };
}

function pickMostNeededPosition(roster: Player[]): Position {
  const counts = new Map<Position, number>(ALL_POSITIONS.map((pos) => [pos, 0]));
  for (const p of roster) {
    if (p.injuryWeeks === 0) {
      counts.set(p.primaryPosition, (counts.get(p.primaryPosition) ?? 0) + 1);
    }
  }
  return [...ALL_POSITIONS].sort(
    (a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0)
  )[0];
}

function createEmergencyLeagueItalian(
  leagueId: LeagueId,
  lbaFormat: LbaRosterFormat,
  position: Position,
  budget: number
): Player {
  const profile = getLeagueRosterProfile(leagueId, lbaFormat);
  const tier = Math.max(45, Math.min(75, profile.leagueCfg.avgOverall - 3));
  const player = createPlayer({
    position,
    tier,
    isItalian: true,
    nationality: 'ITA',
    isItalianFormation: true,
    rosterSlot: 'bench',
    minutePriority: 'Media',
    salaryScale: profile.salaryScale,
    contractYears: 1,
  });
  const affordableSalary = Math.max(
    profile.minSalaryFloor,
    Math.min(player.salary, Math.round((budget * 0.06) / 500) * 500)
  );
  return {
    ...player,
    salary: affordableSalary,
    buyoutClause: Math.round(affordableSalary * 0.65),
  };
}

function findBestItalianReplacement(
  pool: Player[],
  neededPos: Position,
  leagueId: LeagueId,
  freeCap: number
): number {
  const leagueCfg = getLeagueConfig(leagueId);
  const maxAllowedOvr = leagueCfg.avgOverall + 8;
  const minPreferredOvr = Math.max(40, leagueCfg.avgOverall - 12);

  let bestIdx = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < pool.length; i++) {
    const fa = pool[i];
    if (!fa.isItalianFormation || fa.injuryWeeks > 0) continue;

    let score = fa.overall;
    if (fa.primaryPosition === neededPos || fa.secondaryPosition === neededPos) {
      score += 6;
    }
    if (fa.overall > maxAllowedOvr) score -= (fa.overall - maxAllowedOvr) * 2;
    if (fa.overall < minPreferredOvr) score -= (minPreferredOvr - fa.overall) * 1.5;
    if (fa.salary <= Math.max(freeCap, 0)) {
      score += 12;
    } else {
      score -= Math.min(25, (fa.salary - Math.max(0, freeCap)) / 10000);
    }

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}

function releaseWeakestForeigners(
  roster: Player[],
  allowedForeign: number
): { roster: Player[]; released: Player[] } {
  const foreignPlayers = roster
    .filter((p) => !p.isItalianFormation)
    .sort((a, b) => b.overall - a.overall);
  if (foreignPlayers.length <= allowedForeign) {
    return { roster, released: [] };
  }
  const keepForeignIds = new Set(
    foreignPlayers.slice(0, allowedForeign).map((p) => p.id)
  );
  const released: Player[] = [];
  const nextRoster = roster.filter((p) => {
    if (!p.isItalianFormation && !keepForeignIds.has(p.id)) {
      released.push({ ...p, rosterSlot: 'reserve', targetMinutes: 0, benchOrder: undefined });
      return false;
    }
    return true;
  });
  return { roster: nextRoster, released };
}

function findWeakestReplaceablePlayer(
  roster: Player[],
  minIta: number,
  excludeForeign: boolean
): Player | undefined {
  const curIta = roster.filter((p) => p.isItalianFormation).length;
  const candidates = roster.filter((p) => {
    if (p.loanedFromTeamId) return false;
    if (p.isItalianFormation && curIta <= minIta) return false;
    if (!p.isItalianFormation && excludeForeign) return false;
    return true;
  });
  return candidates.sort((a, b) => a.overall - b.overall)[0];
}

function ensureCpuTeamLeagueCompliance(
  team: Team,
  pool: Player[],
  strictForeignCap: boolean
): { team: Team; addedCount: number; releasedCount: number } {
  const leagueId: LeagueId = team.leagueId ?? 'ITA_LBA';
  const lbaFormat: LbaRosterFormat =
    leagueId === 'ITA_LBA' ? (team.lbaRosterFormat ?? '6+6') : '6+6';
  const profile = getLeagueRosterProfile(leagueId, lbaFormat);

  let roster = [...team.roster];
  let youthRoster = [...(team.youthRoster ?? [])];
  let releasedCount = 0;
  let addedCount = 0;

  // 1. Taglia eventuali stranieri oltre il limite consentito (retrocesse / leghe inferiori: limite stretto <= maxForeign)
  const allowedClubForeign =
    strictForeignCap || leagueId !== 'ITA_LBA'
      ? profile.maxForeign
      : profile.maxForeign + 1;
  const foreignTrim = releaseWeakestForeigners(roster, allowedClubForeign);
  if (foreignTrim.released.length > 0) {
    roster = foreignTrim.roster;
    pool.push(...foreignTrim.released);
    releasedCount += foreignTrim.released.length;
  }

  // 2. Assicura almeno minIta italiani sani e almeno 10 giocatori sani a referto
  const minHealthyTotal = Math.max(profile.minActive, 10);
  let guard = 0;
  while (guard < 10) {
    guard += 1;
    const healthyPlayers = roster.filter((p) => p.injuryWeeks === 0);
    const healthyIta = healthyPlayers.filter((p) => p.isItalianFormation).length;
    const missingIta = healthyIta < profile.minIta;
    const missingTotal = healthyPlayers.length < minHealthyTotal;

    const preview = autoFixRosterLineup(roster, leagueId, lbaFormat);
    const validation = validateRoster6Plus6(preview, leagueId, lbaFormat);

    if (!missingIta && !missingTotal && validation.valid) {
      break;
    }

    const freeCap = team.budget - calculateWageBill(roster);
    const neededPos = pickMostNeededPosition(roster);

    const faIdx = findBestItalianReplacement(pool, neededPos, leagueId, freeCap);
    if (faIdx !== -1) {
      const candidate = pool.splice(faIdx, 1)[0];
      const cappedSalary =
        freeCap >= candidate.salary
          ? candidate.salary
          : Math.max(
              profile.minSalaryFloor,
              Math.min(
                candidate.salary,
                Math.round(Math.max(freeCap, team.budget * 0.06) / 500) * 500
              )
            );
      roster.push({
        ...candidate,
        salary: cappedSalary,
        contractYears: 1,
        buyoutClause: Math.round(cappedSalary * 0.65),
        rosterSlot: 'bench',
        promisedRole: 'Giocatore di rotazione',
      });
      addedCount += 1;
      continue;
    }

    const youthItaIdx = youthRoster.findIndex(
      (yp) => yp.isItalianFormation && yp.injuryWeeks === 0
    );
    if (youthItaIdx !== -1) {
      const promotedYouth = youthRoster.splice(youthItaIdx, 1)[0];
      roster.push({
        ...promotedYouth,
        rosterSlot: 'bench',
        contractYears: 2,
        promisedRole: 'Giocatore di rotazione',
      });
      addedCount += 1;
      continue;
    }

    const emergencyIta = createEmergencyLeagueItalian(
      leagueId,
      lbaFormat,
      neededPos,
      team.budget
    );
    roster.push(emergencyIta);
    addedCount += 1;
  }

  const normalizedRoster = autoBalanceRotationMinutes(
    autoFixRosterLineup(roster, leagueId, lbaFormat)
  );

  return {
    team: {
      ...team,
      roster: normalizedRoster,
      youthRoster,
    },
    addedCount,
    releasedCount,
  };
}

/**
 * Mercato estivo della CPU al passaggio di stagione:
 * - rinnova i giocatori chiave e svincola gli stranieri in eccesso per chi retrocede
 * - ricostruisce la rosa nel nuovo budget per promosse e retrocesse rispettando i regolamenti
 */
export function runCpuSummerMarket(params: {
  teams: Team[];
  freeAgents: Player[];
  userTeamId: string;
  promotedIds: Set<string>;
  relegatedIds: Set<string>;
  seasonYear: number;
}): { teams: Team[]; freeAgents: Player[]; news: NewsItem[] } {
  const { userTeamId, promotedIds, relegatedIds, seasonYear } = params;
  const pool = [...params.freeAgents].sort((a, b) => b.overall - a.overall);
  const news: NewsItem[] = [];
  const headlineMoves: string[] = [];

  // 1. Adeguamento regolamenti, tagli retrocesse/promosse e rinnovi CPU
  const adjustedTeams = params.teams.map((team) => {
    if (team.id === userTeamId) return team;

    const leagueId: LeagueId = team.leagueId ?? 'ITA_LBA';
    const lbaFormat: LbaRosterFormat =
      leagueId === 'ITA_LBA' ? (team.lbaRosterFormat ?? '6+6') : '6+6';
    const profile = getLeagueRosterProfile(leagueId, lbaFormat);
    const isRelegated = relegatedIds.has(team.id);
    const isPromoted = promotedIds.has(team.id);

    let roster = [...team.roster];

    // 1a. Se retrocessa o categoria con tetto stranieri stretto, libera gli stranieri oltre maxForeign
    const allowedForeignPhase1 =
      isRelegated || leagueId !== 'ITA_LBA' ? profile.maxForeign : profile.maxForeign + 1;
    const foreignTrim = releaseWeakestForeigners(roster, allowedForeignPhase1);
    if (foreignTrim.released.length > 0) {
      roster = foreignTrim.roster;
      pool.push(...foreignTrim.released);
      if (isRelegated) {
        headlineMoves.push(
          `${team.shortName} (retrocessa) libera ${foreignTrim.released.length} stranier${
            foreignTrim.released.length === 1 ? 'o' : 'i'
          } per adeguamento ${profile.leagueCfg.shortName}`
        );
      }
    }

    // 1b. Se retrocessa e fuori budget, taglia i contratti più pesanti in eccesso per fare spazio salariale
    if (isRelegated) {
      let wageBill = calculateWageBill(roster);
      let guard = 0;
      while (wageBill > team.budget * 0.96 && roster.length > 6 && guard < 8) {
        guard += 1;
        const itaCount = roster.filter((p) => p.isItalianFormation).length;
        const trimCandidates = roster
          .filter((p) => {
            if (p.loanedFromTeamId) return false;
            if (p.isItalianFormation && itaCount <= profile.minIta) return false;
            return true;
          })
          .sort((a, b) => b.salary - a.salary);
        const toRelease = trimCandidates[0];
        if (!toRelease) break;
        roster = roster.filter((p) => p.id !== toRelease.id);
        pool.push({
          ...toRelease,
          rosterSlot: 'reserve',
          targetMinutes: 0,
          benchOrder: undefined,
        });
        wageBill = calculateWageBill(roster);
      }
    }

    // 1c. Se promossa, libera alcuni elementi sotto-categoria (OVR basso) per aprire spazio a rinforzi
    if (isPromoted && roster.length > 7) {
      let cuts = 0;
      while (cuts < 3 && roster.length > 7) {
        const curIta = roster.filter((p) => p.isItalianFormation).length;
        const weakest = roster
          .filter((p) => {
            if (p.loanedFromTeamId) return false;
            if (p.overall >= profile.leagueCfg.avgOverall - 6) return false;
            if (p.isItalianFormation && curIta <= profile.minIta) return false;
            return true;
          })
          .sort((a, b) => a.overall - b.overall)[0];
        if (!weakest) break;
        roster = roster.filter((p) => p.id !== weakest.id);
        pool.push({
          ...weakest,
          rosterSlot: 'reserve',
          targetMinutes: 0,
          benchOrder: undefined,
        });
        cuts += 1;
      }
    }

    // 1d. Rinnovi CPU: estende a 2 anni i titolari/giovani importanti se sotto budget
    const wageBill = calculateWageBill(roster);
    roster = roster.map((p) => {
      if (
        p.contractYears === 1 &&
        p.overall >= profile.leagueCfg.avgOverall - 2 &&
        wageBill < team.budget * 0.88
      ) {
        return { ...p, contractYears: 2 as const };
      }
      return p;
    });

    return { ...team, roster };
  });

  // 2. Acquisti estivi mirati (priorità: Promosse LBA -> Promosse A2 -> Retrocesse -> Altre CPU)
  const sortedForMarket = [...adjustedTeams].sort((a, b) => {
    const aTier = promotedIds.has(a.id)
      ? a.leagueId === 'ITA_LBA'
        ? 4
        : 3
      : relegatedIds.has(a.id)
      ? 2
      : 1;
    const bTier = promotedIds.has(b.id)
      ? b.leagueId === 'ITA_LBA'
        ? 4
        : 3
      : relegatedIds.has(b.id)
      ? 2
      : 1;
    if (bTier !== aTier) return bTier - aTier;
    return b.budget - a.budget;
  });

  const signedByTeam = new Map<string, Team>();
  for (const team of sortedForMarket) {
    if (team.id === userTeamId) continue;

    const leagueId: LeagueId = team.leagueId ?? 'ITA_LBA';
    const lbaFormat: LbaRosterFormat =
      leagueId === 'ITA_LBA' ? (team.lbaRosterFormat ?? '6+6') : '6+6';
    const profile = getLeagueRosterProfile(leagueId, lbaFormat);
    const isPromoted = promotedIds.has(team.id);
    const isRelegated = relegatedIds.has(team.id);

    let roster = [...team.roster];
    const maxSignings =
      isPromoted && leagueId === 'ITA_LBA'
        ? 5
        : isPromoted
        ? 4
        : isRelegated
        ? 5
        : roster.length < 11
        ? 3
        : 2;
    let signingsDone = 0;

    const minFreeCapForVoluntary = leagueId === 'ITA_LBA' ? 15000 : 5000;
    const posCounts = () => {
      const m = new Map<Position, number>();
      for (const rp of roster) {
        m.set(rp.primaryPosition, (m.get(rp.primaryPosition) ?? 0) + 1);
      }
      return m;
    };

    while (signingsDone < maxSignings && (roster.length < profile.targetRosterSize || isPromoted)) {
      if (roster.length >= 13 && !isPromoted) break;
      const freeCap = team.budget - calculateWageBill(roster);
      if (freeCap <= minFreeCapForVoluntary) break;

      const curIta = roster.filter((p) => p.isItalianFormation).length;
      const curForeign = roster.filter((p) => !p.isItalianFormation).length;
      const missingMandatoryIta = Math.max(0, profile.minIta - curIta);
      const openSlotsBeforeFull = Math.max(0, profile.targetRosterSize - roster.length);

      // Promosse con già almeno minIta ITA possono prendere stranieri fino a maxForeign sostituendo eventuali italiani in eccesso
      const mustSignItalian =
        curForeign >= profile.maxForeign ||
        curIta < profile.minIta ||
        (!isPromoted && curIta < profile.minClubIta && openSlotsBeforeFull <= profile.minClubIta - curIta) ||
        (openSlotsBeforeFull > 0 && openSlotsBeforeFull <= missingMandatoryIta);

      const replaceable =
        roster.length >= profile.targetRosterSize
          ? findWeakestReplaceablePlayer(
              roster,
              profile.minIta,
              curForeign >= profile.maxForeign
            )
          : undefined;
      if (roster.length >= profile.targetRosterSize && !replaceable) break;

      const effectiveCap = replaceable ? freeCap + replaceable.salary : freeCap;
      const maxRealisticOvr = profile.leagueCfg.avgOverall + (isPromoted ? 8 : 10);
      const counts = posCounts();

      let candidateIdx = -1;
      let bestScore = -Infinity;

      for (let i = 0; i < pool.length; i++) {
        const fa = pool[i];
        if (fa.injuryWeeks > 0) continue;
        if (mustSignItalian && !fa.isItalianFormation) continue;
        if (fa.salary > effectiveCap) continue;
        if (fa.overall > maxRealisticOvr) continue;
        if (replaceable && fa.overall < replaceable.overall + 3) continue;

        let score = fa.overall;
        if ((counts.get(fa.primaryPosition) ?? 0) < 2) score += 4;
        if (
          isPromoted &&
          !fa.isItalianFormation &&
          curForeign < profile.maxForeign &&
          fa.overall >= profile.leagueCfg.avgOverall - 3
        ) {
          score += 3;
        }
        if (score > bestScore) {
          bestScore = score;
          candidateIdx = i;
        }
      }

      if (candidateIdx === -1) break;

      const signed = pool.splice(candidateIdx, 1)[0];
      if (replaceable && roster.length >= profile.targetRosterSize) {
        roster = roster.filter((p) => p.id !== replaceable.id);
        pool.push({
          ...replaceable,
          rosterSlot: 'reserve',
          targetMinutes: 0,
          benchOrder: undefined,
        });
      }

      roster.push({
        ...signed,
        contractYears: 2,
        rosterSlot: 'bench',
        promisedRole:
          signed.overall >= profile.leagueCfg.avgOverall ? 'Titolare fisso' : 'Giocatore di rotazione',
      });
      signingsDone += 1;

      if (headlineMoves.length < 8 && (isPromoted || isRelegated || headlineMoves.length < 5)) {
        const tag = isPromoted ? ' [Promossa]' : isRelegated ? ' [Retrocessa]' : '';
        headlineMoves.push(
          `${team.shortName}${tag} firma ${signed.firstName[0]}. ${signed.lastName} (OVR ${signed.overall})`
        );
      }
    }

    // 3. Finalizzatore rigoroso di conformità regolamentare per la categoria della squadra
    const compliant = ensureCpuTeamLeagueCompliance(
      { ...team, roster },
      pool,
      isRelegated || leagueId !== 'ITA_LBA'
    );
    signedByTeam.set(team.id, compliant.team);
  }

  const finalTeams = adjustedTeams.map((t) => signedByTeam.get(t.id) ?? t);

  if (headlineMoves.length > 0) {
    news.push({
      id: `news_cpu_summer_${seasonYear}_${Date.now()}`,
      round: 1,
      category: 'Mercato',
      title: 'Operazioni di Mercato Estivo CPU',
      body: headlineMoves.join(' • '),
    });
  }

  return {
    teams: finalTeams,
    freeAgents: pool.sort((a, b) => b.overall - a.overall),
    news,
  };
}

/**
 * Operazioni di mercato CPU durante la stagione:
 * le squadre AI con infortuni, roster corto o spazio salariale firmano Free Agent compatibili con i limiti lega.
 */
export function runCpuInSeasonMarket(
  teams: Team[],
  freeAgents: Player[],
  userTeamId: string,
  round: number
): { teams: Team[]; freeAgents: Player[]; news: NewsItem[] } {
  const pool = [...freeAgents].sort((a, b) => b.overall - a.overall);
  const news: NewsItem[] = [];
  let signingsThisRound = 0;

  const updatedTeams = teams.map((team) => {
    if (team.id === userTeamId) return team;

    const leagueId: LeagueId = team.leagueId ?? 'ITA_LBA';
    const lbaFormat: LbaRosterFormat =
      leagueId === 'ITA_LBA' ? (team.lbaRosterFormat ?? '6+6') : '6+6';
    const { maxForeign, minIta } = getForeignLimitForLeague(leagueId, lbaFormat);

    const healthyCount = team.roster.filter((p) => p.injuryWeeks === 0).length;
    const healthyIta = team.roster.filter(
      (p) => p.injuryWeeks === 0 && p.isItalianFormation
    ).length;
    const freeCap = team.budget - calculateWageBill(team.roster);
    const currentValid = validateRoster6Plus6(team.roster, leagueId, lbaFormat).valid;
    const needsCompliance = !currentValid || healthyIta < minIta || healthyCount < 10;
    const needsDepth = healthyCount < 11;
    const wantsUpgrade =
      team.roster.length < 14 &&
      round % 4 === 0 &&
      freeCap > 65000 &&
      Math.random() < 0.25;

    if (!needsCompliance && ((!needsDepth && !wantsUpgrade) || signingsThisRound >= 2)) {
      return team;
    }

    const curIta = team.roster.filter((p) => p.isItalianFormation).length;
    const curForeign = team.roster.filter((p) => !p.isItalianFormation).length;
    const needItaOnly = curIta < minIta || healthyIta < minIta || curForeign >= maxForeign;

    let idx = pool.findIndex(
      (fa) => (!needItaOnly || fa.isItalianFormation) && fa.salary <= freeCap
    );
    if (idx === -1 && needsCompliance) {
      idx = pool.findIndex((fa) => !needItaOnly || fa.isItalianFormation);
    }

    let signed: Player | undefined;
    if (idx !== -1) {
      const candidate = pool.splice(idx, 1)[0];
      const profile = getLeagueRosterProfile(leagueId, lbaFormat);
      const salary =
        candidate.salary <= freeCap
          ? candidate.salary
          : Math.max(
              profile.minSalaryFloor,
              Math.min(candidate.salary, Math.round(Math.max(freeCap, team.budget * 0.05) / 500) * 500)
            );
      signed = { ...candidate, salary };
    } else if (needsCompliance) {
      const neededPos = pickMostNeededPosition(team.roster);
      signed = createEmergencyLeagueItalian(leagueId, lbaFormat, neededPos, team.budget);
    } else {
      return team;
    }

    signingsThisRound++;

    const nextRoster = autoBalanceRotationMinutes(
      autoFixRosterLineup(
        [
          ...team.roster,
          {
            ...signed,
            contractYears: 1,
            rosterSlot: 'bench',
            promisedRole: 'Giocatore di rotazione',
          },
        ],
        leagueId,
        lbaFormat
      )
    );

    news.push({
      id: `news_cpu_sign_${team.id}_${round}_${signed.id}`,
      round,
      category: 'Mercato',
      title: `${team.shortName}: firma ${signed.firstName} ${signed.lastName}`,
      body: `${team.name} ha ingaggiato ${signed.firstName} ${signed.lastName} (${signed.primaryPosition}, OVR ${signed.overall}) dai Free Agent a ${formatEuro(signed.salary)}/anno.`,
    });

    return { ...team, roster: nextRoster };
  });

  return { teams: updatedTeams, freeAgents: pool, news };
}

/**
 * A fine stagione, i giocatori con contratto pluriennale che risultano scontenti
 * (morale basso o squadra retrocessa) possono attirare offerte con pagamento del buyout
 * da parte di altri club interessati.
 */
export function generateEndOfSeasonUnhappyOffers(params: {
  teams: Team[];
  userTeam: Team;
  multiYearPlayerIds: Set<string>;
  userRelegated: boolean;
  seasonYear: number;
}): { offers: TransferOffer[]; news: NewsItem[] } {
  const { teams, userTeam, multiYearPlayerIds, userRelegated, seasonYear } = params;
  if (userTeam.roster.length <= 10) {
    return { offers: [], news: [] };
  }

  const unhappyCandidates = userTeam.roster
    .filter((p) => {
      if (!multiYearPlayerIds.has(p.id)) return false;
      if (p.morale < 60) return true;
      if (userRelegated && p.morale < 68 && p.overall >= 70) return true;
      return false;
    })
    .sort((a, b) => a.morale - b.morale);

  if (unhappyCandidates.length === 0) {
    return { offers: [], news: [] };
  }

  const maxOffers = Math.min(2, userTeam.roster.length - 10, unhappyCandidates.length);
  const offers: TransferOffer[] = [];
  const news: NewsItem[] = [];
  const usedBuyerIds = new Set<string>();

  for (const player of unhappyCandidates) {
    if (offers.length >= maxOffers) break;

    const buyout = getPlayerBuyoutClause(player);

    const eligibleBuyers = teams
      .filter((t) => {
        if (t.id === userTeam.id || usedBuyerIds.has(t.id)) return false;
        const buyerLeagueId = t.leagueId ?? 'ITA_LBA';
        const buyerCfg = getLeagueConfig(buyerLeagueId);
        if (player.overall < buyerCfg.avgOverall - 2) return false;

        const { maxForeign } = getForeignLimitForLeague(
          buyerLeagueId,
          t.lbaRosterFormat ?? '6+6'
        );
        const buyerForeignCount = t.roster.filter((rp) => !rp.isItalianFormation).length;
        if (!player.isItalianFormation && buyerForeignCount >= maxForeign) return false;

        const freeCap = t.budget - calculateWageBill(t.roster);
        return freeCap >= buyout + player.salary * 0.5 && t.budget - buyout >= 500000;
      })
      .sort((a, b) => b.prestige - a.prestige);

    if (eligibleBuyers.length === 0) continue;

    const topPool = eligibleBuyers.slice(0, Math.min(3, eligibleBuyers.length));
    const buyer = topPool[Math.floor(Math.random() * topPool.length)];
    usedBuyerIds.add(buyer.id);

    const reason =
      player.morale < 50
        ? `Contratto pluriennale • Giocatore molto scontento (Morale ${player.morale})`
        : userRelegated
        ? `Contratto pluriennale • Scontento dopo la retrocessione (Morale ${player.morale})`
        : `Contratto pluriennale • Giocatore scontento a fine stagione (Morale ${player.morale})`;

    offers.push({
      id: `offer_eos_${seasonYear}_${player.id}_${buyer.id}`,
      fromTeamId: buyer.id,
      fromTeamName: buyer.name,
      playerId: player.id,
      playerName: `${player.firstName} ${player.lastName}`,
      buyoutAmount: buyout,
      round: 1,
      reason,
    });

    news.push({
      id: `news_eos_offer_${seasonYear}_${player.id}`,
      round: 1,
      category: 'Mercato',
      title: `BUYOUT FINE STAGIONE: ${buyer.shortName} vuole ${player.lastName}`,
      body: `${player.firstName} ${player.lastName} è scontento nonostante il contratto pluriennale: ${buyer.name} ha presentato un'offerta pagando il buyout da ${formatEuro(buyout)}. Valuta l'offerta nella sezione Mercato → Offerte.`,
    });
  }

  return { offers, news };
}
