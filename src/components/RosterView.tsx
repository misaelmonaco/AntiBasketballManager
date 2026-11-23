import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  ListOrdered,
  ArrowLeftRight,
  BarChart3,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import {
  calculateWageBill,
  validateRoster6Plus6,
} from '../engine/ratings';
import { Player, Position } from '../types';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { PageHeader } from './PageHeader';
import { PlayerCompareModal } from './PlayerCompareModal';
import { nextSortState, SortDir } from './SortableHeader';
import { RosterSortKey, RosterYouthTable } from './roster/RosterYouthTable';
import { RosterStatsTable } from './roster/RosterStatsTable';
import { RosterConfirmCutModal, RosterPlayerQuickModal } from './roster/RosterModals';
import { RosterFirstTeamTable } from './roster/RosterFirstTeamTable';

const POS_ORDER: Record<Position, number> = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 };
const SLOT_ORDER = { starter: 0, bench: 1, reserve: 2 };
const ROSTER_DESC_KEYS: readonly RosterSortKey[] = [
  'overall',
  'condition',
  'morale',
  'salary',
  'contract',
];

export const RosterView: React.FC = () => {
  const {
    career,
    togglePlayerMatchdaySquad,
    cutPlayer,
    renewPlayerContract,
    openPlayerProfile,
    callUpYouthItalianPlayer,
    promoteYouthPlayer,
    demoteToYouthRoster,
    togglePlayerTransferList,
    setUserLbaRosterFormat,
    setActiveTab,
    setToast,
  } = useGameStore();

  const [squadView, setSquadView] = useState<'first' | 'youth' | 'stats'>('first');
  const [filter, setFilter] = useState<'all' | 'active' | 'ita' | 'foreign'>('all');
  const [sortKey, setSortKey] = useState<RosterSortKey>('slot');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [youthSortKey, setYouthSortKey] = useState<RosterSortKey>('overall');
  const [youthSortDir, setYouthSortDir] = useState<SortDir>('desc');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [confirmCut, setConfirmCut] = useState<Player | null>(null);
  const [renewTarget, setRenewTarget] = useState<Player | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const handleSort = (clicked: RosterSortKey) => {
    const next = nextSortState(sortKey, sortDir, clicked, ROSTER_DESC_KEYS);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const handleYouthSort = (clicked: RosterSortKey) => {
    const next = nextSortState(youthSortKey, youthSortDir, clicked, ROSTER_DESC_KEYS);
    setYouthSortKey(next.key);
    setYouthSortDir(next.dir);
  };

  if (!career) return null;
  const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
  const youthRoster = userTeam.youthRoster ?? [];
  const lbaFormat = userTeam.lbaRosterFormat ?? '6+6';
  const validation = validateRoster6Plus6(userTeam.roster, userTeam.leagueId, lbaFormat);

  const comparePlayers = (
    a: Player,
    b: Player,
    key: RosterSortKey,
    dir: SortDir
  ): number => {
    const sign = dir === 'asc' ? 1 : -1;
    let cmp = 0;
    switch (key) {
      case 'slot':
        cmp = SLOT_ORDER[a.rosterSlot] - SLOT_ORDER[b.rosterSlot];
        break;
      case 'name':
        cmp = `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`
        );
        break;
      case 'nationality':
        cmp =
          Number(b.isItalianFormation) - Number(a.isItalianFormation) ||
          a.nationality.localeCompare(b.nationality);
        break;
      case 'position':
        cmp = POS_ORDER[a.primaryPosition] - POS_ORDER[b.primaryPosition];
        break;
      case 'age':
        cmp = a.age - b.age;
        break;
      case 'overall':
        cmp = a.overall - b.overall;
        break;
      case 'condition':
        cmp = a.condition - b.condition;
        break;
      case 'morale':
        cmp = a.morale - b.morale;
        break;
      case 'salary':
        cmp = a.salary - b.salary;
        break;
      case 'contract':
        cmp = a.contractYears - b.contractYears;
        break;
    }
    if (cmp !== 0) return cmp * sign;
    return b.overall - a.overall;
  };

  const filtered = userTeam.roster
    .filter((p) => {
      if (filter === 'active') return p.rosterSlot !== 'reserve';
      if (filter === 'ita') return p.isItalianFormation;
      if (filter === 'foreign') return !p.isItalianFormation;
      return true;
    })
    .sort((a, b) => comparePlayers(a, b, sortKey, sortDir));

  const sortedYouth = [...youthRoster].sort((a, b) =>
    comparePlayers(a, b, youthSortKey, youthSortDir)
  );

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Gestione Squadra"
        title="Roster & Convocazioni"
        subtitle={`Gestione rosa completa (${userTeam.roster.length} giocatori sotto contratto) e selezione dei convocati A Referto`}
        right={
          <>
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-orange-400" />
              Confronta
            </button>
            {userTeam.leagueId === 'ITA_LBA' && squadView === 'first' && (
              <div className="fm-tabs">
                <span className="text-[11px] font-bold text-slate-400 px-2">LBA:</span>
                {(['6+6', '5+5'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setUserLbaRosterFormat(fmt)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      lbaFormat === fmt
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt} ({fmt === '5+5' ? '10' : '12'})
                  </button>
                ))}
              </div>
            )}
            <div className="fm-tabs">
              <button
                onClick={() => setSquadView('first')}
                className={`fm-tab ${squadView === 'first' ? 'fm-tab-active' : ''}`}
              >
                Prima Squadra ({userTeam.roster.length})
              </button>
              <button
                onClick={() => setSquadView('youth')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  squadView === 'youth'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Giovanili U19 ({youthRoster.length})
              </button>
              <button
                onClick={() => setSquadView('stats')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  squadView === 'stats'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Statistiche Stagionali
              </button>
            </div>

            {squadView === 'first' && (
              <div className="fm-tabs">
                {(
                  [
                    ['all', `Tutti (${userTeam.roster.length})`],
                    ['active', `A Referto (${validation.activeCount})`],
                    ['ita', 'Formazione ITA'],
                    ['foreign', 'Stranieri'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      filter === key
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </>
        }
      />

      {/* 6+6 Compliance Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
          validation.valid
            ? 'bg-emerald-950/25 border-emerald-800/50'
            : 'bg-red-950/30 border-red-800/60'
        }`}
      >
        <div className="flex items-center gap-3">
          {validation.valid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <div>
            <div className="text-sm font-bold text-white">
              {validation.valid
                ? validation.injuryExemption
                  ? `Referto Valido (Deroga Infortuni • ${validation.ruleLabel})`
                  : `Referto conforme (${validation.ruleLabel})`
                : validation.errors[0]}
            </div>
            {validation.warnings.length > 0 && (
              <div className="text-xs text-amber-300 mt-0.5">{validation.warnings[0]}</div>
            )}
            <div className="text-xs text-slate-400 mt-0.5">
              Titolari: <b>{validation.startersCount}/5</b> • Panchina:{' '}
              <b>{validation.benchCount}/7</b> • A referto: <b>{validation.activeCount}/12</b>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
          {validation.injuryExemption && (
            <button
              onClick={() => {
                if (youthRoster.length > 0) {
                  setSquadView('youth');
                } else {
                  callUpYouthItalianPlayer();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold cursor-pointer transition-colors"
            >
              + Convoca Giovane U19 (ITA)
            </button>
          )}
          <span
            className={`px-3 py-1.5 rounded-lg border ${
              validation.activeCount === 12
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border-red-500/30 text-red-300'
            }`}
          >
            Convocati: {validation.activeCount}/12
          </span>
          <span
            className={`px-3 py-1.5 rounded-lg border ${
              validation.itaCount >= validation.minIta
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border-red-500/30 text-red-300'
            }`}
          >
            Formazione ITA: {validation.itaCount}/{validation.minIta} min.
          </span>
          <span
            className={`px-3 py-1.5 rounded-lg border ${
              validation.foreignCount <= validation.maxForeign
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                : 'bg-red-500/15 border-red-500/30 text-red-300'
            }`}
          >
            Stranieri: {validation.foreignCount}/{validation.maxForeign} max.
          </span>
          <button
            onClick={() => setActiveTab('rotations')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold cursor-pointer transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Vai a Rotazioni →
          </button>
        </div>
      </div>

      {squadView === 'youth' ? (
        <RosterYouthTable
          sortedYouth={sortedYouth}
          youthSortKey={youthSortKey}
          youthSortDir={youthSortDir}
          onSort={handleYouthSort}
          onCallUpYouth={callUpYouthItalianPlayer}
          onPromoteYouth={promoteYouthPlayer}
          onOpenProfile={openPlayerProfile}
        />
      ) : squadView === 'stats' ? (
        <RosterStatsTable roster={userTeam.roster} onOpenProfile={openPlayerProfile} />
      ) : (
        <RosterFirstTeamTable
          players={filtered}
          seasonYear={career.seasonYear}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onToggleMatchdaySquad={(playerId) => {
            const res = togglePlayerMatchdaySquad(playerId);
            if (!res.ok && res.message) setToast(res.message);
          }}
          onOpenProfile={openPlayerProfile}
          onDemoteToYouth={demoteToYouthRoster}
          onToggleTransferList={togglePlayerTransferList}
          onRenewPlayer={setRenewTarget}
          onConfirmCut={setConfirmCut}
        />
      )}

      {selectedPlayer && (
        <RosterPlayerQuickModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {confirmCut && (
        <RosterConfirmCutModal
          player={confirmCut}
          onCancel={() => setConfirmCut(null)}
          onConfirm={() => {
            const res = cutPlayer(confirmCut.id);
            if (!res.ok) setToast(res.message);
            setConfirmCut(null);
          }}
        />
      )}

      {renewTarget && (
        <ContractNegotiationModal
          player={renewTarget}
          mode="renewal"
          freeCap={
            userTeam.budget - calculateWageBill(userTeam.roster) + renewTarget.salary
          }
          isScouted={true}
          onClose={() => setRenewTarget(null)}
          onSubmit={(salary, years, role) =>
            renewPlayerContract(renewTarget.id, salary, years, role)
          }
        />
      )}

      {compareOpen && (
        <PlayerCompareModal
          players={userTeam.roster}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  );
};
