import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Clock,
  MessageSquare,
  Mic,
  Send,
  User,
  X,
} from 'lucide-react';
import { formatItalianDate, getRoundDate } from '../engine/calendarUtils';
import {
  getChatChannelKey,
  getChatCooldownRemaining,
  getChatTopicsForChannel,
  resolveChatInteraction,
} from '../engine/interactionChatEngine';
import { computeStandings } from '../engine/seasonEngine';
import { useGameStore } from '../store/gameStore';
import { ChatChannel, ChatTone } from '../types';
import { ChatSidebarPanel } from './chat/ChatSidebarPanel';
import { ChatThreadView } from './chat/ChatThreadView';

interface PendingChatReply {
  channelKey: string;
  channel: ChatChannel;
  playerId?: string;
  topicId: string;
  tone: ChatTone;
  coachName: string;
  coachLine: string;
  npcName: string;
  timestamp: string;
}

const TONE_OPTIONS: { id: ChatTone; label: string; hint: string }[] = [
  { id: 'encouraging', label: 'Empatico', hint: 'Sostegno e fiducia' },
  { id: 'diplomatic', label: 'Diplomatico', hint: 'Tono equilibrato' },
  { id: 'demanding', label: 'Deciso / Esigente', hint: 'Pugno duro e richieste chiare' },
];

export const InteractionChatModal: React.FC = () => {
  const { career, activeChatModal, closeChatModal } = useGameStore();

  const [channel, setChannel] = useState<ChatChannel>('player');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('praise_form');
  const [tone, setTone] = useState<ChatTone>('encouraging');
  const [pendingReply, setPendingReply] = useState<PendingChatReply | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userTeam = career?.teams.find((t) => t.id === career.userTeamId);
  const careerSlotId = career?.slotId ?? null;

  useEffect(() => {
    if (!activeChatModal) return;
    setChannel(activeChatModal.channel);
    if (activeChatModal.playerId) {
      setSelectedPlayerId(activeChatModal.playerId);
    }
  }, [activeChatModal]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current !== null) {
        clearTimeout(replyTimerRef.current);
        replyTimerRef.current = null;
      }
      setPendingReply(null);
    };
  }, [careerSlotId]);

  const topics = useMemo(() => getChatTopicsForChannel(channel), [channel]);

  useEffect(() => {
    if (topics.length > 0 && !topics.some((t) => t.id === topicId)) {
      setTopicId(topics[0].id);
    }
  }, [topics, topicId]);

  const effectivePlayerId =
    channel === 'player'
      ? selectedPlayerId && userTeam?.roster.some((p) => p.id === selectedPlayerId)
        ? selectedPlayerId
        : userTeam?.roster[0]?.id || ''
      : undefined;

  const currentDate = career
    ? career.currentDate ?? getRoundDate(career.seasonYear, career.currentRound)
    : '';
  const channelKey = getChatChannelKey(channel, effectivePlayerId);
  const thread = career?.chatHistory?.[channelKey];
  const messages = thread?.messages ?? [];
  const isTypingInCurrentChannel =
    pendingReply !== null && pendingReply.channelKey === channelKey;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [channelKey, messages.length, isTypingInCurrentChannel]);

  if (!career || !activeChatModal || !userTeam) return null;

  const selectedPlayer =
    channel === 'player'
      ? userTeam.roster.find((p) => p.id === effectivePlayerId)
      : undefined;

  const cooldownRemaining = getChatCooldownRemaining(
    career.chatHistory,
    channel,
    currentDate,
    effectivePlayerId
  );

  const selectedTopic = topics.find((t) => t.id === topicId) ?? topics[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedTopic ||
      !career ||
      !userTeam ||
      pendingReply !== null ||
      cooldownRemaining > 0
    ) {
      return;
    }

    const leagueId = userTeam.leagueId ?? 'ITA_LBA';
    const standings = computeStandings(
      career.teams.filter((t) => (t.leagueId ?? 'ITA_LBA') === leagueId),
      career.schedule.filter((g) => (g.leagueId ?? 'ITA_LBA') === leagueId)
    );
    const userRank = Math.max(
      1,
      standings.findIndex((s) => s.teamId === userTeam.id) + 1
    );

    const preview = resolveChatInteraction({
      career,
      userTeam,
      channel,
      topicId: selectedTopic.id,
      tone,
      currentDate,
      player: selectedPlayer,
      userRank,
    });

    const reqChannel = channel;
    const reqPlayerId = effectivePlayerId;
    const reqTopicId = selectedTopic.id;
    const reqTone = tone;
    const startedSlotId = career.slotId;

    setPendingReply({
      channelKey,
      channel: reqChannel,
      playerId: reqPlayerId,
      topicId: reqTopicId,
      tone: reqTone,
      coachName: career.managerName,
      coachLine: preview.coachLine,
      npcName: preview.npcName,
      timestamp: currentDate,
    });

    const delayMs = 950 + Math.floor(Math.random() * 550);
    replyTimerRef.current = setTimeout(() => {
      replyTimerRef.current = null;
      const state = useGameStore.getState();
      if (state.career?.slotId === startedSlotId) {
        state.sendChatInteraction({
          channel: reqChannel,
          playerId: reqPlayerId,
          topicId: reqTopicId,
          tone: reqTone,
        });
      }
      setPendingReply(null);
    }, delayMs);
  };

  return (
    <div className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fm-modal rounded-2xl max-w-4xl w-full h-[86vh] max-h-[760px] flex flex-col overflow-hidden border border-slate-700/80 shadow-2xl">
        {/* Top Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/35 flex items-center justify-center text-orange-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                Centro Colloqui &amp; Comunicazioni — {userTeam.shortName}
              </h2>
              <p className="text-[11px] text-slate-400">
                {formatItalianDate(currentDate)} • Parla con spogliatoio, proprietà o stampa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeChatModal}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Switch */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="fm-tabs">
            <button
              type="button"
              onClick={() => setChannel('player')}
              className={`fm-tab flex items-center gap-1.5 ${
                channel === 'player' ? 'fm-tab-active' : ''
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Giocatori ({userTeam.roster.length})
            </button>
            <button
              type="button"
              onClick={() => setChannel('board')}
              className={`fm-tab flex items-center gap-1.5 ${
                channel === 'board' ? 'fm-tab-active' : ''
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Dirigenza
            </button>
            <button
              type="button"
              onClick={() => setChannel('media')}
              className={`fm-tab flex items-center gap-1.5 ${
                channel === 'media' ? 'fm-tab-active' : ''
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Media &amp; Stampa
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>
              Chimica: <b className="text-emerald-400">{userTeam.chemistry}%</b>
            </span>
            <span>
              Fiducia Dirigenza:{' '}
              <b className="text-orange-400">{career.boardConfidence ?? 75}%</b>
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          <div className="md:col-span-4 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col min-h-0 overflow-hidden">
            <ChatSidebarPanel
              channel={channel}
              career={career}
              userTeam={userTeam}
              effectivePlayerId={effectivePlayerId}
              currentDate={currentDate}
              pendingChannelKey={pendingReply?.channelKey}
              onSelectPlayer={setSelectedPlayerId}
            />
          </div>

          <div className="md:col-span-8 flex flex-col min-h-0 overflow-hidden">
            {selectedPlayer && channel === 'player' && (
              <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                <div>
                  <span className="font-black text-white">
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </span>
                  <span className="ml-2 text-[11px] text-slate-400">
                    {selectedPlayer.primaryPosition}
                    {selectedPlayer.secondaryPosition
                      ? ` / ${selectedPlayer.secondaryPosition}`
                      : ''}{' '}
                    • OVR {selectedPlayer.overall} • {selectedPlayer.personality}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Minuti target: <b>{selectedPlayer.targetMinutes ?? 0}&apos;</b>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                    Morale: <b>{selectedPlayer.morale}%</b>
                  </span>
                </div>
              </div>
            )}

            <ChatThreadView
              scrollRef={scrollRef}
              messages={messages}
              isTypingInCurrentChannel={isTypingInCurrentChannel}
              pendingReply={pendingReply}
            />

            <form
              onSubmit={handleSubmit}
              className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5 shrink-0"
            >
              {cooldownRemaining > 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Colloquio già svolto di recente. Prossima disponibilità tra{' '}
                    <b>
                      {cooldownRemaining} giorn{cooldownRemaining === 1 ? 'o' : 'i'}
                    </b>
                    .
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Argomento
                      </label>
                      <select
                        value={selectedTopic?.id ?? ''}
                        onChange={(e) => setTopicId(e.target.value)}
                        disabled={pendingReply !== null}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {topics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Tono del Coach
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {TONE_OPTIONS.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            disabled={pendingReply !== null}
                            onClick={() => setTone(t.id)}
                            title={t.hint}
                            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border cursor-pointer transition-colors truncate disabled:opacity-50 disabled:cursor-not-allowed ${
                              tone === t.id
                                ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <span className="text-[11px] text-slate-400 truncate">
                      {isTypingInCurrentChannel && pendingReply
                        ? `${pendingReply.npcName} sta scrivendo...`
                        : pendingReply !== null
                        ? "Invio risposta in corso in un'altra chat..."
                        : selectedTopic?.description}
                    </span>
                    <button
                      type="submit"
                      disabled={pendingReply !== null}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {pendingReply !== null ? 'Attendi...' : 'Invia'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
