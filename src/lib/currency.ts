export function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

export function formatUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    centsToDollars(cents)
  );
}

