import { BudgetThermostats } from "@/components/BudgetThermostats";

export default function BudgetPage() {
  return (
    <div className="space-y-4">
      <BudgetThermostats />
      <div className="glass p-4">
        <div className="text-white/70 text-sm">Recent transactions (last 10) will appear here.</div>
      </div>
    </div>
  );
}

