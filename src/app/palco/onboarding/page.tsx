"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import data from "@/data/palco_entities.json";

/* ============================================================================
   Palco · Onboarding
   Flujo real (mockeado) estilo Streem: bienvenida → plan → elegir a quién seguir
   → confirmar → tablero. Corpus real: las entidades y sus números salen del
   dataset capturado. Light mode + design system de /palco.
   Path inicial: /palco/onboarding
============================================================================ */

const BRAND = "#2f5fe0";

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
const INDEX = (data as unknown as { index: IndexRow[] }).index;

/* ---------- planes (modelo self-serve tipo Podscan: precio transparente,
   se paga por cuántos nombres/temas seguís. Cada nombre = una persona, marca
   o tema con sus variantes. Escalás sumando nombres → subís de plan). ---------- */
type Plan = {
  id: "esencial" | "profesional" | "enterprise";
  nombre: string;
  para: string;
  limite: number;
  precio: string;
  bajada: string;
  incluye: string[];
  destacado?: boolean;
  aMedida?: boolean;
};
const PLANES: Plan[] = [
  {
    id: "esencial",
    nombre: "Individual",
    para: "Para vos solo",
    limite: 1,
    precio: "USD 90/mes",
    bajada: "Seguí tu propio nombre y no te pierdas nada de lo que se dice de vos.",
    incluye: [
      "1 nombre o tema",
      "Tablero en vivo, actualizado cada día",
      "Resumen diario por mail",
      "1 usuario",
    ],
  },
  {
    id: "profesional",
    nombre: "Pro",
    para: "Para equipos de prensa",
    limite: 3,
    precio: "USD 250/mes",
    bajada: "Tu principal, un rival y un tema — todo junto.",
    incluye: [
      "Hasta 3 nombres o temas",
      "Avisos de crisis en tiempo real",
      "Reporte semanal curado, listo para presentar",
      "Hasta 5 usuarios",
    ],
    destacado: true,
  },
  {
    id: "enterprise",
    nombre: "A medida",
    para: "Para consultoras y gobierno",
    limite: 999,
    precio: "Hablemos",
    aMedida: true,
    bajada: "Todos los nombres que necesites, varias cuentas, API y soporte.",
    incluye: [
      "Nombres o temas ilimitados",
      "Varias cuentas / clientes en un lugar",
      "Reportes con tu marca + API",
      "Usuarios ilimitados + soporte dedicado",
    ],
  },
];

/* ---------- helpers ---------- */
function compact(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + "k";
  return String(n);
}
const CATS = ["Todas", "Político", "Deporte", "Música"] as const;

/* ---------- UI: barra de sentimiento mini ---------- */
function MiniSent({ r }: { r: IndexRow }) {
  const t = r.neg + r.neu + r.pos || 1;
  return (
    <div className="flex h-1.5 overflow-hidden rounded-full bg-stone-100">
      <div className="bg-red-500" style={{ width: `${(r.neg / t) * 100}%` }} />
      <div className="bg-stone-400" style={{ width: `${(r.neu / t) * 100}%` }} />
      <div className="bg-emerald-500" style={{ width: `${(r.pos / t) * 100}%` }} />
    </div>
  );
}

/* ---------- gobernanza de avisos (mapea a DEFAULT_REGLAS del pipeline,
   pero en palabras humanas: el usuario decide CUÁNDO y CÓMO le avisamos,
   sin tocar umbrales técnicos). ---------- */
type Sensibilidad = "menos" | "equilibrado" | "mas";
type Frecuencia = "al-toque" | "diario" | "semanal";
const SENSIBILIDADES: {
  id: Sensibilidad;
  titulo: string;
  bajada: string;
  reco?: boolean;
}[] = [
  {
    id: "menos",
    titulo: "Menos avisos",
    bajada: "Solo cuando algo se prende fuego de verdad: mucha audiencia y chat disparado.",
  },
  {
    id: "equilibrado",
    titulo: "Equilibrado",
    bajada: "El punto justo. Te avisamos los picos que importan, sin ruido.",
    reco: true,
  },
  {
    id: "mas",
    titulo: "Más avisos",
    bajada: "Enterate de casi todo lo que se mueva, aunque a veces sea menor.",
  },
];
const FRECUENCIAS: { id: Frecuencia; titulo: string; bajada: string }[] = [
  { id: "al-toque", titulo: "Al toque", bajada: "Apenas pasa algo importante." },
  { id: "diario", titulo: "Resumen diario", bajada: "Un mail cada tarde con lo del día." },
  { id: "semanal", titulo: "Resumen semanal", bajada: "Un reporte curado, listo para presentar." },
];

/* ---------- pasos ---------- */
type Paso = "bienvenida" | "plan" | "entidades" | "avisos" | "listo";
const PASOS: { id: Paso; label: string }[] = [
  { id: "bienvenida", label: "Bienvenida" },
  { id: "plan", label: "Plan" },
  { id: "entidades", label: "A quién seguir" },
  { id: "avisos", label: "Avisos" },
  { id: "listo", label: "Listo" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("bienvenida");
  const [planId, setPlanId] = useState<Plan["id"]>("profesional");
  const [sel, setSel] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("Todas");
  // gobernanza de avisos (defaults sanos: equilibrado + todo + diario)
  const [sensibilidad, setSensibilidad] = useState<Sensibilidad>("equilibrado");
  const [soloNegativo, setSoloNegativo] = useState(false);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>("diario");

  const plan = PLANES.find((p) => p.id === planId)!;
  const pasoIdx = PASOS.findIndex((p) => p.id === paso);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INDEX.filter(
      (r) =>
        (cat === "Todas" || r.type === cat) &&
        (!q || r.name.toLowerCase().includes(q))
    ).sort((a, b) => b.mentions - a.mentions);
  }, [query, cat]);

  function toggle(slug: string) {
    setSel((cur) => {
      if (cur.includes(slug)) return cur.filter((s) => s !== slug);
      if (cur.length >= plan.limite) return cur; // tope del plan elegido
      return [...cur, slug];
    });
  }
  const lleno = sel.length >= plan.limite;

  function entrar() {
    const e = sel.join(",");
    const q = new URLSearchParams({
      e,
      plan: planId,
      sens: sensibilidad,
      neg: soloNegativo ? "1" : "0",
      freq: frecuencia,
    });
    router.push(`/palco?${q.toString()}`);
  }

  const selRows = sel
    .map((s) => INDEX.find((r) => r.slug === s))
    .filter(Boolean) as IndexRow[];

  return (
    <div className="min-h-screen bg-[#faf9f7] text-stone-900">
      {/* barra superior */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-5 py-3">
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
          {/* progreso */}
          <div className="flex items-center gap-2">
            {PASOS.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    i <= pasoIdx ? "text-white" : "bg-stone-100 text-stone-400"
                  }`}
                  style={i <= pasoIdx ? { backgroundColor: BRAND } : undefined}
                >
                  {i + 1}
                </div>
                {i < PASOS.length - 1 && (
                  <div
                    className={`hidden h-px w-6 sm:block ${
                      i < pasoIdx ? "" : "bg-stone-200"
                    }`}
                    style={i < pasoIdx ? { backgroundColor: BRAND } : undefined}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1000px] px-5 py-10">
        {/* ---------------- BIENVENIDA ---------------- */}
        {paso === "bienvenida" && (
          <section className="mx-auto max-w-[680px] text-center">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-stone-400">
              Bienvenido a Palco
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-tight">
              Enterate de todo lo que se dice en el streaming, sin escuchar horas de vivo.
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-stone-600">
              Palco escucha los programas en vivo de Argentina las 24 horas. Cada vez
              que nombran a alguien que te importa, lo anotamos: qué dijeron, cuánta
              gente lo estaba escuchando y cómo reaccionó la gente en el chat.
            </p>

            <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
              {[
                {
                  t: "Vos elegís a quién seguir",
                  d: "Personas, candidatos, marcas o temas. Nosotros los buscamos en todo lo hablado.",
                },
                {
                  t: "Te avisamos cuando importa",
                  d: "Si algo se prende fuego —mala mención + mucha audiencia + chat disparado— te llega un aviso.",
                },
                {
                  t: "Listo para mostrar",
                  d: "Un tablero claro y un reporte que podés llevar a la reunión sin traducir nada.",
                },
              ].map((c) => (
                <div
                  key={c.t}
                  className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-[14px] font-semibold">{c.t}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-500">{c.d}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPaso("plan")}
              className="mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[15px] font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: BRAND }}
            >
              Empezar →
            </button>
            <p className="mt-3 text-[12px] text-stone-400">
              Toma 1 minuto · sin tarjeta
            </p>
          </section>
        )}

        {/* ---------------- PLAN ---------------- */}
        {paso === "plan" && (
          <section>
            <div className="text-center">
              <h1 className="text-3xl font-bold">Elegí tu plan</h1>
              <p className="mt-2 text-[15px] text-stone-600">
                Pagás por <b>cuántos nombres o temas</b> querés seguir. Un nombre es
                una persona, marca o tema. Sumás más cuando quieras — sin sorpresas.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {PLANES.map((p) => {
                const active = p.id === planId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlanId(p.id)}
                    className={`relative flex flex-col rounded-2xl border p-5 text-left shadow-sm transition ${
                      active
                        ? "border-[#2f5fe0] ring-2 ring-blue-100"
                        : "border-stone-200 bg-white hover:border-stone-400"
                    }`}
                    style={active ? { backgroundColor: "#f5f8ff" } : { backgroundColor: "#fff" }}
                  >
                    {p.destacado && (
                      <span
                        className="absolute -top-2.5 left-5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold text-white"
                        style={{ backgroundColor: BRAND }}
                      >
                        MÁS ELEGIDO
                      </span>
                    )}
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                      {p.para}
                    </p>
                    <p className="mt-1 text-2xl font-bold">{p.nombre}</p>
                    <p className="mt-0.5 text-[13px] font-medium" style={{ color: BRAND }}>
                      {p.aMedida
                        ? "Nombres ilimitados"
                        : p.limite === 1
                        ? "1 nombre"
                        : `Hasta ${p.limite} nombres`}{" "}
                      · {p.precio}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
                      {p.bajada}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {p.incluye.map((f) => (
                        <li key={f} className="flex gap-2 text-[13px] text-stone-700">
                          <span style={{ color: BRAND }}>✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div
                      className={`mt-4 rounded-lg py-2 text-center text-[13px] font-semibold ${
                        active ? "text-white" : "bg-stone-100 text-stone-600"
                      }`}
                      style={active ? { backgroundColor: BRAND } : undefined}
                    >
                      {active ? "Seleccionado" : "Elegir"}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-center text-[13px] text-stone-500">
              Un nombre es una persona, marca o tema. Sumás o sacás cuando quieras.
            </p>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setPaso("bienvenida")}
                className="text-[14px] text-stone-500 hover:text-stone-800"
              >
                ← Volver
              </button>
              <button
                onClick={() => setPaso("entidades")}
                className="rounded-lg px-6 py-3 text-[15px] font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: BRAND }}
              >
                Seguir →
              </button>
            </div>
          </section>
        )}

        {/* ---------------- ENTIDADES ---------------- */}
        {paso === "entidades" && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold">¿A quién querés seguir?</h1>
                <p className="mt-2 text-[15px] text-stone-600">
                  {plan.aMedida ? (
                    <>
                      Con <b>{plan.nombre}</b> elegís los nombres que quieras.
                    </>
                  ) : plan.limite === 1 ? (
                    <>
                      Con <b>{plan.nombre}</b> seguís <b>1 nombre</b>.
                    </>
                  ) : (
                    <>
                      Elegí hasta <b>{plan.limite} nombres</b> con tu plan {plan.nombre}.
                    </>
                  )}{" "}
                  Estos ya aparecen en lo capturado; en tu cuenta sumás cualquier
                  otro nombre o tema.
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-right shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-stone-400">
                  Elegiste
                </p>
                <p className="text-lg font-bold tabular-nums">
                  {sel.length}
                  <span className="ml-1 text-[13px] font-medium text-stone-400">
                    {plan.aMedida ? "nombres" : `/ ${plan.limite}`}
                  </span>
                </p>
              </div>
            </div>

            {/* buscador + filtros */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar un nombre…"
                className="min-w-[200px] flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#2f5fe0] focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-0.5 text-[13px]">
                {CATS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`rounded-md px-3 py-1.5 ${
                      cat === c ? "text-white" : "text-stone-500 hover:text-stone-800"
                    }`}
                    style={cat === c ? { backgroundColor: BRAND } : undefined}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {lleno && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-[13px]">
                <span className="text-stone-700">
                  Llegaste al tope de tu plan {plan.nombre} ({plan.limite}{" "}
                  {plan.limite === 1 ? "nombre" : "nombres"}).
                </span>
                <button
                  onClick={() => setPaso("plan")}
                  className="font-semibold hover:underline"
                  style={{ color: BRAND }}
                >
                  Subir de plan →
                </button>
              </div>
            )}

            {/* grilla de entidades */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => {
                const on = sel.includes(r.slug);
                const bloq = !on && lleno;
                return (
                  <button
                    key={r.slug}
                    onClick={() => toggle(r.slug)}
                    disabled={bloq}
                    className={`flex flex-col rounded-xl border p-4 text-left shadow-sm transition ${
                      on
                        ? "border-[#2f5fe0] ring-2 ring-blue-100"
                        : bloq
                        ? "border-stone-200 bg-white opacity-40"
                        : "border-stone-200 bg-white hover:border-stone-400"
                    }`}
                    style={on ? { backgroundColor: "#f5f8ff" } : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[15px] font-semibold leading-tight">
                          {r.name}
                        </p>
                        <p className="text-[12px] text-stone-400">{r.type}</p>
                      </div>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                          on ? "border-transparent text-white" : "border-stone-300 text-transparent"
                        }`}
                        style={on ? { backgroundColor: BRAND } : undefined}
                      >
                        ✓
                      </span>
                    </div>
                    <div className="mt-3 flex gap-4 text-[12px] text-stone-500">
                      <span>
                        <b className="tabular-nums text-stone-800">
                          {compact(r.mentions)}
                        </b>{" "}
                        veces nombrado
                      </span>
                      <span>
                        <b className="tabular-nums text-stone-800">{r.channels}</b>{" "}
                        canales
                      </span>
                    </div>
                    <div className="mt-2">
                      <MiniSent r={r} />
                    </div>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <p className="mt-6 rounded-xl border border-stone-200 bg-white p-6 text-center text-[14px] text-stone-500">
                No encontramos ese nombre en el demo. En tu cuenta escribís cualquiera
                y lo empezamos a seguir desde ese momento.
              </p>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setPaso("plan")}
                className="text-[14px] text-stone-500 hover:text-stone-800"
              >
                ← Volver
              </button>
              <button
                onClick={() => setPaso("avisos")}
                disabled={sel.length === 0}
                className="rounded-lg px-6 py-3 text-[15px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: BRAND }}
              >
                Seguir →
              </button>
            </div>
          </section>
        )}

        {/* ---------------- AVISOS (gobernanza) ---------------- */}
        {paso === "avisos" && (
          <section className="mx-auto max-w-[720px]">
            <div className="text-center">
              <h1 className="text-3xl font-bold">¿Cuándo querés que te avisemos?</h1>
              <p className="mt-2 text-[15px] text-stone-600">
                Vos decidís cuánto te molestamos. Podés cambiar todo esto cuando
                quieras desde tu tablero.
              </p>
            </div>

            {/* sensibilidad */}
            <div className="mt-8">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                Cuánto avisar
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {SENSIBILIDADES.map((s) => {
                  const active = s.id === sensibilidad;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSensibilidad(s.id)}
                      className={`relative flex flex-col rounded-2xl border p-4 text-left shadow-sm transition ${
                        active
                          ? "border-[#2f5fe0] ring-2 ring-blue-100"
                          : "border-stone-200 bg-white hover:border-stone-400"
                      }`}
                      style={active ? { backgroundColor: "#f5f8ff" } : undefined}
                    >
                      {s.reco && (
                        <span
                          className="absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold text-white"
                          style={{ backgroundColor: BRAND }}
                        >
                          RECOMENDADO
                        </span>
                      )}
                      <p className="text-[15px] font-semibold">{s.titulo}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                        {s.bajada}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* solo negativo */}
            <div className="mt-6">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                Qué avisar
              </p>
              <button
                onClick={() => setSoloNegativo((v) => !v)}
                className={`mt-3 flex w-full items-center justify-between rounded-2xl border p-4 text-left shadow-sm transition ${
                  soloNegativo
                    ? "border-[#2f5fe0] ring-2 ring-blue-100"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
                style={soloNegativo ? { backgroundColor: "#f5f8ff" } : undefined}
              >
                <div>
                  <p className="text-[15px] font-semibold">Avisame solo lo negativo</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                    Ideal para modo crisis: te llegan solo las malas menciones. Si lo
                    dejás apagado, te avisamos también lo bueno y lo neutro.
                  </p>
                </div>
                <span
                  className={`ml-4 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
                    soloNegativo ? "" : "bg-stone-200"
                  }`}
                  style={soloNegativo ? { backgroundColor: BRAND } : undefined}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow transition ${
                      soloNegativo ? "translate-x-5" : ""
                    }`}
                  />
                </span>
              </button>
            </div>

            {/* frecuencia / cómo */}
            <div className="mt-6">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-stone-400">
                Cómo querés recibirlo
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {FRECUENCIAS.map((f) => {
                  const active = f.id === frecuencia;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFrecuencia(f.id)}
                      className={`flex flex-col rounded-2xl border p-4 text-left shadow-sm transition ${
                        active
                          ? "border-[#2f5fe0] ring-2 ring-blue-100"
                          : "border-stone-200 bg-white hover:border-stone-400"
                      }`}
                      style={active ? { backgroundColor: "#f5f8ff" } : undefined}
                    >
                      <p className="text-[15px] font-semibold">{f.titulo}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                        {f.bajada}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[12px] text-stone-400">
                Los avisos de crisis siempre llegan al toque, sin importar esta
                elección. Esto define el ritmo del resto.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setPaso("entidades")}
                className="text-[14px] text-stone-500 hover:text-stone-800"
              >
                ← Volver
              </button>
              <button
                onClick={() => setPaso("listo")}
                className="rounded-lg px-6 py-3 text-[15px] font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: BRAND }}
              >
                Seguir →
              </button>
            </div>
          </section>
        )}

        {/* ---------------- LISTO ---------------- */}
        {paso === "listo" && (
          <section className="mx-auto max-w-[680px]">
            <div className="text-center">
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white"
                style={{ backgroundColor: BRAND }}
              >
                ✓
              </div>
              <h1 className="mt-4 text-3xl font-bold">Todo listo, {plan.nombre}.</h1>
              <p className="mt-2 text-[15px] text-stone-600">
                Ya estamos escuchando por vos. Así te queda configurado:
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span className="text-[13px] text-stone-500">Plan</span>
                <span className="text-[14px] font-semibold">
                  {plan.nombre} · seguimiento ilimitado
                </span>
              </div>
              <p className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
                Tu watchlist ({selRows.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selRows.map((r) => (
                  <span
                    key={r.slug}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[13px]"
                    style={{ color: BRAND }}
                  >
                    {r.name}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
                Tus avisos
              </p>
              <div className="mt-2 grid gap-2 text-[13px] text-stone-600">
                <p className="flex gap-2">
                  <span style={{ color: BRAND }}>✓</span>{" "}
                  {SENSIBILIDADES.find((s) => s.id === sensibilidad)!.titulo} ·{" "}
                  {soloNegativo ? "solo lo negativo" : "todo (bueno, neutro y malo)"}
                </p>
                <p className="flex gap-2">
                  <span style={{ color: BRAND }}>✓</span>{" "}
                  {FRECUENCIAS.find((f) => f.id === frecuencia)!.titulo} por mail
                </p>
                <p className="flex gap-2">
                  <span style={{ color: BRAND }}>✓</span> Avisos de crisis siempre al toque
                </p>
                {planId === "enterprise" && (
                  <p className="flex gap-2">
                    <span style={{ color: BRAND }}>✓</span> Reportes exportables con tu marca
                  </p>
                )}
              </div>
              <p className="mt-3 text-[12px] text-stone-400">
                Todo esto lo cambiás cuando quieras desde <b>Avisos</b> en tu tablero.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setPaso("avisos")}
                className="text-[14px] text-stone-500 hover:text-stone-800"
              >
                ← Ajustar
              </button>
              <button
                onClick={entrar}
                className="rounded-lg px-6 py-3 text-[15px] font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: BRAND }}
              >
                Entrar a mi tablero →
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
