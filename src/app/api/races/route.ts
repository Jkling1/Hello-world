import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId, isDevOpen } from "@/lib/dev";

export async function GET() {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({ races: [] });

  if (isDevOpen()) {
    const count = await prisma.race.count({ where: { userId } });
    if (count === 0) {
      const future1 = new Date(); future1.setDate(future1.getDate() + 120);
      const future2 = new Date(); future2.setDate(future2.getDate() + 240);
      await prisma.race.createMany({
        data: [
          { userId, name: "Ironman 70.3", date: new Date(future1.toISOString().slice(0,10)), location: "Miami", distanceLabel: "70.3" },
          { userId, name: "Full Ironman", date: new Date(future2.toISOString().slice(0,10)), location: "Cozumel", distanceLabel: "140.6" },
        ]
      });
    }
  }

  const races = await prisma.race.findMany({ where: { userId }, orderBy: { date: "asc" } });
  return NextResponse.json({ races });
}

export async function POST(req: Request) {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...rest } = body;
  const race = id
    ? await prisma.race.update({ where: { id }, data: { ...rest } })
    : await prisma.race.create({ data: { userId, ...rest } });
  return NextResponse.json({ race });
}

