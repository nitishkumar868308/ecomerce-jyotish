"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Wallet, X, ShieldCheck } from "lucide-react";
import { useWalletBalance, useAddMoneyToWallet } from "@/services/wallet";
import { useSendAddingMoneyHeartbeat } from "@/services/chat";
import { useCountryStore } from "@/stores/useCountryStore";
import { usePrice } from "@/hooks/usePrice";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Session id so the backend can surface "user is topping up"
   *  to the astrologer side. */
  sessionId: number | string;
  /** Minimum recommended top-up so the chat resumes with at least
   *  a minute of runway. Driven by the session's pricePerMinute. */
  suggestedAmount?: number;
}

const PRESETS = [100, 250, 500, 1000, 2000];

/**
 * In-chat wallet top-up. Opens as a modal over the chat page so the
 * shopper never loses the conversation while adding money — previously
 * the "+ Add money" button navigated away to /dashboard/wallet/add-
 * money, orphaning the live session. Once payment goes through we
 * invalidate the wallet queries so the billing strip updates on its
 * next poll and the session auto-resumes under its own steam.
 *
 * While the modal is open we heartbeat `/chat/:id/adding-money` every
 * 3 seconds. The astrologer's status poll flips `userAddingMoney:
 * true` so they can see "user is topping up wallet…" and hold off on
 * ending the session.
 */
export function AddMoneyModal({
  open,
  onClose,
  sessionId,
  suggestedAmount,
}: Props) {
  const { data: balance } = useWalletBalance();
  const addMoney = useAddMoneyToWallet();
  const heartbeat = useSendAddingMoneyHeartbeat();
  const { code: countryCode, currency } = useCountryStore();
  const { format, symbol } = usePrice();

  const suggestedPreset =
    suggestedAmount && suggestedAmount > 0
      ? (() => {
          const target = Math.ceil(suggestedAmount);
          return PRESETS.find((p) => p >= target) ?? PRESETS[PRESETS.length - 1];
        })()
      : 500;

  const [amount, setAmount] = useState<number>(suggestedPreset);
  const [custom, setCustom] = useState<string>("");
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount(suggestedPreset);
    setCustom("");
    // Immediate ping + 3s heartbeat so the astrologer's status-poll
    // sees the flag on the next sweep (≤1.5s) and holds the line.
    heartbeat.mutate({ sessionId });
    heartbeatRef.current = setInterval(
      () => heartbeat.mutate({ sessionId }),
      3000,
    );
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionId, suggestedPreset]);

  if (!open) return null;

  const walletBalance =
    balance && typeof balance === "object" && "balance" in balance
      ? Number((balance as { balance: number | string }).balance) || 0
      : 0;

  const isIndia = (countryCode ?? "IND").toUpperCase() === "IND";
  const gateway = isIndia ? "PayU" : "PayGlocal";
  const gatewayCurrency = isIndia ? "INR" : currency;

  const finalAmount = custom ? Number(custom) || 0 : amount;
  const canSubmit = finalAmount >= 10 && !addMoney.isPending;

  const handleConfirm = async () => {
    if (!canSubmit) {
      toast.error("Minimum top-up is 10");
      return;
    }
    try {
      await addMoney.mutateAsync({
        amount: finalAmount,
        note: `In-chat top-up via ${gateway}`,
      });
      toast.success(`${format(finalAmount)} added to wallet.`);
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Could not add money. Try again.",
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={addMoney.isPending ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-br from-[#15102a] via-[#0f0a24] to-[#0b0719] text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={addMoney.isPending}
          className="absolute right-3 top-3 rounded-full p-1.5 text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-40"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-3 pt-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
            <Wallet className="h-3 w-3" />
            Quick top-up
          </div>
          <h3 className="mt-2 text-lg font-bold text-white">Add money</h3>
          <p className="mt-1 text-xs text-white/60">
            Current balance:{" "}
            <span className="font-semibold text-white">
              {format(walletBalance)}
            </span>
          </p>
        </div>

        <div className="space-y-4 px-6 pb-5">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Choose amount
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((val) => {
                const active = !custom && amount === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setAmount(val);
                      setCustom("");
                    }}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "border-amber-300 bg-amber-300/10 text-amber-200"
                        : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:text-white",
                    )}
                  >
                    {symbol}
                    {val.toLocaleString()}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Or enter custom amount
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-amber-300/50">
              <span className="text-sm font-medium text-white/60">
                {symbol}
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                min={10}
              />
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-relaxed text-white/70">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span>
              Secure top-up via{" "}
              <strong className="text-white">{gateway}</strong> in{" "}
              <strong className="text-white">{gatewayCurrency}</strong>. Chat
              resumes the moment payment succeeds.
            </span>
          </p>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 py-2.5 text-sm font-semibold text-slate-900 shadow-md hover:brightness-110 disabled:opacity-60"
          >
            {addMoney.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {addMoney.isPending ? "Adding…" : `Pay ${format(finalAmount || 0)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddMoneyModal;
