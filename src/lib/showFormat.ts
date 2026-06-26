/**
 * Formato de programa (show) vs emisión (VOD diario).
 * Heurística por título — extensible por canal en SHOW_RULES.
 */

import type { Program } from "./programs";

export type ShowFormat = {
  id: string;
  name: string;
};

type ShowRule = { id: string; name: string; test: RegExp };

/** Reglas por canal: orden importa (primera coincidencia gana). */
const SHOW_RULES: Record<string, ShowRule[]> = {
  luzu: [
    { id: "ndn", name: "Nadie Dice Nada", test: /#?\s*nadie\s+dice\s+nada|#nadiedicenada/i },
    { id: "aqn", name: "Antes Que Nadie", test: /antes\s+que\s+nadie/i },
    { id: "sfl", name: "Se Fue Larga", test: /se\s+fue\s+larga/i },
    { id: "novela", name: "La Novela", test: /la\s+novela/i },
    { id: "patria", name: "Patria y Familia", test: /patria\s+y\s+familia|#patriayfamilia/i },
    { id: "fondo", name: "Los del Fondo", test: /los\s+del\s+fondo|#losdelfondo/i },
  ],
  olga: [
    { id: "olga", name: "Olga", test: /olga|envivo/i },
  ],
  bondi: [{ id: "bondi", name: "Bondi", test: /bondi|antes\s+que\s+nadie/i }],
  blend: [{ id: "blender", name: "Blender", test: /blender|antes\s+que\s+nadie/i }],
};

const OTROS: ShowFormat = { id: "otros", name: "Otros" };

export function detectShowFormat(channelId: string, title: string): ShowFormat {
  const rules = SHOW_RULES[channelId.toLowerCase()] || [];
  const t = title || "";
  for (const rule of rules) {
    if (rule.test.test(t)) return { id: rule.id, name: rule.name };
  }
  return OTROS;
}

export type ShowRollup = {
  show: ShowFormat;
  emissions: Program[];
  emissionCount: number;
  mentionCount: number;
  brandSlugs: Set<string>;
  peakAttention: number;
};

export function rollupsByShow(programs: Program[]): ShowRollup[] {
  const map = new Map<string, ShowRollup>();

  for (const p of programs) {
    const show = detectShowFormat(p.channel, p.title);
    let rollup = map.get(show.id);
    if (!rollup) {
      rollup = {
        show,
        emissions: [],
        emissionCount: 0,
        mentionCount: 0,
        brandSlugs: new Set(),
        peakAttention: 0,
      };
      map.set(show.id, rollup);
    }
    rollup.emissions.push(p);
    rollup.emissionCount += 1;
    rollup.mentionCount += p.pnt_count;
    p.brands.forEach((b) => rollup!.brandSlugs.add(b));
    const peak =
      p.peak ||
      p.pnt.reduce((best, row) => Math.max(best, row.conc_at || 0), 0);
    rollup.peakAttention = Math.max(rollup.peakAttention, peak || 0);
  }

  return [...map.values()].sort(
    (a, b) =>
      b.mentionCount - a.mentionCount ||
      b.emissionCount - a.emissionCount ||
      b.peakAttention - a.peakAttention
  );
}
