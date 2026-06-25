/** Casos de uso, Q&A y mapa comercial — fuente para /casos */

export type MoatLevel = "high" | "med" | "low" | "na";
export type MatrixLevel = "primary" | "yes" | "secondary" | "no";

export type UseCase = { id: string; title: string; purpose: string };
export type QA = {
  question: string;
  answer: string;
  product?: string;
  data?: string;
  moat?: MoatLevel;
};

export type Profile = {
  id: "marca" | "agencia" | "canal";
  label: string;
  product: string;
  subtitle: string;
  useCases: UseCase[];
  qa: QA[];
  notFocus?: string[];
  callLines: string[];
  compare?: { label: string; marca: string; agencia: string }[];
};

export const POSITIONING =
  "No reemplazamos el plan de medios. La marca ya sabe en qué programa compró. Auditamos cómo rindió cada aparición dentro de ese programa — minuto, formato, gente mirando, prueba.";

export const LEGEND = {
  products: [
    { sym: "A", text: "Producto marca — /marca + PDF one-pager" },
    { sym: "B", text: "Producto canal — /mediakit + /certificado" },
    { sym: "1.5", text: "Capa eficiencia — inversión declarada vs exposición (solo marca/agencia)" },
    { sym: "2", text: "Capa Radar — tendencias / chat (futuro)" },
  ],
  data: [
    { sym: "1 prog", text: "Un programa con PNT + concurrentes del minuto" },
    { sym: "Semanas", text: "Varios programas del mismo canal o marca" },
    { sym: "Meses", text: "Histórico longitudinal cross-canal" },
    { sym: "Chat", text: "Solo donde hay chat en vivo (Olga sí; Luzu YT no)" },
  ],
  moat: [
    { level: "high" as const, label: "Alto", text: "Concurrentes minuto exacto, curva irreversible, transcript" },
    { level: "med" as const, label: "Medio", text: "Cross-canal, series temporales, competencia" },
    { level: "low" as const, label: "Commodity", text: "¿Salió la pauta? — Seenka y otros" },
  ],
};

export const PROFILES: Profile[] = [
  {
    id: "marca",
    label: "Marca DTC",
    product: "Producto A",
    subtitle: "Anunciante directo. Ej.: Wanderlust, Día, Rexona.",
    useCases: [
      { id: "M1", title: "Auditar entrega de PNT", purpose: "Probar a gerencia que la pauta se cumplió con evidencia" },
      { id: "M2", title: "Comparar mis apariciones", purpose: "Ver cuál PNT rindió mejor (mismo u otro programa)" },
      { id: "M3", title: "Renegociar próxima compra", purpose: "Pedir mejor slot/formato con data del pasado" },
      { id: "M4", title: "Medir orgánico", purpose: "Cuánto nos mencionan sin pagar" },
      { id: "M5", title: "Eficiencia de inversión", purpose: "¿Lo pagado se parece a la exposición medida? (Capa 1.5)" },
      { id: "M6", title: "Contexto y tono", purpose: "¿El conductor habló bien/mal? Cita textual" },
      { id: "M7", title: "Benchmark interno", purpose: "Evolución de la marca en streaming en el trimestre" },
    ],
    qa: [
      { question: "¿Salió mi pauta al aire?", answer: "PNT verificada con cita en transcript + link YouTube al segundo", product: "A", data: "1 prog", moat: "low" },
      { question: "¿Cuánta gente me vio en el minuto exacto?", answer: "X concurrentes en vivo en ese segundo (no promedio del programa)", product: "A", data: "1 prog", moat: "high" },
      { question: "¿Fue lectura dedicada o al pasar?", answer: "Formato: al pasar / lectura dedicada / con código — con cita", product: "A", data: "1 prog", moat: "high" },
      { question: "¿En qué programa y fecha fue?", answer: "Título, canal, fecha, minuto HH:MM:SS", product: "A", data: "1 prog", moat: "med" },
      { question: "¿Qué dijeron textualmente?", answer: "Cita del conductor contrastada con transcripción", product: "A", data: "1 prog", moat: "high" },
      { question: "¿Mi PNT fue en un valle o en el pico del programa?", answer: "Concurrentes en mi minuto vs pico del programa", product: "A", data: "1 prog", moat: "high" },
      { question: "¿Cuánto valió esa exposición?", answer: "Rango estimado (CPM ref. USD 25–35) — benchmark, no factura", product: "A", data: "1 prog", moat: "med" },
      { question: "¿Pagamos USD X — nos convino?", answer: "Ratio exposición medida / inversión declarada (Capa 1.5)", product: "A+1.5", data: "1 prog+", moat: "med" },
      { question: "¿Cuántas veces nos mencionaron sin pagar?", answer: "Menciones orgánicas en audio con cita y minuto", product: "A", data: "Semanas", moat: "high" },
      { question: "¿Cómo midió cada PNT que pagué en el tiempo?", answer: "Tabla: fecha, programa, minuto, concurrentes, formato, exposición", product: "A", data: "Semanas", moat: "med" },
      { question: "¿En qué tramo del vivo nos rindió mejor?", answer: "Comparación de tramos sobre nuestras PNT (ej. post-1h vs inicio)", product: "A", data: "Semanas", moat: "med" },
      { question: "¿Nos conviene seguir en este canal?", answer: "Evolución de exposición medida y formato en ese canal", product: "A", data: "Meses", moat: "med" },
      { question: "¿El conductor habló bien de nosotros?", answer: "Sentimiento + cita", product: "A", data: "1 prog", moat: "med" },
      { question: "¿Hubo código/promo y se leyó?", answer: "Detección en cita; atribución de cupón es del cliente", product: "A", data: "1 prog", moat: "med" },
      { question: "¿La gente se quedó mirando después de nuestra PNT?", answer: "Retención: concurrentes al inicio vs ~90s después", product: "A", data: "1 prog", moat: "high" },
      { question: "¿Se prendió el chat cuando salimos?", answer: "Ritmo del chat vs base del programa", product: "A", data: "1 prog + Chat", moat: "high" },
      { question: "¿Qué programas son más caros?", answer: "Orientación de mercado — no es nuestro core; ya lo sabe su agencia", product: "—", data: "—", moat: "low" },
    ],
    notFocus: [
      "¿Cuántas PNT compramos este trimestre? → Lo manejan en su plan de medios.",
      "¿Olga es más caro que Blender? → Tarifa de rate card; nosotros auditamos la entrega.",
    ],
    callLines: [
      "Ya sabés en qué programa compraste. Te mostramos cómo rindió cada aparición.",
      "No te damos facturación: te damos cuánta gente miraba cuando dijeron tu marca.",
      "Si nos pasás lo que pagaste, te decimos si la exposición medida se acerca o no.",
    ],
  },
  {
    id: "agencia",
    label: "Agencia",
    product: "Producto A (mismo PDF)",
    subtitle: "Presenta al cliente o usa para planning. No es un tercer producto.",
    useCases: [
      { id: "G1", title: "Prueba ante el cliente", purpose: "PDF con cita + minuto + concurrentes para la reunión" },
      { id: "G2", title: "Auditoría de cumplimiento", purpose: "Verificar formato pactado (dedicada vs al pasar)" },
      { id: "G3", title: "Benchmark entre clientes", purpose: "Comparar marcas del portfolio en el segmento" },
      { id: "G4", title: "Inteligencia competitiva", purpose: "Dónde y cómo pauta el competidor del cliente" },
      { id: "G5", title: "Justificar fee / renovación", purpose: "Data independiente del canal" },
      { id: "G6", title: "Planning próxima campaña", purpose: "Slots y formatos que rindieron mejor" },
      { id: "G7", title: "Detectar orgánico regalable", purpose: "Argumentar extensión o earned media" },
    ],
    qa: [
      { question: "¿Cumplió el canal lo pactado para [cliente]?", answer: "PNT + formato + cita + minuto + concurrentes", product: "A", data: "1 prog", moat: "high" },
      { question: "¿Le muestro algo creíble al cliente en 5 minutos?", answer: "One-pager PDF: hero = concurrentes del minuto + mejor PNT", product: "A", data: "1 prog", moat: "high" },
      { question: "¿[Cliente A] rindió peor que [Cliente B] en Luzu?", answer: "Comparación exposición medida por PNT", product: "A", data: "Semanas", moat: "med" },
      { question: "¿Dónde pauta el competidor de mi cliente?", answer: "Listado PNT: canales, programas, formato", product: "A", data: "Semanas", moat: "med" },
      { question: "¿Cuánto orgánico tiene mi cliente vs el competidor?", answer: "Menciones orgánicas verificadas en audio", product: "A", data: "Semanas", moat: "high" },
      { question: "¿El cliente pagó de más por un al pasar?", answer: "Exposición baja + Tier 1 vs inversión (1.5)", product: "A+1.5", data: "1 prog+", moat: "med" },
      { question: "¿Qué slot recomendamos para la próxima compra?", answer: "Mejor minuto/tramo según histórico del cliente en ese show", product: "A", data: "Semanas", moat: "med" },
      { question: "¿Vimos todas las apariciones en el período?", answer: "Inventario PNT del período contratado", product: "A", data: "Meses", moat: "med" },
      { question: "¿Hay tendencia antes de Google?", answer: "Temas/productos emergentes en chat (Capa 2)", product: "2", data: "Meses + Chat", moat: "high" },
      { question: "¿Seenka ya nos da esto?", answer: "Ellos: pauta cross-media. Nosotros: minuto exacto + orgánico + chat en streaming", product: "—", data: "—", moat: "na" },
    ],
    compare: [
      { label: "Motivación", marca: "Auditar su inversión", agencia: "Auditar entrega al cliente + competencia" },
      { label: "Dato extra típico", marca: "Inversión declarada (1.5)", agencia: "Comparación multi-marca" },
      { label: "Recurrencia", marca: "Por campaña", agencia: "Por cliente × N campañas" },
    ],
    callLines: [
      "Mismo reporte que vería Wanderlust, para todos tus clientes en streaming.",
      "Independiente del canal: transcript + concurrentes, no screenshot.",
      "Para la próxima negociación: queremos el slot que midió 240k, no 180k.",
    ],
  },
  {
    id: "canal",
    label: "Canal / comercial",
    product: "Producto B",
    subtitle: "Olga, Luzu, Bondi, Blender… Sin auditoría de precio del anunciante.",
    useCases: [
      { id: "C1", title: "Certificado de entrega", purpose: "Prueba de PNT cumplida para el anunciante" },
      { id: "C2", title: "Defender tarifa", purpose: "Un minuto en nuestro vivo = X exposición de mercado" },
      { id: "C3", title: "Media kit con data real", purpose: "Reemplazar screenshots de YouTube Studio" },
      { id: "C4", title: "Social proof", purpose: "Marcas que ya pautaron con PNT verificada" },
      { id: "C5", title: "Benchmark vs competencia", purpose: "Concurrentes y share vs Olga/Luzu/Bondi" },
      { id: "C6", title: "Retención post-PNT", purpose: "Demostrar que la pauta no espanta audiencia" },
      { id: "C7", title: "Vender upgrade de formato", purpose: "Empujar lectura dedicada vs al pasar" },
    ],
    qa: [
      { question: "¿Entregamos la PNT de [marca] en [programa]?", answer: "Certificado: minuto, cita, concurrentes, link YouTube", product: "B", data: "1 prog", moat: "high" },
      { question: "¿Cuánta gente miraba cuando leímos a [marca]?", answer: "Concurrentes del minuto exacto", product: "B", data: "1 prog", moat: "high" },
      { question: "¿Cuánto vale un minuto de pauta en nuestro vivo?", answer: "Audiencia concurrente prom. ÷ 1.000 × CPM ref.", product: "B", data: "Semanas", moat: "med" },
      { question: "¿Cuál fue el pico del programa?", answer: "Pico concurrentes + promedio", product: "B", data: "1 prog", moat: "high" },
      { question: "¿Somos más grandes que [competidor]?", answer: "Benchmark concurrentes / views en el segmento", product: "B", data: "Semanas", moat: "med" },
      { question: "¿Qué marcas ya pautaron con nosotros?", answer: "Listado PNT verificadas (social proof)", product: "B", data: "Semanas", moat: "med" },
      { question: "¿La pauta hace que se vaya gente?", answer: "Retención post-PNT (~90s después de la lectura)", product: "B", data: "1 prog", moat: "high" },
      { question: "¿Cuántas PNT verificadas tuvo este programa?", answer: "Certificado programa completo (tabla + citas)", product: "B", data: "1 prog", moat: "high" },
      { question: "¿Cuánto pagó la marca?", answer: "No lo sabemos ni lo pedimos — no es producto canal", product: "—", data: "—", moat: "na" },
      { question: "¿Le convino a la marca lo que pagó?", answer: "No — eso es producto A para marca/agencia", product: "—", data: "—", moat: "na" },
    ],
    callLines: [
      "Certificado listo para el comercial: minuto, cita, 238k mirando.",
      "Media kit que se actualiza solo — no screenshots.",
      "Benchmark contra Bondi/Luzu para la reunión de tarifas.",
    ],
  },
];

export const MATRIX: { topic: string; marca: MatrixLevel; agencia: MatrixLevel; canal: MatrixLevel }[] = [
  { topic: "Concurrentes minuto exacto", marca: "yes", agencia: "yes", canal: "yes" },
  { topic: "Cita / prueba textual", marca: "yes", agencia: "yes", canal: "yes" },
  { topic: "Formato (al pasar / dedicada / código)", marca: "yes", agencia: "yes", canal: "yes" },
  { topic: "Exposición estimada (rango USD)", marca: "yes", agencia: "yes", canal: "yes" },
  { topic: "Inversión declarada / ¿convino?", marca: "yes", agencia: "yes", canal: "no" },
  { topic: "Orgánico (sin pauta)", marca: "yes", agencia: "yes", canal: "secondary" },
  { topic: "Competencia", marca: "secondary", agencia: "primary", canal: "secondary" },
  { topic: "Certificado de entrega", marca: "secondary", agencia: "secondary", canal: "primary" },
  { topic: "Media kit / benchmark canal", marca: "no", agencia: "no", canal: "primary" },
  { topic: "Retención post-PNT", marca: "secondary", agencia: "secondary", canal: "primary" },
  { topic: "Reacción del chat", marca: "yes", agencia: "yes", canal: "yes" },
  { topic: "Radar / tendencias (Capa 2)", marca: "secondary", agencia: "yes", canal: "secondary" },
];

export const HORIZONS = [
  {
    title: "1 programa — demo / primer cheque",
    items: [
      "¿Cuántos miraban en mi minuto?",
      "¿Qué dijeron? ¿Qué formato fue?",
      "Certificado de entrega para el canal",
      "Retención en esa PNT",
      "Link verificable al VOD",
    ],
  },
  {
    title: "Semanas — recurrencia",
    items: [
      "Comparar mis PNT entre sí (cómo midió cada una)",
      "Competidor: dónde pautó y con qué formato",
      "Orgánico acumulado",
      "Media kit con social proof actualizado",
      "Benchmark entre canales del segmento",
    ],
  },
  {
    title: "Meses — moat fuerte",
    items: [
      "Evolución trimestral de exposición medida por marca",
      "¿En qué tramos del vivo rinden mejor las PNT del segmento?",
      "Share of voice de categoría en streaming talk",
      "Lead-time de tendencias vs Google (Capa 2)",
      "Estándar: así se mide streaming en AR",
    ],
  },
];

export const NOT_SELLING = [
  { q: "¿Salió el aviso en TV abierta / radio / digital?", why: "Cross-media — Seenka" },
  { q: "¿Cuánto gastó la industria en streaming?", why: "Reporte de industria — Seenka / cámaras" },
  { q: "¿Qué programas conviene comprar? (plan de medios)", why: "Lo decide la agencia; nosotros auditamos la entrega" },
  { q: "¿Cuánto facturó la marca por la PNT?", why: "No medimos ventas ni atribución de cupón" },
  { q: "CPM programático de pre-roll", why: "Otro mercado, otro benchmark" },
];

export const CHECKLIST = [
  "¿Es marca/agencia (A) o canal (B)? No mezclar «¿convino?» en certificado canal.",
  "¿Tenemos concurrentes de ese programa? Sin eso, no hay hero.",
  "¿Hay chat en ese canal? Si no (Luzu YT), no prometer reacción/earned del chat.",
  "¿Es histórico o un programa? No vender evolución trimestral con 2 días de data.",
  "¿Los USD están como rango benchmark? Nunca como lo que pagó o facturación.",
];

export const UI_MAP: { type: string; where: string; href?: string }[] = [
  { type: "Reporte de marca / PDF", where: "Descargar one-pager", href: "/marca" },
  { type: "¿Convino la inversión?", where: "Inversión declarada + PDF", href: "/marca" },
  { type: "Certificado una PNT", where: "Por marca y programa", href: "/certificado" },
  { type: "Certificado programa completo", where: "PDF con todas las PNT", href: "/certificado" },
  { type: "Media kit / tarifa / benchmark", where: "Por canal", href: "/mediakit" },
  { type: "Retención + reacción detallada", where: "pipeline/reaccion.py (interno)" },
  { type: "Novedades / briefing", where: "Eventos recientes", href: "/novedades" },
  { type: "Tendencias cross-canal", where: "Patrones de mercado", href: "/tendencias" },
  { type: "Perfil marca / canal", where: "Profundidad por entidad", href: "/marcas" },
];

export function moatLabel(m: MoatLevel): { text: string; tone: "green" | "amber" | "red" | "gray" } {
  if (m === "high") return { text: "Moat alto", tone: "green" };
  if (m === "med") return { text: "Moat medio", tone: "amber" };
  if (m === "low") return { text: "Commodity", tone: "red" };
  return { text: "—", tone: "gray" };
}

export function matrixSymbol(l: MatrixLevel): string {
  if (l === "primary") return "✓✓";
  if (l === "yes") return "✓";
  if (l === "secondary") return "△";
  return "—";
}
