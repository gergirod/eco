/**
 * Audiencia por canal y programa — para ¿Dónde conviene pautar?
 * Cruza audience.json + placement + corpus matrix.
 */

import type { CorpusChannelRow } from "@/lib/corpus-channels";
import { compact } from "@/lib/format";
import { getChannelPlacement, rubroLabel, type PlacementExport } from "@/lib/placement";
import { detectShowFormat } from "@/lib/showFormat";

type AudienceChannel = {
  id: string;
  name: string;
  avg_concurrent?: number;
  peak_concurrent?: number;
  chat_coverage?: number;
  chat_quality_label?: string;
  top_programs?: { title: string; peak?: number }[];
};

export type ChannelAudienceRow = {
  id: string;
  name: string;
  genre: string;
  peakConcurrent: number;
  avgConcurrent: number;
  hasChat: boolean;
  chatLabel: string;
  rubroPlacas: number;
  positioning: CorpusChannelRow["positioning"];
  positioningNote: string;
  topProgramName: string | null;
  topProgramPeak: number | null;
};

export function buildChannelAudienceRows(
  audience: AudienceChannel[],
  corpusRows: CorpusChannelRow[],
  placement: PlacementExport | null,
  rubroKey: string | null
): ChannelAudienceRow[] {
  const corpusById = Object.fromEntries(corpusRows.map((r) => [r.id, r]));
  const rubroLbl = rubroKey && placement ? rubroLabel(placement, rubroKey) : null;

  return audience
    .map((aud) => {
      const corpus = corpusById[aud.id];
      if (!corpus?.inCorpus) return null;

      const chPl = getChannelPlacement(placement, aud.id);
      const rubroPlacas = rubroKey
        ? (chPl?.rubro_mix?.find((r) => r.key === rubroKey)?.count ?? 0)
        : (chPl?.pauta_mentions ?? 0);

      const topProg = aud.top_programs?.[0];
      const show = topProg?.title
        ? detectShowFormat(aud.id, topProg.title)
        : null;

      const hasChat = (aud.chat_coverage ?? 0) > 0;

      return {
        id: aud.id,
        name: aud.name || corpus.name,
        genre: corpus.genre,
        peakConcurrent: aud.peak_concurrent ?? 0,
        avgConcurrent: aud.avg_concurrent ?? corpus.avgConcurrent ?? 0,
        hasChat,
        chatLabel: hasChat
          ? aud.chat_quality_label || "Chat capturado"
          : "Sin chat esta semana",
        rubroPlacas,
        positioning: corpus.positioning,
        positioningNote: corpus.positioningNote,
        topProgramName: show?.name ?? null,
        topProgramPeak: topProg?.peak ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.peakConcurrent || 0) - (a!.peakConcurrent || 0)) as ChannelAudienceRow[];
}

export function channelAudienceSummary(rows: ChannelAudienceRow[], rubroLabelText: string | null): string {
  if (!rows.length) return "";
  const top = rows[0];
  const scale = rows.filter((r) => r.positioning === "escala");
  const parts = [
    `${top.name} picó ${compact(top.peakConcurrent)} mirando`,
    scale.length >= 2 ? `${scale.map((s) => s.name).join(" y ")} son escala` : null,
    rubroLabelText && rows.some((r) => r.rubroPlacas > 0)
      ? `En ${rubroLabelText.toLowerCase()} hubo placas en ${rows.filter((r) => r.rubroPlacas > 0).length} canales`
      : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function formatRubroEnCanal(count: number, rubroLabelText: string): string {
  if (count <= 0) return `Sin placas de ${rubroLabelText.toLowerCase()} esta semana`;
  return `${count} ${count === 1 ? "placa" : "placas"} de ${rubroLabelText.toLowerCase()}`;
}
