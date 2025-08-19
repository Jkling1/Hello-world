"use client";
import { useEffect, useState } from "react";

export function DevToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_OPEN !== "1") return;
    const v = document.cookie.split(";").find((c) => c.trim().startsWith("impersonate="));
    setOn(v?.includes("=1") ?? false);
  }, []);

  async function toggle() {
    const next = !on;
    await fetch(`/api/dev/impersonate?on=${next ? 1 : 0}`);
    setOn(next);
  }

  if (process.env.NEXT_PUBLIC_DEV_OPEN !== "1") return null;
  return (
    <button onClick={toggle} className="chip hover:bg-white/20 text-xs">
      Dev Login: {on ? "ON" : "OFF"}
    </button>
  );
}

