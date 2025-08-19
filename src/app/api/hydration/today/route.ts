import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId } from "@/lib/dev";
import { startOfLocalDay } from "@/lib/time";

export async function GET() {
  const userId = getOptionalUserId();
  const targetMl = 2500;
  if (!userId) return NextResponse.json({ targetMl, totalMl: 0 });
  const date = new Date(startOfLocalDay().toISOString().slice(0, 10));
  const logs = await prisma.hydrationLog.findMany({ where: { userId, date } });
  const totalMl = logs.reduce((a, l) => a + l.amountMl, 0);
  return NextResponse.json({ targetMl, totalMl });
}

