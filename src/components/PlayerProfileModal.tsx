import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  HeartPulse,
  FileSignature,
  UserX,
  Binoculars,
  Handshake,
  User,
  Trophy,
  ClipboardList,
  MessageSquare,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { calculateWageBill } from '../engine/ratings';
import { computePlayerCareerSummary } from '../engine/careerStatsUtils';
import {
  getAttributeEstimate,
  getPlayerBuyoutClause,
} from '../engine/scoutingEngine';
import { Player, Team } from '../types';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { COUNTRY_NAMES, CountryFlag, FormationBadge } from './CountryFlag';
import { PlayerCareerStatsTable } from './player/PlayerCareerStatsTable';
import { PlayerSkillsGrid, StarRating } from './player/PlayerSkillsGrid';

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(val);
}

export const PlayerProfileModal: React.FC = () => {
  const {
    career,
    inspectedPlayerId,
    closePlayerProfile,
    startScoutingPlayer,
    cutPlayer,
    renewPlayerContract,
    negotiateFreeAgent,
    buyoutRivalPlayer,
    openChatModal,
  } = useGameStore();

  const [showNegModal, setShowNegModal] = useState<boolean>(false);

  if (!career || !inspectedPlayerId) return null;

  let foundPlayer: Player | undefined;
  let ownerTeam: Team | null = null;
  for (const t of career.teams) {
    const p =
      t.roster.find((x) => x.id === inspectedPlayerId) ??
      (t.youthRoster ?? []).find((x) => x.id === inspectedPlayerId);
    if (p) {
      foundPlayer = p;
      ownerTeam = t;
      break;
    }
  }
  if (!foundPlayer) {
    foundPlayer = career.freeAgents.find((x) => x.id === inspectedPlayerId);
  }
  if (!foundPlayer) return null;

  const player = foundPlayer;
  const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
  const isUserPlayer = ownerTeam?.id === userTeam.id;
  const isFreeAgent = ownerTeam === null;
  const isScouted = isUserPlayer || career.scoutedPlayerIds.includes(player.id);
  const isScouting = career.activeScouting.some((s) => s.playerId === player.id);
  const scoutRating = userTeam.staff?.scout_director?.rating ?? 60;
  const freeCap = userTeam.budget - calculateWageBill(userTeam.roster);

  const buyoutCost = getPlayerBuyoutClause(player);
  const expiryYear = career.seasonYear + player.contractYears;

  const attr = player.attributes;
  const consistency = Math.round((attr.basketballIQ + attr.stamina) / 2);
  const leadership = Math.round((attr.basketballIQ + player.morale) / 2);

  const allSkillValues = [
    attr.passing,
    attr.ballHandling,
    attr.finishing,
    attr.twoPoint,
    attr.threePoint,
    attr.freeThrow,
    attr.perimeterDef,
    attr.postDef,
    attr.steals,
    attr.rebounding,
    attr.blocks,
    attr.athleticism,
    attr.stamina,
    attr.basketballIQ,
  ];
  const skillsIndex = Math.round(
    allSkillValues.reduce((sum, v) => sum + v, 0) / allSkillValues.length
  );

  // Season & Career Stats helpers
  const careerSummary = computePlayerCareerSummary(player.seasonStats, player.careerHistory);
  const estimatedPotential = Math.min(99, player.overall + Math.max(0, 27 - player.age) * 2);

  return (
    <div className="fixed inset-0 top-9 z-40 bg-slate-950 flex flex-col overflow-hidden">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={closePlayerProfile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Indietro
          </button>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            {ownerTeam ? ownerTeam.name : 'Mercato Free Agent'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isUserPlayer ? (
            <>
              <button
                type="button"
                onClick={() => openChatModal({ channel: 'player', playerId: player.id })}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-bold text-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Parla / Chat
              </button>
              <button
                onClick={() => setShowNegModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <FileSignature className="w-3.5 h-3.5" />
                Offri Rinnovo
              </button>
              <button
                onClick={() => {
                  const res = cutPlayer(player.id);
                  if (res.ok) closePlayerProfile();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800/60 font-semibold text-xs cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5" />
                Taglia
              </button>
            </>
          ) : (
            <>
              {!isScouted && (
                <button
                  onClick={() =>
                    startScoutingPlayer(
                      player.id,
                      `${player.firstName} ${player.lastName}`,
                      ownerTeam ? ownerTeam.shortName : 'Free Agent'
                    )
                  }
                  disabled={isScouting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sky-300 font-bold text-xs cursor-pointer"
                >
                  <Binoculars className="w-3.5 h-3.5" />
                  {isScouting ? 'Osservazione in corso' : 'Osserva Giocatore'}
                </button>
              )}
              <button
                onClick={() => setShowNegModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <Handshake className="w-3.5 h-3.5" />
                {isFreeAgent ? 'Fai Offerta' : 'Paga Buyout & Tratta'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Sheet */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* 1. Classic Player Identity Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/90 border border-orange-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl border-2 border-slate-700 flex flex-col items-center justify-center shadow-lg relative shrink-0"
                style={{
                  backgroundColor: ownerTeam ? ownerTeam.primaryColor : '#1e293b',
                  color: ownerTeam ? ownerTeam.secondaryColor : '#94a3b8',
                }}
              >
                <User className="w-5 h-5 opacity-40 absolute top-1.5" />
                <span className="text-xl font-black mt-4">#{player.jerseyNumber}</span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CountryFlag nationality={player.nationality} size="lg" />
                  <h1 className="text-xl font-black text-white tracking-tight">
                    {player.firstName} {player.lastName}
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-extrabold">
                    {player.primaryPosition}
                    {player.secondaryPosition ? ` / ${player.secondaryPosition}` : ''}
                  </span>
                  {player.isItalianFormation ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      Form. ITA
                    </span>
                  ) : (
                    <FormationBadge isItalianFormation={false} />
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {ownerTeam ? ownerTeam.name : 'Free Agent'} • {COUNTRY_NAMES[player.nationality] ?? player.nationality}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-2.5 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Ability (OVR)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-orange-400">
                      {isScouted
                        ? player.overall
                        : (() => {
                            const est = getAttributeEstimate(
                              player.overall,
                              player.id,
                              'ovr',
                              scoutRating
                            );
                            return `${est.min}-${est.max}`;
                          })()}
                    </span>
                    <StarRating
                      value={
                        isScouted
                          ? player.overall
                          : (() => {
                              const est = getAttributeEstimate(
                                player.overall,
                                player.id,
                                'ovr',
                                scoutRating
                              );
                              return Math.round((est.min + est.max) / 2);
                            })()
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Forma / Morale
                </div>
                <div className="text-sm font-black text-white">
                  {player.condition}% <span className="text-slate-500">/</span>{' '}
                  <span className="text-emerald-400">
                    {isScouted ? `${player.morale}%` : '?'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Upper Split: Contract & Bio (Left) + Palmarès (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 bg-slate-900/90 border border-red-900/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-3">
                <ClipboardList className="w-4 h-4" />
                Contratto & Anagrafica
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Stipendio Attuale:</span>
                  <span className="font-bold text-orange-300">
                    {formatCurrency(player.salary)} / anno
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Durata Contratto:</span>
                  <span className="font-bold text-white">
                    {player.contractYears} {player.contractYears === 1 ? 'anno' : 'anni'} (scad. {expiryYear})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Età / Nascita:</span>
                  <span className="font-semibold text-slate-100">
                    {player.age} anni ({player.birthDate})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Altezza / Peso:</span>
                  <span className="font-semibold text-slate-100">
                    {player.heightCm} cm • {player.weightKg} kg
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Ruolo / Personalità:</span>
                  <span className="font-semibold text-slate-100">
                    {player.promisedRole} • {player.personality}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Clausola Buyout:</span>
                  <span className="font-semibold text-slate-100">
                    {isFreeAgent ? 'Svincolato (€0)' : formatCurrency(buyoutCost)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <HeartPulse
                    className={`w-4 h-4 ${
                      player.injuryWeeks > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  />
                  <span
                    className={
                      player.injuryWeeks > 0
                        ? 'font-bold text-red-400'
                        : 'font-semibold text-emerald-300'
                    }
                  >
                    {player.injuryWeeks > 0
                      ? `Infortunato (${player.injuryWeeks} settimane rimanenti)`
                      : 'Idoneo al gioco — Nessun infortunio'}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  {player.rosterSlot === 'starter'
                    ? 'Quintetto Base'
                    : player.rosterSlot === 'bench'
                      ? 'Panchina (A Referto)'
                      : 'Tribuna / Riserva'}
                </span>
              </div>
            </div>

            {/* Palmarès / Riepilogo Carriera */}
            <div className="lg:col-span-4 bg-slate-900/90 border border-red-900/50 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                  <Trophy className="w-4 h-4" />
                  Palmarès & Carriera
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stagioni simulate:</span>
                    <span className="font-bold text-white">{careerSummary.seasonsPlayed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Partite totali:</span>
                    <span className="font-bold text-white">{careerSummary.totalGp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Punti totali carriera:</span>
                    <span className="font-bold text-orange-400">{careerSummary.totalPts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Potenziale stimato:</span>
                    <span className="font-bold text-emerald-400">
                      {isScouted ? estimatedPotential : 'Osservazione richiesta'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                Target minuti: <b className="text-slate-300">{player.targetMinutes} min</b> • Priorità:{' '}
                <b className="text-slate-300">{player.minutePriority}</b>
              </div>
            </div>
          </div>

          {/* 3. Middle Section: Season & Career Stats Table */}
          <PlayerCareerStatsTable
            player={player}
            seasonYear={career.seasonYear}
            ownerTeam={ownerTeam}
          />

          {/* 4. Bottom Section: 4 Skill Columns + Skills Index */}
          <PlayerSkillsGrid
            player={player}
            isScouted={isScouted}
            scoutRating={scoutRating}
            estimatedPotential={estimatedPotential}
            leadership={leadership}
            consistency={consistency}
            skillsIndex={skillsIndex}
          />
        </div>
      </div>

      {/* Quick Contract Negotiation Modal */}
      {showNegModal && (
        <ContractNegotiationModal
          player={player}
          mode={isUserPlayer ? 'renewal' : isFreeAgent ? 'free_agent' : 'buyout'}
          freeCap={isUserPlayer ? freeCap + player.salary : freeCap}
          buyoutCost={!isUserPlayer && !isFreeAgent ? buyoutCost : 0}
          rivalTeamName={ownerTeam?.name}
          isScouted={isScouted}
          onClose={() => setShowNegModal(false)}
          onSubmit={(salary, years, role) => {
            if (isUserPlayer) {
              return renewPlayerContract(player.id, salary, years, role);
            }
            if (isFreeAgent) {
              return negotiateFreeAgent(player.id, salary, years, role);
            }
            return buyoutRivalPlayer(ownerTeam!.id, player.id, salary, years, role);
          }}
        />
      )}
    </div>
  );
};
