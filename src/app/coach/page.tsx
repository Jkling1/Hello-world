"use client";
import { useState } from "react";

export default function CoachPage() {
  const [context, setContext] = useState("");
  const [insight, setInsight] = useState<string>("");

  async function submit() {
    const res = await fetch("/api/coach/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });
    const data = await res.json();
    setInsight(data.insights?.[0]?.tip || "");
  }

  async function generateMissions() {
    await fetch("/api/missions/today", { cache: "no-store" });
  }

  return (
    <div className="glass p-4 space-y-3">
      <div className="font-semibold">AI Coach</div>
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        className="w-full h-28 bg-white/5 border border-white/20 rounded p-3"
        placeholder="Describe your current training focus..."
      />
      <div className="flex gap-2">
        <button onClick={submit} className="chip hover:bg-white/20">Get Insight</button>
        <button onClick={generateMissions} className="chip hover:bg-white/20">Generate Today&apos;s Missions</button>
      </div>
      {insight && <div className="text-white/80">{insight}</div>}
    </div>
  );
}

