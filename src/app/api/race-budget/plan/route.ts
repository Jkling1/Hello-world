import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId, isDevOpen } from "@/lib/dev";

const DEFAULTS = [
  { key: "entry", label: "Entry", capCents: 110000 },
  { key: "gear", label: "Gear", capCents: 400000 },
  { key: "lodging", label: "Lodging", capCents: 120000 },
  { key: "transport", label: "Transport", capCents: 80000 },
  { key: "nutrition", label: "Nutrition", capCents: 60000 },
  { key: "misc", label: "Misc", capCents: 30000 },
];

export async function GET(req: Request) {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({ plan: null });
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "race-day-2026";

  let plan = await prisma.budgetPlan.findUnique({ where: { userId_slug: { userId, slug } }, include: { categories: true } });
  if (!plan && isDevOpen()) {
    plan = await prisma.budgetPlan.create({ data: { userId, slug, title: "Race Day 2026", totalCents: 800000 } });
    await prisma.budgetPlanCategory.createMany({ data: DEFAULTS.map((c) => ({ ...c, planId: plan!.id })) });
    plan = await prisma.budgetPlan.findUnique({ where: { userId_slug: { userId, slug } }, include: { categories: true } });
  }
  return NextResponse.json({ plan });
}

export async function POST(req: Request) {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { slug, totalCents, title } = await req.json();
  const plan = await prisma.budgetPlan.upsert({
    where: { userId_slug: { userId, slug } },
    update: { totalCents, title },
    create: { userId, slug, title: title || "Race Day", totalCents },
    include: { categories: true },
  });
  return NextResponse.json({ plan });
}

