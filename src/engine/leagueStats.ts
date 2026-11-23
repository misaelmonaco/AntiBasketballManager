import { Player } from '../types';

export interface PlayerPerGameStats {
  gp: number;
  gs: number;
  mpg: number;
  ppg: number;
  rpg: number;
  oreb: number;
  dreb: number;
  apg: number;
  spg: number;
  bpg: number;
  tov: number;
  fgPct: number;
  tpPct: number;
  ftPct: number;
  pirAvg: number;
}

export function computePlayerPerGameStats(p: Player): PlayerPerGameStats {
  const s = p.seasonStats;
  const gp = s.gamesPlayed;
  if (gp <= 0) {
    return {
      gp: 0,
      gs: s.gamesStarted ?? 0,
      mpg: 0,
      ppg: 0,
      rpg: 0,
      oreb: 0,
      dreb: 0,
      apg: 0,
      spg: 0,
      bpg: 0,
      tov: 0,
      fgPct: 0,
      tpPct: 0,
      ftPct: 0,
      pirAvg: 0,
    };
  }
  return {
    gp,
    gs: s.gamesStarted ?? 0,
    mpg: s.minutes / gp,
    ppg: s.points / gp,
    rpg: s.rebounds / gp,
    oreb: (s.oreb ?? 0) / gp,
    dreb: (s.dreb ?? 0) / gp,
    apg: s.assists / gp,
    spg: s.steals / gp,
    bpg: s.blocks / gp,
    tov: s.turnovers / gp,
    fgPct: s.fga > 0 ? (s.fgm / s.fga) * 100 : 0,
    tpPct: s.tpa > 0 ? (s.tpm / s.tpa) * 100 : 0,
    ftPct: s.fta > 0 ? (s.ftm / s.fta) * 100 : 0,
    pirAvg: s.pir / gp,
  };
}
