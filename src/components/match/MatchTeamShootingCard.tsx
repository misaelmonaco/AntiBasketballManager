import React from 'react';
import { BarChart3 } from 'lucide-react';
import { MatchTeamState } from '../../types';

export interface TeamMatchTotals {
  secondsPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  pir: number;
  fgm: number;
  fga: number;
  fgPct: number;
  twoM: number;
  twoA: number;
  twoPct: number;
  tpm: number;
  tpa: number;
  threePct: number;
  ftm: number;
  fta: number;
  ftPct: number;
}

export function computeTeamTotals(team: MatchTeamState): TeamMatchTotals {
  let secondsPlayed = 0;
  let points = 0;
  let rebounds = 0;
  let assists = 0;
  let steals = 0;
  let blocks = 0;
  let turnovers = 0;
  let fouls = 0;
  let pir = 0;
  let fgm = 0;
  let fga = 0;
  let tpm = 0;
  let tpa = 0;
  let ftm = 0;
  let fta = 0;

  for (const p of team.players) {
    secondsPlayed += p.secondsPlayed;
    points += p.points;
    rebounds += p.rebounds;
    assists += p.assists;
    steals += p.steals;
    blocks += p.blocks;
    turnovers += p.turnovers;
    fouls += p.fouls;
    pir += p.pir;
    fgm += p.fgm;
    fga += p.fga;
    tpm += p.tpm;
    tpa += p.tpa;
    ftm += p.ftm;
    fta += p.fta;
  }

  const twoM = Math.max(0, fgm - tpm);
  const twoA = Math.max(0, fga - tpa);

  return {
    secondsPlayed,
    points,
    rebounds,
    assists,
    steals,
    blocks,
    turnovers,
    fouls,
    pir,
    fgm,
    fga,
    fgPct: fga > 0 ? Math.round((fgm / fga) * 100) : 0,
    twoM,
    twoA,
    twoPct: twoA > 0 ? Math.round((twoM / twoA) * 100) : 0,
    tpm,
    tpa,
    threePct: tpa > 0 ? Math.round((tpm / tpa) * 100) : 0,
    ftm,
    fta,
    ftPct: fta > 0 ? Math.round((ftm / fta) * 100) : 0,
  };
}

interface ShootingMetricItem {
  label: string;
  homeMade: number;
  homeAtt: number;
  homePct: number;
  awayMade: number;
  awayAtt: number;
  awayPct: number;
}

interface MatchTeamShootingCardProps {
  home: MatchTeamState;
  away: MatchTeamState;
}

export const MatchTeamShootingCard: React.FC<MatchTeamShootingCardProps> = ({ home, away }) => {
  const hTot = computeTeamTotals(home);
  const aTot = computeTeamTotals(away);

  const shootingMetrics: ShootingMetricItem[] = [
    {
      label: 'FG Totale',
      homeMade: hTot.fgm,
      homeAtt: hTot.fga,
      homePct: hTot.fgPct,
      awayMade: aTot.fgm,
      awayAtt: aTot.fga,
      awayPct: aTot.fgPct,
    },
    {
      label: 'Tiro da 2',
      homeMade: hTot.twoM,
      homeAtt: hTot.twoA,
      homePct: hTot.twoPct,
      awayMade: aTot.twoM,
      awayAtt: aTot.twoA,
      awayPct: aTot.twoPct,
    },
    {
      label: 'Tiro da 3',
      homeMade: hTot.tpm,
      homeAtt: hTot.tpa,
      homePct: hTot.threePct,
      awayMade: aTot.tpm,
      awayAtt: aTot.tpa,
      awayPct: aTot.threePct,
    },
    {
      label: 'Tiri Liberi',
      homeMade: hTot.ftm,
      homeAtt: hTot.fta,
      homePct: hTot.ftPct,
      awayMade: aTot.ftm,
      awayAtt: aTot.fta,
      awayPct: aTot.ftPct,
    },
  ];

  const secondaryMetrics = [
    { label: 'Rimbalzi (REB)', homeVal: hTot.rebounds, awayVal: aTot.rebounds, lowerIsBetter: false },
    { label: 'Assist (AST)', homeVal: hTot.assists, awayVal: aTot.assists, lowerIsBetter: false },
    { label: 'Palle Perse (TO)', homeVal: hTot.turnovers, awayVal: aTot.turnovers, lowerIsBetter: true },
  ];

  return (
    <div className="fm-card rounded-2xl p-2.5 space-y-2 shrink-0">
      {/* Header squadre con legenda barre */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-black shadow-sm shrink-0"
            style={{
              backgroundColor: home.primaryColor,
              color: home.secondaryColor,
            }}
          >
            {home.shortName}
          </span>
          <span className="text-[11px] font-bold text-white truncate">{home.name}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          <BarChart3 className="w-3.5 h-3.5 text-orange-400" />
          <span>Statistiche al Tiro</span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="text-[11px] font-bold text-white truncate">{away.name}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-black shadow-sm shrink-0"
            style={{
              backgroundColor: away.primaryColor,
              color: away.secondaryColor,
            }}
          >
            {away.shortName}
          </span>
          <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
        </div>
      </div>

      {/* 4 blocchi principali compatti: FG, 2P, 3P, TL */}
      <div className="grid grid-cols-4 gap-1.5">
        {shootingMetrics.map((m) => {
          const totalPct = m.homePct + m.awayPct;
          const homeShare = totalPct > 0 ? Math.round((m.homePct / totalPct) * 100) : 50;
          const homeLeads = m.homePct > m.awayPct;
          const awayLeads = m.awayPct > m.homePct;

          return (
            <div
              key={m.label}
              className="rounded-xl bg-slate-950/85 border border-slate-800/90 px-2 py-1.5 space-y-1"
            >
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 text-center truncate">
                {m.label}
              </div>

              <div className="flex items-end justify-between gap-1 tabular-nums">
                <div className="leading-tight">
                  <div
                    className={`text-sm font-black ${
                      homeLeads ? 'text-orange-300' : 'text-slate-100'
                    }`}
                  >
                    {m.homeAtt > 0 ? `${m.homePct}%` : '-'}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    {m.homeMade}/{m.homeAtt}
                  </div>
                </div>

                <div className="text-right leading-tight">
                  <div
                    className={`text-sm font-black ${
                      awayLeads ? 'text-sky-300' : 'text-slate-100'
                    }`}
                  >
                    {m.awayAtt > 0 ? `${m.awayPct}%` : '-'}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    {m.awayMade}/{m.awayAtt}
                  </div>
                </div>
              </div>

              <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-orange-400 transition-all duration-300"
                  style={{ width: `${homeShare}%` }}
                />
                <div
                  className="h-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${100 - homeShare}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Striscia compatta REB / AST / TO */}
      <div className="grid grid-cols-3 gap-1.5">
        {secondaryMetrics.map((s) => {
          const homeBetter = s.lowerIsBetter ? s.homeVal < s.awayVal : s.homeVal > s.awayVal;
          const awayBetter = s.lowerIsBetter ? s.awayVal < s.homeVal : s.awayVal > s.homeVal;

          return (
            <div
              key={s.label}
              className="rounded-lg bg-slate-950/65 border border-slate-800/75 px-2 py-1 flex items-center justify-between gap-1 text-[11px] tabular-nums"
            >
              <span className={`font-extrabold ${homeBetter ? 'text-orange-300' : 'text-slate-200'}`}>
                {s.homeVal}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 truncate">
                {s.label}
              </span>
              <span className={`font-extrabold ${awayBetter ? 'text-sky-300' : 'text-slate-200'}`}>
                {s.awayVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
