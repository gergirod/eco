"use client";

import { useMemo, useState } from "react";
import data from "@/data/palco_entities.json";

/* ---------- tipos ---------- */
type Card = {
  video_id: string;
  channel: string;
  program: string;
  date: string;
  t_seconds: number;
  t_label: string;
  quote: string;
  conc_at: number | null;
  chat_msgs: number;
  chat_ratio: number;
  chat_ex: string[];
  sentiment: "neg" | "neu" | "pos";
  mentions_in_program: number;
  views: number | null;
  yt_url: string;
  clip_start?: number;
  clip_label?: string;
  origen?: string;
  formato?: string;
};
type Radar = {
  slug: string;
  entity: string;
  type: string;
  watchlist: string[];
  totals: {
    transcript_mentions: number;
    chat_mentions: number;
    programs_with_mentions: number;
    channels: number;
  };
  sentiment: { neg: number; neu: number; pos: number };
  share_of_voice: { channel: string; mentions: number; pct: number }[];
  by_day: { day: string; mentions: number }[];
  crisis: Card | null;
  feed: Card[];
};
type IndexRow = {
  slug: string;
  name: string;
  type: string;
  mentions: number;
  chat: number;
  channels: number;
  neg: number;
  neu: number;
  pos: number;
};
type Data = { default: string; index: IndexRow[]; radars: Record<string, Radar> };

const D = data as unknown as Data;

/* ---------- design system ----------
   Palco · capa de inteligencia de la atención.
   Light mode editorial: papel cálido, tinta, azul de marca, rojo crisis, verde positivo.
   Tokens:
     bg      #faf9f7  papel
     surface #ffffff  tarjeta
     border  stone-200
     ink     stone-900 / muted stone-500
     brand   #2f5fe0  (acento, chat, links)
     crisis  #dc2626
     pos     emerald-600
*/
const BRAND = "#2f5fe0";

/* ---------- helpers ---------- */
function compact(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + "k";
  return String(n);
}
function fmtDay(d: string): string {
  if (!d || d.length < 8) return d;
  return `${d.slice(6, 8)}/${d.slice(4, 6)}`;
}
const SENT = {
  neg: { label: "negativo", dot: "🔴", cls: "text-red-700 bg-red-50 border-red-200" },
  neu: { label: "neutro", dot: "⚪", cls: "text-stone-600 bg-stone-100 border-stone-200" },
  pos: { label: "positivo", dot: "🟢", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
} as const;

const ORIGEN: Record<string, { label: string; cls: string }> = {
  hablado: { label: "🎙 dicho al aire", cls: "text-stone-700 bg-stone-100 border-stone-200" },
  ambos: { label: "🎙+💬 aire y sala", cls: "text-[#2f5fe0] bg-blue-50 border-blue-200" },
  chat: { label: "💬 solo la sala", cls: "text-[#2f5fe0] bg-blue-50 border-blue-200" },
};

/* ---------- página ---------- */
export default function PalcoPage() {
  const [slug, setSlug] = useState<string>(D.default);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"todas" | "neg">("todas");

  const R = D.radars[slug];

  const filteredIndex = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return D.index;
    return D.index.filter((r) => r.name.toLowerCase().includes(q));
  }, [query]);

  const notFound = query.trim().length > 0 && filteredIndex.length === 0;

  const maxSov = Math.max(...R.share_of_voice.map((s) => s.mentions), 1);
  const maxDay = Math.max(...R.by_day.map((s) => s.mentions), 1);
  const sentTotal = R.sentiment.neg + R.sentiment.neu + R.sentiment.pos || 1;
  const pico = R.feed.reduce(
    (a, b) => ((b.conc_at ?? 0) > (a.conc_at ?? 0) ? b : a),
    R.feed[0]
  );
  const feed = tab === "neg" ? R.feed.filter((f) => f.sentiment === "neg") : R.feed;

  return (
    <div className="min-h-screen bg-[#faf9f7] text-stone-900">
      <div className="mx-auto max-w-[1100px] px-5 py-8">
        {/* marca */}
        <div
          className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.2em]"
          style={{ color: BRAND }}
        >
          <span
            className="inline-block h-2 w-2 animate-pulse rounded-full"
            style={{ backgroundColor: BRAND }}
          />
          PALCO
        </div>

        {/* selector de entidad */}
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <label className="text-[12px] font-medium text-stone-500">
            ¿A quién querés monitorear?
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribí un nombre — persona, marca, tema…"
            className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-[15px] text-stone-900 placeholder-stone-400 outline-none focus:border-[#2f5fe0] focus:ring-2 focus:ring-blue-100"
          />
          {notFound ? (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              No hay resultados en <b>este demo</b>. En producción Palco no depende de una lista:
              escribís cualquier nombre y hacemos un <b>retro-scan</b> de todo lo hablado en los
              canales + monitoreo en vivo. Si nunca lo nombraron, eso también es señal
              (&ldquo;no está en la conversación&rdquo;).
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {filteredIndex.map((r) => {
                const active = r.slug === slug;
                return (
                  <button
                    key={r.slug}
                    onClick={() => {
                      setSlug(r.slug);
                      setQuery("");
                      setTab("todas");
                    }}
                    className={`rounded-full border px-3 py-1.5 text-left text-[12px] transition ${
                      active
                        ? "border-[#2f5fe0] bg-blue-50 text-[#2f5fe0]"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                    }`}
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="ml-2 text-stone-400">
                      {r.type} · {compact(r.mentions)} menc.
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* header entidad */}
        <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <p className="text-[12px] uppercase tracking-wide text-stone-400">{R.type}</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight">
              Radar de {R.entity} en el streaming
            </h1>
            <p className="mt-1 text-[14px] text-stone-500">
              Qué se dice · cuánta gente lo escucha en vivo · cómo reacciona la sala
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-stone-400">Watchlist activa</p>
            <div className="mt-1 flex flex-wrap justify-end gap-1.5">
              {R.watchlist.map((w) => (
                <span
                  key={w}
                  className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[12px] text-stone-600"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* KPIs */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "Menciones habladas", v: compact(R.totals.transcript_mentions), s: "en transcripción" },
            { k: "Menciones en chat", v: compact(R.totals.chat_mentions), s: "la sala hablando" },
            { k: "Programas", v: String(R.totals.programs_with_mentions), s: "lo nombraron" },
            { k: "Canales", v: String(R.totals.channels), s: "cobertura" },
          ].map((kpi) => (
            <div key={kpi.k} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide text-stone-400">{kpi.k}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{kpi.v}</p>
              <p className="text-[12px] text-stone-400">{kpi.s}</p>
            </div>
          ))}
        </section>

        {/* doble termómetro */}
        <section className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-stone-400">
              Termómetro 1 · Tono de cobertura
            </p>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-stone-100">
              <div className="bg-red-500" style={{ width: `${(R.sentiment.neg / sentTotal) * 100}%` }} />
              <div className="bg-stone-400" style={{ width: `${(R.sentiment.neu / sentTotal) * 100}%` }} />
              <div className="bg-emerald-500" style={{ width: `${(R.sentiment.pos / sentTotal) * 100}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-[12px] text-stone-500">
              <span>🔴 {R.sentiment.neg} negativo</span>
              <span>⚪ {R.sentiment.neu} neutro</span>
              <span>🟢 {R.sentiment.pos} positivo</span>
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-stone-400">
              Termómetro 2 · Reacción de la sala{" "}
              <span style={{ color: BRAND }}>(único)</span>
            </p>
            <div className="mt-3 flex items-end gap-6">
              <div>
                <p className="text-3xl font-bold tabular-nums">{compact(pico?.conc_at)}</p>
                <p className="text-[12px] text-stone-400">pico mirando en vivo · {pico?.channel}</p>
              </div>
              <div>
                <p className="text-3xl font-bold tabular-nums" style={{ color: BRAND }}>
                  ×{pico?.chat_ratio}
                </p>
                <p className="text-[12px] text-stone-400">chat vs. su ritmo normal</p>
              </div>
            </div>
          </div>
        </section>

        {/* alerta de crisis */}
        {R.crisis && (
          <section className="mt-6">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-red-600">
              🚨 Alerta de crisis
            </h2>
            <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-red-600 px-4 py-2 text-[12px] font-medium text-white">
                <span>PALCO · CRISIS</span>
                <span className="opacity-90">{fmtDay(R.crisis.date)}</span>
              </div>
              <div className="p-5">
                <p className="text-[15px] font-semibold">
                  {R.crisis.channel} · <span className="text-stone-500">{R.crisis.program}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {R.crisis.origen && ORIGEN[R.crisis.origen] && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${ORIGEN[R.crisis.origen].cls}`}
                    >
                      {ORIGEN[R.crisis.origen].label}
                    </span>
                  )}
                  {R.crisis.formato && (
                    <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
                      {R.crisis.formato}
                    </span>
                  )}
                </div>
                <p className="mt-3 border-l-2 border-red-400 pl-3 text-[15px] italic text-stone-700">
                  &ldquo;{R.crisis.quote}&rdquo;
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-stone-600">
                  <span>👁 <b className="tabular-nums text-stone-900">{compact(R.crisis.conc_at)}</b> en vivo</span>
                  <span>
                    💬 chat{" "}
                    <b className="tabular-nums" style={{ color: BRAND }}>
                      ×{R.crisis.chat_ratio}
                    </b>
                  </span>
                  <span>🕐 {R.crisis.t_label}</span>
                  <span className="text-red-600">🔴 tono negativo</span>
                </div>
                <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-[12px] text-stone-500">
                  <b className="text-stone-700">Por qué es crisis:</b> mención + audiencia alta + chat
                  disparado + tono negativo, todo al mismo tiempo. Nadie más puede computar este cruce.
                </p>
                <a
                  href={R.crisis.yt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-white hover:opacity-90"
                  style={{ backgroundColor: BRAND }}
                >
                  🎬 {R.crisis.clip_label || "Ver clip en el minuto exacto"}
                </a>
              </div>
            </div>
          </section>
        )}

        {/* feed de fichas */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">
              Fichas de mención · por reacción del chat
            </h2>
            <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-0.5 text-[12px]">
              {(["todas", "neg"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1 ${
                    tab === t
                      ? "bg-stone-900 text-white"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {t === "todas" ? "Todas" : "Solo negativas"}
                </button>
              ))}
            </div>
          </div>

          {feed.length === 0 ? (
            <p className="rounded-xl border border-stone-200 bg-white p-6 text-center text-[13px] text-stone-400">
              Sin menciones negativas en el período.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {feed.map((c) => {
                const s = SENT[c.sentiment];
                const o = c.origen ? ORIGEN[c.origen] : null;
                return (
                  <article
                    key={c.video_id + c.t_seconds}
                    className="flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-stone-800">{c.channel}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${s.cls}`}>
                        {s.dot} {s.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-stone-400 line-clamp-1">{c.program}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o && (
                        <span className={`rounded-full border px-2 py-0.5 text-[10.5px] ${o.cls}`}>
                          {o.label}
                        </span>
                      )}
                      {c.formato && (
                        <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10.5px] text-stone-500">
                          {c.formato}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 flex-1 text-[13.5px] italic leading-relaxed text-stone-700 line-clamp-3">
                      &ldquo;{c.quote}&rdquo;
                    </p>
                    {c.chat_ex?.[0] && (
                      <p className="mt-2 rounded-md bg-stone-50 px-2.5 py-1.5 text-[12px] text-stone-500">
                        💬 la sala: «{c.chat_ex[0]}»
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-stone-500">
                      <span>👁 <b className="tabular-nums text-stone-800">{compact(c.conc_at)}</b></span>
                      <span>
                        💬{" "}
                        <b className="tabular-nums" style={{ color: BRAND }}>
                          ×{c.chat_ratio}
                        </b>
                      </span>
                      <span>{fmtDay(c.date)} · {c.t_label}</span>
                      <a
                        href={c.yt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto font-medium hover:underline"
                        style={{ color: BRAND }}
                      >
                        🎬 {c.clip_label || "clip"}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* share of voice + timeline */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">
              Share of voice por canal
            </h2>
            <div className="mt-4 space-y-2">
              {R.share_of_voice.slice(0, 8).map((s) => (
                <div key={s.channel} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-[12px] text-stone-600">{s.channel}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-stone-100">
                    <div
                      className="h-full rounded"
                      style={{ width: `${(s.mentions / maxSov) * 100}%`, backgroundColor: BRAND }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-stone-500">
                    {s.mentions}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">
              Menciones por día
            </h2>
            <div className="mt-6 flex h-40 items-end gap-1.5">
              {R.by_day.slice(-14).map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] tabular-nums text-stone-400">{d.mentions}</span>
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${Math.max((d.mentions / maxDay) * 100, 3)}%`,
                      background: `linear-gradient(to top, ${BRAND}, #7aa0f0)`,
                    }}
                  />
                  <span className="text-[9px] text-stone-400">{fmtDay(d.day)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-stone-200 pt-4 text-[11px] text-stone-400">
          Palco · demo sobre corpus real · datos capturados del streaming argentino en vivo ·
          elegí otra entidad arriba para cambiar el radar
        </footer>
      </div>
    </div>
  );
}
