import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId } from "@/lib/dev";

export async function POST(req: Request) {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { startDate, items } = await req.json();
  const week = await prisma.menuWeek.upsert({
    where: { userId_startDate: { userId, startDate: new Date(new Date(startDate).toISOString().slice(0,10)) } },
    update: {},
    create: { userId, startDate: new Date(new Date(startDate).toISOString().slice(0,10)) },
  });
  await prisma.menuItem.deleteMany({ where: { weekId: week.id } });
  await prisma.menuItem.createMany({ data: items.map((i: any) => ({ ...i, weekId: week.id })) });
  return NextResponse.json({ ok: true });
}

