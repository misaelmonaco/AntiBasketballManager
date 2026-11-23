import React, { useState } from 'react';
import { UserCog, UserMinus, UserPlus, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { formatEuro } from '../engine/ratings';
import { StaffRole } from '../types';
import { PageHeader } from './PageHeader';

const ROLE_META: Record<StaffRole, { title: string; effectDesc: string }> = {
  assistant_coach: {
    title: 'Vice Allenatore',
    effectDesc: 'Bonus tattico in attacco/difesa durante la partita.',
  },
  fitness_coach: {
    title: 'Preparatore Atletico',
    effectDesc: 'Accelera il recupero fisico tra le gare e riduce gli infortuni.',
  },
  scout_director: {
    title: 'Resp. Scouting / Sviluppo',
    effectDesc: 'Migliora la crescita settimanale dei giovani (≤ 24 anni).',
  },
};

export const StaffView: React.FC = () => {
  const { career, hireStaffMember, fireStaffMember } = useGameStore();
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole>('all');
  const [marketModalRole, setMarketModalRole] = useState<StaffRole | null>(null);

  if (!career) return null;
  const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;

  const staffBill = Object.values(userTeam.staff ?? {}).reduce(
    (sum, s) => sum + (s?.salary ?? 0),
    0
  );

  const availableMarket = career.staffMarket.filter((s) =>
    roleFilter === 'all' ? true : s.role === roleFilter
  );

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Area Tecnica & Medica"
        title="Staff Tecnico"
        subtitle={`Gestisci i membri dello staff di ${userTeam.name} e ingaggia sostituti dal mercato`}
        right={
          <div className="fm-subcard px-4 py-2 rounded-xl text-xs text-slate-300 tabular-nums">
            Costo Staff Annuo: <b className="text-orange-400">{formatEuro(staffBill)}</b>
          </div>
        }
      />

      {/* 1. MEMBRI ATTUALI DELLO STAFF */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['assistant_coach', 'fitness_coach', 'scout_director'] as StaffRole[]).map((role) => {
          const member = userTeam.staff[role];
          const meta = ROLE_META[role];
          return (
            <div key={role} className="fm-card rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                    {meta.title}
                  </span>
                  {member && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-extrabold text-xs tabular-nums">
                      VAL {member.rating}
                    </span>
                  )}
                </div>

                {member ? (
                  <div className="space-y-1">
                    <div className="text-base font-bold text-white">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs text-emerald-400 font-medium">
                      Specialità: {member.specialty}
                    </div>
                    <div className="text-xs text-slate-400 tabular-nums">
                      Ingaggio: {formatEuro(member.salary)}/anno
                    </div>
                  </div>
                ) : (
                  <div className="py-3 text-xs text-red-400 font-semibold">
                    Ruolo scoperto — Nessun bonus attivo
                  </div>
                )}

                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                  {meta.effectDesc}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => setMarketModalRole(role)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {member ? 'Sostituisci' : 'Assumi'}
                </button>
                {member && (
                  <button
                    onClick={() => fireStaffMember(role)}
                    title="Licenzia"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. MERCATO SOSTITUTI */}
      <div className="fm-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <UserCog className="w-4 h-4 text-sky-400" />
            Mercato Sostituti Staff ({availableMarket.length})
          </div>

          <div className="fm-tabs">
            {(
              [
                ['all', 'Tutti i Ruoli'],
                ['assistant_coach', 'Vice Allenatori'],
                ['fitness_coach', 'Preparatori'],
                ['scout_director', 'Resp. Scouting'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setRoleFilter(id)}
                className={`fm-tab ${roleFilter === id ? 'fm-tab-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {availableMarket.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Nessun profilo disponibile al momento per questo ruolo.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {availableMarket.map((s) => {
              const currentInRole = userTeam.staff[s.role];
              return (
                <div
                  key={s.id}
                  className="fm-subcard rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
                      {ROLE_META[s.role].title}
                    </div>
                    <div className="font-bold text-white text-sm truncate mt-0.5">
                      {s.firstName} {s.lastName}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {s.specialty} • <span className="tabular-nums">{formatEuro(s.salary)}/anno</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-black text-xs tabular-nums">
                      VAL {s.rating}
                    </span>
                    <button
                      onClick={() => hireStaffMember(s.id)}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold text-xs cursor-pointer"
                    >
                      {currentInRole ? 'Sostituisci' : 'Assumi'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal rapido sostituzione per ruolo */}
      {marketModalRole && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="fm-modal rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Mercato Staff — {ROLE_META[marketModalRole].title}
                </h3>
                <p className="text-xs text-slate-400">
                  Seleziona un profilo disponibile da inserire nello staff
                </p>
              </div>
              <button
                onClick={() => setMarketModalRole(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 mt-4 max-h-80 overflow-y-auto pr-1">
              {career.staffMarket
                .filter((s) => s.role === marketModalRole)
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3.5 rounded-xl fm-subcard"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="text-xs text-slate-400">
                        Specialità: <span className="text-emerald-400">{s.specialty}</span> •{' '}
                        {formatEuro(s.salary)}/anno
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-amber-300 font-extrabold text-xs tabular-nums">
                        {s.rating}
                      </span>
                      <button
                        onClick={() => {
                          hireStaffMember(s.id);
                          setMarketModalRole(null);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Assumi
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
