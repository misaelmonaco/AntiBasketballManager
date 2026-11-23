import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, Handshake, MessageSquare, Tag, X } from 'lucide-react';
import { Player, TransferOffer } from '../../types';
import { formatEuro } from '../../engine/ratings';
import { getPlayerBuyoutClause } from '../../engine/scoutingEngine';

export interface BuyoutCounterFeedback {
  status: 'accepted' | 'countered' | 'final_offer' | 'withdrawn' | 'error';
  newOfferAmount?: number;
  message: string;
}

interface MarketOffersTabProps {
  incomingOffers: TransferOffer[];
  roster: Player[];
  onRespondOffer: (offerId: string, accept: boolean) => void;
  onCounterOffer: (offerId: string, requestedAmount: number) => BuyoutCounterFeedback;
  onToggleTransferList: (playerId: string) => void;
}

function roundToFiveK(amount: number, minAmount: number): number {
  const rounded = Math.round(amount / 5000) * 5000;
  return Math.max(minAmount, rounded);
}

function getRiskAssessment(
  requestedAmount: number,
  initialAmount: number
): { label: string; badgeClass: string; isHighRisk: boolean } {
  const ratio = initialAmount > 0 ? (requestedAmount - initialAmount) / initialAmount : 0;
  if (ratio > 0.35) {
    return {
      label: 'Alto rischio rottura',
      badgeClass: 'bg-red-500/15 border-red-500/40 text-red-300',
      isHighRisk: true,
    };
  }
  if (ratio >= 0.2) {
    return {
      label: 'Ambiziosa',
      badgeClass: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      isHighRisk: false,
    };
  }
  return {
    label: 'Moderata',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    isHighRisk: false,
  };
}

/**
 * Scheda Offerte & Lista Trasferimenti: consente di accettare, rifiutare
 * o contrattare al rialzo le offerte di buyout ricevute per i propri giocatori.
 */
export const MarketOffersTab: React.FC<MarketOffersTabProps> = ({
  incomingOffers,
  roster,
  onRespondOffer,
  onCounterOffer,
  onToggleTransferList,
}) => {
  const [negotiatingOfferId, setNegotiatingOfferId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState<number>(0);
  const [withdrawnNotice, setWithdrawnNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const rosterById = useMemo(
    () => new Map(roster.map((p) => [p.id, p])),
    [roster]
  );

  const openNegotiation = (off: TransferOffer) => {
    if (off.isFinalOffer) return;
    if (negotiatingOfferId === off.id) {
      setNegotiatingOfferId(null);
      setErrorNotice(null);
      return;
    }
    const defaultTarget = roundToFiveK(off.buyoutAmount * 1.15, off.buyoutAmount + 5000);
    setNegotiatingOfferId(off.id);
    setCounterAmount(defaultTarget);
    setErrorNotice(null);
  };

  const handleSubmitCounter = (off: TransferOffer) => {
    const res = onCounterOffer(off.id, counterAmount);
    if (res.status === 'error') {
      setErrorNotice(res.message);
      return;
    }
    setErrorNotice(null);
    if (res.status === 'withdrawn') {
      setWithdrawnNotice(res.message);
      setNegotiatingOfferId(null);
      return;
    }
    if (res.status === 'accepted' || res.status === 'final_offer') {
      setNegotiatingOfferId(null);
      return;
    }
    const nextBase = res.newOfferAmount ?? off.buyoutAmount;
    setCounterAmount(roundToFiveK(nextBase * 1.1, nextBase + 5000));
  };

  return (
    <div className="space-y-5">
      <div className="fm-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white">
            Offerte di Buyout Ricevute per i Tuoi Giocatori
          </h2>
          {incomingOffers.length > 0 && (
            <span className="text-xs text-slate-400">
              Puoi accettare subito, rifiutare o contrattare un rilancio (max 3 round)
            </span>
          )}
        </div>

        {withdrawnNotice && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{withdrawnNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setWithdrawnNotice(null)}
              className="p-1 rounded-lg text-red-300 hover:text-white hover:bg-red-900/40 shrink-0 cursor-pointer"
              title="Chiudi avviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {incomingOffers.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Nessuna offerta ricevuta al momento. Metti un giocatore sul mercato qui sotto per attirare offerte!
          </div>
        ) : (
          <div className="space-y-3">
            {incomingOffers.map((off) => {
              const player = rosterById.get(off.playerId);
              const clause = player ? getPlayerBuyoutClause(player) : null;
              const initialAmount = off.initialBuyoutAmount ?? off.buyoutAmount;
              const gainedDelta = off.buyoutAmount - initialAmount;
              const roundsUsed = off.negotiationRounds ?? 0;
              const isNegotiating = negotiatingOfferId === off.id;
              const risk = getRiskAssessment(counterAmount, initialAmount);
              const liveDeltaPct =
                off.buyoutAmount > 0
                  ? Math.round(((counterAmount - off.buyoutAmount) / off.buyoutAmount) * 100)
                  : 0;

              return (
                <div
                  key={off.id}
                  className={`p-4 rounded-xl bg-slate-950/80 border transition space-y-3 ${
                    isNegotiating
                      ? 'border-amber-500/55 ring-1 ring-amber-500/20'
                      : off.isFinalOffer
                      ? 'border-emerald-500/35'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                        <span>
                          {off.fromTeamName} vuole{' '}
                          <span className="text-orange-400">{off.playerName}</span>
                        </span>
                        {off.reason && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                            {off.reason}
                          </span>
                        )}
                        {roundsUsed > 0 && !off.isFinalOffer && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-bold">
                            Trattativa {roundsUsed}/3
                          </span>
                        )}
                        {off.isFinalOffer && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[10px] font-bold">
                            Offerta Definitiva
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>
                          Offerta Buyout:{' '}
                          <span className="text-emerald-400 font-extrabold">
                            {formatEuro(off.buyoutAmount)}
                          </span>
                        </span>
                        {gainedDelta > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                            +{formatEuro(gainedDelta)} da {formatEuro(initialAmount)}
                          </span>
                        )}
                        {player && clause !== null && (
                          <span>
                            • [{player.primaryPosition}] OVR {player.overall} • Clausola{' '}
                            <span className="text-slate-200 font-semibold">
                              {formatEuro(clause)}
                            </span>
                          </span>
                        )}
                        <span>• Giornata {off.round}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRespondOffer(off.id, true)}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accetta e Incassa
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(off.isFinalOffer)}
                        onClick={() => openNegotiation(off)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-bold text-xs transition ${
                          off.isFinalOffer
                            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            : isNegotiating
                            ? 'bg-amber-500 text-slate-950 border-amber-400 cursor-pointer'
                            : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/50 text-amber-300 cursor-pointer'
                        }`}
                      >
                        <Handshake className="w-3.5 h-3.5" />
                        {off.isFinalOffer ? 'Definitiva' : 'Contratta'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (isNegotiating) setNegotiatingOfferId(null);
                          onRespondOffer(off.id, false);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-900/50 text-slate-300 font-semibold text-xs cursor-pointer"
                      >
                        Rifiuta
                      </button>
                    </div>
                  </div>

                  {off.lastClubResponse && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                        off.isFinalOffer
                          ? 'bg-emerald-950/35 border-emerald-500/35 text-emerald-200'
                          : 'bg-slate-900/90 border-slate-700/80 text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                      <span>{off.lastClubResponse}</span>
                    </div>
                  )}

                  {isNegotiating && (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/35 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="font-bold text-amber-300">
                          Controproposta a {off.fromTeamName} (Round {roundsUsed + 1}/3)
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span>
                            Attuale:{' '}
                            <strong className="text-white">{formatEuro(off.buyoutAmount)}</strong>
                          </span>
                          {clause !== null && (
                            <span>
                              • Clausola:{' '}
                              <strong className="text-slate-200">{formatEuro(clause)}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                          Rilanci rapidi:
                        </span>
                        {[
                          { label: '+10%', mult: 1.1 },
                          { label: '+20%', mult: 1.2 },
                          { label: '+30%', mult: 1.3 },
                        ].map((preset) => {
                          const targetVal = roundToFiveK(
                            off.buyoutAmount * preset.mult,
                            off.buyoutAmount + 5000
                          );
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setCounterAmount(targetVal);
                                setErrorNotice(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition ${
                                counterAmount === targetVal
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                  : 'bg-slate-950 border-slate-700 hover:border-amber-500/50 text-slate-300'
                              }`}
                            >
                              {preset.label} ({formatEuro(targetVal)})
                            </button>
                          );
                        })}
                        {clause !== null && clause > off.buyoutAmount && (
                          <button
                            type="button"
                            onClick={() => {
                              setCounterAmount(roundToFiveK(clause, off.buyoutAmount + 5000));
                              setErrorNotice(null);
                            }}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition ${
                              counterAmount === roundToFiveK(clause, off.buyoutAmount + 5000)
                                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                : 'bg-slate-950 border-slate-700 hover:border-amber-500/50 text-slate-300'
                            }`}
                          >
                            Clausola ({formatEuro(clause)})
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <input
                            type="number"
                            step={5000}
                            min={off.buyoutAmount + 5000}
                            value={counterAmount}
                            onChange={(e) => {
                              setCounterAmount(Number(e.target.value));
                              setErrorNotice(null);
                            }}
                            className="w-full max-w-[190px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-extrabold text-white focus:outline-none focus:border-amber-500 tabular-nums"
                          />
                          <span className="text-xs font-bold text-amber-300 tabular-nums">
                            {liveDeltaPct > 0 ? `+${liveDeltaPct}%` : `${liveDeltaPct}%`}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${risk.badgeClass}`}
                        >
                          {risk.label}
                        </span>
                      </div>

                      {errorNotice && (
                        <div className="text-xs text-red-400 font-semibold">{errorNotice}</div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setNegotiatingOfferId(null);
                            setErrorNotice(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          disabled={counterAmount <= off.buyoutAmount}
                          onClick={() => handleSubmitCounter(off)}
                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-extrabold cursor-pointer"
                        >
                          Invia Controproposta ({formatEuro(counterAmount)})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fm-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              Lista Trasferimenti (Metti sul Mercato)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              I giocatori messi sul mercato attirano subito l’interesse di altri club con offerte di buyout.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-300">
            {roster.filter((p) => p.onTransferList).length} sul mercato
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {[...roster]
            .sort(
              (a, b) =>
                Number(Boolean(b.onTransferList)) - Number(Boolean(a.onTransferList)) ||
                b.overall - a.overall
            )
            .map((p) => (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  p.onTransferList ? 'bg-amber-500/10 border-amber-500/40' : 'fm-subcard'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {p.firstName[0]}. {p.lastName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {p.primaryPosition} • OVR {p.overall} • Buyout{' '}
                    {formatEuro(getPlayerBuyoutClause(p))}
                  </div>
                </div>
                <button
                  onClick={() => onToggleTransferList(p.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                    p.onTransferList
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {p.onTransferList ? 'Sul Mercato' : 'Metti in Lista'}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
