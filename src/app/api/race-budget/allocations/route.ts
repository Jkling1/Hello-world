import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId } from "@/lib/dev";

export async function POST(req: Request) {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { slug, categories } = await req.json();
  const plan = await prisma.budgetPlan.findUnique({ where: { userId_slug: { userId, slug } } });
  if (!plan) return NextResponse.json({ error: "not found" }, { status: 404 });
  await Promise.all(
    categories.map((c: any) =>
      prisma.budgetPlanCategory.upsert({
        where: { planId_key: { planId: plan.id, key: c.key } },
        update: { label: c.label, capCents: c.capCents },
        create: { planId: plan.id, key: c.key, label: c.label, capCents: c.capCents },
      })
    )
  );
  const updated = await prisma.budgetPlan.findUnique({ where: { id: plan.id }, include: { categories: true } });
  return NextResponse.json({ plan: updated });
}

