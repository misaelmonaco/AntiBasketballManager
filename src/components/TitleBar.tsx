import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Trophy } from 'lucide-react';
import { isTauriRuntime } from '../services/saveService';
import { useGameStore } from '../store/gameStore';

export const TitleBar: React.FC = () => {
  const career = useGameStore((s) => s.career);
  const userTeam = career?.teams.find((t) => t.id === career.userTeamId);

  const handleMinimize = async () => {
    if (isTauriRuntime()) {
      await getCurrentWindow().minimize();
    }
  };

  const handleMaximize = async () => {
    if (isTauriRuntime()) {
      await getCurrentWindow().toggleMaximize();
    }
  };

  const handleClose = async () => {
    if (isTauriRuntime()) {
      await getCurrentWindow().close();
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="h-9 bg-slate-950 border-b border-slate-800/90 flex items-center justify-between px-3 select-none shrink-0"
    >
      <div data-tauri-drag-region className="flex items-center gap-2.5 text-xs">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-sm shadow-orange-500/30">
          <Trophy className="w-3 h-3 text-slate-950 stroke-[2.5]" />
        </div>
        <span className="font-bold tracking-wide text-slate-100">
          BASKET MANAGER <span className="text-orange-400">ITALIA</span>
        </span>
        {userTeam && (
          <div className="hidden sm:flex items-center gap-2 ml-3 pl-3 border-l border-slate-800 text-slate-400">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: userTeam.primaryColor }}
            />
            <span className="text-slate-200 font-medium">{userTeam.name}</span>
            <span className="text-slate-600">•</span>
            <span>
              {career?.phase === 'offseason'
                ? 'Offseason & Mercato Estivo'
                : career?.phase === 'regular'
                ? `Giornata ${career.currentRound}/30`
                : career?.phase === 'playoffs'
                ? 'Playoff Scudetto'
                : 'Stagione Conclusa'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleMinimize}
          title="Riduci a icona"
          className="w-8 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          title="Ingrandisci / Ripristina"
          className="w-8 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          title="Chiudi"
          className="w-8 h-7 flex items-center justify-center rounded hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
