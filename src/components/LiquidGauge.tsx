"use client";
import { motion } from "framer-motion";

export function LiquidGauge({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative w-32 h-32 rounded-full glass flex items-center justify-center">
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neon-cyan/70 to-neon-purple/40"
        style={{ height: `${pct}%` }}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <div className="relative text-center">
        <div className="text-xl font-semibold">{pct}%</div>
        {label && <div className="text-xs text-white/70">{label}</div>}
      </div>
    </div>
  );
}

