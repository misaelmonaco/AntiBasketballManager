import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FastForward, Pause, Play, Timer, Users } from 'lucide-react';
import { Nationality } from '../types';
import { useGameStore } from '../store/gameStore';
import { formatClock } from '../engine/ratings';
import { BasketballCourtCanvas } from './BasketballCourtCanvas';
import { MatchTeamShootingCard } from './match/MatchTeamShootingCard';
import { MatchScoreboardHeader } from './match/MatchScoreboardHeader';
import { MatchPlayByPlayFeed } from './match/MatchPlayByPlayFeed';
import { MatchBoxScoreTable } from './match/MatchBoxScoreTable';
import { MatchSubstitutionsModal } from './match/MatchSubstitutionsModal';
import { ManagerAvatar } from './ManagerAvatar';
import { TimeoutModal } from './TimeoutModal';
import { createDefaultManagerProfile } from '../engine/managerEngine';
import { computeAssistantTimeoutPlan } from '../engine/assistantCoachTactics';

export const MatchLiveView: React.FC = () => {
  const {
    career,
    liveMatch,
    autoSubUser,
    setAutoSubUser,
    stepLiveMatch,
    simulateLiveMatchToEnd,
    userCallTimeout,
    userApplyTimeoutTactics,
    userSubstitute,
    setDelegateTacticsToAssistant,
    setToast,
    completeLiveMatchAndAdvance,
  } = useGameStore();

  const [playing, setPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [boxTab, setBoxTab] = useState<'home' | 'away'>('home');
  const [showSubModal, setShowSubModal] = useState<boolean>(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState<boolean>(false);
  const [subOutId, setSubOutId] = useState<string>('');
  const lastAutoTimeoutPossRef = useRef<number>(-99);

  const nationalityByPlayerId = useMemo(() => {
    const map = new Map<string, Nationality>();
    if (!career) return map;
    for (const team of career.teams) {
      for (const player of team.roster) {
        map.set(player.id, player.nationality);
      }
    }
    return map;
  }, [career]);

  useEffect(() => {
    if (!playing || !liveMatch || liveMatch.finished) return;
    const intervalMs = speed === 1 ? 950 : speed === 2 ? 450 : 140;
    const timer = setInterval(() => {
      stepLiveMatch();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [playing, speed, liveMatch, stepLiveMatch]);

  useEffect(() => {
    if (!liveMatch || !career || liveMatch.finished) return;
    const club = career.teams.find((t) => t.id === career.userTeamId);
    if (!club?.tactics.delegateToAssistant) return;

    const isHome = liveMatch.home.teamId === career.userTeamId;
    const myTeam = isHome ? liveMatch.home : liveMatch.away;
    const oppTeam = isHome ? liveMatch.away : liveMatch.home;
    if (
      myTeam.momentum <= -6 &&
      myTeam.timeoutsRemaining > 0 &&
      liveMatch.possessionCount - lastAutoTimeoutPossRef.current >= 10
    ) {
      lastAutoTimeoutPossRef.current = liveMatch.possessionCount;
      const ast = club.staff?.assistant_coach;
      const astLabel = ast ? `${ast.firstName} ${ast.lastName}` : 'Vice Allenatore';
      userCallTimeout();
      const { plan, summary } = computeAssistantTimeoutPlan(
        myTeam,
        oppTeam,
        liveMatch.quarter,
        liveMatch.clockRemaining,
        astLabel
      );
      userApplyTimeoutTactics(plan);
      setToast(`Timeout automatico del Vice! ${summary}`);
    }
  }, [
    liveMatch,
    career,
    userCallTimeout,
    userApplyTimeoutTactics,
    setToast,
  ]);

  if (!liveMatch || !career) return null;

  const userIsHome = liveMatch.home.teamId === career.userTeamId;
  const userTeamState = userIsHome ? liveMatch.home : liveMatch.away;
  const opponentTeamState = userIsHome ? liveMatch.away : liveMatch.home;
  const userClub = career.teams.find((t) => t.id === career.userTeamId);
  const assistantStaff = userClub?.staff?.assistant_coach;
  const assistantLabel = assistantStaff
    ? `${assistantStaff.firstName} ${assistantStaff.lastName}`
    : 'Vice Allenatore';
  const delegateTactics = Boolean(userClub?.tactics.delegateToAssistant);

  const quarterLabel =
    liveMatch.quarter <= 4 ? `${liveMatch.quarter}° Quarto` : `${liveMatch.quarter - 4}° OT`;
  const clockFormatted = formatClock(liveMatch.clockRemaining);
  const managerProfile = career.managerProfile ?? createDefaultManagerProfile(career.managerName);

  return (
    <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
      <MatchScoreboardHeader
        home={liveMatch.home}
        away={liveMatch.away}
        finished={liveMatch.finished}
        quarterLabel={quarterLabel}
        clockFormatted={clockFormatted}
      />

      {/* Controls Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {!liveMatch.finished ? (
            <>
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {playing ? 'Pausa' : 'Riprendi'}
              </button>

              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                {([1, 2, 5] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                      speed === s ? 'bg-slate-700 text-orange-400' : 'text-slate-400'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  simulateLiveMatchToEnd();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-400" />
                Simula fino alla fine
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={completeLiveMatchAndAdvance}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Continua e Salva Risultati Giornata
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 mr-3 pr-3 border-r border-slate-800">
            <ManagerAvatar
              avatar={managerProfile.avatar}
              clubColor={userClub?.primaryColor}
              size="sm"
            />
            <span className="text-xs font-bold text-slate-200">
              {managerProfile.firstName} {managerProfile.lastName}
            </span>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-400 mr-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSubUser}
              onChange={(e) => setAutoSubUser(e.target.checked)}
              className="accent-orange-500"
            />
            Cambi automatici
          </label>

          <label className="flex items-center gap-1.5 text-xs text-amber-300 mr-2 cursor-pointer">
            <input
              type="checkbox"
              checked={delegateTactics}
              onChange={(e) => {
                const enabled = e.target.checked;
                setDelegateTacticsToAssistant(enabled);
                if (enabled) {
                  const { plan, summary } = computeAssistantTimeoutPlan(
                    userTeamState,
                    opponentTeamState,
                    liveMatch.quarter,
                    liveMatch.clockRemaining,
                    assistantLabel
                  );
                  userApplyTimeoutTactics(plan);
                  setToast(summary);
                }
              }}
              className="accent-amber-500"
            />
            Tattica al Vice
          </label>

          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              userCallTimeout();
              setShowTimeoutModal(true);
            }}
            disabled={liveMatch.finished || userTeamState.timeoutsRemaining <= 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 text-xs font-bold border border-slate-700 cursor-pointer"
          >
            <Timer className="w-3.5 h-3.5" />
            Timeout ({userTeamState.timeoutsRemaining})
          </button>

          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              const firstOnCourt = userTeamState.players.find((p) => p.onCourt);
              setSubOutId(firstOnCourt?.playerId ?? '');
              setShowSubModal(true);
            }}
            disabled={liveMatch.finished}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sky-300 text-xs font-bold border border-slate-700 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            Sostituzioni
          </button>
        </div>
      </div>

      {/* Main Content: Left (Canvas + Statistiche al Tiro), Right (Tabellino Compatto + Play-by-Play) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-y-auto lg:overflow-hidden">
        <div className="lg:col-span-5 flex flex-col gap-3 min-h-0 lg:overflow-y-auto pr-0.5">
          <BasketballCourtCanvas match={liveMatch} speed={speed} playing={playing} />
          <MatchTeamShootingCard home={liveMatch.home} away={liveMatch.away} />
        </div>

        <div className="lg:col-span-7 flex flex-col gap-3 min-h-0 overflow-hidden">
          <MatchBoxScoreTable
            home={liveMatch.home}
            away={liveMatch.away}
            boxTab={boxTab}
            onChangeTab={setBoxTab}
          />
          <MatchPlayByPlayFeed
            events={liveMatch.playByPlay}
            homeTeamId={liveMatch.home.teamId}
            homeShort={liveMatch.home.shortName}
            awayShort={liveMatch.away.shortName}
          />
        </div>
      </div>

      {showSubModal && (
        <MatchSubstitutionsModal
          teamName={userTeamState.name}
          players={userTeamState.players}
          nationalityByPlayerId={nationalityByPlayerId}
          subOutId={subOutId}
          onSelectSubOut={setSubOutId}
          onSubstitute={userSubstitute}
          onClose={() => setShowSubModal(false)}
        />
      )}

      {showTimeoutModal && (
        <TimeoutModal
          userTeam={userTeamState}
          opponentTeam={opponentTeamState}
          quarter={liveMatch.quarter}
          clockRemaining={liveMatch.clockRemaining}
          assistantName={assistantLabel}
          quarterLabel={quarterLabel}
          clockFormatted={clockFormatted}
          onSubstitute={userSubstitute}
          onApply={(plan, resumePlay) => {
            userApplyTimeoutTactics(plan);
            setShowTimeoutModal(false);
            if (resumePlay) setPlaying(true);
          }}
          onClose={() => setShowTimeoutModal(false)}
        />
      )}
    </div>
  );
};
