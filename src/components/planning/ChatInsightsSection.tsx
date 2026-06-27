"use client";

import Link from "next/link";
import {
  canShowCrossChannelInsights,
  demandTipoLabel,
  mixSummary,
  type ChannelChatInsight,
  type ChatDemandSignal,
  type ChatInsightsExport,
  type ConductorMoment,
  type ProgramChatInsight,
} from "@/lib/chatInsights";

function MixBar({ mix, label }: { mix: ChannelChatInsight["mix"]; label: string }) {
  const items = [
    { key: "demanda_pct", color: "bg-accent", label: "Pide algo" },
    { key: "obediencia_pct", color: "bg-green-500", label: "Responde al conductor" },
    { key: "pregunta_pct", color: "bg-sky-500", label: "Pregunta" },
    { key: "emoji_pct", color: "bg-gray-300", label: "Emoji" },
    { key: "reaccion_pct", color: "bg-gray-200", label: "Reacción corta" },
    { key: "texto_pct", color: "bg-gray-400", label: "Conversación" },
  ] as const;

  const visible = items.filter((i) => (mix[i.key] ?? 0) > 0);
  if (!visible.length) return null;

  return (
    <div className="mt-3">
      <p className="text-[11px] text-gray-400 mb-1.5">{label}</p>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
        {visible.map((i) => (
          <div
            key={i.key}
            className={`${i.color} h-full`}
            style={{ width: `${mix[i.key]}%` }}
            title={`${i.label}: ${mix[i.key]}%`}
          />
        ))}
      </div>
      <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{mixSummary(mix)}</p>
    </div>
  );
}

function ChannelRow({ ch }: { ch: ChannelChatInsight }) {
  return (
    <Link
      href={`/canales/${ch.id}?tab=audiencia`}
      className="card p-5 block hover:border-accent/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold text-ink group-hover:text-accent transition-colors">
            {ch.name}
          </h3>
          <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed">{ch.character_label}</p>
          <p className="text-[12.5px] text-gray-500 mt-2">
            {ch.msgs_per_1k != null ? (
              <>
                <b className="text-ink">{ch.msgs_per_1k}</b> mensajes por cada mil mirando
              </>
            ) : (
              <>{ch.chat_messages.toLocaleString("es-AR")} mensajes</>
            )}
            {ch.chat_quality_label ? ` · ${ch.chat_quality_label}` : ""}
            {ch.noise_score != null && ch.noise_score >= 0.55 ? " · sala ruidosa" : ""}
          </p>
          <MixBar mix={ch.mix} label="De qué está hecho el chat" />
          {ch.top_demands.length > 0 && (
            <p className="text-[12px] text-gray-400 mt-2 truncate">
              Ej: «{ch.top_demands[0].text.slice(0, 72)}
              {ch.top_demands[0].text.length > 72 ? "…" : ""}»
            </p>
          )}
        </div>
        <span className="text-[12.5px] text-accent font-medium shrink-0 group-hover:underline">
          Ver →
        </span>
      </div>
    </Link>
  );
}

function ProgramRow({ p }: { p: ProgramChatInsight }) {
  return (
    <Link
      href={`/programas/${p.video_id}`}
      className="block py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 -mx-2 px-2 rounded transition-colors"
    >
      <p className="text-[12px] text-gray-400">{p.channel}</p>
      <p className="text-[13.5px] text-gray-800 font-medium leading-snug line-clamp-2">{p.title}</p>
      <p className="text-[12px] text-gray-500 mt-1">
        {p.msgs_per_1k != null
          ? `${p.msgs_per_1k} mensajes por mil mirando`
          : `${p.chat_messages} mensajes`}{" "}
        · {p.character_label.toLowerCase()}
      </p>
    </Link>
  );
}

function DemandRow({ d }: { d: ChatDemandSignal }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex flex-wrap items-baseline gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-accent">
          {demandTipoLabel(d.tipo)}
        </span>
        {d.cross_canal && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
            en varios canales
          </span>
        )}
        <span className="text-[11px] text-gray-400 tabular-nums">×{d.count}</span>
      </div>
      <p className="text-[13px] text-gray-700 italic leading-relaxed">«{d.text}»</p>
      <p className="text-[11px] text-gray-400 mt-1">
        {d.n_programas} {d.n_programas === 1 ? "programa" : "programas"}
        {d.canales.length ? ` · ${d.canales.join(", ")}` : ""}
      </p>
    </div>
  );
}

function conductorKindLabel(kind?: string): string {
  if (kind === "like") return "pedido de like";
  if (kind === "voto") return "voto / elección";
  if (kind === "codigo") return "código o link";
  return kind || "pedido en vivo";
}

function ConductorRow({ m }: { m: ConductorMoment }) {
  return (
    <Link
      href={`/programas/${m.video_id}`}
      className="block py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 -mx-2 px-2 rounded transition-colors"
    >
      <p className="text-[12px] text-gray-400">
        {m.channel} · min {m.minute ?? "—"} · {conductorKindLabel(m.kind)}
      </p>
      <p className="text-[13.5px] text-gray-800 font-medium mt-0.5">{m.label}</p>
      <p className="text-[12px] text-gray-500 mt-1 italic line-clamp-2">«{m.quote}»</p>
      {m.ratio != null && m.pre_rpm != null && m.post_rpm != null && (
        <p className="text-[11px] text-gray-400 mt-1">
          Antes {m.pre_rpm} → después {m.post_rpm} mensajes por minuto
          {m.ratio >= 1.12 ? ` (${m.ratio}× más activo)` : ""}
        </p>
      )}
    </Link>
  );
}

type Props = {
  insights: ChatInsightsExport | null;
  rubroLabel?: string | null;
};

export default function ChatInsightsSection({ insights, rubroLabel }: Props) {
  if (!insights || !canShowCrossChannelInsights(insights)) return null;

  const channels = insights.channels.filter((c) => c.chat_messages > 0);
  const demands = insights.demand_signals
    .filter((d) => d.count >= 2 || d.tipo !== "otro")
    .slice(0, 8);
  const conductor = (insights.conductor_moments || []).slice(0, 6);

  return (
    <>
      {rubroLabel && (
        <p className="text-[12.5px] text-accent font-medium mt-6 mb-1">
          Filtrado por rubro: {rubroLabel}
        </p>
      )}

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-ink">¿Dónde interactúa más la sala?</h2>
          <p className="text-[13px] text-gray-500 mt-1 max-w-xl leading-relaxed">
            Quién habla más en el chat por cada mil mirando — no es lo mismo que cuántos
            concurrentes hay. Solo entran canales con chat capturado; Luzu y otros sin chat quedan
            afuera.
          </p>
          {insights.platform_line && !rubroLabel && (
            <p className="text-[13px] text-gray-700 mt-2 max-w-xl leading-relaxed">
              {insights.platform_line}
            </p>
          )}
        </div>
        {channels.length > 0 ? (
          <div className="flex flex-col gap-3">
            {channels.map((ch) => (
              <ChannelRow key={ch.id} ch={ch} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-gray-500">Sin canales con chat para este rubro.</p>
        )}
      </section>

      {conductor.length > 0 && (
        <section className="mt-10 card p-5">
          <h2 className="text-[15px] font-semibold text-ink mb-1">
            ¿La sala le hace caso al conductor?
          </h2>
          <p className="text-[13px] text-gray-500 mb-4 max-w-xl leading-relaxed">
            Cuando el conductor pide algo en el audio (like, voto, código), miramos si el chat se
            acelera en los minutos siguientes. En TV lineal esto no se veía.
          </p>
          <div>
            {conductor.map((m, i) => (
              <ConductorRow key={`${m.video_id}-${m.minute}-${i}`} m={m} />
            ))}
          </div>
        </section>
      )}

      {demands.length > 0 && (
        <section className="mt-10 card p-5">
          <h2 className="text-[15px] font-semibold text-ink mb-1">Qué pide la gente en vivo</h2>
          <p className="text-[13px] text-gray-500 mb-4 max-w-xl leading-relaxed">
            Lo que la gente pidió o repitió en el chat — links, precios, invitados, votos.
          </p>
          <div>
            {demands.map((d, i) => (
              <DemandRow key={`${d.text}-${i}`} d={d} />
            ))}
          </div>
        </section>
      )}

      {insights.top_programs.length > 0 && (
        <section className="mt-10 card p-5">
          <h2 className="text-[15px] font-semibold text-ink mb-1">Emisiones con sala más activa</h2>
          <p className="text-[13px] text-gray-500 mb-3 max-w-xl">
            Shows donde la comunidad más habla por cada mil mirando.
          </p>
          <div>
            {insights.top_programs.slice(0, 6).map((p) => (
              <ProgramRow key={p.video_id} p={p} />
            ))}
          </div>
        </section>
      )}

      <p className="text-[11px] text-gray-400 mt-4 max-w-xl leading-relaxed">
        Medimos si el chat se mueve después de un pedido del conductor, comparado con lo que pasaba
        antes. No incluye el botón 👍 de YouTube.
      </p>
    </>
  );
}
