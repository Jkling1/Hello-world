import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId } from "@/lib/dev";

export async function GET(req: Request) {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({});
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")!;
  const plan = await prisma.budgetPlan.findUnique({ where: { userId_slug: { userId, slug } }, include: { categories: true } });
  if (!plan) return NextResponse.json({});
  const tx = await prisma.budgetTransaction.findMany({ where: { userId } });
  const spentByKey = tx.reduce<Record<string, number>>((acc, t) => {
    if (!t.mappedKey) return acc;
    acc[t.mappedKey] = (acc[t.mappedKey] || 0) + t.amountCents;
    return acc;
  }, {});
  const categories = plan.categories.map((c) => ({
    key: c.key,
    label: c.label,
    capCents: c.capCents,
    spentCents: spentByKey[c.key] || 0,
  }));
  return NextResponse.json({ plan: { ...plan, categories } });
}

