"use client";

import type { CategoryRow, ChannelPlacement, MixRow, TopicRow } from "@/lib/placement";
import { categoryLabel } from "@/lib/placement";

function MixBar({ rows, empty }: { rows: MixRow[]; empty?: string }) {
  if (!rows.length) {
    return <p className="text-[12.5px] text-gray-400">{empty || "Todavía no hay datos de las últimas emisiones."}</p>;
  }
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex justify-between text-[12px] mb-0.5">
            <span className="text-gray-700">{r.label}</span>
            <span className="text-gray-400 tabular-nums">
              {r.pct}% · {r.count} {r.count === 1 ? "vez" : "veces"}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-accent/70 rounded-full" style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopicList({ rows, limit = 5 }: { rows: TopicRow[]; limit?: number }) {
  if (!rows.length) {
    return <p className="text-[12.5px] text-gray-400">Todavía no hay temas para mostrar.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {rows.slice(0, limit).map((t) => (
        <li key={t.tema} className="text-[12.5px] text-gray-700 flex justify-between gap-2">
          <span className="truncate">{t.tema}</span>
          <span className="text-gray-400 tabular-nums shrink-0">{t.score}</span>
        </li>
      ))}
    </ul>
  );
}

function CategoryPills({ rows }: { rows: CategoryRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {rows.slice(0, 5).map((c) => (
        <span
          key={c.categoria}
          className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100"
        >
          {categoryLabel(c.categoria)}
        </span>
      ))}
    </div>
  );
}

export function PlacementChannelCard({
  placement,
  channelName,
}: {
  placement: ChannelPlacement | null;
  channelName: string;
}) {
  if (!placement || (!placement.rubro_mix.length && !placement.top_temas.length)) {
    return null;
  }

  return (
    <div className="card p-5 mb-5">
      <h2 className="text-[15px] font-semibold mb-1">¿Te cierra este canal?</h2>
      <p className="text-[13px] text-gray-500 mb-4 max-w-xl leading-relaxed">
        Qué tipo de marcas pautan y de qué charlan en {channelName} en las últimas emisiones que
        medimos.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Marcas que pautan, por tipo
          </h3>
          <MixBar
            rows={placement.rubro_mix}
            empty="Todavía no vimos marcas pautando acá."
          />
        </div>
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-gray-400 mb-3">
            De qué hablan
          </h3>
          <TopicList rows={placement.top_temas} />
          <div className="mt-3">
            <CategoryPills rows={placement.categoria_mix} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlacementShowSnippet({
  placement,
  compact,
}: {
  placement: ChannelPlacement | null;
  compact?: boolean;
}) {
  if (!placement) return null;
  const topRubro = placement.rubro_mix[0];
  const topTema = placement.top_temas[0];
  if (!topRubro && !topTema) return null;

  if (compact) {
    return (
      <div className="text-[12px] text-gray-600 space-y-1 mb-3 leading-relaxed">
        {topRubro ? (
          <p>
            Pautan: <b className="text-gray-700">{topRubro.label}</b> ({topRubro.pct}%)
          </p>
        ) : null}
        {topTema ? (
          <p>
            Hablan de: <b className="text-gray-700">{topTema.tema}</b>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="border-t border-[#ececec] pt-3 mt-3 space-y-3">
      {placement.rubro_mix.length > 0 ? (
        <div>
          <h4 className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Tipos de marcas que pautan</h4>
          <MixBar rows={placement.rubro_mix.slice(0, 4)} />
        </div>
      ) : null}
      {placement.top_temas.length > 0 ? (
        <div>
          <h4 className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">De qué hablan</h4>
          <TopicList rows={placement.top_temas} limit={4} />
        </div>
      ) : null}
    </div>
  );
}
