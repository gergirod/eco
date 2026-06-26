/** Demanda de audiencia en chat — SPEC-009 F2 */

export type AudienceDemandSignal = {
  tema: string;
  n: number;
  evidencia: string;
  minute?: string;
  tipo?: string;
};

export type AudienceDemandMeta = {
  has_chat?: boolean;
  audience_demand?: AudienceDemandSignal[];
};

const TIPO_LABEL: Record<string, string> = {
  pedido_link: "Pedido de link / código",
  pregunta_precio: "Consulta de precio",
  pregunta_compra: "Dónde comprar",
  pedido_contenido: "Pedido editorial",
  voto_eleccion: "Voto / elección",
  otro: "Demanda de audiencia",
};

export function demandTipoLabel(tipo?: string): string {
  return TIPO_LABEL[tipo || "otro"] || TIPO_LABEL.otro;
}

export function getAudienceDemand(moment: AudienceDemandMeta | null | undefined): AudienceDemandSignal[] {
  return moment?.audience_demand?.filter((d) => d.tema && d.evidencia) ?? [];
}

export function demandSummary(moment: AudienceDemandMeta | null | undefined): string | null {
  const items = getAudienceDemand(moment);
  if (!items.length) return null;
  if (items.length === 1) {
    return `La audiencia pidió sobre todo: ${items[0].tema.toLowerCase()}.`;
  }
  return `${items.length} temas con pedidos o reacciones claras en el chat de este programa.`;
}
