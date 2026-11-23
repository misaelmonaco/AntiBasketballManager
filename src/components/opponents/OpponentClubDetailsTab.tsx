import React from 'react';
import { Building2, Sliders, UserCog } from 'lucide-react';
import { PLAYBOOK_PLAYS } from '../../data/tacticsCatalog';
import { getEffectiveSteps } from '../../engine/customPlayEngine';
import { formatEuro } from '../../engine/ratings';
import { StaffMember, StaffRole, Team } from '../../types';
import { OpponentTeamMetrics } from './opponentAnalytics';

interface OpponentClubDetailsTabProps {
  team: Team;
  metrics: OpponentTeamMetrics;
  onOpenPlayerProfile: (playerId: string) => void;
}

const STAFF_LABELS: { role: StaffRole; title: string }[] = [
  { role: 'assistant_coach', title: 'Vice Allenatore' },
  { role: 'fitness_coach', title: 'Preparatore Atletico' },
  { role: 'scout_director', title: 'Capo Scout' },
];

export const OpponentClubDetailsTab: React.FC<OpponentClubDetailsTabProps> = ({
  team,
  metrics,
  onOpenPlayerProfile,
}) => {
  const tac = team.tactics;
  const goToPlayer = tac.goToPlayerId
    ? team.roster.find((p) => p.id === tac.goToPlayerId)
    : undefined;
  const secondaryPlayer = tac.secondaryOptionPlayerId
    ? team.roster.find((p) => p.id === tac.secondaryOptionPlayerId)
    : undefined;
  const playbookLabels = (tac.playbook ?? []).map(
    (id) => PLAYBOOK_PLAYS.find((p) => p.id === id)?.label ?? id
  );
  const customPlays = (tac.customPlays ?? []).filter((cp) => cp.active);

  const tacticRows = [
    { label: 'Ritmo di Gioco', value: tac.pace },
    { label: 'Focus Offensivo', value: tac.offensiveFocus },
    { label: 'Atteggiamento Offensivo', value: tac.offensiveAggression ?? 'Normale' },
    { label: 'Rimbalzo vs Rientro', value: tac.reboundPolicy ?? 'Equilibrato' },
    { label: 'Sistema Difensivo', value: tac.defense },
    { label: 'Copertura Pick & Roll', value: tac.pnrCoverage ?? 'Hedge & Recover' },
    { label: 'Intensità Difensiva', value: tac.defensiveIntensity ?? 'Standard' },
    { label: 'Focus Avversario', value: tac.opponentFocus ?? 'Equilibrata' },
  ];

  const facilities = team.facilities ?? {
    arenaLevel: 1,
    youthLevel: 1,
    medicalLevel: 1,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Assetto Tattico & Playbook */}
      <div className="fm-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange-400">
          <Sliders className="w-4 h-4" />
          Assetto Tattico &amp; Playbook
        </div>

        <div className="space-y-1.5">
          {tacticRows.map((tr) => (
            <div
              key={tr.label}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/75 border border-slate-800 text-[11px]"
            >
              <span className="text-slate-400">{tr.label}</span>
              <span className="font-bold text-slate-100">{tr.value}</span>
            </div>
          ))}
        </div>

        {(goToPlayer || secondaryPlayer) && (
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
            <div className="text-[10px] font-bold uppercase text-emerald-400">
              Terminali Offensivi
            </div>
            {goToPlayer && (
              <div className="flex items-center justify-between bg-slate-950/75 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-400">1ª Opzione</span>
                <button
                  type="button"
                  onClick={() => onOpenPlayerProfile(goToPlayer.id)}
                  className="font-bold text-orange-300 hover:underline cursor-pointer"
                >
                  {goToPlayer.firstName} {goToPlayer.lastName} ({goToPlayer.primaryPosition})
                </button>
              </div>
            )}
            {secondaryPlayer && (
              <div className="flex items-center justify-between bg-slate-950/75 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-400">2ª Opzione</span>
                <button
                  type="button"
                  onClick={() => onOpenPlayerProfile(secondaryPlayer.id)}
                  className="font-bold text-amber-300 hover:underline cursor-pointer"
                >
                  {secondaryPlayer.firstName} {secondaryPlayer.lastName} (
                  {secondaryPlayer.primaryPosition})
                </button>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="text-[10px] font-bold uppercase text-sky-400">
            Schemi Ricorrenti nel Playbook
          </div>
          {playbookLabels.length === 0 ? (
            <div className="text-[11px] text-slate-500">Nessuno schema specifico selezionato.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {playbookLabels.map((label) => (
                <span
                  key={label}
                  className="px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-[10px] font-semibold text-sky-200"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {customPlays.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="text-[10px] font-bold uppercase text-amber-300">
                Schemi Disegnati Attivi
              </div>
              {customPlays.map((cp) => (
                <div
                  key={cp.id}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-200 flex items-center justify-between"
                >
                  <span className="font-bold truncate">{cp.name}</span>
                  <span className="shrink-0 ml-2 text-amber-300/80">
                    {getEffectiveSteps(cp).length} Fasi · {cp.shooterRole}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Staff Tecnico */}
      <div className="fm-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-400">
          <UserCog className="w-4 h-4" />
          Staff Tecnico
        </div>

        <div className="space-y-2.5">
          {STAFF_LABELS.map(({ role, title }) => {
            const member: StaffMember | null = team.staff?.[role] ?? null;
            return (
              <div
                key={role}
                className="p-3 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {title}
                  </span>
                  {member && (
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-black">
                      Valutazione {member.rating}
                    </span>
                  )}
                </div>
                {member ? (
                  <>
                    <div className="text-sm font-extrabold text-white">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-[11px] text-slate-300">{member.specialty}</div>
                    <div className="text-[10px] text-slate-400">
                      Compenso annuo: <b className="text-slate-200">{formatEuro(member.salary)}</b>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500 italic">Posizione vacante</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1 text-[11px]">
          <div className="text-[10px] font-bold uppercase text-amber-400">
            Programma Settimanale Allenamento
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Focus</span>
            <b className="text-slate-100">{team.training.focus}</b>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Intensità</span>
            <b className="text-slate-100">{team.training.intensity}</b>
          </div>
        </div>
      </div>

      {/* 3. Strutture & Finanze del Club */}
      <div className="fm-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
          <Building2 className="w-4 h-4" />
          Strutture &amp; Finanze del Club
        </div>

        <div className="space-y-2">
          {[
            { label: 'Livello Palazzetto', level: facilities.arenaLevel },
            { label: 'Settore Giovanile', level: facilities.youthLevel },
            { label: 'Staff & Area Medica', level: facilities.medicalLevel },
          ].map((fac) => (
            <div
              key={fac.label}
              className="p-2.5 rounded-xl bg-slate-950/75 border border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">{fac.label}</span>
                <span className="font-black text-emerald-300">{fac.level}/5</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, (fac.level / 5) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/75 border border-slate-800">
            <span className="text-slate-400">Impianto di Casa</span>
            <b className="text-slate-100">
              {team.arena} ({team.arenaCapacity.toLocaleString('it-IT')})
            </b>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/75 border border-slate-800">
            <span className="text-slate-400">Budget Annuale</span>
            <b className="text-white tabular-nums">{formatEuro(team.budget)}</b>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/75 border border-slate-800">
            <span className="text-slate-400">Monte Ingaggi Attuale</span>
            <b className="text-amber-300 tabular-nums">{formatEuro(metrics.wageBill)}</b>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/75 border border-slate-800">
            <span className="text-slate-400">Spazio Salariale Residuo</span>
            <b
              className={`tabular-nums ${
                metrics.freeCap >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatEuro(metrics.freeCap)}
            </b>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/75 border border-slate-800">
            <span className="text-slate-400">Composizione Rosa</span>
            <b className="text-slate-100">
              {metrics.italiansCount} ITA · {metrics.foreignersCount} Stranieri
            </b>
          </div>
          {(team.leagueId ?? 'ITA_LBA') === 'ITA_LBA' && (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/75 border border-slate-800">
              <span className="text-slate-400">Formato LBA Scelto</span>
              <b className="text-sky-300">{team.lbaRosterFormat ?? '6+6'}</b>
            </div>
          )}
          {facilities.sponsorName && (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/75 border border-slate-800">
              <span className="text-slate-400">Main Sponsor</span>
              <b className="text-amber-200">
                {facilities.sponsorName}
                {facilities.sponsorAnnualBonus
                  ? ` (+${formatEuro(facilities.sponsorAnnualBonus)})`
                  : ''}
              </b>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
