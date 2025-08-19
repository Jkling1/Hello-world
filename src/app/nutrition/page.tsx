"use client";
import { useEffect, useState } from "react";
import { LiquidGauge } from "@/components/LiquidGauge";

type Meal = { title: string; recipeId?: string; calories: number; mealType: string };

export default function NutritionPage() {
  const [today, setToday] = useState<Meal[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/nutrition/today", { cache: "no-store" });
      setToday((await res.json()).meals);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="glass p-4">
        <h3 className="font-semibold mb-3">Today&apos;s Menu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {today.map((m) => (
            <div key={m.mealType} className="glass p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-white/70">{m.mealType}</div>
                <div className="font-medium">{m.title}</div>
              </div>
              <div className="flex-shrink-0">
                <div className="relative w-20 h-20 rounded-full border border-white/20 flex items-center justify-center">
                  <div className="text-sm font-semibold">{m.calories}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Edit This Week&apos;s Menu</div>
            <div className="text-sm text-white/60">Horizontal planner</div>
          </div>
          <LiquidGauge value={42} label="prep" />
        </div>
      </div>
    </div>
  );
}

