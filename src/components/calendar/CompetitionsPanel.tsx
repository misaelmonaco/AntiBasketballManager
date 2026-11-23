import React, { useState } from 'react';
import { Award, Globe, Trophy } from 'lucide-react';
import { CoppaItaliaState, EuroCompetitionState, EuropeanCupId } from '../../types';
import { CountryFlag } from '../CountryFlag';

interface CompetitionsPanelProps {
  coppaItalia?: CoppaItaliaState;
  euroLeagues?: Record<EuropeanCupId, EuroCompetitionState>;
  userTeamId: string;
}

export const CompetitionsPanel: React.FC<CompetitionsPanelProps> = ({
  coppaItalia,
  euroLeagues,
  userTeamId,
}) => {
  const [compTab, setCompTab] = useState<'coppa' | 'EL' | 'EC'>('EL');

  const activeEuro = compTab === 'EL' || compTab === 'EC' ? euroLeagues?.[compTab] : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 fm-card rounded-2xl p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Globe className="w-4 h-4 text-orange-400" />
          Coppe Nazionali & Competizioni Europee
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(
            [
              ['EL', 'EuroLega (EL)'],
              ['EC', 'EuroCup (EC)'],
              ['coppa', 'Coppa Italia LBA'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setCompTab(id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                compTab === id
                  ? 'bg-orange-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {compTab === 'coppa' && (
        <div className="fm-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Final Eight Coppa Italia LBA
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Si disputa tra le prime 8 squadre della Serie A al termine del girone d'andata (16ª giornata).
              </p>
            </div>
            {coppaItalia?.winnerName && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Vincitrice: {coppaItalia.winnerName}
              </div>
            )}
          </div>

          {!coppaItalia?.started ? (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
              La Final Eight inizierà automaticamente alla 16ª giornata di Regular Season.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['Quarti', 'Semifinali', 'Finale'] as const).map((stage) => {
                const stageMatches = coppaItalia.matches.filter((m) => m.stage === stage);
                return (
                  <div key={stage} className="space-y-2.5">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400">
                      {stage}
                    </div>
                    {stageMatches.map((m) => {
                      const isUser =
                        m.homeTeamId === userTeamId || m.awayTeamId === userTeamId;
                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                            isUser
                              ? 'bg-orange-500/10 border-orange-500/40'
                              : 'bg-slate-950/70 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={
                                m.winnerId === m.homeTeamId
                                  ? 'font-extrabold text-white'
                                  : 'text-slate-400'
                              }
                            >
                              {m.homeTeamName}
                            </span>
                            <span className="font-mono font-bold text-orange-400">
                              {m.homeScore ?? '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className={
                                m.winnerId === m.awayTeamId
                                  ? 'font-extrabold text-white'
                                  : 'text-slate-400'
                              }
                            >
                              {m.awayTeamName}
                            </span>
                            <span className="font-mono font-bold text-orange-400">
                              {m.awayScore ?? '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeEuro && (
        <div className="fm-card rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-white">{activeEuro.name}</h3>
              <p className="text-[11px] text-slate-400">
                Turno {activeEuro.roundsPlayed} / {activeEuro.totalRounds} • Le squadre italiane sono evidenziate
              </p>
            </div>
            {activeEuro.championName && (
              <span className="px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
                1ª Classificata: {activeEuro.championName}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-3">Squadra</th>
                  <th className="py-2.5 px-2 text-center">G</th>
                  <th className="py-2.5 px-2 text-center">V</th>
                  <th className="py-2.5 px-2 text-center">P</th>
                  <th className="py-2.5 px-2 text-center">PF</th>
                  <th className="py-2.5 px-2 text-center">PS</th>
                  <th className="py-2.5 px-3 text-center">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeEuro.standings.map((row, idx) => {
                  const diff = row.pointsFor - row.pointsAgainst;
                  const isUser = row.teamId === userTeamId;
                  return (
                    <tr
                      key={row.teamId}
                      className={
                        isUser
                          ? 'bg-orange-500/15 text-orange-200 font-bold'
                          : row.isItalian
                          ? 'bg-sky-500/5 text-sky-200 font-semibold'
                          : 'hover:bg-slate-800/40 text-slate-200'
                      }
                    >
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block w-6 text-center py-0.5 rounded font-bold ${
                            idx < 8
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <CountryFlag nationality={row.country as 'ITA'} size="sm" />
                          <span>{row.teamName}</span>
                          {row.isItalian && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-extrabold">
                              ITA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">{row.played}</td>
                      <td className="py-2.5 px-2 text-center text-emerald-400">{row.wins}</td>
                      <td className="py-2.5 px-2 text-center text-red-400">{row.losses}</td>
                      <td className="py-2.5 px-2 text-center text-slate-400">{row.pointsFor}</td>
                      <td className="py-2.5 px-2 text-center text-slate-400">{row.pointsAgainst}</td>
                      <td
                        className={`py-2.5 px-3 text-center font-semibold ${
                          diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
