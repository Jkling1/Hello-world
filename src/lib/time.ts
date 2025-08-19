export function startOfLocalDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function friendlyGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function daysUntil(target: Date): number {
  const start = startOfLocalDay(new Date());
  const end = startOfLocalDay(target);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

