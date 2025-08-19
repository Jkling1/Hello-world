import { TrainingPhaseTracker } from "@/components/TrainingPhaseTracker";

async function fetchPhases() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/phases`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data;
}

export default async function TrainingPage() {
  const { phases, currentWeek, totalWeeks } = await fetchPhases();
  return (
    <div className="space-y-4">
      <TrainingPhaseTracker phases={phases || []} currentWeek={currentWeek} totalWeeks={totalWeeks} />
      <div className="glass p-4">
        <div className="text-white/80">Weekly plan coming soon: click to complete.</div>
      </div>
    </div>
  );
}

