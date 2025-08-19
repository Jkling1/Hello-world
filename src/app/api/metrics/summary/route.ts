import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId, isDevOpen } from "@/lib/dev";
import { startOfLocalDay, formatISODate } from "@/lib/time";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = Number(searchParams.get("range") || 30);
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({});

  const end = startOfLocalDay();
  const start = new Date(end);
  start.setDate(end.getDate() - (range - 1));

  const kinds = [
    "RUN_MILES",
    "BIKE_MILES",
    "SWIM_YARDS",
    "HOURS_TRAINING",
    "READING_MIN",
    "CALORIES",
  ];

  if (isDevOpen()) {
    const count = await prisma.metricLog.count({ where: { userId } });
    if (count === 0) {
      const logs = [] as any[];
      for (let i = 0; i < 30; i++) {
        const d = new Date(end);
        d.setDate(end.getDate() - i);
        for (const k of kinds) {
          logs.push({ userId, date: new Date(d.toISOString().slice(0, 10)), kind: k, value: Math.random() * (k === "CALORIES" ? 1000 : 10) });
        }
      }
      await prisma.metricLog.createMany({ data: logs });
    }
  }

  const rows = await prisma.metricLog.findMany({
    where: { userId, date: { gte: new Date(start.toISOString().slice(0, 10)), lte: new Date(end.toISOString().slice(0, 10)) } },
    orderBy: { date: "asc" },
  });

  const byKind: Record<string, { date: string; value: number }[]> = {};
  for (const k of kinds) byKind[k] = [];

  const dayMap = new Map<string, Record<string, number>>();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dayMap.set(formatISODate(d), Object.fromEntries(kinds.map((k) => [k, 0])));
  }
  for (const r of rows) {
    const key = formatISODate(r.date);
    const m = dayMap.get(key)!;
    m[r.kind] += r.value;
  }
  for (const [date, agg] of dayMap) {
    for (const k of kinds) {
      byKind[k].push({ date, value: agg[k] });
    }
  }

  return NextResponse.json(byKind);
}

