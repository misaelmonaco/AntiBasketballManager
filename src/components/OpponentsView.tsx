import React, { useEffect, useMemo, useState } from 'react';
import { getLeagueConfig, LEAGUES } from '../data/teams';
import { getRoundDate } from '../engine/calendarUtils';
import { computeStandings } from '../engine/seasonEngine';
import { useGameStore } from '../store/gameStore';
import { LeagueId } from '../types';
import { PageHeader } from './PageHeader';
import { MatchBoxScoreModal } from './calendar/MatchBoxScoreModal';
import {
  computeTeamFormMap,
  computeTeamSeasonOverview,
  getNextScheduledOpponentId,
} from './opponents/opponentAnalytics';
import { OpponentTeamListSidebar } from './opponents/OpponentTeamListSidebar';
import { OpponentClubHeader, OpponentSubTab } from './opponents/OpponentClubHeader';
import { OpponentOverviewTab } from './opponents/OpponentOverviewTab';
import { OpponentRosterTab } from './opponents/OpponentRosterTab';
import { OpponentStatsTab } from './opponents/OpponentStatsTab';
import { OpponentClubDetailsTab } from './opponents/OpponentClubDetailsTab';
import { OpponentScheduleTab } from './opponents/OpponentScheduleTab';

export const OpponentsView: React.FC = () => {
  const {
    career,
    inspectedTeamId,
    openPlayerProfile,
    startScoutingPlayer,
    toggleShortlistPlayer,
    setActiveTab,
    setToast,
  } = useGameStore();

  const userTeam = career?.teams.find((t) => t.id === career.userTeamId) ?? null;
  const userLeagueId: LeagueId = userTeam?.leagueId ?? 'ITA_LBA';

  const initialOpponentId = useMemo(() => {
    if (!career || !userTeam) return null;
    if (inspectedTeamId && inspectedTeamId !== userTeam.id) {
      return inspectedTeamId;
    }
    const nextOppId = getNextScheduledOpponentId(userTeam.id, career.schedule);
    if (nextOppId) return nextOppId;
    return career.teams.find((t) => t.id !== userTeam.id)?.id ?? null;
  }, [career, userTeam, inspectedTeamId]);

  const [selectedLeagueId, setSelectedLeagueId] = useState<LeagueId>(() => {
    if (career && initialOpponentId) {
      const target = career.teams.find((t) => t.id === initialOpponentId);
      if (target?.leagueId) return target.leagueId;
    }
    return userLeagueId;
  });

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(initialOpponentId);
  const [activeSubTab, setActiveSubTab] = useState<OpponentSubTab>('overview');
  const [selectedBoxGameId, setSelectedBoxGameId] = useState<string | null>(null);

  // Sincronizza quando si apre un club da Classifiche o da altro link esterno
  useEffect(() => {
    if (!career || !userTeam || !inspectedTeamId || inspectedTeamId === userTeam.id) return;
    const found = career.teams.find((t) => t.id === inspectedTeamId);
    if (!found) return;
    setSelectedLeagueId(found.leagueId ?? 'ITA_LBA');
    setSelectedTeamId(found.id);
    setSelectedBoxGameId(null);
  }, [career, userTeam, inspectedTeamId]);

  const leagueTeams = useMemo(() => {
    if (!career) return [];
    return career.teams.filter((t) => (t.leagueId ?? 'ITA_LBA') === selectedLeagueId);
  }, [career, selectedLeagueId]);

  const leagueRivals = useMemo(() => {
    if (!career) return [];
    return leagueTeams.filter((t) => t.id !== career.userTeamId);
  }, [leagueTeams, career]);

  // Se la selezione corrente non appartiene al campionato selezionato, ripiega sul primo rivale del girone
  useEffect(() => {
    if (leagueRivals.length === 0) return;
    if (!selectedTeamId || !leagueRivals.some((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(leagueRivals[0].id);
      setSelectedBoxGameId(null);
    }
  }, [leagueRivals, selectedTeamId]);

  const leagueSchedule = useMemo(() => {
    if (!career) return [];
    return career.schedule.filter((g) => (g.leagueId ?? 'ITA_LBA') === selectedLeagueId);
  }, [career, selectedLeagueId]);

  const userLeagueSchedule = useMemo(() => {
    if (!career) return [];
    return career.schedule.filter((g) => (g.leagueId ?? 'ITA_LBA') === userLeagueId);
  }, [career, userLeagueId]);

  const standingsMap = useMemo(() => {
    const map = new Map<string, { rank: number; wins: number; losses: number }>();
    const rows = computeStandings(leagueTeams, leagueSchedule);
    rows.forEach((row, idx) => {
      map.set(row.teamId, { rank: idx + 1, wins: row.wins, losses: row.losses });
    });
    return map;
  }, [leagueTeams, leagueSchedule]);

  const formMap = useMemo(
    () => computeTeamFormMap(leagueTeams, leagueSchedule),
    [leagueTeams, leagueSchedule]
  );

  const nextOpponentId = useMemo(() => {
    if (!career || !userTeam) return null;
    return getNextScheduledOpponentId(userTeam.id, career.schedule);
  }, [career, userTeam]);

  const selectedTeam = useMemo(() => {
    return leagueRivals.find((t) => t.id === selectedTeamId) ?? leagueRivals[0] ?? null;
  }, [leagueRivals, selectedTeamId]);

  const metrics = useMemo(() => {
    if (!career || !userTeam || !selectedTeam) return null;
    return computeTeamSeasonOverview(
      selectedTeam,
      userTeam,
      leagueTeams,
      leagueSchedule,
      career.teams,
      career.seasonYear,
      userLeagueSchedule
    );
  }, [
    career,
    userTeam,
    selectedTeam,
    leagueTeams,
    leagueSchedule,
    userLeagueSchedule,
  ]);

  if (!career || !userTeam) return null;

  const selectedLeagueCfg = getLeagueConfig(selectedLeagueId);
  const scoutRating = userTeam.staff?.scout_director?.rating ?? 60;
  const scoutedSet = new Set(career.scoutedPlayerIds);
  const activeScoutSet = new Set(career.activeScouting.map((s) => s.playerId));
  const shortlistSet = new Set(career.shortlistPlayerIds ?? []);

  const selectedBoxGame = selectedBoxGameId
    ? career.schedule.find((g) => g.id === selectedBoxGameId) ?? null
    : null;
  const boxHomeTeam = selectedBoxGame
    ? career.teams.find((t) => t.id === selectedBoxGame.homeTeamId) ?? null
    : null;
  const boxAwayTeam = selectedBoxGame
    ? career.teams.find((t) => t.id === selectedBoxGame.awayTeamId) ?? null
    : null;

  const handleSelectLeague = (leagueId: LeagueId) => {
    setSelectedLeagueId(leagueId);
    const rivalsInLeague = career.teams.filter(
      (t) => (t.leagueId ?? 'ITA_LBA') === leagueId && t.id !== career.userTeamId
    );
    if (nextOpponentId && rivalsInLeague.some((t) => t.id === nextOpponentId)) {
      setSelectedTeamId(nextOpponentId);
    } else if (rivalsInLeague[0]) {
      setSelectedTeamId(rivalsInLeague[0].id);
    }
    setSelectedBoxGameId(null);
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <PageHeader
        eyebrow="Scouting & Analisi Leghe"
        title="Squadre Avversarie"
        subtitle="Esplora roster, statistiche collettive e individuali, assetto tattico, staff, strutture e calendario di ogni club avversario."
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <OpponentTeamListSidebar
          leagues={LEAGUES}
          selectedLeagueId={selectedLeagueId}
          onChangeLeague={handleSelectLeague}
          teams={leagueRivals}
          selectedTeamId={selectedTeam?.id ?? null}
          onSelectTeam={(id) => {
            setSelectedTeamId(id);
            setSelectedBoxGameId(null);
          }}
          nextOpponentId={nextOpponentId}
          standingsMap={standingsMap}
          formMap={formMap}
        />

        <div className="xl:col-span-8 space-y-4">
          {!selectedTeam || !metrics ? (
            <div className="fm-card rounded-2xl p-10 text-center text-sm text-slate-400">
              Seleziona una squadra avversaria dalla lista a sinistra per visualizzarne il dossier completo.
            </div>
          ) : (
            <>
              <OpponentClubHeader
                team={selectedTeam}
                leagueName={`${selectedLeagueCfg.name} (${selectedLeagueCfg.tier})`}
                metrics={metrics}
                activeSubTab={activeSubTab}
                onChangeSubTab={setActiveSubTab}
                isSameLeague={(selectedTeam.leagueId ?? 'ITA_LBA') === userLeagueId}
                isNextOpponent={selectedTeam.id === nextOpponentId}
                onGoToTactics={() => {
                  setToast(
                    `Preparazione tattica vs ${selectedTeam.name}: imposta le istruzioni nella sezione Piano Avversario.`
                  );
                  setActiveTab('tactics');
                }}
              />

              {activeSubTab === 'overview' && (
                <OpponentOverviewTab
                  team={selectedTeam}
                  userTeam={userTeam}
                  metrics={metrics}
                  scoutRating={scoutRating}
                  scoutedSet={scoutedSet}
                  onOpenPlayerProfile={openPlayerProfile}
                />
              )}

              {activeSubTab === 'roster' && (
                <OpponentRosterTab
                  team={selectedTeam}
                  scoutRating={scoutRating}
                  scoutedSet={scoutedSet}
                  activeScoutSet={activeScoutSet}
                  shortlistSet={shortlistSet}
                  onOpenPlayerProfile={openPlayerProfile}
                  onStartScouting={startScoutingPlayer}
                  onToggleShortlist={toggleShortlistPlayer}
                />
              )}

              {activeSubTab === 'stats' && (
                <OpponentStatsTab
                  team={selectedTeam}
                  metrics={metrics}
                  onOpenPlayerProfile={openPlayerProfile}
                />
              )}

              {activeSubTab === 'club' && (
                <OpponentClubDetailsTab
                  team={selectedTeam}
                  metrics={metrics}
                  onOpenPlayerProfile={openPlayerProfile}
                />
              )}

              {activeSubTab === 'schedule' && (
                <OpponentScheduleTab
                  team={selectedTeam}
                  userTeam={userTeam}
                  metrics={metrics}
                  onSelectTeam={(id) => {
                    const target = career.teams.find((t) => t.id === id);
                    if (!target || target.id === userTeam.id) return;
                    setSelectedLeagueId(target.leagueId ?? 'ITA_LBA');
                    setSelectedTeamId(target.id);
                    setSelectedBoxGameId(null);
                  }}
                  onOpenBoxScore={(gameId) => setSelectedBoxGameId(gameId)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {selectedBoxGame && boxHomeTeam && boxAwayTeam && (
        <MatchBoxScoreModal
          game={selectedBoxGame}
          date={getRoundDate(
            career.seasonYear,
            selectedBoxGame.round,
            getLeagueConfig(selectedBoxGame.leagueId ?? selectedLeagueId).totalRounds
          )}
          homeTeam={boxHomeTeam}
          awayTeam={boxAwayTeam}
          onClose={() => setSelectedBoxGameId(null)}
          onOpenPlayerProfile={(pid) => {
            setSelectedBoxGameId(null);
            openPlayerProfile(pid);
          }}
        />
      )}
    </div>
  );
};
