"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";

type Phase = {
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
};

type Props = {
  phases: Phase[];
  today?: string; // YYYY-MM-DD
  currentWeek?: number;
  totalWeeks?: number;
};

export function TrainingPhaseTracker({ phases, today, currentWeek, totalWeeks }: Props) {
  const todayDate = useMemo(() => (today ? new Date(today) : new Date()), [today]);
  const allStart = useMemo(() => new Date(phases[0]?.startDate ?? new Date()), [phases]);
  const allEnd = useMemo(() => new Date(phases[phases.length - 1]?.endDate ?? new Date()), [
    phases,
  ]);

  const totalMs = Math.max(1, allEnd.getTime() - allStart.getTime());
  const progress = Math.min(
    1,
    Math.max(0, (todayDate.getTime() - allStart.getTime()) / totalMs)
  );

  return (
    <div className="glass p-4 md:p-5 mb-6">
      <div className="text-sm text-white/70 mb-2">Training Phases</div>
      <div className="relative w-full h-6 rounded-full overflow-hidden flex border border-white/15">
        {phases.map((p, i) => {
          const start = new Date(p.startDate).getTime();
          const end = new Date(p.endDate).getTime();
          const widthPct = ((end - start) / totalMs) * 100;
          const colors = [
            "from-neon-cyan/50 to-neon-purple/40",
            "from-neon-purple/50 to-neon-magenta/40",
            "from-neon-magenta/50 to-neon-gold/40",
            "from-neon-gold/50 to-neon-cyan/40",
          ];
          return (
            <div
              key={i}
              className={`h-full bg-gradient-to-r ${colors[i % colors.length]} backdrop-blur-sm border-r border-white/10`}
              style={{ width: `${widthPct}%` }}
              title={p.name}
            />
          );
        })}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 text-black flex items-center justify-center shadow-glow"
          style={{ left: `calc(${progress * 100}% - 12px)` }}
          layout
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          ⚙
        </motion.div>
      </div>
      <div className="mt-2 flex justify-between text-xs text-white/70">
        {phases.map((p, i) => (
          <span key={i} className="flex-1 text-center">
            {p.name}
          </span>
        ))}
      </div>
      {currentWeek !== undefined && totalWeeks !== undefined && (
        <div className="mt-2 text-sm text-white/80">
          Week {currentWeek} / {totalWeeks}
        </div>
      )}
    </div>
  );
}

