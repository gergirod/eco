export const usd = (n: number) =>
  "US$ " + Math.round(n).toLocaleString("es-AR");

export const num = (n: number) => (n ?? 0).toLocaleString("es-AR");

export const compact = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n ?? 0);
};

export const pct = (n: number) => `${n.toFixed(1)}%`;
