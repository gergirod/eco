/**
 * Cobertura del corpus por canal — 8 capturas en vivo, no solo Olga/Luzu.
 */

import { compact } from "@/lib/format";

type MetaChannel = {
  id: string;
  streams?: number;
  hours?: number;
};

type MetaRoot = {
  live_capture?: {
    channels_captured?: number;
    hours_captured?: number;
    capture_days?: number;
    channel_ids?: string[];
    by_channel?: MetaChannel[];
  };
};

type ChannelConfig = {
  id: string;
  name: string;
  genre?: string;
  stats?: {
    brands_detected?: number;
    avg_concurrent?: number;
    mentions?: number;
  } | null;
};

type BrandRow = {
  channels?: string[];
  mentions?: number;
};

export type CorpusChannelRow = {
  id: string;
  name: string;
  genre: string;
  hours: number;
  streams: number;
  brandCount: number;
  avgConcurrent: number | null;
  positioning: "escala" | "nicho" | "emergente";
  positioningNote: string;
  inCorpus: boolean;
};

const POSITIONING: Record<string, { kind: CorpusChannelRow["positioning"]; note: string }> = {
  olga: {
    kind: "escala",
    note: "Charla masiva · chat capturado · ideal para awareness Tier 2/3",
  },
  luzu: {
    kind: "escala",
    note: "Mayor pico del corpus · sin chat hoy · escala pura",
  },
  bondi: {
    kind: "emergente",
    note: "Capturado · ventana corta · sin PNT aún en el período",
  },
  blend: {
    kind: "nicho",
    note: "Audiencia más chica y directa · YPF y marcas locales",
  },
  gelatina: {
    kind: "emergente",
    note: "1 emisión · política/cultura · muestra de nicho duro",
  },
  neura: {
    kind: "nicho",
    note: "Baja escala · chat activo · B2B / energía / industria",
  },
  urbana: {
    kind: "nicho",
    note: "Radio en vivo · Cremolati y marcas de consumo",
  },
  vorterix: {
    kind: "nicho",
    note: "Rock / cultura · Hyundai, Coto, Adidas — público distinto a talk",
  },
  aura: {
    kind: "nicho",
    note: "Periodismo TN · chat activo · escala chica, comunidad fuerte",
  },
};

function brandCountForChannel(channelId: string, brands: BrandRow[]): number {
  return brands.filter(
    (b) => (b.mentions ?? 0) > 0 && (b.channels ?? []).some((c) => c === channelId || c.startsWith(channelId))
  ).length;
}

export function buildCorpusChannelMatrix(
  meta: MetaRoot,
  channels: ChannelConfig[],
  brands: BrandRow[]
): CorpusChannelRow[] {
  const ids = meta.live_capture?.channel_ids ?? [];
  const byMeta = Object.fromEntries((meta.live_capture?.by_channel ?? []).map((c) => [c.id, c]));
  const chById = Object.fromEntries(channels.map((c) => [c.id, c]));

  return ids.map((id) => {
    const ch = chById[id];
    const capture = byMeta[id];
    const pos = POSITIONING[id] ?? {
      kind: "emergente" as const,
      note: "En corpus",
    };
    const brandCount =
      brandCountForChannel(id, brands) || ch?.stats?.brands_detected || 0;

    return {
      id,
      name: ch?.name ?? id,
      genre: ch?.genre ?? "—",
      hours: capture?.hours ?? 0,
      streams: capture?.streams ?? 0,
      brandCount,
      avgConcurrent: ch?.stats?.avg_concurrent ?? null,
      positioning: pos.kind,
      positioningNote: pos.note,
      inCorpus: true,
    };
  });
}

export function corpusChannelSummary(rows: CorpusChannelRow[], meta: MetaRoot): string {
  const scale = rows.filter((r) => r.positioning === "escala");
  const niche = rows.filter((r) => r.positioning === "nicho");
  const hours = meta.live_capture?.hours_captured ?? 0;
  const days = meta.live_capture?.capture_days ?? 0;
  return `${rows.length} canales · ${Math.round(hours)} horas de stream en ${days} días · masivos (${scale.map((r) => r.name).join(", ")}) vs más chicos (${niche.map((r) => r.name).join(", ")})`;
}

export function formatChannelBadge(row: CorpusChannelRow): string {
  const conc = row.avgConcurrent != null ? compact(row.avgConcurrent) : "—";
  return `${row.name} · ${row.brandCount} marcas · ~${conc} avg`;
}
