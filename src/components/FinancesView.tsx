import React from 'react';
import {
  Coins,
  Ticket,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Users,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { calculateWageBill } from '../engine/ratings';
import { getPlayerBuyoutClause } from '../engine/scoutingEngine';
import { CountryFlag, FormationBadge } from './CountryFlag';
import { PageHeader } from './PageHeader';

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(val);
}

export const FinancesView: React.FC = () => {
  const { career, openPlayerProfile, upgradeFacility, selectSeasonSponsor } = useGameStore();
  if (!career) return null;

  const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
  const facilities = userTeam.facilities ?? {
    arenaLevel: 1,
    youthLevel: 1,
    medicalLevel: 1,
  };
  const sponsorOptions = [
    { name: 'Banco Nazionale Sport', bonus: Math.round(userTeam.budget * 0.08), desc: 'Sponsor solido e garantito' },
    { name: 'TechArena Energia', bonus: Math.round(userTeam.budget * 0.11), desc: 'Main sponsor ad alto rendimento' },
    { name: 'Gruppo Basket Italia', bonus: Math.round(userTeam.budget * 0.06), desc: 'Partner storico del club' },
  ];
  const wageBill = calculateWageBill(userTeam.roster);
  const staffBill = Object.values(userTeam.staff ?? {}).reduce(
    (sum, s) => sum + (s?.salary ?? 0),
    0
  );
  const totalPayroll = wageBill + staffBill;
  const freeCap = userTeam.budget - wageBill;
  const capUsagePct = userTeam.budget > 0 ? Math.min(100, Math.round((wageBill / userTeam.budget) * 100)) : 0;

  // Calcolo entrate da biglietteria, sponsor e diritti TV
  const userHomeGames = career.schedule.filter((g) => g.homeTeamId === userTeam.id);
  const homePlayed = userHomeGames.filter((g) => g.played).length;
  const homeRemaining = userHomeGames.filter((g) => !g.played).length;

  const leagueId = userTeam.leagueId ?? 'ITA_LBA';
  const avgTicketPrice =
    leagueId === 'ITA_LBA'
      ? 24
      : leagueId === 'ITA_A2'
        ? 15
        : leagueId === 'ITA_B' || leagueId === 'ITA_B2'
          ? 11
          : 8;
  const occupancyRate = Math.min(0.95, Math.max(0.45, 0.52 + (userTeam.prestige - 40) * 0.0065));
  const avgAttendance = Math.round(userTeam.arenaCapacity * occupancyRate);
  const revenuePerHomeGame = avgAttendance * avgTicketPrice;
  const ticketRevenueEarned = revenuePerHomeGame * homePlayed;
  const ticketRevenueProjected = revenuePerHomeGame * userHomeGames.length;

  const sponsorAndTv =
    Math.round(userTeam.budget * 0.62) +
    (userTeam.euroCup === 'EL' ? 650000 : userTeam.euroCup === 'EC' ? 220000 : 0);
  const projectedTotalIncome = ticketRevenueProjected + sponsorAndTv;
  const netBalance = projectedTotalIncome - totalPayroll;

  const sortedRoster = [...userTeam.roster].sort((a, b) => b.salary - a.salary);

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      {/* Header */}
      <PageHeader
        eyebrow="Area Economica"
        title="Finanze & Contratti"
        subtitle={`Bilancio di ${userTeam.name} • Stagione ${career.seasonYear}/${career.seasonYear + 1}`}
        right={
          <div className="fm-subcard px-4 py-2 rounded-xl text-xs text-slate-300">
            Palazzetto: <b className="text-white">{userTeam.arena}</b> ({userTeam.arenaCapacity.toLocaleString('it-IT')} posti)
          </div>
        }
      />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="fm-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Saldo / Margine Disponibile</span>
            <Wallet className={`w-4 h-4 ${freeCap >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div className={`text-xl font-black ${freeCap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(freeCap)}
          </div>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${capUsagePct > 95 ? 'bg-red-500' : 'bg-orange-500'}`}
              style={{ width: `${capUsagePct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Budget Roster: {formatCurrency(userTeam.budget)} ({capUsagePct}% usato)
          </div>
        </div>

        <div className="fm-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Monte Ingaggi Totale</span>
            <TrendingDown className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-xl font-black text-white">{formatCurrency(totalPayroll)}</div>
          <div className="text-[11px] text-slate-400 mt-2">
            Giocatori: <b className="text-slate-200">{formatCurrency(wageBill)}</b>
          </div>
          <div className="text-[11px] text-slate-400">
            Staff Tecnico: <b className="text-slate-200">{formatCurrency(staffBill)}</b>
          </div>
        </div>

        <div className="fm-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Entrate Biglietteria</span>
            <Ticket className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-300">
            {formatCurrency(ticketRevenueEarned)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Incassate su {homePlayed} gare in casa ({avgAttendance.toLocaleString('it-IT')} sp./gara)
          </div>
          <div className="text-[11px] text-slate-400">
            Proiezione annua ({homePlayed + homeRemaining} gare):{' '}
            <b className="text-slate-200">{formatCurrency(ticketRevenueProjected)}</b>
          </div>
        </div>

        <div className="fm-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Bilancio Previsionale</span>
            <TrendingUp className={`w-4 h-4 ${netBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className={`text-xl font-black ${netBalance >= 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
            {netBalance >= 0 ? '+' : ''}
            {formatCurrency(netBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Sponsor & Diritti TV: <b className="text-slate-200">{formatCurrency(sponsorAndTv)}</b>
          </div>
          <div className="text-[11px] text-slate-400">
            Prezzo medio biglietto: <b className="text-slate-200">€{avgTicketPrice}</b>
          </div>
        </div>
      </div>

      {/* Breakdown Ricavi & Costi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="fm-card rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Coins className="w-4 h-4" />
            Riepilogo Entrate Stimate
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/70">
              <span className="text-slate-300">Biglietteria Maturata ({homePlayed} gare casalinghe)</span>
              <span className="font-bold text-emerald-400">{formatCurrency(ticketRevenueEarned)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/70">
              <span className="text-slate-300">Biglietteria Residua ({homeRemaining} gare casalinghe)</span>
              <span className="font-semibold text-slate-200">
                {formatCurrency(revenuePerHomeGame * homeRemaining)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/70">
              <span className="text-slate-300">Sponsorizzazioni, Merchandising & Diritti TV</span>
              <span className="font-semibold text-slate-200">{formatCurrency(sponsorAndTv)}</span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-white">
              <span>Totale Entrate Previste</span>
              <span className="text-emerald-400">{formatCurrency(projectedTotalIncome)}</span>
            </div>
          </div>
        </div>

        <div className="fm-card rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
            <Building2 className="w-4 h-4" />
            Riepilogo Uscite & Staff
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/70">
              <span className="text-slate-300">Ingaggi Prima Squadra ({userTeam.roster.length} giocatori)</span>
              <span className="font-bold text-orange-300">{formatCurrency(wageBill)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/70">
              <span className="text-slate-300">Ingaggi Staff Tecnico & Medico</span>
              <span className="font-semibold text-slate-200">{formatCurrency(staffBill)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/70">
              <span className="text-slate-300">Margine Residuo su Budget Roster</span>
              <span className={`font-bold ${freeCap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(freeCap)}
              </span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-white">
              <span>Totale Costi Annui</span>
              <span className="text-orange-400">{formatCurrency(totalPayroll)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabella Contratti Giocatori */}
      <div className="fm-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Users className="w-4 h-4 text-orange-400" />
            Contratti Giocatori ({sortedRoster.length})
          </div>
          <span className="text-xs text-slate-400">
            Ordinati per stipendio annuale decrescente
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="fm-table-head">
              <tr>
                <th className="py-2.5 px-4">Giocatore</th>
                <th className="py-2.5 px-2 text-center">Ruolo</th>
                <th className="py-2.5 px-2 text-center">Età</th>
                <th className="py-2.5 px-2 text-center">OVR</th>
                <th className="py-2.5 px-3">Ruolo Contrattuale</th>
                <th className="py-2.5 px-3 text-right">Stipendio / Anno</th>
                <th className="py-2.5 px-2 text-center">Scadenza</th>
                <th className="py-2.5 px-3 text-right">Clausola Buyout</th>
                <th className="py-2.5 px-3 text-right">% Monte Ingaggi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedRoster.map((p) => {
                const share = wageBill > 0 ? ((p.salary / wageBill) * 100).toFixed(1) : '0.0';
                const buyout = getPlayerBuyoutClause(p);
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <CountryFlag nationality={p.nationality} size="sm" />
                        <button
                          onClick={() => openPlayerProfile(p.id)}
                          className="font-bold text-slate-100 hover:text-orange-400 hover:underline cursor-pointer text-left"
                        >
                          {p.firstName} {p.lastName}
                        </button>
                        <FormationBadge isItalianFormation={p.isItalianFormation} />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-semibold text-slate-300">
                      {p.primaryPosition}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-400">{p.age}</td>
                    <td className="py-2.5 px-2 text-center font-extrabold text-orange-400">
                      {p.overall}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {p.promisedRole ?? 'Giocatore di rotazione'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-300 tabular-nums">
                      {formatCurrency(p.salary)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300">
                      {career.seasonYear + p.contractYears} ({p.contractYears}a)
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                      {formatCurrency(buyout)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                      {share}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strutture Club & Sponsor Stagionale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="fm-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Building2 className="w-4 h-4" />
              Strutture Club (Livelli 1–5)
            </div>
            <span className="text-[11px] text-slate-400">Investi il budget libero</span>
          </div>
          <div className="space-y-2.5 text-xs">
            {(
              [
                ['arenaLevel', 'Palazzetto & Biglietteria (+12% capienza)', facilities.arenaLevel],
                ['youthLevel', 'Settore Giovanile U19 (migliori prospetti)', facilities.youthLevel],
                ['medicalLevel', 'Centro Medico & Recupero (-infortuni)', facilities.medicalLevel],
              ] as const
            ).map(([key, label, lvl]) => {
              const cost = lvl * 180000;
              return (
                <div key={key} className="fm-subcard rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white">{label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Livello attuale: <b className="text-orange-400">{lvl}/5</b>
                    </div>
                  </div>
                  <button
                    onClick={() => upgradeFacility(key)}
                    disabled={lvl >= 5}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 disabled:opacity-40 text-sky-300 font-bold shrink-0 cursor-pointer"
                  >
                    {lvl >= 5 ? 'Max' : `Potenzia (${formatCurrency(cost)})`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="fm-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Coins className="w-4 h-4" />
              Sponsor Principale di Stagione
            </div>
          </div>
          {facilities.sponsorName ? (
            <div className="fm-subcard rounded-xl p-4 space-y-1">
              <div className="text-xs font-bold uppercase text-emerald-400">Accordo Attivo</div>
              <div className="text-base font-black text-white">{facilities.sponsorName}</div>
              <div className="text-xs text-slate-300">
                Contributo incassato al budget:{' '}
                <b className="text-emerald-400">
                  {formatCurrency(facilities.sponsorAnnualBonus ?? 0)}
                </b>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {sponsorOptions.map((sp) => (
                <div key={sp.name} className="fm-subcard rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white">{sp.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {sp.desc} • Bonus:{' '}
                      <b className="text-emerald-400">{formatCurrency(sp.bonus)}</b>
                    </div>
                  </div>
                  <button
                    onClick={() => selectSeasonSponsor(sp.name, sp.bonus)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shrink-0 cursor-pointer"
                  >
                    Firma
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
