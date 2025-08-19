import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId } from "@/lib/dev";
import { startOfLocalDay } from "@/lib/time";
import { z } from "zod";

const Body = z.object({ deltaMl: z.number().int().positive() });

export async function POST(req: Request) {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { deltaMl } = Body.parse(await req.json());
  const date = new Date(startOfLocalDay().toISOString().slice(0, 10));
  await prisma.hydrationLog.create({ data: { userId, date, amountMl: deltaMl } });
  const logs = await prisma.hydrationLog.findMany({ where: { userId, date } });
  const totalMl = logs.reduce((a, l) => a + l.amountMl, 0);
  return NextResponse.json({ targetMl: 2500, totalMl });
}

