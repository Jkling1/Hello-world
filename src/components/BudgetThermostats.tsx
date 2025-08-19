"use client";
import { useEffect, useState } from "react";
import { centsToDollars, dollarsToCents, formatUSD } from "@/lib/currency";

type Plan = { id: string; slug: string; title: string; totalCents: number; categories: Category[] };
type Category = { id: string; key: string; label: string; capCents: number };

export function BudgetThermostats({ slug = "race-day-2026" }: { slug?: string }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [tip, setTip] = useState<string>("");

  async function load() {
    const res = await fetch(`/api/race-budget/plan?slug=${slug}`, { cache: "no-store" });
    const data = await res.json();
    setPlan(data.plan);
    computeRemain(data.plan);
    const tipRes = await fetch(`/api/race-budget/tip?slug=${slug}`);
    setTip((await tipRes.json()).tip);
  }

  function computeRemain(p: Plan) {
    const sum = p.categories.reduce((a, c) => a + c.capCents, 0);
    setRemaining(p.totalCents - sum);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveTotal(value: number) {
    const totalCents = dollarsToCents(value);
    const res = await fetch(`/api/race-budget/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, totalCents }),
    });
    const data = await res.json();
    setPlan(data.plan);
    computeRemain(data.plan);
  }

  async function saveCaps(categories: Category[]) {
    const res = await fetch(`/api/race-budget/allocations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, categories }),
    });
    const data = await res.json();
    setPlan(data.plan);
    computeRemain(data.plan);
  }

  if (!plan) return <div className="glass p-4">Loading...</div>;

  return (
    <div className="glass p-4 md:p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Race Day Budget</h3>
        <div className="chip">Remaining {formatUSD(remaining)}</div>
      </div>
      <div className="mb-4">
        <label className="text-sm text-white/70">Total</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="number"
            step="0.01"
            className="w-40 bg-white/5 border border-white/20 rounded px-3 py-2"
            value={centsToDollars(plan.totalCents)}
            onChange={(e) => saveTotal(Number(e.target.value))}
          />
          <span className="text-white/60 text-sm">USD</span>
        </div>
      </div>
      <div className="space-y-3">
        {plan.categories.map((c, idx) => (
          <div key={c.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="text-white/80">{c.label}</div>
              <div className="text-white/60">{formatUSD(c.capCents)}</div>
            </div>
            <input
              type="range"
              min={0}
              max={plan.totalCents}
              value={c.capCents}
              onChange={(e) => {
                const next = { ...c, capCents: Number(e.target.value) };
                const updated = plan.categories.map((x) => (x.key === c.key ? next : x));
                const merged = { ...plan, categories: updated };
                setPlan(merged);
                computeRemain(merged);
              }}
              onMouseUp={() => saveCaps(plan.categories)}
              className="w-full"
            />
            <div className="w-full h-2 rounded bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                style={{ width: `${Math.min(100, (c.capCents / plan.totalCents) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 chip bg-white/10 border-white/20">Tip: {tip}</div>
    </div>
  );
}

