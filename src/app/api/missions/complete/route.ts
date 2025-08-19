import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId } from "@/lib/dev";

const Body = z.object({ id: z.string(), done: z.boolean() });

export async function POST(req: Request) {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const json = await req.json();
  const { id, done } = Body.parse(json);
  const mission = await prisma.mission.update({
    where: { id },
    data: { completed: done },
  });
  const xp = done ? mission.xp : 0;
  return NextResponse.json({ ok: true, xp });
}

