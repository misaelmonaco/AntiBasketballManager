import React, { useMemo, useState } from 'react';
import { calculateWageBill, formatEuro } from '../engine/ratings';
import { useGameStore } from '../store/gameStore';
import { LeagueId, Player, Position } from '../types';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { MarketLoanModal } from './market/MarketLoanModal';
import { MarketTradeModal } from './market/MarketTradeModal';
import { PageHeader } from './PageHeader';
import { nextSortState, SortDir } from './SortableHeader';
import {
  PlayerSearchFilters,
  SearchAgeFilter,
  SearchContractFilter,
  SearchSourceFilter,
} from './search/PlayerSearchFilters';
import {
  IndexedPlayer,
  PlayerSearchTable,
  SearchSortKey,
} from './search/PlayerSearchTable';

const POS_ORDER: Record<Position, number> = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 };
const DESC_KEYS: readonly SearchSortKey[] = [
  'overall',
  'threePoint',
  'defense',
  'rebounding',
  'salary',
];

export const PlayerSearchView: React.FC = () => {
  const {
    career,
    negotiateFreeAgent,
    buyoutRivalPlayer,
    requestPlayerLoan,
    proposePlayerTrade,
    toggleShortlistPlayer,
    startScoutingPlayer,
    advanceScoutingDays,
    openPlayerProfile,
  } = useGameStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SearchSourceFilter>('ALL');
  const [posFilter, setPosFilter] = useState<'ALL' | Position>('ALL');
  const [natFilter, setNatFilter] = useState<'ALL' | 'ITA' | 'FOREIGN'>('ALL');
  const [ageFilter, setAgeFilter] = useState<SearchAgeFilter>('ALL');
  const [contractFilter, setContractFilter] = useState<SearchContractFilter>('ALL');
  const [minOvr, setMinOvr] = useState<number>(40);
  const [min3pt, setMin3pt] = useState<number>(0);
  const [minDef, setMinDef] = useState<number>(0);
  const [minPlay, setMinPlay] = useState<number>(0);
  const [minReb, setMinReb] = useState<number>(0);
  const [maxSalary, setMaxSalary] = useState<number>(3000000);
  const [onlyScouted, setOnlyScouted] = useState(false);
  const [onlyShortlist, setOnlyShortlist] = useState(false);
  const [excludeUserTeam, setExcludeUserTeam] = useState(true);

  const [sortKey, setSortKey] = useState<SearchSortKey>('overall');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [negotiation, setNegotiation] = useState<{
    player: Player;
    mode: 'free_agent' | 'buyout';
    fromTeamId?: string;
    fromTeamName?: string;
    buyoutCost?: number;
  } | null>(null);
  const [loanModal, setLoanModal] = useState<{
    player: Player;
    fromTeamId: string;
    fromTeamName: string;
  } | null>(null);
  const [loanSharePct, setLoanSharePct] = useState<50 | 75 | 100>(75);
  const [loanFeedback, setLoanFeedback] = useState<string | null>(null);
  const [tradeTarget, setTradeTarget] = useState<{
    player: Player;
    fromTeamId: string;
    fromTeamName: string;
  } | null>(null);

  const handleSort = (clicked: SearchSortKey) => {
    const next = nextSortState(sortKey, sortDir, clicked, DESC_KEYS);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSourceFilter('ALL');
    setPosFilter('ALL');
    setNatFilter('ALL');
    setAgeFilter('ALL');
    setContractFilter('ALL');
    setMinOvr(40);
    setMin3pt(0);
    setMinDef(0);
    setMinPlay(0);
    setMinReb(0);
    setMaxSalary(3000000);
    setOnlyScouted(false);
    setOnlyShortlist(false);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    sourceFilter !== 'ALL' ||
    posFilter !== 'ALL' ||
    natFilter !== 'ALL' ||
    ageFilter !== 'ALL' ||
    contractFilter !== 'ALL' ||
    minOvr !== 40 ||
    min3pt !== 0 ||
    minDef !== 0 ||
    minPlay !== 0 ||
    minReb !== 0 ||
    maxSalary !== 3000000 ||
    onlyScouted ||
    onlyShortlist;

  const userTeam = career?.teams.find((t) => t.id === career.userTeamId);
  const scoutedList = career?.scoutedPlayerIds ?? [];
  const shortlistList = career?.shortlistPlayerIds ?? [];

  const allIndexed = useMemo<IndexedPlayer[]>(() => {
    if (!career) return [];
    const teamEntries: IndexedPlayer[] = career.teams.flatMap((t) =>
      t.roster.map((p) => ({
        player: p,
        clubId: t.id,
        clubName: t.name,
        leagueId: (t.leagueId ?? 'ITA_LBA') as LeagueId,
        isUserClub: t.id === career.userTeamId,
      }))
    );
    const faEntries: IndexedPlayer[] = career.freeAgents.map((p) => ({
      player: p,
      clubId: null,
      clubName: 'Free Agent',
      leagueId: null,
      isUserClub: false,
    }));
    return [...teamEntries, ...faEntries];
  }, [career]);

  const filteredSorted = useMemo(() => {
    const scoutSet = new Set(scoutedList);
    const shortlistSet = new Set(shortlistList);
    const q = searchQuery.trim().toLowerCase();

    const filtered = allIndexed.filter((item) => {
      const p = item.player;
      if (excludeUserTeam && item.isUserClub) return false;
      if (sourceFilter === 'FREE_AGENTS' && item.clubId !== null) return false;
      if (sourceFilter === 'CONTRACTED' && item.clubId === null) return false;
      if (
        sourceFilter !== 'ALL' &&
        sourceFilter !== 'FREE_AGENTS' &&
        sourceFilter !== 'CONTRACTED' &&
        item.leagueId !== sourceFilter
      ) {
        return false;
      }
      if (posFilter !== 'ALL' && p.primaryPosition !== posFilter) return false;
      if (natFilter === 'ITA' && !p.isItalianFormation) return false;
      if (natFilter === 'FOREIGN' && p.isItalianFormation) return false;
      if (ageFilter === 'U20' && p.age > 20) return false;
      if (ageFilter === 'U22' && p.age > 22) return false;
      if (ageFilter === '23_27' && (p.age < 23 || p.age > 27)) return false;
      if (ageFilter === '28_32' && (p.age < 28 || p.age > 32)) return false;
      if (ageFilter === '33_PLUS' && p.age < 33) return false;
      if (contractFilter === 'EXPIRING' && item.clubId !== null && p.contractYears > 1) return false;
      if (contractFilter === 'MULTI' && (item.clubId === null || p.contractYears < 2)) return false;

      if (p.overall < minOvr) return false;
      if (p.attributes.threePoint < min3pt) return false;
      const avgDef = (p.attributes.perimeterDef + p.attributes.postDef) / 2;
      if (avgDef < minDef) return false;
      const avgPlay = (p.attributes.passing + p.attributes.ballHandling) / 2;
      if (avgPlay < minPlay) return false;
      if (p.attributes.rebounding < minReb) return false;
      if (p.salary > maxSalary) return false;

      if (onlyScouted && !item.isUserClub && !scoutSet.has(p.id)) return false;
      if (onlyShortlist && !shortlistSet.has(p.id)) return false;

      if (q) {
        const hay = `${p.firstName} ${p.lastName} ${item.clubName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = `${a.player.lastName} ${a.player.firstName}`.localeCompare(
            `${b.player.lastName} ${b.player.firstName}`
          );
          break;
        case 'team':
          cmp = a.clubName.localeCompare(b.clubName);
          break;
        case 'nationality':
          cmp =
            Number(b.player.isItalianFormation) - Number(a.player.isItalianFormation) ||
            a.player.nationality.localeCompare(b.player.nationality);
          break;
        case 'position':
          cmp = POS_ORDER[a.player.primaryPosition] - POS_ORDER[b.player.primaryPosition];
          break;
        case 'age':
          cmp = a.player.age - b.player.age;
          break;
        case 'overall':
          cmp = a.player.overall - b.player.overall;
          break;
        case 'threePoint':
          cmp = a.player.attributes.threePoint - b.player.attributes.threePoint;
          break;
        case 'defense': {
          const defA = (a.player.attributes.perimeterDef + a.player.attributes.postDef) / 2;
          const defB = (b.player.attributes.perimeterDef + b.player.attributes.postDef) / 2;
          cmp = defA - defB;
          break;
        }
        case 'rebounding':
          cmp = a.player.attributes.rebounding - b.player.attributes.rebounding;
          break;
        case 'salary':
          cmp = a.player.salary - b.player.salary;
          break;
        case 'contract':
          cmp =
            (a.clubId ? a.player.contractYears : 0) -
            (b.clubId ? b.player.contractYears : 0);
          break;
      }
      if (cmp !== 0) return cmp * dir;
      return b.player.overall - a.player.overall;
    });
  }, [
    allIndexed,
    excludeUserTeam,
    sourceFilter,
    posFilter,
    natFilter,
    ageFilter,
    contractFilter,
    minOvr,
    min3pt,
    minDef,
    minPlay,
    minReb,
    maxSalary,
    onlyScouted,
    onlyShortlist,
    searchQuery,
    scoutedList,
    shortlistList,
    sortKey,
    sortDir,
  ]);

  if (!career || !userTeam) return null;

  const freeCap = userTeam.budget - calculateWageBill(userTeam.roster);
  const scoutRating = userTeam.staff?.scout_director?.rating ?? 60;
  const scoutedSet = new Set(career.scoutedPlayerIds);
  const activeScoutSet = new Set(career.activeScouting.map((s) => s.playerId));
  const shortlistSet = new Set(career.shortlistPlayerIds ?? []);

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Database & Osservatori"
        title={`Ricerca Avanzata & Scouting (${filteredSorted.length} trovati)`}
        subtitle={
          <>
            Resp. Scouting: <b className="text-amber-400">VAL {scoutRating}</b> • Spazio salariale:{' '}
            <span className={freeCap >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {formatEuro(freeCap)}
            </span>{' '}
            • Database globale: tutti i club italiani + svincolati
          </>
        }
      />

      <PlayerSearchFilters
        searchQuery={searchQuery}
        sourceFilter={sourceFilter}
        posFilter={posFilter}
        natFilter={natFilter}
        ageFilter={ageFilter}
        contractFilter={contractFilter}
        minOvr={minOvr}
        min3pt={min3pt}
        minDef={minDef}
        minPlay={minPlay}
        minReb={minReb}
        maxSalary={maxSalary}
        onlyScouted={onlyScouted}
        onlyShortlist={onlyShortlist}
        excludeUserTeam={excludeUserTeam}
        shortlistCount={shortlistList.length}
        activeScouting={career.activeScouting}
        hasActiveFilters={hasActiveFilters}
        onSearchQueryChange={setSearchQuery}
        onSourceFilterChange={setSourceFilter}
        onPosFilterChange={setPosFilter}
        onNatFilterChange={setNatFilter}
        onAgeFilterChange={setAgeFilter}
        onContractFilterChange={setContractFilter}
        onMinOvrChange={setMinOvr}
        onMin3ptChange={setMin3pt}
        onMinDefChange={setMinDef}
        onMinPlayChange={setMinPlay}
        onMinRebChange={setMinReb}
        onMaxSalaryChange={setMaxSalary}
        onToggleOnlyScouted={() => setOnlyScouted((v) => !v)}
        onToggleOnlyShortlist={() => setOnlyShortlist((v) => !v)}
        onToggleExcludeUserTeam={() => setExcludeUserTeam((v) => !v)}
        onAdvanceScouting={() => advanceScoutingDays(3)}
        onResetFilters={resetFilters}
      />

      <PlayerSearchTable
        visibleRows={filteredSorted.slice(0, 120)}
        totalMatches={filteredSorted.length}
        sortKey={sortKey}
        sortDir={sortDir}
        scoutRating={scoutRating}
        scoutedSet={scoutedSet}
        activeScoutSet={activeScoutSet}
        shortlistSet={shortlistSet}
        onSort={handleSort}
        onToggleShortlist={toggleShortlistPlayer}
        onOpenProfile={openPlayerProfile}
        onStartScouting={startScoutingPlayer}
        onOfferFreeAgent={(p) => setNegotiation({ player: p, mode: 'free_agent' })}
        onOfferBuyout={(p, fromTeamId, fromTeamName, buyoutCost) =>
          setNegotiation({ player: p, mode: 'buyout', fromTeamId, fromTeamName, buyoutCost })
        }
        onRequestLoan={(p, fromTeamId, fromTeamName) => {
          setLoanFeedback(null);
          setLoanSharePct(75);
          setLoanModal({ player: p, fromTeamId, fromTeamName });
        }}
        onProposeTrade={(p, fromTeamId, fromTeamName) =>
          setTradeTarget({ player: p, fromTeamId, fromTeamName })
        }
      />

      {negotiation && (
        <ContractNegotiationModal
          player={negotiation.player}
          mode={negotiation.mode}
          freeCap={freeCap}
          buyoutCost={negotiation.buyoutCost}
          rivalTeamName={negotiation.fromTeamName}
          isScouted={scoutedSet.has(negotiation.player.id)}
          onClose={() => setNegotiation(null)}
          onSubmit={(salary, years, role) =>
            negotiation.mode === 'free_agent'
              ? negotiateFreeAgent(negotiation.player.id, salary, years, role)
              : buyoutRivalPlayer(
                  negotiation.fromTeamId!,
                  negotiation.player.id,
                  salary,
                  years,
                  role
                )
          }
        />
      )}

      {loanModal && (
        <MarketLoanModal
          player={loanModal.player}
          fromTeamName={loanModal.fromTeamName}
          loanSharePct={loanSharePct}
          feedback={loanFeedback}
          onChangeSharePct={setLoanSharePct}
          onSubmit={() => {
            const res = requestPlayerLoan(
              loanModal.fromTeamId,
              loanModal.player.id,
              loanSharePct
            );
            if (res.accepted) setLoanModal(null);
            else setLoanFeedback(res.message);
          }}
          onClose={() => setLoanModal(null)}
        />
      )}

      {tradeTarget && (
        <MarketTradeModal
          rivalTeamName={tradeTarget.fromTeamName}
          requestedPlayer={tradeTarget.player}
          userRoster={userTeam.roster}
          onSubmit={(offeredId, cash) =>
            proposePlayerTrade(
              tradeTarget.fromTeamId,
              offeredId,
              tradeTarget.player.id,
              cash
            )
          }
          onClose={() => setTradeTarget(null)}
        />
      )}
    </div>
  );
};
