import React, { useMemo, useState } from 'react';
import { Globe, ShieldAlert, ShieldCheck } from 'lucide-react';
import { LEAGUES } from '../../data/teams';
import { getEffectiveTeamTemplates } from '../../services/editorDbService';
import { getTeamBoardObjective } from '../../engine/managerEngine';
import { LeagueId } from '../../types';
import { ClubBadge } from '../ClubBadge';

interface WizardStepClubProps {
  selectedTeamId: string;
  slotName: string;
  allowFiring: boolean;
  onSelectTeam: (id: string) => void;
  onSlotNameChange: (v: string) => void;
  onAllowFiringChange: (val: boolean) => void;
}

export const WizardStepClub: React.FC<WizardStepClubProps> = ({
  selectedTeamId,
  slotName,
  allowFiring,
  onSelectTeam,
  onSlotNameChange,
  onAllowFiringChange,
}) => {
  const allTeams = useMemo(() => getEffectiveTeamTemplates(), []);
  const initialLeague =
    allTeams.find((t) => t.id === selectedTeamId)?.leagueId ?? 'ITA_LBA';
  const [activeLeague, setActiveLeague] = useState<LeagueId>(initialLeague);

  const leagueConfig = LEAGUES.find((l) => l.id === activeLeague) ?? LEAGUES[0];
  const leagueTeams = allTeams.filter((t) => t.leagueId === activeLeague);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <h3 className="text-sm font-extrabold text-white">
            Seleziona Campionato & Club ({allTeams.length} Squadre Italiane)
          </h3>
          <span className="text-[11px] text-slate-400">
            {leagueConfig.name} • {leagueConfig.teamsCount} squadre • OVR medio{' '}
            <strong className="text-orange-400">{leagueConfig.avgOverall}</strong>
          </span>
        </div>

        {/* League Selector Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {LEAGUES.map((lg) => {
            const isActive = lg.id === activeLeague;
            return (
              <button
                key={lg.id}
                onClick={() => {
                  setActiveLeague(lg.id);
                  const first = allTeams.find((t) => t.leagueId === lg.id);
                  if (first) onSelectTeam(first.id);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-slate-950 border-orange-400'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {lg.shortName} <span className="opacity-70">({lg.avgOverall})</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {leagueTeams.map((t) => {
            const active = t.id === selectedTeamId;
            const obj = getTeamBoardObjective(t.prestige);
            return (
              <button
                key={t.id}
                onClick={() => onSelectTeam(t.id)}
                className={`relative overflow-hidden p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/15 ring-1 ring-orange-500/40'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    background: `linear-gradient(90deg, ${t.primaryColor}, ${t.secondaryColor})`,
                  }}
                />
                <div className="flex items-center justify-between gap-1 mb-2 pt-0.5">
                  <ClubBadge
                    shortName={t.shortName}
                    primaryColor={t.primaryColor}
                    secondaryColor={t.secondaryColor}
                    size="sm"
                  />
                  <div className="flex flex-col items-end gap-0.5">
                    {t.euroCup && (
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                          t.euroCup === 'EL'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        }`}
                      >
                        <Globe className="w-2.5 h-2.5" />
                        {t.euroCup}
                      </span>
                    )}
                    <span className="text-[11px] font-extrabold tabular-nums text-slate-300">
                      OVR {t.avgOverall}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-bold text-white truncate">{t.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{t.city}</div>
                <div className="text-[10px] text-orange-300 font-semibold mt-1 truncate">{obj}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sicurezza Panchina (Con/Senza Esoneri) */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5">
        <div className="text-xs font-extrabold text-white">
          Sicurezza Panchina (Regola Esoneri)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onAllowFiringChange(true)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              allowFiring
                ? 'bg-orange-500/15 border-orange-500 text-white'
                : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              Con possibili esoneri (Realistica)
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Se la fiducia dirigenza crolla sotto il 20%, la società può esonerarti e ripartirai da un nuovo club.
            </div>
          </button>

          <button
            type="button"
            onClick={() => onAllowFiringChange(false)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              !allowFiring
                ? 'bg-emerald-500/15 border-emerald-500 text-white'
                : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Senza esoneri (Panchina blindata)
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Massima libertà dirigenziale: non potrai mai essere esonerato qualsiasi sia il risultato stagionale.
            </div>
          </button>
        </div>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
        <label className="block text-xs font-semibold text-slate-400 mb-1">
          Nome Salvataggio Locale
        </label>
        <input
          value={slotName}
          onChange={(e) => onSlotNameChange(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
        />
      </div>
    </div>
  );
};
