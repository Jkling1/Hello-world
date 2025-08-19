import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const on = searchParams.get("on") === "1";
  const res = NextResponse.json({ ok: true });
  if (process.env.DEV_OPEN === "1") {
    res.cookies.set("impersonate", on ? "1" : "0", { path: "/" });
  }
  return res;
}

