import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Expose DEV flag to client as NEXT_PUBLIC_DEV_OPEN via header for simple checks (not secure; dev only)
  const res = NextResponse.next();
  if (process.env.DEV_OPEN === "1") {
    res.headers.set("x-dev-open", "1");
  }
  return res;
}

export const config = {
  matcher: ["/:path*"],
};

