import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatItalianDate, getMarketOpenDate } from '../engine/calendarUtils';
import { calculateWageBill, formatEuro } from '../engine/ratings';
import {
  getAttributeEstimate,
  getSalaryEstimate,
} from '../engine/scoutingEngine';
import { LeagueId, Player } from '../types';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { PageHeader } from './PageHeader';
import { MarketOffersTab } from './market/MarketOffersTab';
import { MarketLoanModal } from './market/MarketLoanModal';
import { MarketTradeModal } from './market/MarketTradeModal';
import { MarketRivalsTab } from './market/MarketRivalsTab';
import { MarketScoutingTab } from './market/MarketScoutingTab';
import { MarketInspectPlayerModal } from './market/MarketInspectPlayerModal';

export const MarketView: React.FC = () => {
  const {
    career,
    buyoutRivalPlayer,
    requestPlayerLoan,
    proposePlayerTrade,
    toggleShortlistPlayer,
    startScoutingPlayer,
    advanceScoutingDays,
    respondToIncomingOffer,
    counterIncomingOffer,
    togglePlayerTransferList,
    openPlayerProfile,
  } = useGameStore();

  const [marketTab, setMarketTab] = useState<'rivals' | 'scouting' | 'offers'>('rivals');
  const [selectedRivalLeague, setSelectedRivalLeague] = useState<'ALL' | LeagueId>('ALL');
  const [selectedRivalId, setSelectedRivalId] = useState<string>('');

  const [inspectPlayer, setInspectPlayer] = useState<{
    player: Player;
    originLabel: string;
  } | null>(null);

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

  if (!career) return null;
  const userTeam = career.teams.find((t) => t.id === career.userTeamId)!;
  const allRivalTeams = career.teams.filter((t) => t.id !== userTeam.id);
  const rivalTeams =
    selectedRivalLeague === 'ALL'
      ? allRivalTeams
      : allRivalTeams.filter((t) => (t.leagueId ?? 'ITA_LBA') === selectedRivalLeague);
  const activeRival =
    rivalTeams.find((t) => t.id === selectedRivalId) ?? rivalTeams[0];

  const freeCap = userTeam.budget - calculateWageBill(userTeam.roster);
  const scoutRating = userTeam.staff?.scout_director?.rating ?? 60;
  const scoutedSet = new Set(career.scoutedPlayerIds);
  const activeScoutSet = new Set(career.activeScouting.map((s) => s.playerId));

  const formatEst = (val: number, pid: string, key: string, isScouted: boolean) => {
    if (isScouted) return String(val);
    const est = getAttributeEstimate(val, pid, key, scoutRating);
    return `${est.min}-${est.max}`;
  };

  const formatSalaryCell = (p: Player, isScouted: boolean) => {
    if (isScouted) return formatEuro(p.salary);
    const est = getSalaryEstimate(p.salary, p.id, scoutRating);
    return `${Math.round(est.min / 1000)}k - ${Math.round(est.max / 1000)}k €`;
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Area Mercato"
        title="Mercato & Scouting"
        subtitle={
          <>
            Resp. Scouting: <b className="text-amber-400">VAL {scoutRating}</b> • Spazio salariale:{' '}
            <span
              className={
                freeCap >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'
              }
            >
              {formatEuro(freeCap)}
            </span>{' '}
            • Mercato estivo:{' '}
            <span className="text-sky-400 font-semibold">
              apertura {formatItalianDate(getMarketOpenDate(career.seasonYear))}
            </span>
          </>
        }
        right={
          <div className="fm-tabs">
            {(
              [
                ['rivals', 'Altre Squadre (Buyout)'],
                ['scouting', `Scouting (${career.activeScouting.length}/5)`],
                ['offers', `Offerte (${career.incomingOffers.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setMarketTab(id)}
                className={`fm-tab ${marketTab === id ? 'fm-tab-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {marketTab === 'rivals' && activeRival && (
        <MarketRivalsTab
          allRivalTeams={allRivalTeams}
          rivalTeams={rivalTeams}
          activeRival={activeRival}
          selectedRivalLeague={selectedRivalLeague}
          scoutedSet={scoutedSet}
          activeScoutSet={activeScoutSet}
          shortlistIds={career.shortlistPlayerIds ?? []}
          formatEst={formatEst}
          formatSalaryCell={formatSalaryCell}
          onChangeLeague={(nextLeague) => {
            setSelectedRivalLeague(nextLeague);
            const firstInLeague =
              nextLeague === 'ALL'
                ? allRivalTeams[0]
                : allRivalTeams.find((t) => (t.leagueId ?? 'ITA_LBA') === nextLeague);
            if (firstInLeague) {
              setSelectedRivalId(firstInLeague.id);
            }
          }}
          onChangeRival={setSelectedRivalId}
          onOpenProfile={openPlayerProfile}
          onInspectPlayer={(player, originLabel) =>
            setInspectPlayer({ player, originLabel })
          }
          onStartScouting={startScoutingPlayer}
          onToggleShortlist={toggleShortlistPlayer}
          onOpenTrade={(player, fromTeamId, fromTeamName) =>
            setTradeTarget({ player, fromTeamId, fromTeamName })
          }
          onOpenLoan={(player, fromTeamId, fromTeamName) => {
            setLoanFeedback(null);
            setLoanSharePct(75);
            setLoanModal({ player, fromTeamId, fromTeamName });
          }}
          onOpenBuyout={(player, fromTeamId, fromTeamName, buyoutCost) =>
            setNegotiation({
              player,
              mode: 'buyout',
              fromTeamId,
              fromTeamName,
              buyoutCost,
            })
          }
        />
      )}

      {marketTab === 'scouting' && (
        <MarketScoutingTab
          activeScouting={career.activeScouting}
          onAdvanceDays={advanceScoutingDays}
        />
      )}

      {marketTab === 'offers' && (
        <MarketOffersTab
          incomingOffers={career.incomingOffers}
          roster={userTeam.roster}
          onRespondOffer={respondToIncomingOffer}
          onCounterOffer={counterIncomingOffer}
          onToggleTransferList={togglePlayerTransferList}
        />
      )}

      {inspectPlayer && (
        <MarketInspectPlayerModal
          player={inspectPlayer.player}
          originLabel={inspectPlayer.originLabel}
          isScouted={scoutedSet.has(inspectPlayer.player.id)}
          formatEst={formatEst}
          onClose={() => setInspectPlayer(null)}
        />
      )}

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
            buyoutRivalPlayer(
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
            if (res.accepted) {
              setLoanModal(null);
            } else {
              setLoanFeedback(res.message);
            }
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
