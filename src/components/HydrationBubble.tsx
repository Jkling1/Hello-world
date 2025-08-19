"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type TodayHydration = { targetMl: number; totalMl: number };

export function HydrationBubble() {
  const [data, setData] = useState<TodayHydration>({ targetMl: 2500, totalMl: 0 });

  async function load() {
    const res = await fetch("/api/hydration/today", { cache: "no-store" });
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function add(delta: number) {
    const res = await fetch("/api/hydration/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deltaMl: delta }),
    });
    const updated = await res.json();
    setData(updated);
  }

  const pct = Math.min(1, data.totalMl / data.targetMl);
  const color = pct < 0.5 ? "from-neon-cyan/60" : pct < 0.9 ? "from-neon-purple/60" : "from-neon-gold/70";

  return (
    <div className="glass p-4 md:p-5 h-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Hydration</h3>
        <div className="text-sm text-white/70">
          {data.totalMl}/{data.targetMl} ml
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className={`relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-b ${color} to-transparent border border-white/20 shadow-glowPurple`}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <div className="absolute inset-0 rounded-full backdrop-blur-[2px]" />
            {pct > 1 && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-neon-gold text-xs">Overfill!</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold">
              {(pct * 100).toFixed(0)}%
            </div>
          </motion.div>
        </div>
        <div className="flex flex-col gap-2 w-32">
          <button onClick={() => add(250)} className="chip hover:bg-white/20">+250</button>
          <button onClick={() => add(500)} className="chip hover:bg-white/20">+500</button>
          <button onClick={() => add(1000)} className="chip hover:bg-white/20">+1000</button>
        </div>
      </div>
    </div>
  );
}

