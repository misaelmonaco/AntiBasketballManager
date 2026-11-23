import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCheck,
  Inbox,
  Mail,
  MailOpen,
  MessageSquare,
  Scale,
  Stethoscope,
  Store,
  Trash2,
  User,
  UserCog,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { formatItalianDate } from '../engine/calendarUtils';
import { InboxMessage, InboxMessageCategory } from '../types';
import { PageHeader } from './PageHeader';

const CATEGORY_META: Record<
  InboxMessageCategory,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  dirigenza: {
    label: 'Dirigenza',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Building2,
  },
  vice: {
    label: 'Vice Allenatore',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    icon: UserCog,
  },
  staff: {
    label: 'Staff & Scouting',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: Stethoscope,
  },
  mercato: {
    label: 'Mercato & Agenti',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    icon: Store,
  },
  lega: {
    label: 'Lega',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    icon: Scale,
  },
};

export const MessagesView: React.FC = () => {
  const {
    career,
    markMessageRead,
    markAllMessagesRead,
    deleteMessage,
    resolveMessageChoice,
    setActiveTab,
    openPlayerProfile,
    openRosterComplianceModal,
    openChatModal,
  } = useGameStore();

  const [categoryFilter, setCategoryFilter] = useState<'all' | InboxMessageCategory>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const messages = career?.messages ?? [];
  const unreadCount = messages.filter((m) => !m.read).length;

  const filtered = messages.filter((m) =>
    categoryFilter === 'all' ? true : m.category === categoryFilter
  );

  const selectedMessage: InboxMessage | undefined =
    filtered.find((m) => m.id === selectedId) ?? filtered[0];

  useEffect(() => {
    if (selectedMessage && !selectedMessage.read) {
      markMessageRead(selectedMessage.id);
    }
  }, [selectedMessage?.id, selectedMessage?.read, markMessageRead]);

  if (!career) return null;

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full flex flex-col">
      <PageHeader
        eyebrow="Comunicazioni & Posta"
        title="Mail"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} mail da leggere da Dirigenza, Staff e Mercato`
            : 'Tutte le mail di Dirigenza, Vice Allenatore, Staff e Lega sono state lette'
        }
        right={
          <>
            <div className="fm-tabs">
              {(
                [
                  ['all', `Tutti (${messages.length})`],
                  ['dirigenza', 'Dirigenza'],
                  ['vice', 'Vice'],
                  ['staff', 'Staff'],
                  ['mercato', 'Mercato'],
                  ['lega', 'Lega'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className={`fm-tab ${categoryFilter === key ? 'fm-tab-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => openChatModal({ channel: 'player' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-xs font-bold text-sky-300 cursor-pointer transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Apri Chat
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllMessagesRead}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                Segna tutte lette
              </button>
            )}
          </>
        }
      />

      {filtered.length === 0 ? (
        <div className="fm-card rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-2 flex-1">
          <Inbox className="w-10 h-10 text-slate-600" />
          <div className="text-sm font-bold text-slate-300">Nessuna mail in questa sezione</div>
          <p className="text-xs text-slate-500 max-w-md">
            Le comunicazioni della Dirigenza, del Vice Allenatore, dello Staff Medico e del Mercato appariranno qui automaticamente durante la stagione.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
          {/* Left: Thread list */}
          <div className="lg:col-span-5 fm-card rounded-2xl overflow-hidden flex flex-col min-h-[360px]">
            <div className="px-4 py-3 border-b border-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Posta in Arrivo</span>
              <span className="tabular-nums">{filtered.length} mail</span>
            </div>
            <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1">
              {filtered.map((msg) => {
                const meta = CATEGORY_META[msg.category];
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => {
                      setSelectedId(msg.id);
                      if (!msg.read) markMessageRead(msg.id);
                    }}
                    className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-orange-500/12 border-l-2 border-l-orange-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="mt-1 shrink-0">
                      {!msg.read ? (
                        <span className="block w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-400/60" />
                      ) : (
                        <MailOpen className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                          {formatItalianDate(msg.date)}
                        </span>
                      </div>
                      <div
                        className={`text-xs mt-1.5 truncate ${
                          !msg.read ? 'font-black text-white' : 'font-semibold text-slate-200'
                        }`}
                      >
                        {msg.urgent && (
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 inline mr-1 -mt-0.5" />
                        )}
                        {msg.subject}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {msg.senderName} • {msg.body.replace(/\s+/g, ' ')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detail pane */}
          <div className="lg:col-span-7 fm-card rounded-2xl p-6 flex flex-col justify-between gap-5 overflow-y-auto">
            {selectedMessage ? (
              <>
                <div className="space-y-4">
                  {/* Top metadata */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {(() => {
                          const meta = CATEGORY_META[selectedMessage.category];
                          const Icon = meta.icon;
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold uppercase ${meta.badgeClass}`}
                            >
                              <Icon className="w-3 h-3" />
                              {selectedMessage.senderRole}
                            </span>
                          );
                        })()}
                        {selectedMessage.urgent && (
                          <span className="px-2 py-0.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-extrabold uppercase">
                            Priorità Alta
                          </span>
                        )}
                        <span className="text-xs text-slate-400 tabular-nums">
                          {formatItalianDate(selectedMessage.date)} • Giornata {selectedMessage.round}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-white pt-1">
                        {selectedMessage.subject}
                      </h2>
                      <div className="text-xs text-slate-400">
                        Da: <strong className="text-slate-200">{selectedMessage.senderName}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/60 border border-slate-700/80 text-slate-400 hover:text-red-300 cursor-pointer"
                      title="Elimina mail"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="fm-subcard rounded-xl p-5 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {selectedMessage.body}
                  </div>

                  {/* Interactive Choices */}
                  {selectedMessage.choices && selectedMessage.choices.length > 0 && (
                    <div className="fm-subcard rounded-xl p-4 space-y-3 border-orange-500/30">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
                        Risposta Richiesta
                      </div>
                      {selectedMessage.resolvedChoiceId ? (
                        <div className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3.5 py-2.5">
                          {selectedMessage.resolutionNote ?? 'Decisione già presa.'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {selectedMessage.choices.map((ch) => (
                            <button
                              key={ch.id}
                              onClick={() => resolveMessageChoice(selectedMessage.id, ch.id)}
                              className="text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/60 transition-all cursor-pointer"
                            >
                              <div className="text-xs font-bold text-white">{ch.label}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{ch.effectHint}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Quick Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedMessage.playerId && (
                      <button
                        onClick={() => openPlayerProfile(selectedMessage.playerId!)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        Apri Profilo Giocatore
                      </button>
                    )}
                    {selectedMessage.openRosterModal && (
                      <button
                        onClick={openRosterComplianceModal}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-black cursor-pointer"
                      >
                        {selectedMessage.actionLabel ?? 'Apri Costruttore Roster'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {selectedMessage.actionTab && (
                      <button
                        onClick={() => setActiveTab(selectedMessage.actionTab!)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-black cursor-pointer"
                      >
                        {selectedMessage.actionLabel ?? 'Vai alla Sezione'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Mail className="w-3.5 h-3.5" />
                    Posta Ufficiale Club
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
