import React, { useState } from 'react';
import { BarChart3, X } from 'lucide-react';
import { CompactPlayerBoxScore, ScheduledGame, Team } from '../../types';
import { formatItalianDate } from '../../engine/calendarUtils';
import { ScoringPlayTimeline } from '../match/ScoringPlayTimeline';

interface MatchBoxScoreModalProps {
  game: ScheduledGame;
  date?: string;
  homeTeam: Team;
  awayTeam: Team;
  onClose: () => void;
  onOpenPlayerProfile?: (playerId: string) => void;
}

function sumTeamStats(players: CompactPlayerBoxScore[]) {
  return players.reduce(
    (acc, p) => ({
      minutes: acc.minutes + p.minutes,
      points: acc.points + p.points,
      rebounds: acc.rebounds + p.rebounds,
      assists: acc.assists + p.assists,
      steals: acc.steals + p.steals,
      blocks: acc.blocks + p.blocks,
      turnovers: acc.turnovers + p.turnovers,
      fouls: acc.fouls + p.fouls,
      fgm: acc.fgm + p.fgm,
      fga: acc.fga + p.fga,
      tpm: acc.tpm + p.tpm,
      tpa: acc.tpa + p.tpa,
      ftm: acc.ftm + p.ftm,
      fta: acc.fta + p.fta,
      pir: acc.pir + p.pir,
    }),
    {
      minutes: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      pir: 0,
    }
  );
}

export const MatchBoxScoreModal: React.FC<MatchBoxScoreModalProps> = ({
  game,
  date,
  homeTeam,
  awayTeam,
  onClose,
  onOpenPlayerProfile,
}) => {
  const [activeSide, setActiveSide] = useState<'home' | 'away'>('home');
  const [modalTab, setModalTab] = useState<'boxscore' | 'pbp'>('boxscore');
  const summary = game.summary;
  const homePlayers = summary?.homePlayers ?? [];
  const awayPlayers = summary?.awayPlayers ?? [];
  const scoringPlays = summary?.scoringPlays ?? [];
  const hasFullBox = homePlayers.length > 0 || awayPlayers.length > 0;

  const activeTeam = activeSide === 'home' ? homeTeam : awayTeam;
  const activePlayers = [...(activeSide === 'home' ? homePlayers : awayPlayers)].sort(
    (a, b) => Number(b.isStarter) - Number(a.isStarter) || b.points - a.points || b.minutes - a.minutes
  );
  const totals = sumTeamStats(activePlayers);

  const homeQuarters = summary?.homeQuarterScores ?? [];
  const awayQuarters = summary?.awayQuarterScores ?? [];
  const quarterCount = Math.max(homeQuarters.length, awayQuarters.length);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tabellino Partita • Giornata {game.round}
                {date ? ` • ${formatItalianDate(date)}` : ''}
              </div>
              <h3 className="text-base font-extrabold text-white">
                {homeTeam.name} vs {awayTeam.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Scoreboard + Quarter Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between lg:col-span-2 gap-4">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className="w-3 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: homeTeam.primaryColor }}
                />
                <div className="min-w-0">
                  <div className="text-xs text-slate-400 uppercase font-bold">Casa</div>
                  <div className="text-base font-extrabold text-white truncate">{homeTeam.name}</div>
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center shrink-0">
                <div className="text-2xl font-black text-orange-400 font-mono">
                  {game.homeScore ?? 0} - {game.awayScore ?? 0}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Finale
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1 text-right">
                <div className="min-w-0">
                  <div className="text-xs text-slate-400 uppercase font-bold">Ospite</div>
                  <div className="text-base font-extrabold text-white truncate">{awayTeam.name}</div>
                </div>
                <span
                  className="w-3 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: awayTeam.primaryColor }}
                />
              </div>
            </div>

            {quarterCount > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="py-1 text-left font-bold">Sq.</th>
                      {Array.from({ length: quarterCount }, (_, i) => (
                        <th key={i} className="py-1 px-1.5 font-bold">
                          {i < 4 ? `Q${i + 1}` : `OT${i - 3}`}
                        </th>
                      ))}
                      <th className="py-1 pl-2 font-extrabold text-orange-400">TOT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800/60 text-slate-200">
                      <td className="py-1 text-left font-bold">{homeTeam.shortName}</td>
                      {Array.from({ length: quarterCount }, (_, i) => (
                        <td key={i} className="py-1 px-1.5 font-mono">
                          {homeQuarters[i] ?? 0}
                        </td>
                      ))}
                      <td className="py-1 pl-2 font-mono font-extrabold text-white">
                        {game.homeScore ?? 0}
                      </td>
                    </tr>
                    <tr className="text-slate-200">
                      <td className="py-1 text-left font-bold">{awayTeam.shortName}</td>
                      {Array.from({ length: quarterCount }, (_, i) => (
                        <td key={i} className="py-1 px-1.5 font-mono">
                          {awayQuarters[i] ?? 0}
                        </td>
                      ))}
                      <td className="py-1 pl-2 font-mono font-extrabold text-white">
                        {game.awayScore ?? 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal View Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setModalTab('boxscore')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                modalTab === 'boxscore'
                  ? 'bg-orange-500 text-slate-950 border-orange-400'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              Tabellino & Statistiche
            </button>
            <button
              type="button"
              onClick={() => setModalTab('pbp')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                modalTab === 'pbp'
                  ? 'bg-orange-500 text-slate-950 border-orange-400'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              Play-by-Play Marcatori ({scoringPlays.length})
            </button>
          </div>

          {modalTab === 'pbp' ? (
            scoringPlays.length === 0 ? (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center space-y-1.5">
                <div className="text-sm font-bold text-white">
                  Play-by-Play Marcatori non disponibile per questa partita
                </div>
                <p className="text-xs text-slate-400">
                  La cronologia dettagliata canestro per canestro viene salvata per tutte le partite simulate da questa versione in poi.
                </p>
              </div>
            ) : (
              <div className="h-[460px] flex flex-col">
                <ScoringPlayTimeline
                  plays={scoringPlays}
                  homeShort={homeTeam.shortName}
                  awayShort={awayTeam.shortName}
                />
              </div>
            )
          ) : (
            <>
              {/* Zone di Tiro (Shot Chart Breakdown) */}
              {(() => {
                const sumTeam = (players: typeof homePlayers) => {
                  const fgm = players.reduce((s, p) => s + p.fgm, 0);
                  const fga = players.reduce((s, p) => s + p.fga, 0);
                  const tpm = players.reduce((s, p) => s + p.tpm, 0);
                  const tpa = players.reduce((s, p) => s + p.tpa, 0);
                  const ftm = players.reduce((s, p) => s + p.ftm, 0);
                  const fta = players.reduce((s, p) => s + p.fta, 0);
                  const twoM = Math.max(0, fgm - tpm);
                  const twoA = Math.max(0, fga - tpa);
                  const pct = (m: number, a: number) => (a > 0 ? Math.round((m / a) * 100) : 0);
                  return {
                    two: `${twoM}/${twoA} (${pct(twoM, twoA)}%)`,
                    three: `${tpm}/${tpa} (${pct(tpm, tpa)}%)`,
                    ft: `${ftm}/${fta} (${pct(ftm, fta)}%)`,
                    twoPct: pct(twoM, twoA),
                    threePct: pct(tpm, tpa),
                    ftPct: pct(ftm, fta),
                  };
                };
                const hShot = sumTeam(homePlayers);
                const aShot = sumTeam(awayPlayers);
                if (homePlayers.length === 0 && awayPlayers.length === 0) return null;
                return (
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400">
                      Mappa Tiri & Percentuali per Zona
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {(
                        [
                          ['Tiri da 2 / Area', hShot.two, aShot.two, hShot.twoPct, aShot.twoPct],
                          ['Tiri da 3 / Arco', hShot.three, aShot.three, hShot.threePct, aShot.threePct],
                          ['Tiri Liberi (Lunetta)', hShot.ft, aShot.ft, hShot.ftPct, aShot.ftPct],
                        ] as const
                      ).map(([label, hv, av, hp, ap]) => (
                        <div key={label} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                          <div className="text-[11px] font-bold text-slate-300">{label}</div>
                          <div className="flex justify-between text-[11px] tabular-nums">
                            <span className="text-orange-300 font-bold">{homeTeam.shortName}: {hv}</span>
                            <span className="text-sky-300 font-bold">{awayTeam.shortName}: {av}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 h-1.5">
                            <div className="bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500" style={{ width: `${hp}%` }} />
                            </div>
                            <div className="bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-400" style={{ width: `${ap}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {!hasFullBox ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center space-y-2">
                  <div className="text-sm font-bold text-white">
                    Top Scorer: {summary?.homeTopScorer.name ?? '-'} ({summary?.homeTopScorer.points ?? 0} pt) —{' '}
                    {summary?.awayTopScorer.name ?? '-'} ({summary?.awayTopScorer.points ?? 0} pt)
                  </div>
                  <p className="text-xs text-slate-400">
                    Il tabellino completo giocatore per giocatore è disponibile per le partite simulate da questa versione in poi.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Team Toggle */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveSide('home')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                        activeSide === 'home'
                          ? 'bg-orange-500 text-slate-950 border-orange-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {homeTeam.name} ({game.homeScore ?? 0})
                    </button>
                    <button
                      onClick={() => setActiveSide('away')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                        activeSide === 'away'
                          ? 'bg-orange-500 text-slate-950 border-orange-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {awayTeam.name} ({game.awayScore ?? 0})
                    </button>
                  </div>

                  {/* Box Score Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                          <th className="py-2.5 px-3 text-left">Giocatore ({activeTeam.shortName})</th>
                          <th className="py-2.5 px-2 text-center">Pos</th>
                          <th className="py-2.5 px-2">MIN</th>
                          <th className="py-2.5 px-2 text-orange-400">PTS</th>
                          <th className="py-2.5 px-2">REB</th>
                          <th className="py-2.5 px-2">AST</th>
                          <th className="py-2.5 px-2">STL</th>
                          <th className="py-2.5 px-2">BLK</th>
                          <th className="py-2.5 px-2">TO</th>
                          <th className="py-2.5 px-2">PF</th>
                          <th className="py-2.5 px-2">FG</th>
                          <th className="py-2.5 px-2">3PT</th>
                          <th className="py-2.5 px-2">FT</th>
                          <th className="py-2.5 px-3 text-emerald-400">PIR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activePlayers.map((p) => (
                          <tr
                            key={p.playerId}
                            className="border-b border-slate-800/60 hover:bg-slate-900/70 text-slate-200"
                          >
                            <td className="py-2 px-3 text-left font-semibold">
                              <div className="flex items-center gap-1.5">
                                {p.isStarter && (
                                  <span className="text-[9px] font-extrabold px-1 py-0.5 rounded bg-orange-500/20 text-orange-300">
                                    5
                                  </span>
                                )}
                                {onOpenPlayerProfile ? (
                                  <button
                                    onClick={() => onOpenPlayerProfile(p.playerId)}
                                    className="hover:text-orange-400 hover:underline text-left cursor-pointer"
                                  >
                                    {p.name}
                                  </button>
                                ) : (
                                  <span>{p.name}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center text-slate-400 font-bold">{p.position}</td>
                            <td className="py-2 px-2 font-mono">{p.minutes}'</td>
                            <td className="py-2 px-2 font-mono font-extrabold text-white">{p.points}</td>
                            <td className="py-2 px-2 font-mono">{p.rebounds}</td>
                            <td className="py-2 px-2 font-mono">{p.assists}</td>
                            <td className="py-2 px-2 font-mono">{p.steals}</td>
                            <td className="py-2 px-2 font-mono">{p.blocks}</td>
                            <td className="py-2 px-2 font-mono text-slate-400">{p.turnovers}</td>
                            <td className="py-2 px-2 font-mono text-slate-400">{p.fouls}</td>
                            <td className="py-2 px-2 font-mono">
                              {p.fgm}/{p.fga}
                            </td>
                            <td className="py-2 px-2 font-mono">
                              {p.tpm}/{p.tpa}
                            </td>
                            <td className="py-2 px-2 font-mono">
                              {p.ftm}/{p.fta}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-400">{p.pir}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-900 font-extrabold text-white border-t border-slate-700">
                          <td className="py-2.5 px-3 text-left">TOTALI SQUADRA</td>
                          <td className="py-2.5 px-2 text-center">—</td>
                          <td className="py-2.5 px-2 font-mono">{totals.minutes}'</td>
                          <td className="py-2.5 px-2 font-mono text-orange-400">{totals.points}</td>
                          <td className="py-2.5 px-2 font-mono">{totals.rebounds}</td>
                          <td className="py-2.5 px-2 font-mono">{totals.assists}</td>
                          <td className="py-2.5 px-2 font-mono">{totals.steals}</td>
                          <td className="py-2.5 px-2 font-mono">{totals.blocks}</td>
                          <td className="py-2.5 px-2 font-mono">{totals.turnovers}</td>
                          <td className="py-2.5 px-2 font-mono">{totals.fouls}</td>
                          <td className="py-2.5 px-2 font-mono">
                            {totals.fgm}/{totals.fga}
                          </td>
                          <td className="py-2.5 px-2 font-mono">
                            {totals.tpm}/{totals.tpa}
                          </td>
                          <td className="py-2.5 px-2 font-mono">
                            {totals.ftm}/{totals.fta}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400">{totals.pir}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
