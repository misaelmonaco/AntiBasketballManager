import React from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck, Target } from 'lucide-react';
import {
  createDefaultManagerProfile,
  getTeamBoardObjective,
  MANAGER_PHILOSOPHIES,
} from '../../engine/managerEngine';
import { computeSeasonMovements } from '../../engine/seasonTransition';
import type { RosterValidationResult } from '../../engine/ratings';
import { CareerSave, LeagueId, Team } from '../../types';
import { ManagerAvatar } from '../ManagerAvatar';

export const OfficeRegulationBanner: React.FC<{
  regulationAlert: string;
  onOpenCompliance: () => void;
  onDismiss: () => void;
}> = ({ regulationAlert, onOpenCompliance, onDismiss }) => (
  <div className="fm-card rounded-2xl p-4 border border-sky-500/40 bg-sky-500/10 flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
      <div>
        <div className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
          Cambio Categoria — Adeguamento Regolamento Roster
        </div>
        <p className="text-xs text-slate-200 mt-0.5">{regulationAlert}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={onOpenCompliance}
        className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold cursor-pointer"
      >
        Adatta Roster
      </button>
      <button
        onClick={onDismiss}
        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
      >
        Ho capito
      </button>
    </div>
  </div>
);

export const OfficeOffseasonBanner: React.FC<{
  seasonYear: number;
  validation: RosterValidationResult;
  incomingOffersCount: number;
  onOpenCompliance: () => void;
  onOpenMarket: () => void;
  onStartRegularSeason: () => void;
}> = ({
  seasonYear,
  validation,
  incomingOffersCount,
  onOpenCompliance,
  onOpenMarket,
  onStartRegularSeason,
}) => (
  <div className="fm-card rounded-2xl p-5 border border-sky-500/40 bg-gradient-to-r from-sky-500/10 via-slate-900 to-orange-500/10 flex flex-wrap items-center justify-between gap-4">
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400">
        Offseason & Mercato Estivo • Stagione {seasonYear}/{String(seasonYear + 1).slice(-2)}
      </div>
      <h2 className="text-lg font-black text-white">
        Costruzione Squadra & Adeguamento al Campionato
      </h2>
      <p className="text-xs text-slate-300 mt-0.5">
        Regola attiva: <b className="text-orange-300">{validation.ruleLabel}</b> • Stato attuale:{' '}
        {validation.valid ? (
          <span className="text-emerald-400 font-bold">Roster conforme al campionato</span>
        ) : (
          <span className="text-red-400 font-bold">{validation.errors[0]}</span>
        )}
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onOpenCompliance}
        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-bold cursor-pointer"
      >
        Costruttore Roster & Regole
      </button>
      <button
        onClick={onOpenMarket}
        className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-bold cursor-pointer"
      >
        Mercato Estivo ({incomingOffersCount > 0 ? `${incomingOffersCount} offerte` : 'Apri'})
      </button>
      <button
        onClick={onStartRegularSeason}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/25 cursor-pointer"
      >
        Avvia Regular Season
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export const OfficeSeasonFinishedBanner: React.FC<{
  career: CareerSave;
  userLeagueId: LeagueId;
  onStartNextSeason: () => void;
}> = ({ career, userLeagueId, onStartNextSeason }) => {
  const movements = computeSeasonMovements(
    career.teams,
    career.schedule,
    userLeagueId,
    career.championTeamId
  );
  const nextSeasonYr = career.seasonYear + 1;
  return (
    <div className="fm-card rounded-2xl p-5 border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
            Stagione {career.seasonYear}/{String(career.seasonYear + 1).slice(-2)} Conclusa
          </div>
          <h2 className="text-lg font-black text-white">
            Promozioni, Retrocessioni & Passaggio alla Nuova Stagione
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Ricalcola la composizione dei campionati, aggiorna i contratti e avvia la stagione{' '}
            {nextSeasonYr}/{String(nextSeasonYr + 1).slice(-2)} (inizio 3ª settimana di settembre).
          </p>
        </div>
        <button
          onClick={onStartNextSeason}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/25 cursor-pointer"
        >
          Avvia Offseason {nextSeasonYr}/{String(nextSeasonYr + 1).slice(-2)}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase text-emerald-400 mb-1">
            Promosse in LBA (1ª + PO A2)
          </div>
          <div className="text-slate-200 font-semibold">
            {movements.promotedToLba.map((t) => t.name).join(' • ') || '-'}
          </div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase text-red-400 mb-1">
            Retrocesse in Serie A2
          </div>
          <div className="text-slate-200 font-semibold">
            {movements.relegatedFromLba.map((t) => t.name).join(' • ') || '-'}
          </div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase text-sky-400 mb-1">
            Promosse in Serie A2 (da B)
          </div>
          <div className="text-slate-200 font-semibold">
            {movements.promotedToA2.map((t) => t.name).join(' • ') || '-'}
          </div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase text-amber-400 mb-1">
            Retrocesse in Serie B
          </div>
          <div className="text-slate-200 font-semibold">
            {movements.relegatedFromA2.map((t) => t.name).join(' • ') || '-'}
          </div>
        </div>
      </div>
    </div>
  );
};

export const OfficeManagerConfidenceBar: React.FC<{
  career: CareerSave;
  userTeam: Team;
}> = ({ career, userTeam }) => {
  const profile = career.managerProfile ?? createDefaultManagerProfile(career.managerName);
  const phil = MANAGER_PHILOSOPHIES.find((p) => p.id === profile.philosophy);
  const objective = career.boardObjective ?? getTeamBoardObjective(userTeam.prestige);
  const allowFiring = career.allowFiring ?? true;
  const confidence = career.boardConfidence ?? 75;
  const confStatus =
    confidence >= 70
      ? { label: 'Salda', color: 'bg-emerald-500', text: 'text-emerald-400' }
      : confidence >= 40
      ? { label: 'Stabile', color: 'bg-amber-500', text: 'text-amber-400' }
      : { label: 'A rischio esonero', color: 'bg-red-500', text: 'text-red-400' };

  return (
    <div className="fm-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: userTeam.primaryColor }}
      />
      <div className="flex items-center gap-3.5 pl-1">
        <ManagerAvatar
          avatar={profile.avatar}
          clubColor={userTeam.primaryColor}
          size="md"
        />
        <div>
          <div className="text-sm font-black text-white flex items-center gap-2">
            <span>
              {profile.firstName} {profile.lastName}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[10px] font-extrabold tabular-nums">
              Rep. {profile.reputation}/100
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-sky-300 font-semibold">{phil?.title ?? 'Filosofia Tattica'}</span>
            <span className="text-slate-600">•</span>
            <span className="tabular-nums">
              Att {profile.attributes.offenseSpacing} | Dif {profile.attributes.defenseOrg} | Gest{' '}
              {profile.attributes.lockerRoom} | Live {profile.attributes.liveTactics}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="text-xs">
          <div className="text-slate-400 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-orange-400" />
            Obiettivo Società
          </div>
          <div className="font-black text-white mt-0.5">{objective}</div>
        </div>

        <div className="w-64 space-y-1.5">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              Fiducia Dirigenza
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                  allowFiring
                    ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {allowFiring ? 'Esonero <20%' : 'Panchina Blindata'}
              </span>
              <span className={`font-black tabular-nums ${confStatus.text}`}>
                {confidence}% • {confStatus.label}
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${confStatus.color}`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
