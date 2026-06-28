/**
 * Briefing completo agencia — 37 preguntas → respuestas desde corpus (sin PDF).
 */

import placementFile from "@/data/placement.json";
import type { AgenciaBrandPair } from "@/lib/agencia-demo";
import { compact, vodLink } from "@/lib/format";
import { rubroLabel } from "@/lib/placement";
import {
  buildRubroShare,
  markCompetitorsInRubro,
  rubroDisplay,
  type RubroShareRow,
} from "@/lib/agencia-product";

export type BriefingStatus = "ok" | "partial" | "gap" | "na";
export type BriefingMechanism =
  | "push"
  | "marca"
  | "competencia"
  | "novedades"
  | "briefing"
  | "config"
  | "posicion";

export type BriefingAnswer = {
  id: string;
  block: string;
  blockLabel: string;
  question: string;
  status: BriefingStatus;
  mechanism: BriefingMechanism;
  answer: string;
  pushCopy?: string;
  layers: string[];
  evidence?: { label: string; href: string; external?: boolean };
};

type Activation = {
  channel?: string;
  channel_name?: string;
  date?: string;
  video_id?: string;
  title?: string;
  minute?: string;
  t_seconds?: number;
  quote?: string;
  tier?: number;
  tier_label?: string;
  sentiment?: string;
  conc_at?: number | null;
  program_peak?: number | null;
  evidence?: string;
  has_chat?: boolean;
  chat_ratio?: number | null;
  retention_pct?: number | null;
  value_usd?: number;
  chat_reaction?: {
    headline?: string;
    table_line?: string;
    tone?: string;
    has_chat?: boolean;
  };
};

type Report = {
  name?: string;
  mentions?: number;
  value_usd?: number;
  by_tier?: Record<string, number>;
  by_sentiment?: Record<string, number>;
  best?: Activation;
  detail?: Activation[];
};

type BrandRow = { slug: string; name: string; mentions?: number; value_usd?: number; channels?: string[] };

type ProductRow = { slug: string; name: string; kind?: string; mentions?: number; samples?: { quote?: string; minute?: string; video_id?: string; t_seconds?: number }[] };

type RadarRow = {
  tema: string;
  cross_comunidad?: boolean;
  menciones?: number;
  canales?: string[];
};

type CommercialDemand = {
  disclaimer?: string;
  channels?: { id: string; name: string; commercial_messages?: number; post_pnt_messages?: number; top_examples?: { text: string; tipo: string }[] }[];
};

const PLACEMENT = placementFile as { brand_rubros?: Record<string, string> };
const AGENCIA = "/agencia";
const VALLE_THRESHOLD = 40;

function rubro(slug: string): string {
  return PLACEMENT.brand_rubros?.[slug] || "otro";
}

function activations(report: Report | null): Activation[] {
  if (!report) return [];
  const list = report.detail?.length ? [...report.detail] : report.best ? [report.best] : [];
  return list.sort((a, b) => (b.conc_at ?? 0) - (a.conc_at ?? 0));
}

function peakPct(act: Activation): number | null {
  const c = act.conc_at;
  const p = act.program_peak;
  if (c == null || p == null || p <= 0) return null;
  return Math.round((c / p) * 100);
}

function isValley(act: Activation): boolean {
  const pct = peakPct(act);
  return pct != null && pct < VALLE_THRESHOLD;
}

function bestAct(report: Report | null): Activation | null {
  return activations(report)[0] || report?.best || null;
}

function brandReport(reports: Record<string, Report>, slug: string): Report | null {
  return reports[slug] || null;
}

function organicCount(products: ProductRow[], brandSlug: string, brandName: string): number {
  const slugNorm = brandSlug.replace(/-/g, " ");
  return products.filter(
    (p) =>
      p.kind === "producto" &&
      (p.slug.includes(brandSlug) ||
        p.name.toLowerCase().includes(brandName.toLowerCase().split(" ")[0]) ||
        p.slug.includes(slugNorm.split(" ")[0]))
  ).length;
}

function radarForRubro(radar: RadarRow[], rubroKey: string, limit = 3): RadarRow[] {
  const keywords: Record<string, string[]> = {
    fintech: ["invers", "dolar", "banco", "fintech", "aguinaldo"],
    viajes: ["viaje", "turismo", "aerol", "hotel"],
  };
  const keys = keywords[rubroKey] || [];
  return radar
    .filter((r) => r.cross_comunidad && keys.some((k) => r.tema.toLowerCase().includes(k)))
    .sort((a, b) => (b.menciones ?? 0) - (a.menciones ?? 0))
    .slice(0, limit);
}

function channelDemand(commercial: CommercialDemand | null, channelId: string) {
  return commercial?.channels?.find((c) => c.id === channelId);
}

function pushLine(brandName: string, act: Activation): string {
  const pct = peakPct(act);
  const parts = [
    `${brandName} · ${act.channel_name || act.channel}`,
    act.conc_at ? `${compact(act.conc_at)} mirando` : null,
    act.tier_label,
    pct != null ? `${pct}% del pico${isValley(act) ? " ⚠️ VALLE" : ""}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function mk(
  partial: Omit<BriefingAnswer, "block" | "blockLabel"> & { block: string; blockLabel: string }
): BriefingAnswer {
  return partial;
}

export type BriefingInput = {
  brandSlugs: string[];
  competitorSlugs: string[];
  pairs: readonly AgenciaBrandPair[];
  reports: Record<string, Report>;
  brands: BrandRow[];
  products: ProductRow[];
  radar: RadarRow[];
  commercialDemand: CommercialDemand | null;
  metaExportedAt?: string;
};

export function buildAgenciaBriefing(input: BriefingInput): BriefingAnswer[] {
  const { brandSlugs, competitorSlugs, reports, brands, products, radar, commercialDemand } =
    input;
  const primary = brandSlugs[0];
  const secondary = brandSlugs[1];
  const primaryReport = brandReport(reports, primary);
  const primaryName = primaryReport?.name || primary.replace(/-/g, " ");
  const best = bestAct(primaryReport);
  const compSlug = input.pairs.find((p) => p.slug === primary)?.competitorSlug || competitorSlugs[0];
  const compReport = compSlug ? brandReport(reports, compSlug) : null;
  const rubroKey = rubro(primary);
  const rubroRows = markCompetitorsInRubro(
    buildRubroShare(rubroKey, brands, reports, [...brandSlugs, ...competitorSlugs]),
    competitorSlugs
  );

  const answers: BriefingAnswer[] = [];

  // —— A. Viernes ——
  answers.push(
    mk({
      id: "A1",
      block: "A",
      blockLabel: "Viernes / entrega",
      question: "¿Cumplió el canal lo pactado para mi cliente?",
      status: best?.evidence === "VERIFIED" ? "ok" : best ? "partial" : "gap",
      mechanism: "push",
      answer: best
        ? `${primaryName}: ${primaryReport?.mentions ?? 0} PNT verificadas. Mejor momento: ${best.tier_label} el ${best.date} — ${best.evidence === "VERIFIED" ? "evidencia completa" : "evidencia parcial"}.`
        : `Sin activaciones capturadas para ${primaryName} en el período.`,
      pushCopy: best ? pushLine(primaryName, best) : undefined,
      layers: ["transcript", "tier", "viewers"],
      evidence: best?.video_id
        ? { label: "Ver evidencia", href: `${AGENCIA}/marcas/${primary}` }
        : undefined,
    }),
    mk({
      id: "A2",
      block: "A",
      blockLabel: "Viernes / entrega",
      question: "¿Le muestro algo creíble al cliente en 5 minutos?",
      status: best?.video_id ? "ok" : "gap",
      mechanism: "push",
      answer: best
        ? `Sí — reenviá el push o este link: ${compact(best.conc_at ?? 0)} mirando, ${best.tier_label}, cita verificada.`
        : "Necesitamos capturar una activación primero.",
      pushCopy: best
        ? `${primaryName}: ${compact(best.conc_at ?? 0)} en el minuto ${best.minute}. ${best.tier_label}. Link al segundo 👇`
        : undefined,
      layers: ["viewers", "transcript"],
      evidence: best?.video_id
        ? {
            label: "Link YouTube",
            href: vodLink(best.video_id, best.t_seconds ?? 0),
            external: true,
          }
        : undefined,
    }),
    mk({
      id: "A3",
      block: "A",
      blockLabel: "Viernes / entrega",
      question: "¿Rindió la inversión / la PNT?",
      status: best?.conc_at ? "partial" : "gap",
      mechanism: "marca",
      answer: best
        ? `Atención al minuto: ${compact(best.conc_at ?? 0)} concurrentes · ${best.tier_label} · exposición estimada USD ${Math.round(primaryReport?.value_usd ?? 0).toLocaleString("es-AR")} en el período. No medimos ROI de ventas — medimos entrega de atención verificable.`
        : "Sin data de rendimiento en el período.",
      layers: ["viewers", "tier", "valuation"],
    }),
    mk({
      id: "A4",
      block: "A",
      blockLabel: "Viernes / entrega",
      question: "¿Cuánta gente me vio en el minuto exacto?",
      status: best?.conc_at ? "ok" : "gap",
      mechanism: "push",
      answer: best
        ? `${compact(best.conc_at ?? 0)} concurrentes en ${best.minute} (${best.date}, ${best.channel_name}).`
        : "Sin serie de audiencia para esta marca.",
      pushCopy: best ? `${primaryName}: ${compact(best.conc_at ?? 0)} mirando en el minuto de la PNT` : undefined,
      layers: ["viewers"],
      evidence: best?.video_id
        ? { label: "Prueba", href: vodLink(best.video_id, best.t_seconds ?? 0), external: true }
        : undefined,
    }),
    mk({
      id: "A5",
      block: "A",
      blockLabel: "Viernes / entrega",
      question: "¿Fue pico o valle del programa?",
      status: best?.program_peak ? "ok" : "partial",
      mechanism: "push",
      answer: (() => {
        if (!best) return "Sin benchmark de programa.";
        const pct = peakPct(best);
        if (pct == null) return "Sin pico del programa en esta captura.";
        if (isValley(best))
          return `⚠️ VALLE — ${pct}% del pico del programa (${compact(best.conc_at ?? 0)} vs pico ${compact(best.program_peak ?? 0)}). Avisá al cliente antes del viernes.`;
        return `Pico relativo — ${pct}% del pico del programa (${compact(best.program_peak ?? 0)}). Buen slot.`;
      })(),
      pushCopy: best && isValley(best)
        ? `⚠️ ${primaryName} corrió en VALLE (${peakPct(best)}% del pico). ${compact(best.conc_at ?? 0)} mirando.`
        : best
          ? `${primaryName}: ${peakPct(best)}% del pico del programa · ${compact(best.conc_at ?? 0)} mirando`
          : undefined,
      layers: ["viewers", "peak"],
    }),
    mk({
      id: "A6",
      block: "A",
      blockLabel: "Viernes / entrega",
      question: "¿Fue lectura dedicada o al pasar?",
      status: best?.tier_label ? "ok" : "gap",
      mechanism: "push",
      answer: best
        ? `${best.tier_label} (Tier ${best.tier ?? "?"}). ${best.tier === 2 ? "Formato pactado de lectura dedicada." : best.tier === 3 ? "Mención con código/promo." : "Mención al pasar — revisar si era lo acordado."}`
        : "Sin clasificación de formato.",
      pushCopy: best ? `${primaryName}: ${best.tier_label}` : undefined,
      layers: ["tier", "transcript"],
    }),
    mk({
      id: "A7",
      block: "A",
      blockLabel: "Viernes / entrega",
      question: "¿Qué dijeron textualmente?",
      status: best?.quote ? "ok" : "gap",
      mechanism: "marca",
      answer: best?.quote
        ? `«${best.quote.slice(0, 280)}${best.quote.length > 280 ? "…" : ""}»`
        : "Sin cita en el período.",
      layers: ["transcript"],
      evidence: best?.video_id
        ? { label: "Escuchar cita", href: vodLink(best.video_id, best.t_seconds ?? 0), external: true }
        : undefined,
    }),
    mk({
      id: "A8",
      block: "A",
      blockLabel: "Viernes / entrega",
      question: "¿El conductor habló bien o mal de la marca?",
      status: primaryReport?.by_sentiment || best?.sentiment ? "ok" : "partial",
      mechanism: "marca",
      answer: primaryReport?.by_sentiment
        ? `Período: ${primaryReport.by_sentiment.positivo ?? 0} positivo · ${primaryReport.by_sentiment.neutro ?? 0} neutro · ${primaryReport.by_sentiment.negativo ?? 0} negativo. Mejor momento: ${best?.sentiment ?? "—"}.`
        : best?.sentiment
          ? `Sentimiento en mejor momento: ${best.sentiment}.`
          : "Sin clasificación de sentimiento.",
      layers: ["sentiment", "transcript"],
    }),
    mk({
      id: "A9",
      block: "A",
      blockLabel: "Viernes / entrega",
      question: "¿Prueba para el cliente el viernes?",
      status: best?.video_id ? "ok" : "gap",
      mechanism: "push",
      answer: best?.video_id
        ? `Link al segundo exacto en YouTube — minuto ${best.minute}, ${compact(best.conc_at ?? 0)} concurrentes, cita verificada.`
        : "Sin evidencia enlazable.",
      pushCopy: best?.video_id
        ? `${primaryName} — evidencia: ${vodLink(best.video_id, best.t_seconds ?? 0)}`
        : undefined,
      layers: ["transcript", "viewers"],
      evidence: best?.video_id
        ? { label: "Abrir prueba", href: vodLink(best.video_id, best.t_seconds ?? 0), external: true }
        : undefined,
    }),
    mk({
      id: "A10",
      block: "A",
      blockLabel: "Viernes / entrega",
      question: "¿Salió la pauta al aire?",
      status: "na",
      mechanism: "posicion",
      answer:
        "Seenka y el canal confirman aparición. ECO no compite ahí — auditamos cómo rindió: minuto, formato, atención y prueba (preguntas A1–A9).",
      layers: [],
    })
  );

  // —— B. Competencia ——
  const clientShare = rubroRows.find((r) => r.slug === primary);
  const compShare = compSlug ? rubroRows.find((r) => r.slug === compSlug) : null;

  answers.push(
    mk({
      id: "B1",
      block: "B",
      blockLabel: "Competencia",
      question: "¿Dónde pauta el competidor de mi cliente?",
      status: compReport?.mentions ? "ok" : compSlug ? "gap" : "na",
      mechanism: "novedades",
      answer: compReport?.mentions
        ? `${compReport.name}: ${compReport.mentions} PNT en ${(compReport as Report & { channels?: string[] }).channels?.join(", ") || "streaming capturado"}. Última: ${bestAct(compReport)?.date ?? "—"}.`
        : compSlug
          ? `${compSlug.replace(/-/g, " ")}: sin activaciones en el período capturado.`
          : "No configuraste competidor — agregalo en Marcas.",
      layers: ["activations"],
      evidence: compSlug ? { label: "Ver competidor", href: `${AGENCIA}/marcas/${compSlug}` } : undefined,
    }),
    mk({
      id: "B2",
      block: "B",
      blockLabel: "Competencia",
      question: secondary
        ? "¿Un cliente rindió peor que otro en el portfolio?"
        : "¿Mi cliente rindió peor que otro en el portfolio?",
      status: secondary && brandSlugs.length >= 2 ? "ok" : "na",
      mechanism: "competencia",
      answer:
        secondary && brandSlugs.length >= 2
          ? (() => {
              const r2 = brandReport(reports, secondary);
              const b2 = bestAct(r2);
              return `${primaryName}: pico ${compact(best?.conc_at ?? 0)} · ${secondary.replace(/-/g, " ")}: pico ${compact(b2?.conc_at ?? 0)}. Exposición USD ${Math.round(primaryReport?.value_usd ?? 0).toLocaleString("es-AR")} vs ${Math.round(r2?.value_usd ?? 0).toLocaleString("es-AR")}.`;
            })()
          : "Agregá una segunda marca en tu portfolio para comparar clientes.",
      layers: ["valuation", "viewers"],
      evidence: { label: "Competencia", href: `${AGENCIA}/competencia` },
    }),
    mk({
      id: "B3",
      block: "B",
      blockLabel: "Competencia",
      question: "¿Cómo estoy vs mi competidor directo?",
      status: compReport && primaryReport ? "ok" : "partial",
      mechanism: "competencia",
      answer:
        compReport && primaryReport
          ? `${primaryName}: ${primaryReport.mentions} PNT · USD ${Math.round(primaryReport.value_usd ?? 0).toLocaleString("es-AR")}. ${compReport.name}: ${compReport.mentions} PNT · USD ${Math.round(compReport.value_usd ?? 0).toLocaleString("es-AR")}.`
          : "Configurá competidor en Marcas para comparar.",
      layers: ["activations", "valuation"],
      evidence: { label: "Comparar", href: `${AGENCIA}/competencia` },
    }),
    mk({
      id: "B4",
      block: "B",
      blockLabel: "Competencia",
      question: "¿Quién domina el rubro en streaming?",
      status: clientShare ? "ok" : "partial",
      mechanism: "briefing",
      answer: clientShare
        ? `En ${rubroDisplay(rubroKey)} (streaming capturado): ${primaryName} ${clientShare.sharePct.toFixed(0)}% exposición estimada.${compShare ? ` ${compReport?.name}: ${compShare.sharePct.toFixed(0)}%.` : ""} Top: ${rubroRows.slice(0, 3).map((r) => `${r.name} ${r.sharePct.toFixed(0)}%`).join(" · ")}.`
        : "Sin marcas del rubro en el corpus del período.",
      layers: ["valuation"],
    }),
    mk({
      id: "B5",
      block: "B",
      blockLabel: "Competencia",
      question: "¿Por qué el competidor aparece y nosotros no?",
      status: compReport && !primaryReport?.mentions ? "ok" : primaryReport?.mentions ? "partial" : "gap",
      mechanism: "novedades",
      answer:
        !primaryReport?.mentions
          ? `${primaryName} sin PNT en el período. ${compReport?.name ?? "Competidor"}: ${compReport?.mentions ?? 0} apariciones — revisá Novedades.`
          : `${compReport?.name ?? "Competidor"}: ${compReport?.mentions ?? 0} PNT vs ${primaryName}: ${primaryReport.mentions}. ${(compReport?.mentions ?? 0) > (primaryReport.mentions ?? 0) ? "Rival más activo en streaming esta semana." : "Vos liderás en apariciones."}`,
      layers: ["activations"],
      evidence: { label: "Novedades", href: `${AGENCIA}/novedades` },
    }),
    mk({
      id: "B6",
      block: "B",
      blockLabel: "Competencia",
      question: "¿Cuánto orgánico tiene mi cliente vs el competidor?",
      status: "partial",
      mechanism: "briefing",
      answer: (() => {
        const orgClient = organicCount(products, primary, primaryName);
        const orgComp = compSlug
          ? organicCount(products, compSlug, compReport?.name || compSlug)
          : 0;
        return `Menciones orgánicas en audio (sin pauta): ${primaryName} ~${orgClient} · ${compReport?.name ?? "competidor"} ~${orgComp}. Basado en extracción del corpus — no incluye todo el mercado.`;
      })(),
      layers: ["transcript"],
    }),
    mk({
      id: "B7",
      block: "B",
      blockLabel: "Competencia",
      question: "¿Seenka ya nos da esto?",
      status: "ok",
      mechanism: "posicion",
      answer:
        "Seenka confirma aparición cross-media. ECO: minuto exacto + concurrentes + tier + cita + competencia en streaming el mismo día + prueba enlazable.",
      layers: [],
    })
  );

  // —— C. Chat / demanda ——
  const chatAct =
    activations(primaryReport).find((a) => a.has_chat || a.chat_reaction?.has_chat) || best;
  const demandCh = chatAct?.channel ? channelDemand(commercialDemand, chatAct.channel) : null;

  answers.push(
    mk({
      id: "C1",
      block: "C",
      blockLabel: "Chat / demanda",
      question: "¿La sala reaccionó cuando salimos?",
      status: chatAct?.chat_reaction?.headline ? "ok" : chatAct?.has_chat === false ? "gap" : "partial",
      mechanism: "marca",
      answer: chatAct?.chat_reaction?.headline
        ? chatAct.chat_reaction.headline
        : chatAct?.channel === "luzu"
          ? "Sin chat capturado en Luzu en este período — no podemos medir reacción de sala."
          : "Sin data de chat para esta activación.",
      layers: ["chat"],
    }),
    mk({
      id: "C2",
      block: "C",
      blockLabel: "Chat / demanda",
      question: "¿Se prendió el chat?",
      status: chatAct?.chat_ratio != null ? "ok" : "gap",
      mechanism: "marca",
      answer:
        chatAct?.chat_ratio != null
          ? `Ratio chat ${chatAct.chat_ratio} vs base del programa. ${chatAct.chat_reaction?.table_line ?? ""}`
          : "Sin chat capturado en este programa.",
      layers: ["chat"],
    }),
    mk({
      id: "C3",
      block: "C",
      blockLabel: "Chat / demanda",
      question: "¿Pidieron link, precio o dónde comprar?",
      status: demandCh?.commercial_messages ? "ok" : "gap",
      mechanism: "briefing",
      answer: demandCh?.commercial_messages
        ? `Canal ${demandCh.name}: ${demandCh.commercial_messages} pedidos comerciales filtrados en chat${demandCh.post_pnt_messages ? ` · ${demandCh.post_pnt_messages} post-PNT` : ""}. Ej: «${demandCh.top_examples?.[0]?.text?.slice(0, 80) ?? ""}…»`
        : commercialDemand?.disclaimer?.includes("LUZU")
          ? "LUZU sin chat usable en el período. Demanda comercial disponible en Olga/Blender/Neura."
          : "Sin demanda comercial filtrada en chat para este canal.",
      layers: ["chat", "demand"],
    }),
    mk({
      id: "C4",
      block: "C",
      blockLabel: "Chat / demanda",
      question: "¿La gente se quedó mirando después de nuestra PNT?",
      status: best?.retention_pct != null ? "ok" : "partial",
      mechanism: "marca",
      answer:
        best?.retention_pct != null
          ? `Retención ~${best.retention_pct}% vs minuto anterior en la mejor activación.`
          : "Sin serie de retención post-PNT en esta captura.",
      layers: ["viewers", "peak"],
    }),
    mk({
      id: "C5",
      block: "C",
      blockLabel: "Chat / demanda",
      question: "¿Leyeron el código o promo?",
      status: best?.quote ? "ok" : "gap",
      mechanism: "marca",
      answer: best?.quote
        ? best.tier === 3 || /código|codigo|promo|descarg/i.test(best.quote)
          ? "Sí — mención con código/promo detectada en transcript."
          : "No detectamos código explícito en la cita — revisar Tier y audio."
        : "Sin cita para analizar.",
      layers: ["transcript", "tier"],
    })
  );

  // —— D. Planning ——
  const sortedActs = activations(primaryReport);
  const bestSlot = sortedActs[0];

  answers.push(
    mk({
      id: "D1",
      block: "D",
      blockLabel: "Planning",
      question: "¿Qué slot recomendamos para la próxima compra?",
      status: sortedActs.length >= 2 ? "ok" : sortedActs.length === 1 ? "partial" : "gap",
      mechanism: "briefing",
      answer: bestSlot
        ? `Mejor slot histórico: ${bestSlot.date} ${bestSlot.channel_name} min ${bestSlot.minute} — ${compact(bestSlot.conc_at ?? 0)} concurrentes (${peakPct(bestSlot) ?? "?"}% del pico). ${sortedActs.length >= 2 ? `Evitar: ${sortedActs[sortedActs.length - 1].minute} (${compact(sortedActs[sortedActs.length - 1].conc_at ?? 0)} conc.).` : "Necesitamos más activaciones para comparar slots."}`
        : "Sin histórico de activaciones.",
      layers: ["viewers", "peak"],
    }),
    mk({
      id: "D2",
      block: "D",
      blockLabel: "Planning",
      question: "¿Dónde recomiendo pautar?",
      status: primaryReport ? "partial" : "gap",
      mechanism: "posicion",
      answer: primaryReport
        ? `${primaryName} apareció en: ${brands.find((b) => b.slug === primary)?.channels?.join(", ") || "—"}. Para planning de inventario: negociá con el canal. ECO audita entrega post-compra, no reemplaza rate card.`
        : "Sin apariciones — no hay base para recomendar.",
      layers: ["activations"],
    }),
    mk({
      id: "D3",
      block: "D",
      blockLabel: "Planning",
      question: "¿Este programa es para mi marca?",
      status: sortedActs.length ? "ok" : "gap",
      mechanism: "marca",
      answer: sortedActs.length
        ? `Ya corriste en: ${[...new Set(sortedActs.map((a) => a.title?.slice(0, 50)))].join(" · ")}.`
        : "Sin activaciones previas en corpus.",
      layers: ["activations"],
    }),
    mk({
      id: "D4",
      block: "D",
      blockLabel: "Planning",
      question: "¿Cuánta atención compro por USD invertido?",
      status: "partial",
      mechanism: "posicion",
      answer:
        "Benchmark de exposición estimada (CPM ref.) — no facturación. Pasanos inversión declarada y calculamos ratio (Capa 1.5). Hoy: exposición USD en Marca.",
      layers: ["valuation"],
    }),
    mk({
      id: "D5",
      block: "D",
      blockLabel: "Planning",
      question: "¿El cliente pagó de más por una mención al pasar?",
      status: sortedActs.some((a) => a.tier === 1) ? "ok" : "partial",
      mechanism: "briefing",
      answer: sortedActs.some((a) => a.tier === 1)
        ? `Hay activaciones Tier 1 (al pasar) con exposición menor — revisar si el fee era por lectura dedicada.`
        : sortedActs.every((a) => (a.tier ?? 0) >= 2)
          ? "Formato predominantemente Tier 2/3 — no hay señal de al pasar."
          : "Sin clasificación tier.",
      layers: ["tier", "valuation"],
    }),
    mk({
      id: "D6",
      block: "D",
      blockLabel: "Planning",
      question: "¿Qué copy funcionó mejor?",
      status: sortedActs.length >= 2 ? "ok" : sortedActs.length === 1 ? "partial" : "gap",
      mechanism: "marca",
      answer:
        sortedActs.length >= 2
          ? `Mejor conc: «${sortedActs[0].quote?.slice(0, 100) ?? ""}…» (${compact(sortedActs[0].conc_at ?? 0)}). Peor: «${sortedActs[sortedActs.length - 1].quote?.slice(0, 80) ?? ""}…» (${compact(sortedActs[sortedActs.length - 1].conc_at ?? 0)}).`
          : sortedActs[0]?.quote
            ? `Una activación: «${sortedActs[0].quote.slice(0, 120)}…»`
            : "Sin citas comparables.",
      layers: ["transcript", "viewers"],
    }),
    mk({
      id: "D7",
      block: "D",
      blockLabel: "Planning",
      question: "¿Qué temas conviene atar creativamente?",
      status: radar.length ? "partial" : "gap",
      mechanism: "briefing",
      answer: (() => {
        const topics = radarForRubro(radar, rubroKey);
        return topics.length
          ? `Temas cross-canal en ${rubroDisplay(rubroKey)}: ${topics.map((t) => t.tema).join(", ")}.`
          : "Sin temas cross-comunidad claros para tu rubro en el período.";
      })(),
      layers: ["radar"],
    })
  );

  // —— E. Operación ——
  answers.push(
    mk({
      id: "E1",
      block: "E",
      blockLabel: "Operación",
      question: "¿Vimos todas las apariciones del período?",
      status: primaryReport?.mentions ? "ok" : "gap",
      mechanism: "novedades",
      answer: primaryReport
        ? `${primaryReport.mentions} PNT registradas para ${primaryName} en el corpus (${activations(primaryReport).filter((a) => a.evidence === "VERIFIED").length} verificadas al 100%). Monitoreo = canales capturados en vivo.`
        : "Sin apariciones — monitoreo arranca cuando la marca sale en un programa capturado.",
      layers: ["activations"],
      evidence: { label: "Inventario", href: `${AGENCIA}/marcas/${primary}` },
    }),
    mk({
      id: "E2",
      block: "E",
      blockLabel: "Operación",
      question: "¿Corrió bien EN VIVO ahora?",
      status: "partial",
      mechanism: "push",
      answer: `Última captura: ${best?.date ?? "—"}. Alerta live automática en build — hoy: te avisamos por WhatsApp cuando detectamos la PNT post-programa.`,
      pushCopy: "Te avisamos por WhatsApp cuando detectamos tu PNT — configurá campaña activa con ECO.",
      layers: ["activations"],
    }),
    mk({
      id: "E3",
      block: "E",
      blockLabel: "Operación",
      question: "¿Hay tendencia antes de Google?",
      status: radar.some((r) => r.cross_comunidad) ? "partial" : "gap",
      mechanism: "briefing",
      answer: (() => {
        const top = radar.filter((r) => r.cross_comunidad).sort((a, b) => (b.menciones ?? 0) - (a.menciones ?? 0)).slice(0, 3);
        return top.length
          ? `Temas cross-comunidad: ${top.map((t) => `${t.tema} (${t.menciones} menc.)`).join(" · ")}.`
          : "Sin tendencias cross-canal en el período.";
      })(),
      layers: ["radar"],
    }),
    mk({
      id: "E4",
      block: "E",
      blockLabel: "Operación",
      question: "¿Cuántas PNT compramos este trimestre?",
      status: "na",
      mechanism: "posicion",
      answer: "Lo maneja el plan de medios de la agencia — ECO audita entrega, no compra de medios.",
      layers: [],
    }),
    mk({
      id: "E5",
      block: "E",
      blockLabel: "Operación",
      question: "Pregunta ad-hoc sobre mi cuenta",
      status: "ok",
      mechanism: "briefing",
      answer: "Escribinos por WhatsApp o elegí cualquier pregunta de este briefing — cada respuesta incluye evidencia del corpus.",
      layers: ["corpus"],
    })
  );

  // —— F. Setup ——
  answers.push(
    mk({
      id: "F1",
      block: "F",
      blockLabel: "Setup",
      question: "¿Qué marcas monitoreamos?",
      status: brandSlugs.length ? "ok" : "gap",
      mechanism: "config",
      answer: brandSlugs.length
        ? brandSlugs.map((s) => reports[s]?.name || s.replace(/-/g, " ")).join(" · ")
        : "Configurá marcas en Marcas.",
      layers: [],
      evidence: { label: "Configurar", href: `${AGENCIA}/configurar` },
    }),
    mk({
      id: "F2",
      block: "F",
      blockLabel: "Setup",
      question: "¿Quién es mi competidor de referencia?",
      status: competitorSlugs.length ? "ok" : "partial",
      mechanism: "config",
      answer: competitorSlugs.length
        ? competitorSlugs.map((s) => reports[s]?.name || s.replace(/-/g, " ")).join(" · ")
        : "Opcional — agregá competidor por marca en Marcas.",
      evidence: { label: "Editar", href: `${AGENCIA}/configurar` },
      layers: [],
    }),
    mk({
      id: "F3",
      block: "F",
      blockLabel: "Setup",
      question: "¿Puedo cambiar el portfolio?",
      status: "ok",
      mechanism: "config",
      answer: "Sí — Marcas en el menú. Cambiás marcas y competidores cuando quieras.",
      evidence: { label: "Ir a Marcas", href: `${AGENCIA}/configurar` },
      layers: [],
    })
  );

  return answers;
}

export function briefingScore(answers: BriefingAnswer[]) {
  const ok = answers.filter((a) => a.status === "ok").length;
  const partial = answers.filter((a) => a.status === "partial").length;
  const gap = answers.filter((a) => a.status === "gap").length;
  const na = answers.filter((a) => a.status === "na").length;
  const actionable = ok + partial;
  return { ok, partial, gap, na, total: answers.length, actionable, pct: Math.round((actionable / answers.length) * 100) };
}

export const BRIEFING_BLOCKS: { id: string; label: string }[] = [
  { id: "A", label: "Viernes / entrega" },
  { id: "B", label: "Competencia" },
  { id: "C", label: "Chat / demanda" },
  { id: "D", label: "Planning" },
  { id: "E", label: "Operación" },
  { id: "F", label: "Setup" },
];
