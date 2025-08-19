import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalUserId, isDevOpen } from "@/lib/dev";
import { startOfLocalDay } from "@/lib/time";

export async function GET() {
  const userId = getOptionalUserId();
  if (!userId) return NextResponse.json({ meals: [] });
  const weekStart = startOfWeek(startOfLocalDay());

  if (isDevOpen()) {
    const recipes = await prisma.recipe.findMany({ where: { userId } });
    if (recipes.length === 0) {
      await prisma.recipe.createMany({
        data: [
          { userId, title: "Oats + Berries", mealType: "BREAKFAST", calories: 420, macros: { p: 20, c: 60, f: 10 }, ingredients: ["oats", "berries", "yogurt"], instructions: "Mix and enjoy" },
          { userId, title: "Chicken Bowl", mealType: "LUNCH", calories: 650, macros: { p: 40, c: 70, f: 18 }, ingredients: ["chicken", "rice", "greens"], instructions: "Assemble bowl" },
          { userId, title: "Salmon + Veg", mealType: "DINNER", calories: 700, macros: { p: 45, c: 40, f: 30 }, ingredients: ["salmon", "veggies"], instructions: "Bake 12m" },
        ] as any,
      });
    }
    const weeks = await prisma.menuWeek.findMany({ where: { userId, startDate: new Date(weekStart.toISOString().slice(0,10)) } });
    if (weeks.length === 0) {
      const r = await prisma.recipe.findMany({ where: { userId } });
      const week = await prisma.menuWeek.create({ data: { userId, startDate: new Date(weekStart.toISOString().slice(0,10)) } });
      const mealTypes = ["BREAKFAST", "LUNCH", "DINNER"] as const;
      const items = [] as any[];
      for (let d = 0; d < 7; d++) {
        for (const mt of mealTypes) {
          const recipe = r.find((x) => x.mealType === mt)!;
          items.push({ weekId: week.id, dayIndex: d, mealType: mt, recipeId: recipe.id });
        }
      }
      await prisma.menuItem.createMany({ data: items });
    }
  }

  const today = startOfLocalDay();
  const dayIdx = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  const week = await prisma.menuWeek.findFirst({ where: { userId, startDate: new Date(weekStart.toISOString().slice(0,10)) } });
  if (!week) return NextResponse.json({ meals: [] });
  const items = await prisma.menuItem.findMany({ where: { weekId: week.id, dayIndex: dayIdx }, include: { recipe: true } });
  const meals = items.map((i) => ({ mealType: i.mealType, title: i.recipe.title, recipeId: i.recipe.id, calories: i.recipe.calories }));
  return NextResponse.json({ meals });
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7; // Monday start
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

