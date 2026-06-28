/** Señales agregadas de chat en sala — export pipeline/sala_signals → webapp/data. */

export type SalaSignalRow = {
  tema: string;
  evidence_lane?: string;
  n_msgs: number;
  n_authors?: number;
  canales: string[];
  ejemplo?: string;
  programs?: { channel: string; title: string; n_msgs: number; ejemplo?: string }[];
};

export type SalaSignalsExport = {
  exported_at?: string;
  signals?: SalaSignalRow[];
};

const CHANNEL_ALIASES: Record<string, string[]> = {
  olga: ["OLGA"],
  luzu: ["LUZU"],
  vorterix: ["VORTERIX"],
  neura: ["NEURA"],
  blend: ["BLENDER", "BLEND"],
  bondi: ["BONDI"],
  gelatina: ["GELATINA"],
  urbana: ["URBANA"],
};

export type SalaSignalCard = {
  id: string;
  channel: string;
  tema: string;
  ejemplo: string;
  nMsgs: number;
  line: string;
};

function channelMatches(signal: SalaSignalRow, channelId: string): boolean {
  const aliases = CHANNEL_ALIASES[channelId] ?? [channelId.toUpperCase()];
  return signal.canales.some((c) =>
    aliases.some((a) => c.toUpperCase().includes(a) || a.includes(c.toUpperCase()))
  );
}

export function filterSalaSignals(
  exportData: SalaSignalsExport | null | undefined,
  channelIds: Set<string> | null,
  limit = 6
): SalaSignalCard[] {
  const signals = exportData?.signals ?? [];
  const filtered = channelIds?.size
    ? signals.filter((s) => [...channelIds].some((id) => channelMatches(s, id)))
    : signals;

  return filtered.slice(0, limit).map((s, i) => {
    const channel = s.canales[0] ?? "—";
    const ejemplo = (s.ejemplo || s.tema).trim();
    const tema = s.tema.replace(/ · /g, " · ");
    return {
      id: `${channel}-${tema}-${i}`,
      channel,
      tema,
      ejemplo,
      nMsgs: s.n_msgs,
      line: `${channel} · ${s.n_msgs} mensajes en chat sobre «${ejemplo.slice(0, 48)}${ejemplo.length > 48 ? "…" : ""}»`,
    };
  });
}
