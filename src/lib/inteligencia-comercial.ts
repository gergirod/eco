/** Inteligencia comercial — hoy vs 90 días. Fuente para /backoffice?tab=inteligencia */

export type Confidence = "evidencia" | "conversacion" | "patron";

export type IntelRow = {
  question: string;
  answer: string;
  confidence: Confidence;
  moat: "alto" | "medio" | "bajo";
};

export type IcpIntel = {
  id: "marca" | "agencia" | "canal";
  label: string;
  product: string;
  buyerQuestion: string;
  today: IntelRow[];
  in90Days: IntelRow[];
  valueToday: string;
  value90Days: string;
  callOpener: string;
};

export const TAGLINE =
  "No medimos publicidad. Medimos atención con evidencia — minuto exacto, transcript, chat en vivo.";

export const STATUS = {
  product: "Plataforma v1 navegable (Marcas, Canales, Novedades, Tendencias, Programas).",
  business: "Falta primer cliente pago.",
  next: "Intelligence Layer: recomendaciones y alertas cruzadas (ARCH-001 §6).",
};

export const CONFIDENCE_LEVELS: {
  id: Confidence;
  label: string;
  description: string;
  examples: string;
}[] = [
  {
    id: "evidencia",
    label: "Evidencia",
    description: "Máxima confianza — verificable en transcript y audiencia.",
    examples: "PNT, minuto exacto, cita, formato, retención, certificado.",
  },
  {
    id: "conversacion",
    label: "Conversación",
    description: "Confianza media — señales del contenido y el chat.",
    examples: "Orgánico, temas, reacción del chat, Google Trends como señal.",
  },
  {
    id: "patron",
    label: "Patrones",
    description: "Inteligencia de mercado — mejora con histórico.",
    examples: "Tendencias cross-canal, marcas emergentes, oportunidades comerciales.",
  },
];

export const ICP_INTEL: IcpIntel[] = [
  {
    id: "marca",
    label: "Marca",
    product: "A — reporte + plataforma",
    buyerQuestion: "¿Cómo rindió mi inversión en atención real?",
    valueToday:
      "Certificado creíble para gerencia: minuto, concurrentes, cita, link al segundo. Un programa alcanza para el primer cheque.",
    value90Days:
      "Benchmark propio de slots y formatos, orgánico acumulado cuantificado, negociación con data («quiero como el 02/06»).",
    callOpener:
      "Ya sabés en qué programa compraste. Te mostramos cómo rindió cada aparición — no un promedio del show.",
    today: [
      {
        question: "¿Salió mi pauta?",
        answer: "PNT verificada con cita + timestamp + link YouTube",
        confidence: "evidencia",
        moat: "bajo",
      },
      {
        question: "¿Cuánta gente me vio?",
        answer: "Concurrentes en el minuto exacto de la mención",
        confidence: "evidencia",
        moat: "alto",
      },
      {
        question: "¿Fue dedicada o al pasar?",
        answer: "Clasificación de formato con prueba textual",
        confidence: "evidencia",
        moat: "alto",
      },
      {
        question: "¿Valió la exposición?",
        answer: "Rango USD benchmark (CPM ref.) — no facturación",
        confidence: "evidencia",
        moat: "medio",
      },
      {
        question: "¿Se fue gente después?",
        answer: "Retención post-PNT (~90s)",
        confidence: "evidencia",
        moat: "alto",
      },
      {
        question: "¿Reaccionó el chat?",
        answer: "Ritmo de chat vs base (donde hay captura en vivo)",
        confidence: "conversacion",
        moat: "alto",
      },
    ],
    in90Days: [
      {
        question: "¿Qué PNT rindió mejor?",
        answer: "Tabla comparativa histórica por programa, slot y formato",
        confidence: "evidencia",
        moat: "medio",
      },
      {
        question: "¿Cuánto orgánico no cobré?",
        answer: "Inventario acumulado con valorización benchmark",
        confidence: "conversacion",
        moat: "alto",
      },
      {
        question: "¿Me conviene seguir en este canal?",
        answer: "Evolución de exposición medida y formato en el trimestre",
        confidence: "patron",
        moat: "medio",
      },
      {
        question: "¿Pagamos de más?",
        answer: "Capa 1.5: inversión declarada vs exposición medida",
        confidence: "evidencia",
        moat: "medio",
      },
    ],
  },
  {
    id: "agencia",
    label: "Agencia",
    product: "A — mismo PDF, uso multi-cliente",
    buyerQuestion: "¿Puedo demostrar valor al cliente y planificar mejor que el canal?",
    valueToday:
      "Prueba independiente del comercial del stream en 5 minutos. Mismo entregable que ve la marca, con ángulo de cumplimiento.",
    value90Days:
      "Benchmark entre clientes del portfolio, inteligencia competitiva (dónde pauta el rival), planning con slots que históricamente rindieron.",
    callOpener:
      "Mismo reporte que vería tu cliente, pero vos lo usás para todos tus clientes en streaming — con data que el canal no te manda.",
    today: [
      {
        question: "¿Cumplió el canal lo pactado?",
        answer: "Formato + cita + minuto + concurrentes",
        confidence: "evidencia",
        moat: "alto",
      },
      {
        question: "¿Le muestro algo creíble al cliente?",
        answer: "One-pager: hero = concurrentes del minuto + mejor PNT",
        confidence: "evidencia",
        moat: "alto",
      },
      {
        question: "¿Seenka ya nos da esto?",
        answer: "Ellos: pauta cross-media. Nosotros: minuto exacto + orgánico + chat",
        confidence: "evidencia",
        moat: "alto",
      },
    ],
    in90Days: [
      {
        question: "¿Cliente A vs B en Luzu?",
        answer: "Comparación de exposición medida por PNT",
        confidence: "evidencia",
        moat: "medio",
      },
      {
        question: "¿Dónde pauta el competidor?",
        answer: "Inventario PNT del rival: canales, programas, formato",
        confidence: "patron",
        moat: "medio",
      },
      {
        question: "¿Qué slot recomendamos?",
        answer: "Mejor minuto/tramo según histórico del cliente en ese show",
        confidence: "patron",
        moat: "medio",
      },
      {
        question: "¿Hay tendencia antes de Google?",
        answer: "Señales en chat + lead time vs Google Trends (Tendencias)",
        confidence: "patron",
        moat: "alto",
      },
    ],
  },
  {
    id: "canal",
    label: "Canal",
    product: "B — certificado + media kit",
    buyerQuestion: "¿Cómo defiendo tarifa y renuevo anunciantes?",
    valueToday:
      "Certificado listo para mandar al comercial de la marca: minuto, cita, 238k mirando. Cierra renovaciones con prueba.",
    value90Days:
      "Media kit con data real (no screenshots), benchmark vs competencia, argumento para vender upgrade dedicada vs al pasar.",
    callOpener:
      "Certificado listo para Frávega: minuto, cita, cuánta gente miraba. Benchmark contra Bondi/Luzu para la reunión de tarifas.",
    today: [
      {
        question: "¿Entregamos la PNT?",
        answer: "Certificado: minuto, cita, concurrentes, link",
        confidence: "evidencia",
        moat: "alto",
      },
      {
        question: "¿Cuánta gente miraba?",
        answer: "Concurrentes del minuto exacto",
        confidence: "evidencia",
        moat: "alto",
      },
      {
        question: "¿La pauta espanta gente?",
        answer: "Retención post-PNT",
        confidence: "evidencia",
        moat: "alto",
      },
      {
        question: "¿Qué marcas ya pautaron?",
        answer: "Listado PNT verificadas (social proof)",
        confidence: "evidencia",
        moat: "medio",
      },
    ],
    in90Days: [
      {
        question: "¿Cuánto vale un minuto en nuestro vivo?",
        answer: "Audiencia concurrente × CPM ref. — defender tarifa con data",
        confidence: "evidencia",
        moat: "medio",
      },
      {
        question: "¿Somos más grandes que X?",
        answer: "Benchmark concurrentes vs Olga/Luzu/Bondi",
        confidence: "patron",
        moat: "medio",
      },
      {
        question: "¿Vender upgrade de formato?",
        answer: "Comparar retención y exposición: dedicada vs al pasar",
        confidence: "evidencia",
        moat: "alto",
      },
    ],
  },
];

export const COMPOUNDING = [
  {
    horizon: "Hoy — 1 programa",
    unlocks: "Demo, primer cheque, certificado, retención en esa PNT",
    irreversible: "Concurrentes minuto a minuto del vivo (no se backfillea del VOD)",
  },
  {
    horizon: "30 días — semanas",
    unlocks: "Comparar PNTs, orgánico acumulado, competencia básica, media kit vivo",
    irreversible: "Curvas de audiencia por programa y slot",
  },
  {
    horizon: "90 días — meses",
    unlocks: "Tendencias cross-canal, planning, share de categoría, lead time vs Google",
    irreversible: "Dataset longitudinal que nadie más tiene en streaming AR",
  },
];

export const PRICING = [
  { stage: "Fundador (validar «sí pago»)", ticket: "ARS 150–300K/mes (~USD 100–200)", note: "1 marca, reporte semanal" },
  { stage: "Starter", ticket: "~USD 150/mes", note: "1 marca, 2 canales" },
  { stage: "Pro", ticket: "~USD 500/mes", note: "Hasta 5 marcas, todos los canales" },
  { stage: "Agencia", ticket: "USD 1.500+/mes", note: "Multi-cliente, tendencias, white-label" },
];

export const VALUE_ANCHORS = [
  { anchor: "PNT top auditada", ref: "~USD 3.000/aparición", note: "Vara Seenka — no nuestro precio" },
  { anchor: "Hallazgo orgánico", ref: "Ej. USD 36K en 10 días", note: "Argumento de venta vs ticket fundador" },
  { anchor: "Podscan (comparable SaaS)", ref: "USD 100–2.500/mes", note: "Packaging internacional" },
];

export const PROMISE_RULES = [
  "USD en reportes = benchmark de exposición, nunca facturación ni ROI garantizado.",
  "Sin concurrentes de ese programa → no hay hero. No prometer.",
  "Sin chat en el canal (ej. Luzu YT) → no prometer reacción del chat.",
  "Con 2 días de data → no vender evolución trimestral.",
  "Canal: certificado sí; «¿le convino a la marca?» no — eso es producto A.",
];

export const PLATFORM_MAP = [
  { surface: "Perfil de marca", href: "/marcas", answers: "Apariciones, programas, canales, audiencia, evidencia" },
  { surface: "Perfil de canal", href: "/canales", answers: "Marcas activas, actividad comercial, benchmark" },
  { surface: "Novedades", href: "/novedades", answers: "Briefing: qué pasó y merece atención" },
  { surface: "Tendencias", href: "/tendencias", answers: "Patrones de mercado + señal Google Trends" },
  { surface: "Programa", href: "/programas", answers: "Entidad desde canal o marca — sin nav propio" },
  { surface: "PDF / certificado", href: "/marca", answers: "Entregable vendible one-pager" },
];

export function confidenceLabel(c: Confidence): { text: string; tone: "green" | "amber" | "blue" } {
  if (c === "evidencia") return { text: "Evidencia", tone: "green" };
  if (c === "conversacion") return { text: "Conversación", tone: "amber" };
  return { text: "Patrón", tone: "blue" };
}

export function moatLabel(m: IntelRow["moat"]): { text: string; tone: "green" | "amber" | "red" } {
  if (m === "alto") return { text: "Moat alto", tone: "green" };
  if (m === "medio") return { text: "Moat medio", tone: "amber" };
  return { text: "Commodity", tone: "red" };
}
