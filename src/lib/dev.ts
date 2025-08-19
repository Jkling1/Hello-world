import { cookies } from "next/headers";

export function isDevOpen(): boolean {
  return process.env.DEV_OPEN === "1";
}

export function getUserIdFromRequest(): string | null {
  if (isDevOpen()) {
    const store = cookies();
    const impersonate = store.get("impersonate")?.value;
    if (impersonate === "1") return "dev-jordan";
    return "dev-jordan";
  }
  // Placeholder for real auth later
  return null;
}

export function getOptionalUserId(): string | null {
  const id = getUserIdFromRequest();
  return id;
}

