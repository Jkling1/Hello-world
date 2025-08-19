import { NextResponse } from "next/server";
import { generateInsightsStub } from "@/lib/ai";

export async function POST(req: Request) {
  const { context } = await req.json();
  const insights = await generateInsightsStub(String(context || ""));
  return NextResponse.json({ insights });
}

