import { NextResponse } from "next/server";

const tips = [
  "Ask 3 friends to donate $25 each this week.",
  "Sell unused gear; earmark proceeds to entry fee.",
  "Automate $10/day savings until race day.",
  "Negotiate a group lodging rate with teammates.",
];

function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h << 5) - h + input.charCodeAt(i);
  return Math.abs(h);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "race-day-2026";
  const idx = hash(`${slug}-${new Date().toISOString().slice(0, 10)}`) % tips.length;
  return NextResponse.json({ tip: tips[idx] });
}

