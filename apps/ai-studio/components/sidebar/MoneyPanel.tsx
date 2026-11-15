'use client';

import React, { useState } from 'react';
import { AlertTriangle, Coins, Download, ShieldCheck } from 'lucide-react';
import { useBrowserState } from '../BrowserStateProvider';
import { ApprovalCard } from '../ApprovalCard';

export function MoneyPanel() {
  const {
    spendingPolicy,
    simulatedTransactions,
    approvals,
    updateSpendingPolicy,
    createManualApproval,
  } = useBrowserState();

  const [merchant, setMerchant] = useState('Linear Plus Team Plan');
  const [description, setDescription] = useState('Monthly workspace seat simulation');
  const [amount, setAmount] = useState('49');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const pendingSpend = approvals.filter(
    (a) => a.status === 'PENDING' && a.actionType === 'SPEND_MONEY_SIMULATED'
  );
  const totalSimulatedSpent = simulatedTransactions.reduce(
    (sum, t) => sum + t.amountUsd,
    0
  );

  const handleProposePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setStatusMsg('Enter a valid positive USD amount.');
      return;
    }

    const apr = await createManualApproval({
      missionId: `msn_money_${Date.now()}`,
      stepId: `step_mercury_${Date.now()}`,
      agentId: 'mercury',
      action: {
        actionType: 'SPEND_MONEY_SIMULATED',
        title: `Simulated Purchase: ${merchant}`,
        reason: `Mercury requests approval for a simulated $${numAmount.toFixed(2)} charge.`,
        targetService: 'money_os',
        riskLevel: 'HIGH',
        estimatedCostUsd: numAmount,
        parameters: {
          merchant: merchant.trim(),
          description: description.trim(),
          amountUsd: numAmount,
          isSimulated: true,
        },
      },
    });

    if (!apr) {
      setStatusMsg('Blocked by Aegis spending policy limits.');
    } else {
      setStatusMsg('Pending approval created below. Approve or Reject to continue.');
    }
  };

  const downloadReceipt = (txId: string) => {
    const tx = simulatedTransactions.find((t) => t.id === txId);
    if (!tx) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            ...tx,
            notice:
              'SIMULATION MODE RECEIPT — No real funds were transferred or settled.',
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tx.id}_simulated_receipt.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <div className="rounded-xl border border-amber-500/35 bg-amber-950/20 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
          <Coins className="h-4 w-4 text-amber-400" />
          <span>Money OS · Simulation Mode</span>
        </div>
        <p className="mt-1 text-[11px] text-amber-200/80 leading-relaxed">
          All balances and transactions are simulated. Real payment execution is disabled by default and requires a separately verified payment provider.
        </p>
      </div>

      {/* Wallet Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3">
          <div className="text-[11px] text-slate-400">Simulated Balance</div>
          <div className="mt-1 font-mono tabular-nums text-base font-semibold text-emerald-300">
            ${spendingPolicy.simulatedBalanceUsd.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3">
          <div className="text-[11px] text-slate-400">Simulated Spent</div>
          <div className="mt-1 font-mono tabular-nums text-base font-semibold text-slate-100">
            ${totalSimulatedSpent.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Spending Policy Controls */}
      <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span>Aegis Spending Policy</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="block">
            <span className="text-[11px] text-slate-400">Per-Tx Limit ($)</span>
            <input
              type="number"
              min={1}
              max={100000}
              value={spendingPolicy.perTxLimitUsd}
              onChange={(e) =>
                updateSpendingPolicy({
                  perTxLimitUsd: Number(e.target.value) || 0,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080c14] px-2 py-1 text-xs font-mono tabular-nums text-slate-100"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-400">Daily Limit ($)</span>
            <input
              type="number"
              min={1}
              max={100000}
              value={spendingPolicy.dailyLimitUsd}
              onChange={(e) =>
                updateSpendingPolicy({
                  dailyLimitUsd: Number(e.target.value) || 0,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080c14] px-2 py-1 text-xs font-mono tabular-nums text-slate-100"
            />
          </label>
        </div>
      </div>

      {/* Propose Simulated Purchase */}
      <form
        onSubmit={handleProposePurchase}
        className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-2"
      >
        <div className="text-xs font-semibold text-slate-200">
          Propose Simulated Transaction (Mercury)
        </div>
        <input
          type="text"
          required
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="Merchant / Vendor"
          className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100"
        />
        <input
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Purpose"
          className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-100"
          />
          <button
            type="submit"
            className="flex-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
          >
            Request Approval
          </button>
        </div>
        {statusMsg && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </form>

      {/* Pending Purchase Approvals */}
      {pendingSpend.map((apr) => (
        <ApprovalCard key={apr.id} approval={apr} />
      ))}

      {/* Transaction History */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400">
          Simulated Receipts ({simulatedTransactions.length})
        </div>
        {simulatedTransactions.length === 0 ? (
          <p className="text-xs text-slate-500">No simulated transactions recorded yet.</p>
        ) : (
          simulatedTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#0b101b] px-2.5 py-2 text-xs"
            >
              <div className="min-w-0">
                <div className="font-medium text-slate-200 truncate">
                  {tx.merchant}
                </div>
                <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                  ${tx.amountUsd.toFixed(2)} · Simulation
                </div>
              </div>
              <button
                type="button"
                aria-label={`Download simulated receipt ${tx.id}`}
                onClick={() => downloadReceipt(tx.id)}
                className="rounded border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
