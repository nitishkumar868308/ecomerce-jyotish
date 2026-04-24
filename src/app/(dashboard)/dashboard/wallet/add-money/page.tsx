"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, ShieldCheck, Zap } from "lucide-react";
import { useAddMoneyToWallet, useWalletBalance } from "@/services/wallet";
import { usePrice } from "@/hooks/usePrice";
import { useCountryStore } from "@/stores/useCountryStore";
import toast from "react-hot-toast";

/**
 * "Add Money" landing screen. This intentionally only captures intent for now
 * — the actual payment gateway hand-off is a separate work item. When wired
 * up, the confirm button should:
 *   1. Create a wallet top-up intent on the backend.
 *   2. Redirect to PayU (India) or PayGlocal (international) based on the
 *      user's country.
 *   3. On gateway callback the backend credits the wallet.
 */
const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

export default function AddMoneyPage() {
  const router = useRouter();
  const { data: balance } = useWalletBalance();
  const { format, symbol } = usePrice();
  const { code: countryCode, currency } = useCountryStore();
  const addMoney = useAddMoneyToWallet();
  const [amount, setAmount] = useState<number>(500);
  const [custom, setCustom] = useState<string>("");

  const finalAmount = custom ? Number(custom) || 0 : amount;

  // Same routing logic as checkout: India → PayU (INR), non-India →
  // PayGlocal (international cards in the shopper's currency). Surfaced
  // in the UI so the shopper knows which hosted page they'll land on.
  const isIndia = (countryCode ?? "IND").toUpperCase() === "IND";
  const gateway = isIndia ? "PayU" : "PayGlocal";
  const gatewayCurrency = isIndia ? "INR" : currency;

  const handleConfirm = async () => {
    if (finalAmount < 10) {
      toast.error("Minimum top-up is 10");
      return;
    }
    // Credits the user's wallet immediately and records a transaction.
    // When the PayU / PayGlocal work lands, this direct call is replaced
    // by a redirect to the hosted page + credit-on-callback flow.
    try {
      await addMoney.mutateAsync({
        amount: finalAmount,
        note: `Wallet top-up via ${gateway}`,
      });
      toast.success(`${format(finalAmount)} added to wallet.`);
      router.push("/dashboard/wallet");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not add money. Try again.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard/wallet"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to wallet
      </Link>

      <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Add Money to Wallet
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Current balance: {format(balance?.balance || 0)}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Choose amount
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {PRESET_AMOUNTS.map((val) => {
              const active = !custom && amount === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setAmount(val);
                    setCustom("");
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                      : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                  }`}
                >
                  {symbol}
                  {val.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Or enter custom amount
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2.5 focus-within:border-[var(--accent-primary)]">
            <span className="text-sm font-medium text-[var(--text-muted)]">
              {symbol}
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Enter amount"
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              min={10}
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)]">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-success)]" />
            <span>
              Secure top-up via{" "}
              <strong className="text-[var(--text-primary)]">{gateway}</strong>
              {" "}in{" "}
              <strong className="text-[var(--text-primary)]">
                {gatewayCurrency}
              </strong>
              . You picked {countryCode ?? "IND"} in the top bar — change it
              there to switch gateway.
            </span>
          </p>
          <p className="mt-2 flex items-start gap-2">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
            <span>
              Used for Jyotish consultations, purchases across QuickGo &amp; the
              Mall, and seller payouts.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={finalAmount < 10 || addMoney.isPending}
          className="mt-6 w-full rounded-xl bg-[var(--accent-primary)] py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addMoney.isPending
            ? "Adding…"
            : `Add ${format(finalAmount || 0)} to wallet`}
        </button>
      </div>
    </div>
  );
}
