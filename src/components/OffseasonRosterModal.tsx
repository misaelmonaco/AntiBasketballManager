import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Store,
  Tag,
  UserX,
  X,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import {
  calculateBuyout,
  calculateWageBill,
  formatEuro,
  getForeignLimitForLeague,
  validateRoster6Plus6,
} from '../engine/ratings';
import { getLeagueConfig } from '../data/teams';
import { CountryFlag, FormationBadge } from './CountryFlag';

export const OffseasonRosterModal: React.FC = () => {
  const {
    career,
    rosterComplianceModalOpen,
    closeRosterComplianceModal,
    togglePlayerMatchdaySquad,
    togglePlayerTransferList,
    cutPlayer,
    setUserLbaRosterFormat,
    autoFixUserRoster,
    startRegularSeasonFromOffseason,
    setActiveTab,
    setToast,
  } = useGameStore();

  if (!career || !rosterComplianceModalOpen) return null;

  const userTeam = career.teams.find((t) => t.id === career.userTeamId);
  if (!userTeam) return null;

  const leagueId = userTeam.leagueId ?? 'ITA_LBA';
  const leagueCfg = getLeagueConfig(leagueId);
  const lbaFormat = userTeam.lbaRosterFormat ?? '6+6';
  const limits = getForeignLimitForLeague(leagueId, lbaFormat);
  const validation = validateRoster6Plus6(userTeam.roster, leagueId, lbaFormat);

  const wageBill = calculateWageBill(userTeam.roster);
  const freeCap = userTeam.budget - wageBill;
  const isOffseason = career.phase === 'offseason';

  const sortedRoster = [...userTeam.roster].sort((a, b) => {
    const slotOrder = { starter: 0, bench: 1, reserve: 2 };
    if (slotOrder[a.rosterSlot] !== slotOrder[b.rosterSlot]) {
      return slotOrder[a.rosterSlot] - slotOrder[b.rosterSlot];
    }
    return b.overall - a.overall;
  });

  const handleGoToTab = (tab: 'market' | 'roster' | 'rotations') => {
    closeRosterComplianceModal();
    setActiveTab(tab);
  };

  const handleConfirm = () => {
    if (isOffseason) {
      const res = startRegularSeasonFromOffseason();
      if (!res.ok && res.error) {
        setToast(res.error);
      }
      return;
    }
    if (validation.valid) {
      closeRosterComplianceModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fm-modal rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/90 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-400">
              {isOffseason
                ? `Offseason & Mercato Estivo • Stagione ${career.seasonYear}/${String(career.seasonYear + 1).slice(-2)}`
                : 'Adeguamento Obbligatorio al Regolamento'}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Costruzione Squadra — {leagueCfg.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {leagueId === 'ITA_LBA' && (
              <div className="fm-tabs">
                {(['6+6', '5+5'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setUserLbaRosterFormat(fmt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      lbaFormat === fmt
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={closeRosterComplianceModal}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Chiudi (potrai riaprire dal Menu o dall'Ufficio)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* League rules + compliance summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="fm-subcard rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Regolamento Lega</div>
              <div className="text-sm font-black text-orange-400 mt-0.5">{limits.ruleLabel}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Max {limits.maxForeign} stranier{limits.maxForeign === 1 ? 'o' : 'i'} • Min {limits.minIta} ITA
              </div>
            </div>
            <div className="fm-subcard rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Convocati A Referto</div>
              <div className="text-sm font-black text-white mt-0.5 tabular-nums">
                {validation.activeCount} / {limits.maxActive} (min {limits.minActive})
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                ITA: <b className="text-emerald-400">{validation.itaCount}</b> • Stranieri:{' '}
                <b className={validation.foreignCount > limits.maxForeign ? 'text-red-400' : 'text-sky-400'}>
                  {validation.foreignCount}
                </b>
              </div>
            </div>
            <div className="fm-subcard rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Spazio Salariale</div>
              <div className={`text-sm font-black mt-0.5 tabular-nums ${freeCap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatEuro(freeCap)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Rosa totale: {userTeam.roster.length} giocatori
              </div>
            </div>
            <div className="fm-subcard rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase text-slate-400">Stato Idoneità</div>
              {validation.valid ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm mt-0.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Roster Conforme
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-400 font-black text-sm mt-0.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Non Conforme
                </div>
              )}
              <button
                onClick={autoFixUserRoster}
                className="mt-1.5 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Auto-sistema Referto
              </button>
            </div>
          </div>

          {/* Errors */}
          {!validation.valid && (
            <div className="p-3.5 rounded-xl bg-red-950/35 border border-red-700/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                Requisiti da soddisfare prima di scendere in campo:
              </div>
              {validation.errors.map((err, idx) => (
                <div key={idx} className="text-xs text-red-200 pl-6">
                  • {err}
                </div>
              ))}
            </div>
          )}

          {/* Roster Table for quick Referto / Cut adjustments */}
          <div className="fm-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="fm-table-head sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4">Giocatore</th>
                    <th className="py-2 px-2">Naz</th>
                    <th className="py-2 px-2">Ruolo</th>
                    <th className="py-2 px-2 text-center">OVR</th>
                    <th className="py-2 px-3">Stipendio</th>
                    <th className="py-2 px-3">Stato Referto</th>
                    <th className="py-2 px-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedRoster.map((p) => {
                    const isReserve = p.rosterSlot === 'reserve';
                    const cutCost = calculateBuyout(p);
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-4 font-bold text-slate-100">
                          {p.firstName} {p.lastName}
                          {p.injuryWeeks > 0 && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                              INF {p.injuryWeeks}s
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5">
                            <CountryFlag nationality={p.nationality} size="sm" />
                            <FormationBadge isItalianFormation={p.isItalianFormation} />
                          </div>
                        </td>
                        <td className="py-2 px-2 font-semibold text-slate-300">
                          {p.primaryPosition}
                        </td>
                        <td className="py-2 px-2 text-center font-black text-orange-400 tabular-nums">
                          {p.overall}
                        </td>
                        <td className="py-2 px-3 text-slate-300 tabular-nums">
                          {formatEuro(p.salary)}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.rosterSlot === 'starter'
                                ? 'bg-orange-500/20 text-orange-300'
                                : p.rosterSlot === 'bench'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.rosterSlot === 'starter'
                              ? 'Quintetto'
                              : p.rosterSlot === 'bench'
                              ? 'Panchina'
                              : 'Fuori Referto'}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const res = togglePlayerMatchdaySquad(p.id);
                                if (!res.ok && res.message) setToast(res.message);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                isReserve
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {isReserve ? 'Convoca' : 'Metti in Riserva'}
                            </button>
                            <button
                              onClick={() => togglePlayerTransferList(p.id)}
                              title={p.onTransferList ? 'Rimuovi dal mercato' : 'Metti sul mercato'}
                              className={`p-1.5 rounded-lg cursor-pointer ${
                                p.onTransferList
                                  ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300'
                                  : 'bg-slate-800 hover:bg-amber-500/20 text-slate-300'
                              }`}
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const res = cutPlayer(p.id);
                                if (!res.ok) setToast(res.message);
                              }}
                              disabled={userTeam.roster.length <= 7}
                              title={`Taglia (buonuscita ${formatEuro(cutCost)})`}
                              className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/70 disabled:opacity-30 text-red-300 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/90 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleGoToTab('market')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-orange-400" />
              Mercato & Free Agent ({career.incomingOffers.length > 0 ? `${career.incomingOffers.length} offerte` : 'Apri'})
            </button>
            <button
              onClick={() => handleGoToTab('rotations')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
            >
              Vai alle Rotazioni
            </button>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!validation.valid}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
          >
            {isOffseason ? 'Conferma Roster & Inizia Regular Season' : 'Conferma Roster Conforme'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
