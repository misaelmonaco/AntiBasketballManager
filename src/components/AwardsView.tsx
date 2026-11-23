import React, { useMemo, useState } from 'react';
import { Award, Crown, Sparkles, Trophy, UserCheck, BarChart3 } from 'lucide-react';
import { LEAGUES } from '../data/teams';
import { computePlayerPerGameStats, PlayerPerGameStats } from '../engine/leagueStats';
import { useGameStore } from '../store/gameStore';
import { LeagueId, Player, Position, Team } from '../types';
import { ClubBadge } from './ClubBadge';
import { PageHeader } from './PageHeader';
import { nextSortState, SortableTh, SortDir } from './SortableHeader';

type LeaderSortKey =
  | 'name'
  | 'position'
  | 'gp'
  | 'mpg'
  | 'ppg'
  | 'rpg'
  | 'apg'
  | 'spg'
  | 'bpg'
  | 'fgPct'
  | 'tpPct'
  | 'pirAvg';

const POS_ORDER: Record<Position, number> = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 };
const DESC_KEYS: readonly LeaderSortKey[] = [
  'gp',
  'mpg',
  'ppg',
  'rpg',
  'apg',
  'spg',
  'bpg',
  'fgPct',
  'tpPct',
  'pirAvg',
];

interface LeaguePlayerStatRow {
  player: Player;
  team: Team;
  stats: PlayerPerGameStats;
}

export const AwardsView: React.FC = () => {
  const { career, openPlayerProfile } = useGameStore();
  const userTeam = career?.teams.find((t) => t.id === career.userTeamId);
  const userLeagueId: LeagueId = userTeam?.leagueId ?? 'ITA_LBA';

  const [selectedLeagueId, setSelectedLeagueId] = useState<LeagueId>(userLeagueId);
  const [posFilter, setPosFilter] = useState<'ALL' | Position>('ALL');
  const [natFilter, setNatFilter] = useState<'ALL' | 'ITA' | 'FOREIGN'>('ALL');
  const [sortKey, setSortKey] = useState<LeaderSortKey>('ppg');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const leagueTeams = useMemo(
    () =>
      (career?.teams ?? []).filter(
        (t) => (t.leagueId ?? 'ITA_LBA') === selectedLeagueId
      ),
    [career?.teams, selectedLeagueId]
  );

  const playerEntries: LeaguePlayerStatRow[] = useMemo(() => {
    const raw = leagueTeams.flatMap((t) =>
      t.roster
        .filter((p) => {
          if (posFilter !== 'ALL' && p.primaryPosition !== posFilter) return false;
          if (natFilter === 'ITA' && !p.isItalianFormation) return false;
          if (natFilter === 'FOREIGN' && p.isItalianFormation) return false;
          return true;
        })
        .map((p) => ({
          player: p,
          team: t,
          stats: computePlayerPerGameStats(p),
        }))
    );
    const withGames = raw.filter((e) => e.stats.gp >= 1);
    return withGames.length > 0 ? withGames : raw;
  }, [leagueTeams, posFilter, natFilter]);

  const sortedLeaders = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...playerEntries]
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'name') {
          cmp = `${a.player.lastName} ${a.player.firstName}`.localeCompare(
            `${b.player.lastName} ${b.player.firstName}`
          );
        } else if (sortKey === 'position') {
          cmp = POS_ORDER[a.player.primaryPosition] - POS_ORDER[b.player.primaryPosition];
        } else {
          cmp =
            a.stats[sortKey as keyof PlayerPerGameStats] -
            b.stats[sortKey as keyof PlayerPerGameStats];
        }
        if (cmp !== 0) return cmp * dir;
        return b.stats.pirAvg - a.stats.pirAvg || b.player.overall - a.player.overall;
      })
      .slice(0, 25);
  }, [playerEntries, sortKey, sortDir]);

  if (!career) return null;

  const pickTop = (getter: (r: LeaguePlayerStatRow) => number, minGames = 1) => {
    const eligible = playerEntries.filter((e) => e.stats.gp >= minGames);
    const pool = eligible.length > 0 ? eligible : playerEntries;
    return [...pool].sort((a, b) => getter(b) - getter(a))[0];
  };

  const leaderCards = [
    {
      label: 'Punti (PPG)',
      entry: pickTop((e) => e.stats.ppg),
      value: (e: LeaguePlayerStatRow) => e.stats.ppg.toFixed(1),
      color: 'text-orange-400',
    },
    {
      label: 'Rimbalzi (RPG)',
      entry: pickTop((e) => e.stats.rpg),
      value: (e: LeaguePlayerStatRow) => e.stats.rpg.toFixed(1),
      color: 'text-emerald-400',
    },
    {
      label: 'Assist (APG)',
      entry: pickTop((e) => e.stats.apg),
      value: (e: LeaguePlayerStatRow) => e.stats.apg.toFixed(1),
      color: 'text-sky-400',
    },
    {
      label: 'Valutazione (PIR)',
      entry: pickTop((e) => e.stats.pirAvg),
      value: (e: LeaguePlayerStatRow) => e.stats.pirAvg.toFixed(1),
      color: 'text-amber-400',
    },
    {
      label: 'Tiro da 3 (3P%)',
      entry: pickTop((e) => (e.player.seasonStats.tpa >= 3 ? e.stats.tpPct : -1)),
      value: (e: LeaguePlayerStatRow) => `${e.stats.tpPct.toFixed(1)}%`,
      color: 'text-purple-400',
    },
    {
      label: 'Stoppate (BPG)',
      entry: pickTop((e) => e.stats.bpg),
      value: (e: LeaguePlayerStatRow) => e.stats.bpg.toFixed(1),
      color: 'text-rose-400',
    },
  ];

  const mvpRace = [...playerEntries]
    .filter((e) => e.stats.gp >= 1)
    .sort((a, b) => b.stats.pirAvg - a.stats.pirAvg)
    .slice(0, 5);

  const awards = career.awardsHistory ?? [];
  const activeLeagueName =
    LEAGUES.find((l) => l.id === selectedLeagueId)?.name ?? 'Serie A LBA';

  const handleSort = (clicked: LeaderSortKey) => {
    const next = nextSortState(sortKey, sortDir, clicked, DESC_KEYS);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Statistiche & Storia"
        title="Leader di Lega & Albo d'Oro"
        subtitle={`Classifiche statistiche individuali, corsa MVP e storico campioni — ${activeLeagueName}`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value as LeagueId)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
            >
              {LEAGUES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            <select
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value as 'ALL' | Position)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Tutti i Ruoli</option>
              <option value="PG">PG</option>
              <option value="SG">SG</option>
              <option value="SF">SF</option>
              <option value="PF">PF</option>
              <option value="C">C</option>
            </select>

            <select
              value={natFilter}
              onChange={(e) => setNatFilter(e.target.value as 'ALL' | 'ITA' | 'FOREIGN')}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Tutte Naz.</option>
              <option value="ITA">Formazione ITA</option>
              <option value="FOREIGN">Stranieri</option>
            </select>
          </div>
        }
      />

      {/* 6 Leader Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {leaderCards.map((card) => (
          <div key={card.label} className="fm-card rounded-2xl p-3.5 space-y-1.5">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {card.label}
            </div>
            {card.entry && card.entry.stats.gp > 0 ? (
              <>
                <div className={`text-xl font-black tabular-nums ${card.color}`}>
                  {card.value(card.entry)}
                </div>
                <button
                  onClick={() => openPlayerProfile(card.entry!.player.id)}
                  className="text-xs font-bold text-white hover:text-orange-400 hover:underline truncate block text-left w-full cursor-pointer"
                >
                  {card.entry.player.firstName[0]}. {card.entry.player.lastName}
                </button>
                <div className="text-[10px] text-slate-400 truncate">
                  {card.entry.team.shortName} • {card.entry.player.primaryPosition}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500 pt-2">Nessuna gara</div>
            )}
          </div>
        ))}
      </div>

      {/* Corsa MVP attuale */}
      <div className="fm-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Sparkles className="w-4 h-4 text-orange-400" />
          Corsa MVP {activeLeagueName} — Stagione {career.seasonYear}/{String(career.seasonYear + 1).slice(-2)}
        </div>
        {mvpRace.length === 0 ? (
          <div className="text-xs text-slate-400 py-4">
            Gioca le prime partite di Regular Season per vedere la classifica MVP.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {mvpRace.map((entry, idx) => (
              <div key={entry.player.id} className="fm-subcard rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                  <span className={idx === 0 ? 'text-amber-400' : 'text-slate-400'}>
                    #{idx + 1} Candidato
                  </span>
                  <span className="text-slate-400">{entry.team.shortName}</span>
                </div>
                <button
                  onClick={() => openPlayerProfile(entry.player.id)}
                  className="text-xs font-bold text-white hover:text-orange-400 hover:underline truncate block text-left w-full cursor-pointer"
                >
                  {entry.player.firstName[0]}. {entry.player.lastName}
                </button>
                <div className="text-[11px] text-emerald-400 font-bold tabular-nums">
                  {entry.stats.pirAvg.toFixed(1)} PIR • {entry.stats.ppg.toFixed(1)} PPG
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 25 Classifica Statistica Completa */}
      <div className="fm-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            Top 25 Giocatori {activeLeagueName}
          </div>
          <span className="text-[11px] text-slate-400">
            Clicca sulle colonne per ordinare
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="fm-table-head">
              <tr>
                <th className="py-3 px-3 text-center">#</th>
                <SortableTh label="Giocatore" sortKey="name" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3 px-3" />
                <th className="py-3 px-2">Club</th>
                <SortableTh label="Ruolo" sortKey="position" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3 px-2" />
                <SortableTh label="PG" sortKey="gp" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
                <SortableTh label="MIN" sortKey="mpg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
                <SortableTh label="PTS" sortKey="ppg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
                <SortableTh label="REB" sortKey="rpg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
                <SortableTh label="AST" sortKey="apg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
                <SortableTh label="STL" sortKey="spg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
                <SortableTh label="BLK" sortKey="bpg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
                <SortableTh label="FG%" sortKey="fgPct" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
                <SortableTh label="3P%" sortKey="tpPct" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-2" />
                <SortableTh label="PIR" sortKey="pirAvg" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3 px-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 tabular-nums">
              {sortedLeaders.map((row, idx) => (
                <tr key={row.player.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => openPlayerProfile(row.player.id)}
                      className="font-bold text-slate-100 hover:text-orange-400 hover:underline text-left cursor-pointer"
                    >
                      {row.player.firstName[0]}. {row.player.lastName}
                    </button>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1.5">
                      <ClubBadge
                        shortName={row.team.shortName}
                        primaryColor={row.team.primaryColor}
                        secondaryColor={row.team.secondaryColor}
                        size="sm"
                      />
                      <span className="text-[11px] font-semibold text-slate-300">
                        {row.team.shortName}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 font-semibold text-slate-300">
                    {row.player.primaryPosition}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.stats.gp}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.stats.mpg.toFixed(1)}</td>
                  <td className="py-2.5 px-2 text-center font-extrabold text-white">
                    {row.stats.ppg.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-200">{row.stats.rpg.toFixed(1)}</td>
                  <td className="py-2.5 px-2 text-center text-slate-200">{row.stats.apg.toFixed(1)}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.stats.spg.toFixed(1)}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.stats.bpg.toFixed(1)}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">
                    {row.stats.gp > 0 ? `${row.stats.fgPct.toFixed(0)}%` : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-300">
                    {row.stats.gp > 0 ? `${row.stats.tpPct.toFixed(0)}%` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-orange-400">
                    {row.stats.pirAvg.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Storico Albo d'Oro */}
      <div className="fm-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center gap-2 text-sm font-bold text-white">
          <Trophy className="w-4 h-4 text-amber-400" />
          Albo d&apos;Oro Stagioni Concluse ({awards.length})
        </div>

        {awards.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            Nessuna stagione ancora conclusa. Completa una stagione per registrare Campioni, MVP e premi individuali nell&apos;Albo d&apos;Oro.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {awards.map((rec, idx) => (
              <div key={`${rec.seasonLabel}_${idx}`} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-black text-white">
                    Stagione {rec.seasonLabel} —{' '}
                    <span className="text-orange-400">{rec.leagueName}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    <Crown className="w-3.5 h-3.5" />
                    Campione: {rec.championTeamName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="fm-subcard rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase text-orange-400 flex items-center gap-1">
                      <Award className="w-3 h-3" /> MVP Stagione
                    </div>
                    <div className="font-bold text-white mt-1">{rec.mvpName}</div>
                  </div>
                  <div className="fm-subcard rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase text-emerald-400">
                      Miglior Giovane U22
                    </div>
                    <div className="font-bold text-white mt-1">{rec.bestYoungName}</div>
                  </div>
                  <div className="fm-subcard rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase text-sky-400">
                      Miglior Sesto Uomo
                    </div>
                    <div className="font-bold text-white mt-1">{rec.sixthManName}</div>
                  </div>
                  <div className="fm-subcard rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Coach dell&apos;Anno
                    </div>
                    <div className="font-bold text-white mt-1">{rec.coachOfTheYearName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
