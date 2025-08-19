"use client";
import { useEffect, useMemo, useState } from "react";
import { daysUntil } from "@/lib/time";

type Race = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  location?: string;
  distanceLabel: string;
};

export function UpcomingBattlesWidget() {
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/races", { cache: "no-store" });
      const data = await res.json();
      setRaces(data.races || []);
    })();
  }, []);

  const selected = useMemo(() => races.filter((r) => selectedIds.includes(r.id)), [races, selectedIds]);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="glass p-4 md:p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Upcoming Battles</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          {races.map((r) => (
            <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(r.id)}
                onChange={() => toggle(r.id)}
                className="accent-neon-cyan"
              />
              <span className="text-white/80">{r.name}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.map((r) => (
            <div key={r.id} className="chip bg-white/10 border-white/20">
              <div className="font-medium">{r.name}</div>
              <div className="text-white/60 text-xs">{daysUntil(new Date(r.date))} days</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

