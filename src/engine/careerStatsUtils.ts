import {
  CareerHistoryEntry,
  PlayerGameLogEntry,
  PlayerSeasonStats,
} from '../types';

const FAKE_TEAM_NAME_RE = /^Squadra (Milano|Bologna|Valencia|Berlino|Lubiana)$/;

export function isFakeGeneratedHistoryEntry(entry: CareerHistoryEntry): boolean {
  return entry.teamName === 'Club Precedente' || FAKE_TEAM_NAME_RE.test(entry.teamName);
}

export function filterRealCareerHistory(
  history?: CareerHistoryEntry[]
): CareerHistoryEntry[] {
  return (history ?? []).filter((entry) => !isFakeGeneratedHistoryEntry(entry));
}

export function buildCareerHistoryEntry(
  stats: PlayerSeasonStats,
  meta: { seasonLabel: string; teamName: string; league: string }
): CareerHistoryEntry {
  const gp = Math.max(1, stats.gamesPlayed);
  return {
    seasonLabel: meta.seasonLabel,
    teamName: meta.teamName,
    league: meta.league,
    gamesPlayed: stats.gamesPlayed,
    gamesStarted: stats.gamesStarted ?? 0,
    ppg: Number((stats.points / gp).toFixed(1)),
    rpg: Number((stats.rebounds / gp).toFixed(1)),
    apg: Number((stats.assists / gp).toFixed(1)),
    pir: Number((stats.pir / gp).toFixed(1)),
    minutes: stats.minutes,
    points: stats.points,
    rebounds: stats.rebounds,
    oreb: stats.oreb ?? 0,
    dreb: stats.dreb ?? 0,
    assists: stats.assists,
    steals: stats.steals,
    blocks: stats.blocks,
    turnovers: stats.turnovers,
    fgm: stats.fgm,
    fga: stats.fga,
    tpm: stats.tpm,
    tpa: stats.tpa,
    ftm: stats.ftm,
    fta: stats.fta,
    pirTotal: stats.pir,
  };
}

export interface CareerRowAverages {
  gp: number;
  gs: number | null;
  ppg: number | null;
  mpg: number | null;
  drpg: number | null;
  orpg: number | null;
  rpg: number | null;
  apg: number | null;
  fgPct: number | null;
  tpPct: number | null;
  ftPct: number | null;
  spg: number | null;
  tpg: number | null;
  bpg: number | null;
  pirPg: number | null;
}

export function getHistoryEntryAverages(h: CareerHistoryEntry): CareerRowAverages {
  const gp = h.gamesPlayed;
  if (gp <= 0) {
    return {
      gp: 0,
      gs: h.gamesStarted ?? null,
      ppg: null,
      mpg: null,
      drpg: null,
      orpg: null,
      rpg: null,
      apg: null,
      fgPct: null,
      tpPct: null,
      ftPct: null,
      spg: null,
      tpg: null,
      bpg: null,
      pirPg: null,
    };
  }

  return {
    gp,
    gs: h.gamesStarted ?? null,
    ppg: h.points !== undefined ? h.points / gp : h.ppg,
    mpg: h.minutes !== undefined ? h.minutes / gp : null,
    drpg: h.dreb !== undefined ? h.dreb / gp : null,
    orpg: h.oreb !== undefined ? h.oreb / gp : null,
    rpg: h.rebounds !== undefined ? h.rebounds / gp : h.rpg,
    apg: h.assists !== undefined ? h.assists / gp : h.apg,
    fgPct:
      h.fga !== undefined
        ? h.fga > 0
          ? Math.round(((h.fgm ?? 0) / h.fga) * 100)
          : null
        : null,
    tpPct:
      h.tpa !== undefined
        ? h.tpa > 0
          ? Math.round(((h.tpm ?? 0) / h.tpa) * 100)
          : null
        : null,
    ftPct:
      h.fta !== undefined
        ? h.fta > 0
          ? Math.round(((h.ftm ?? 0) / h.fta) * 100)
          : null
        : null,
    spg: h.steals !== undefined ? h.steals / gp : null,
    tpg: h.turnovers !== undefined ? h.turnovers / gp : null,
    bpg: h.blocks !== undefined ? h.blocks / gp : null,
    pirPg: h.pirTotal !== undefined ? h.pirTotal / gp : h.pir,
  };
}

export interface PlayerCareerSummary {
  history: CareerHistoryEntry[];
  seasonsPlayed: number;
  totalGp: number;
  totalGs: number | null;
  totalPts: number;
  ppg: number | null;
  mpg: number | null;
  drpg: number | null;
  orpg: number | null;
  rpg: number | null;
  apg: number | null;
  fgPct: number | null;
  tpPct: number | null;
  ftPct: number | null;
  spg: number | null;
  tpg: number | null;
  bpg: number | null;
  pirPg: number | null;
}

export function computePlayerCareerSummary(
  seasonStats: PlayerSeasonStats,
  rawHistory?: CareerHistoryEntry[]
): PlayerCareerSummary {
  const history = filterRealCareerHistory(rawHistory);
  const currentGp = seasonStats.gamesPlayed;
  const seasonsPlayed = history.length + (currentGp > 0 ? 1 : 0);

  let totalGp = currentGp;
  let totalPts = seasonStats.points;
  let totalReb = seasonStats.rebounds;
  let totalAst = seasonStats.assists;
  let totalPir = seasonStats.pir;

  let gsSum = currentGp > 0 ? seasonStats.gamesStarted ?? 0 : 0;
  let hasAllGs = true;

  let gpMinutes = currentGp;
  let totalMinutes = seasonStats.minutes;

  let gpRebSplit = currentGp;
  let totalDreb = seasonStats.dreb ?? 0;
  let totalOreb = seasonStats.oreb ?? 0;

  let gpDefense = currentGp;
  let totalSteals = seasonStats.steals;
  let totalTurnovers = seasonStats.turnovers;
  let totalBlocks = seasonStats.blocks;

  let totalFgm = seasonStats.fgm;
  let totalFga = seasonStats.fga;
  let totalTpm = seasonStats.tpm;
  let totalTpa = seasonStats.tpa;
  let totalFtm = seasonStats.ftm;
  let totalFta = seasonStats.fta;

  for (const h of history) {
    if (h.gamesPlayed <= 0) continue;
    totalGp += h.gamesPlayed;
    totalPts += h.points !== undefined ? h.points : h.ppg * h.gamesPlayed;
    totalReb += h.rebounds !== undefined ? h.rebounds : h.rpg * h.gamesPlayed;
    totalAst += h.assists !== undefined ? h.assists : h.apg * h.gamesPlayed;
    totalPir += h.pirTotal !== undefined ? h.pirTotal : h.pir * h.gamesPlayed;

    if (h.gamesStarted !== undefined) {
      gsSum += h.gamesStarted;
    } else {
      hasAllGs = false;
    }

    if (h.minutes !== undefined) {
      gpMinutes += h.gamesPlayed;
      totalMinutes += h.minutes;
    }

    if (h.dreb !== undefined && h.oreb !== undefined) {
      gpRebSplit += h.gamesPlayed;
      totalDreb += h.dreb;
      totalOreb += h.oreb;
    }

    if (
      h.steals !== undefined &&
      h.turnovers !== undefined &&
      h.blocks !== undefined
    ) {
      gpDefense += h.gamesPlayed;
      totalSteals += h.steals;
      totalTurnovers += h.turnovers;
      totalBlocks += h.blocks;
    }

    if (h.fga !== undefined) {
      totalFga += h.fga;
      totalFgm += h.fgm ?? 0;
    }
    if (h.tpa !== undefined) {
      totalTpa += h.tpa;
      totalTpm += h.tpm ?? 0;
    }
    if (h.fta !== undefined) {
      totalFta += h.fta;
      totalFtm += h.ftm ?? 0;
    }
  }

  return {
    history,
    seasonsPlayed,
    totalGp,
    totalGs: totalGp === 0 ? 0 : hasAllGs ? gsSum : null,
    totalPts: Math.round(totalPts),
    ppg: totalGp > 0 ? totalPts / totalGp : null,
    mpg: gpMinutes > 0 ? totalMinutes / gpMinutes : null,
    drpg: gpRebSplit > 0 ? totalDreb / gpRebSplit : null,
    orpg: gpRebSplit > 0 ? totalOreb / gpRebSplit : null,
    rpg: totalGp > 0 ? totalReb / totalGp : null,
    apg: totalGp > 0 ? totalAst / totalGp : null,
    fgPct: totalFga > 0 ? Math.round((totalFgm / totalFga) * 100) : null,
    tpPct: totalTpa > 0 ? Math.round((totalTpm / totalTpa) * 100) : null,
    ftPct: totalFta > 0 ? Math.round((totalFtm / totalFta) * 100) : null,
    spg: gpDefense > 0 ? totalSteals / gpDefense : null,
    tpg: gpDefense > 0 ? totalTurnovers / gpDefense : null,
    bpg: gpDefense > 0 ? totalBlocks / gpDefense : null,
    pirPg: totalGp > 0 ? totalPir / totalGp : null,
  };
}

export interface PlayerSeasonHighs {
  hasGames: boolean;
  points: number | null;
  minutes: number | null;
  dreb: number | null;
  oreb: number | null;
  rebounds: number | null;
  assists: number | null;
  fgPct: number | null;
  tpPct: number | null;
  ftPct: number | null;
  steals: number | null;
  turnovers: number | null;
  blocks: number | null;
  pir: number | null;
}

export function computePlayerSeasonHighs(
  gameLog?: PlayerGameLogEntry[]
): PlayerSeasonHighs {
  const games = gameLog ?? [];
  if (games.length === 0) {
    return {
      hasGames: false,
      points: null,
      minutes: null,
      dreb: null,
      oreb: null,
      rebounds: null,
      assists: null,
      fgPct: null,
      tpPct: null,
      ftPct: null,
      steals: null,
      turnovers: null,
      blocks: null,
      pir: null,
    };
  }

  let points = -Infinity;
  let minutes = -Infinity;
  let dreb = -Infinity;
  let oreb = -Infinity;
  let rebounds = -Infinity;
  let assists = -Infinity;
  let steals = -Infinity;
  let turnovers = -Infinity;
  let blocks = -Infinity;
  let pir = -Infinity;
  let fgPct: number | null = null;
  let tpPct: number | null = null;
  let ftPct: number | null = null;

  for (const g of games) {
    points = Math.max(points, g.points);
    minutes = Math.max(minutes, g.minutes);
    dreb = Math.max(dreb, g.dreb ?? 0);
    oreb = Math.max(oreb, g.oreb ?? 0);
    rebounds = Math.max(rebounds, g.rebounds);
    assists = Math.max(assists, g.assists);
    steals = Math.max(steals, g.steals);
    turnovers = Math.max(turnovers, g.turnovers);
    blocks = Math.max(blocks, g.blocks);
    pir = Math.max(pir, g.pir);

    if (g.fga > 0) {
      const pct = Math.round((g.fgm / g.fga) * 100);
      fgPct = fgPct === null ? pct : Math.max(fgPct, pct);
    }
    if (g.tpa > 0) {
      const pct = Math.round((g.tpm / g.tpa) * 100);
      tpPct = tpPct === null ? pct : Math.max(tpPct, pct);
    }
    if (g.fta > 0) {
      const pct = Math.round((g.ftm / g.fta) * 100);
      ftPct = ftPct === null ? pct : Math.max(ftPct, pct);
    }
  }

  return {
    hasGames: true,
    points,
    minutes,
    dreb,
    oreb,
    rebounds,
    assists,
    fgPct,
    tpPct,
    ftPct,
    steals,
    turnovers,
    blocks,
    pir,
  };
}
