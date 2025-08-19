"use client";
import { friendlyGreeting } from "@/lib/time";

type Props = { name?: string };

export function GreetingBar({ name = "Jordan" }: Props) {
  return (
    <div className="glass p-4 md:p-5 mb-4 md:mb-6 neon-hover">
      <h2 className="text-xl md:text-2xl font-semibold">
        {friendlyGreeting()}, {name}
      </h2>
    </div>
  );
}

