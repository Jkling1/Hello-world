"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

type Series = { date: string; value: number }[];
type SummaryResp = Record<string, Series>;

export function MetricsCards() {
  const [summary, setSummary] = useState<SummaryResp>({});

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/metrics/summary?range=30", { cache: "no-store" });
      setSummary(await res.json());
    })();
  }, []);

  const streams = Object.entries(summary);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {streams.map(([key, data]) => (
        <div key={key} className="glass p-3">
          <div className="text-sm mb-2 text-white/70">{key.replaceAll("_", " ")}</div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id={`g-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00fff7" stopOpacity={0.9} />
                    <stop offset="80%" stopColor="#8a2be2" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.7)", border: "none" }} />
                <Area type="monotone" dataKey="value" stroke="#00fff7" fill={`url(#g-${key})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}

