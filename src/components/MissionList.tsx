"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

type Mission = {
  id: string;
  title: string;
  type: "PHYSICAL" | "FINANCIAL" | "MENTAL";
  completed: boolean;
  xp: number;
};

export function MissionList() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [xpPulse, setXpPulse] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/missions/today", { cache: "no-store" });
    const data = await res.json();
    setMissions(data.missions);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(id: string, done: boolean) {
    const res = await fetch("/api/missions/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done }),
    });
    const data = await res.json();
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, completed: done } : m)));
    if (data.xp) {
      setXpPulse(data.xp);
      setTimeout(() => setXpPulse(null), 1200);
    }
  }

  const colorFor = (t: Mission["type"]) =>
    t === "PHYSICAL" ? "text-neon-cyan" : t === "FINANCIAL" ? "text-neon-gold" : "text-neon-magenta";

  return (
    <div className="glass p-4 md:p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Today&apos;s Missions</h3>
        <AnimatePresence>
          {xpPulse !== null && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: -10, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="chip bg-neon-gold/20 border-neon-gold/40 text-neon-gold"
            >
              +{xpPulse} XP
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="space-y-3">
        {missions.map((m) => (
          <button
            key={m.id}
            onClick={() => toggle(m.id, !m.completed)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition ${
              m.completed ? "opacity-70" : ""
            }`}
          >
            <CheckCircle2
              className={`w-5 h-5 ${m.completed ? "text-neon-gold" : "text-white/40"}`}
            />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">{m.title}</div>
              <div className={`text-xs ${colorFor(m.type)}`}>{m.type.toLowerCase()}</div>
            </div>
            <div className="text-xs text-white/60">{m.xp} XP</div>
          </button>
        ))}
      </div>
    </div>
  );
}

