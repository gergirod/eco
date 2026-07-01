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
  neg: { label: "negativo", dot: "🔴", cls: "text-red-300 bg-red-500/10 border-red-500/30" },
  neu: { label: "neutro", dot: "⚪", cls: "text-zinc-300 bg-zinc-500/10 border-zinc-500/30" },
  pos: { label: "positivo", dot: "🟢", cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
} as const;

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[1100px] px-5 py-8">
        {/* marca */}
        <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.2em] text-sky-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sky-400" />
          PALCO
        </div>

        {/* selector de entidad */}
        <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <label className="text-[12px] font-medium text-zinc-400">
            ¿A quién querés monitorear?
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribí un nombre — persona, marca, tema…"
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-[15px] text-zinc-100 placeholder-zinc-600 outline-none focus:border-sky-500"
          />
          {notFound ? (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[13px] text-amber-200/90">
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
                        ? "border-sky-500 bg-sky-500/15 text-sky-200"
                        : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="ml-2 text-zinc-500">
                      {r.type} · {compact(r.mentions)} menc.
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* header entidad */}
        <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <p className="text-[12px] uppercase tracking-wide text-zinc-500">{R.type}</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight">
              Radar de {R.entity} en el streaming
            </h1>
            <p className="mt-1 text-[14px] text-zinc-400">
              Qué se dice · cuánta gente lo escucha en vivo · cómo reacciona la sala
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Watchlist activa</p>
            <div className="mt-1 flex flex-wrap justify-end gap-1.5">
              {R.watchlist.map((w) => (
                <span
                  key={w}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[12px] text-zinc-300"
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
            <div key={kpi.k} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">{kpi.k}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{kpi.v}</p>
              <p className="text-[12px] text-zinc-500">{kpi.s}</p>
            </div>
          ))}
        </section>

        {/* doble termómetro */}
        <section className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              Termómetro 1 · Tono de cobertura
            </p>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-zinc-800">
              <div className="bg-red-500" style={{ width: `${(R.sentiment.neg / sentTotal) * 100}%` }} />
              <div className="bg-zinc-500" style={{ width: `${(R.sentiment.neu / sentTotal) * 100}%` }} />
              <div className="bg-emerald-500" style={{ width: `${(R.sentiment.pos / sentTotal) * 100}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-[12px] text-zinc-400">
              <span>🔴 {R.sentiment.neg} negativo</span>
              <span>⚪ {R.sentiment.neu} neutro</span>
              <span>🟢 {R.sentiment.pos} positivo</span>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              Termómetro 2 · Reacción de la sala <span className="text-sky-400">(único)</span>
            </p>
            <div className="mt-3 flex items-end gap-6">
              <div>
                <p className="text-3xl font-bold tabular-nums">{compact(pico?.conc_at)}</p>
                <p className="text-[12px] text-zinc-500">pico mirando en vivo · {pico?.channel}</p>
              </div>
              <div>
                <p className="text-3xl font-bold tabular-nums text-sky-300">×{pico?.chat_ratio}</p>
                <p className="text-[12px] text-zinc-500">chat vs. su ritmo normal</p>
              </div>
            </div>
          </div>
        </section>

        {/* alerta de crisis */}
        {R.crisis && (
          <section className="mt-6">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-red-400">
              🚨 Alerta de crisis
            </h2>
            <div className="overflow-hidden rounded-2xl border border-red-500/40 bg-red-950/30">
              <div className="flex items-center justify-between bg-red-600 px-4 py-2 text-[12px] font-medium text-white">
                <span>PALCO · CRISIS</span>
                <span className="opacity-90">{fmtDay(R.crisis.date)}</span>
              </div>
              <div className="p-5">
                <p className="text-[15px] font-semibold">
                  {R.crisis.channel} · <span className="text-zinc-300">{R.crisis.program}</span>
                </p>
                <p className="mt-3 border-l-2 border-red-500/50 pl-3 text-[15px] italic text-zinc-200">
                  &ldquo;{R.crisis.quote}&rdquo;
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-zinc-300">
                  <span>👁 <b className="tabular-nums">{compact(R.crisis.conc_at)}</b> en vivo</span>
                  <span>💬 chat <b className="tabular-nums text-sky-300">×{R.crisis.chat_ratio}</b></span>
                  <span>🕐 {R.crisis.t_label}</span>
                  <span className="text-red-300">🔴 tono negativo</span>
                </div>
                <p className="mt-3 rounded-lg bg-zinc-900/60 px-3 py-2 text-[12px] text-zinc-400">
                  <b className="text-zinc-300">Por qué es crisis:</b> mención + audiencia alta + chat
                  disparado + tono negativo, todo al mismo tiempo. Nadie más puede computar este cruce.
                </p>
                <a
                  href={R.crisis.yt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[13px] font-medium hover:bg-white/20"
                >
                  🎬 Ver clip en el minuto exacto
                </a>
              </div>
            </div>
          </section>
        )}

        {/* feed de fichas */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
              Fichas de mención · por reacción del chat
            </h2>
            <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-[12px]">
              {(["todas", "neg"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1 ${
                    tab === t ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {t === "todas" ? "Todas" : "Solo negativas"}
                </button>
              ))}
            </div>
          </div>

          {feed.length === 0 ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center text-[13px] text-zinc-500">
              Sin menciones negativas en el período.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {feed.map((c) => {
                const s = SENT[c.sentiment];
                return (
                  <article
                    key={c.video_id + c.t_seconds}
                    className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-zinc-200">{c.channel}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${s.cls}`}>
                        {s.dot} {s.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-zinc-500 line-clamp-1">{c.program}</p>
                    <p className="mt-2 flex-1 text-[13.5px] italic leading-relaxed text-zinc-200 line-clamp-3">
                      &ldquo;{c.quote}&rdquo;
                    </p>
                    {c.chat_ex?.[0] && (
                      <p className="mt-2 rounded-md bg-zinc-950/60 px-2.5 py-1.5 text-[12px] text-zinc-400">
                        💬 la sala: «{c.chat_ex[0]}»
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-zinc-400">
                      <span>👁 <b className="tabular-nums text-zinc-200">{compact(c.conc_at)}</b></span>
                      <span>💬 <b className="tabular-nums text-sky-300">×{c.chat_ratio}</b></span>
                      <span>{fmtDay(c.date)} · {c.t_label}</span>
                      <a
                        href={c.yt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto text-sky-400 hover:underline"
                      >
                        🎬 clip
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
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
              Share of voice por canal
            </h2>
            <div className="mt-4 space-y-2">
              {R.share_of_voice.slice(0, 8).map((s) => (
                <div key={s.channel} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-[12px] text-zinc-300">{s.channel}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-zinc-800">
                    <div
                      className="h-full rounded bg-sky-500/70"
                      style={{ width: `${(s.mentions / maxSov) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-zinc-400">
                    {s.mentions}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">
              Menciones por día
            </h2>
            <div className="mt-6 flex h-40 items-end gap-1.5">
              {R.by_day.slice(-14).map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] tabular-nums text-zinc-500">{d.mentions}</span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-sky-600 to-sky-400"
                    style={{ height: `${Math.max((d.mentions / maxDay) * 100, 3)}%` }}
                  />
                  <span className="text-[9px] text-zinc-500">{fmtDay(d.day)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-zinc-800 pt-4 text-[11px] text-zinc-600">
          Palco · demo sobre corpus real · datos capturados del streaming argentino en vivo ·
          elegí otra entidad arriba para cambiar el radar
        </footer>
      </div>
    </div>
  );
}
