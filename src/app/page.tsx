import { GreetingBar } from "@/components/GreetingBar";
import { TrainingPhaseTracker } from "@/components/TrainingPhaseTracker";
import { MissionList } from "@/components/MissionList";
import { HydrationBubble } from "@/components/HydrationBubble";
import { UpcomingBattlesWidget } from "@/components/UpcomingBattlesWidget";
import { BudgetThermostats } from "@/components/BudgetThermostats";
import { MetricsCards } from "@/components/MetricsCards";

async function fetchPhases() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/phases`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  try {
    const data = await res.json();
    return data;
  } catch {
    return { phases: [], currentWeek: 0, totalWeeks: 0 };
  }
}

export default async function Page() {
  const { phases, currentWeek, totalWeeks } = await fetchPhases();
  return (
    <div className="space-y-4 md:space-y-6">
      <GreetingBar name="Jordan" />
      <TrainingPhaseTracker phases={phases || []} currentWeek={currentWeek} totalWeeks={totalWeeks} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <MissionList />
          <HydrationBubble />
        </div>
        <div className="space-y-4">
          <UpcomingBattlesWidget />
          <BudgetThermostats />
        </div>
      </div>
      <MetricsCards />
    </div>
  );
}

