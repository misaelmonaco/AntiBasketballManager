import React from 'react';
import { MessageSquare } from 'lucide-react';
import { formatItalianDate } from '../../engine/calendarUtils';
import { ChatMessageBubble } from '../../types';

export interface PendingChatReplyPreview {
  coachName: string;
  coachLine: string;
  npcName: string;
  timestamp: string;
}

interface ChatThreadViewProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  messages: ChatMessageBubble[];
  isTypingInCurrentChannel: boolean;
  pendingReply: PendingChatReplyPreview | null;
}

export const ChatThreadView: React.FC<ChatThreadViewProps> = ({
  scrollRef,
  messages,
  isTypingInCurrentChannel,
  pendingReply,
}) => {
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40"
    >
      {messages.length === 0 && !isTypingInCurrentChannel ? (
        <div className="h-full flex flex-col items-center justify-center text-center px-6 py-8">
          <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
          <div className="text-xs font-bold text-slate-300">
            Nessun colloquio recente in questo canale
          </div>
          <p className="text-[11px] text-slate-500 mt-1 max-w-md">
            Scegli un argomento e il tono della conversazione qui sotto per iniziare il confronto diretto.
          </p>
        </div>
      ) : (
        <>
          {messages.map((msg) => {
            const isCoach = msg.sender === 'coach';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isCoach ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-slate-500 mb-1 px-1">
                  {msg.senderName} • {formatItalianDate(msg.timestamp)}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border ${
                    isCoach
                      ? 'bg-orange-500/15 border-orange-500/40 text-orange-100 rounded-br-sm'
                      : 'bg-slate-900 border-slate-700/80 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  <div>{msg.text}</div>
                  {msg.effects && msg.effects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-800">
                      {msg.effects.map((eff, i) => {
                        const isNeg = eff.trim().startsWith('-');
                        return (
                          <span
                            key={`${msg.id}-eff-${i}`}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isNeg
                                ? 'bg-red-500/15 border-red-500/40 text-red-300'
                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            }`}
                          >
                            {eff}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTypingInCurrentChannel && pendingReply && (
            <>
              <div className="flex flex-col items-end">
                <div className="text-[10px] text-slate-500 mb-1 px-1">
                  {pendingReply.coachName} • {formatItalianDate(pendingReply.timestamp)}
                </div>
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border bg-orange-500/15 border-orange-500/40 text-orange-100 rounded-br-sm">
                  <div>{pendingReply.coachLine}</div>
                </div>
              </div>

              <div className="flex flex-col items-start">
                <div className="text-[10px] text-slate-500 mb-1 px-1">
                  {pendingReply.npcName}
                </div>
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border bg-slate-900 border-slate-700/80 text-slate-300 rounded-bl-sm flex items-center gap-2">
                  <span className="italic">sta scrivendo</span>
                  <span className="inline-flex items-center gap-1" aria-hidden="true">
                    <span
                      className="chat-typing-dot"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="chat-typing-dot"
                      style={{ animationDelay: '180ms' }}
                    />
                    <span
                      className="chat-typing-dot"
                      style={{ animationDelay: '360ms' }}
                    />
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
