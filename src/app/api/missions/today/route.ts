import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId, isDevOpen } from "@/lib/dev";
import { startOfLocalDay } from "@/lib/time";

export async function GET() {
  const userId = getOptionalUserId();
  const today = startOfLocalDay();
  const day = new Date(today.toISOString().slice(0, 10));

  if (!userId) {
    return NextResponse.json({ missions: [] });
  }

  let missions = await prisma.mission.findMany({
    where: { userId, date: day },
    orderBy: { type: "asc" },
  });

  if (missions.length === 0 && isDevOpen()) {
    missions = await prisma.$transaction([
      prisma.mission.create({
        data: { userId, date: day, title: "45 min Z2 run", type: "PHYSICAL", xp: 75 },
      }),
      prisma.mission.create({
        data: { userId, date: day, title: "Mobility + Core", type: "PHYSICAL", xp: 50 },
      }),
      prisma.mission.create({
        data: { userId, date: day, title: "Log 2 expenses", type: "FINANCIAL", xp: 40 },
      }),
      prisma.mission.create({
        data: { userId, date: day, title: "10 min mindfulness", type: "MENTAL", xp: 35 },
      }),
    ]);
  }

  return NextResponse.json({ missions });
}

