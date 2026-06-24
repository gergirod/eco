export const usd = (n: number) =>
  "US$ " + Math.round(n).toLocaleString("es-AR");

export const num = (n: number) => (n ?? 0).toLocaleString("es-AR");

export const compact = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n ?? 0);
};

export const pct = (n: number) => `${n.toFixed(1)}%`;

/** Timestamp en el VOD: HH:MM:SS (ej. 02:31:32, no 151:32). */
export const fmtHMS = (sec: number) => {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return h ? `${String(h).padStart(2, "0")}:${mm}` : mm;
};

export const vodLink = (videoId: string, tSeconds: number) =>
  `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(0, Math.floor(tSeconds || 0))}s`;
