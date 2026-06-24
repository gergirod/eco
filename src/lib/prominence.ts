/** Etiquetas de formato de pauta (sin jerga "Tier"). El número interno sigue siendo 1/2/3. */

export const PROMINENCE_LABEL: Record<number, string> = {
  1: "Al pasar",
  2: "Lectura dedicada",
  3: "Con código o promo",
};

export const PROMINENCE_BAR = [
  { key: "1", label: "Al pasar", color: "#cbd2dd" },
  { key: "2", label: "Lectura dedicada", color: "#22a06b" },
  { key: "3", label: "Con código o promo", color: "#2f5fe0" },
] as const;

export const PROMINENCE_TONE: Record<number, "blue" | "green" | "gray"> = {
  1: "gray",
  2: "green",
  3: "blue",
};

/** Muestra etiqueta legible; tolera exports viejos con "Tier N · …". */
export function prominenceLabel(tier?: number, tierLabel?: string): string {
  if (tierLabel && !/^tier\s*\d/i.test(tierLabel.trim())) return tierLabel;
  if (tier != null && PROMINENCE_LABEL[tier]) return PROMINENCE_LABEL[tier];
  if (tierLabel) {
    const m = tierLabel.match(/tier\s*(\d)/i);
    if (m) return PROMINENCE_LABEL[Number(m[1])] || tierLabel;
  }
  return "Pauta";
}
