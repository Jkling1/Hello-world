import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId, isDevOpen } from "@/lib/dev";
import { startOfLocalDay } from "@/lib/time";

export async function GET() {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({ phases: [], currentWeek: 0, totalWeeks: 0 });

  if (isDevOpen()) {
    const count = await prisma.trainingPhase.count({ where: { userId } });
    if (count === 0) {
      const races = await prisma.race.findMany({ where: { userId }, orderBy: { date: "asc" } });
      const end = races[0]?.date ?? new Date(new Date().getFullYear(), 11, 31);
      const start = startOfLocalDay();
      const totalDays = Math.max(28, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const quarter = Math.floor(totalDays / 4);
      const mk = (d: Date) => new Date(d.toISOString().slice(0, 10));
      const a = mk(start);
      const b = mk(new Date(a.getTime() + quarter * 24 * 60 * 60 * 1000));
      const c = mk(new Date(b.getTime() + quarter * 24 * 60 * 60 * 1000));
      const d = mk(new Date(c.getTime() + quarter * 24 * 60 * 60 * 1000));
      const e = mk(end);
      await prisma.trainingPhase.createMany({
        data: [
          { userId, name: "Base", startDate: a, endDate: b, order: 1 },
          { userId, name: "Build", startDate: b, endDate: c, order: 2 },
          { userId, name: "Peak", startDate: c, endDate: d, order: 3 },
          { userId, name: "Taper", startDate: d, endDate: e, order: 4 },
        ],
      });
    }
  }

  const phases = await prisma.trainingPhase.findMany({ where: { userId }, orderBy: { order: "asc" } });
  const start = phases[0]?.startDate ?? startOfLocalDay();
  const end = phases[phases.length - 1]?.endDate ?? startOfLocalDay();
  const now = startOfLocalDay();
  const totalWeeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)));
  const currentWeek = Math.min(totalWeeks, Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))));
  return NextResponse.json({
    phases: phases.map((p) => ({ name: p.name, startDate: p.startDate.toISOString().slice(0, 10), endDate: p.endDate.toISOString().slice(0, 10) })),
    currentWeek,
    totalWeeks,
  });
}

