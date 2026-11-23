import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { PlayerBoxScore } from '../../types';

export const MatchBoxScoreRow: React.FC<{ p: PlayerBoxScore }> = ({ p }) => {
  const openPlayerProfile = useGameStore((s) => s.openPlayerProfile);
  const fgPct = p.fga > 0 ? Math.round((p.fgm / p.fga) * 100) : 0;
  const tpPct = p.tpa > 0 ? Math.round((p.tpm / p.tpa) * 100) : 0;
  const ftPct = p.fta > 0 ? Math.round((p.ftm / p.fta) * 100) : 0;

  return (
    <tr className={`${p.onCourt ? 'bg-orange-500/5' : ''} hover:bg-slate-800/40 tabular-nums`}>
      <td className="py-1.5 px-2.5 sticky left-0 bg-slate-900/95">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              p.fouledOut ? 'bg-red-500' : p.onCourt ? 'bg-emerald-400' : 'bg-slate-600'
            }`}
          />
          <button
            onClick={() => openPlayerProfile(p.playerId)}
            className="font-semibold text-slate-100 hover:text-orange-400 hover:underline text-left cursor-pointer truncate max-w-[130px]"
          >
            {p.name}
          </button>
          <span className="text-[10px] font-bold text-slate-500 shrink-0">{p.position}</span>
        </div>
      </td>
      <td className="py-1.5 px-2 text-center text-slate-400">
        {Math.floor(p.secondsPlayed / 60)}
      </td>
      <td className="py-1.5 px-2 text-center font-extrabold text-white">{p.points}</td>
      <td className="py-1.5 px-2 text-center text-slate-300">{p.rebounds}</td>
      <td className="py-1.5 px-2 text-center text-slate-300">{p.assists}</td>
      <td className="py-1.5 px-2 text-center text-slate-300">{p.steals}</td>
      <td className="py-1.5 px-2 text-center text-slate-300">{p.blocks}</td>
      <td className="py-1.5 px-2 text-center text-slate-400">{p.turnovers}</td>
      <td className="py-1.5 px-2 text-center text-slate-300">
        {p.fga > 0 ? `${fgPct}%` : '-'}
      </td>
      <td className="py-1.5 px-2 text-center text-slate-300">
        {p.tpa > 0 ? `${tpPct}%` : '-'}
      </td>
      <td className="py-1.5 px-2 text-center text-slate-300">
        {p.fta > 0 ? `${ftPct}%` : '-'}
      </td>
      <td
        className={`py-1.5 px-2 text-center font-bold ${
          p.fouls >= 5 ? 'text-red-400' : p.fouls === 4 ? 'text-amber-400' : 'text-slate-400'
        }`}
      >
        {p.fouls}
      </td>
      <td className="py-1.5 px-2.5 text-center font-extrabold text-orange-400">{p.pir}</td>
    </tr>
  );
};
