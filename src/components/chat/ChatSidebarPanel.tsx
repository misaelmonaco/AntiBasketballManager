import React from 'react';
import { getChatChannelKey, getChatCooldownRemaining } from '../../engine/interactionChatEngine';
import { formatEuro } from '../../engine/ratings';
import { CareerSave, ChatChannel, Player, Team } from '../../types';

interface ChatSidebarPanelProps {
  channel: ChatChannel;
  career: CareerSave;
  userTeam: Team;
  effectivePlayerId?: string;
  currentDate: string;
  pendingChannelKey?: string;
  onSelectPlayer: (playerId: string) => void;
}

export const ChatSidebarPanel: React.FC<ChatSidebarPanelProps> = ({
  channel,
  career,
  userTeam,
  effectivePlayerId,
  currentDate,
  pendingChannelKey,
  onSelectPlayer,
}) => {
  if (channel === 'player') {
    return (
      <>
        <div className="px-4 py-2.5 border-b border-slate-800/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">
          Seleziona Giocatore
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 max-h-40 md:max-h-none">
          {userTeam.roster.map((p: Player) => {
            const active = p.id === effectivePlayerId;
            const cd = getChatCooldownRemaining(
              career.chatHistory,
              'player',
              currentDate,
              p.id
            );
            const isTypingThisPlayer =
              pendingChannelKey === getChatChannelKey('player', p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPlayer(p.id)}
                className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-orange-500/15 border-l-2 border-l-orange-400'
                    : 'hover:bg-slate-900/80'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {p.firstName[0]}. {p.lastName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {p.primaryPosition} • {p.personality}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isTypingThisPlayer && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 animate-pulse">
                      ...
                    </span>
                  )}
                  {cd > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {cd}g
                    </span>
                  )}
                  <span
                    className={`text-[11px] font-black tabular-nums px-1.5 py-0.5 rounded ${
                      p.morale >= 75
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : p.morale >= 55
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-red-500/15 text-red-300'
                    }`}
                  >
                    {p.morale}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  if (channel === 'board') {
    return (
      <div className="p-4 space-y-3 text-xs">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
          Situazione Societaria
        </div>
        <div className="fm-subcard rounded-xl p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Club:</span>
            <strong className="text-white">{userTeam.name}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Fiducia Dirigenza:</span>
            <strong className="text-orange-400">{career.boardConfidence ?? 75}%</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Obiettivo:</span>
            <strong className="text-slate-200">{career.boardObjective ?? 'Playoff'}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Budget Attuale:</span>
            <strong className="text-emerald-300">{formatEuro(userTeam.budget)}</strong>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Puoi confrontarti con la proprietà ogni 14 giorni. Con fiducia alta puoi richiedere extra-budget sacrificando parte della stima societaria.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 text-xs">
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
        Sala Stampa &amp; Ambiente
      </div>
      <div className="fm-subcard rounded-xl p-3 space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Reputazione Coach:</span>
          <strong className="text-sky-300">
            {career.managerProfile?.reputation ?? 58}/99
          </strong>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Chimica Spogliatoio:</span>
          <strong className="text-emerald-300">{userTeam.chemistry}%</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Spogliatoio (Skill):</span>
          <strong className="text-orange-300">
            {career.managerProfile?.attributes.lockerRoom ?? 10}/20
          </strong>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Le dichiarazioni alla stampa influenzano l’umore collettivo del gruppo, la chimica e la tua reputazione nella lega.
      </p>
    </div>
  );
};
