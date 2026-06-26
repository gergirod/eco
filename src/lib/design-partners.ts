import partnersFile from "@/data/partners.json";
import brandsFile from "@/data/brands.json";
import type { PartnerRecord, PartnersFile, PartnerIcp } from "@/lib/partners";
import { partnerCompetitorSlugs } from "@/lib/partners";

export type PartnerStage =
  | "prospecto"
  | "brief_enviado"
  | "design_partner_activo"
  | "pausado";

export type PartnerOpsView = PartnerRecord & {
  competitorSlugs: string[];
  pairs: { brandSlug: string; brandName: string; competitorSlug?: string; competitorName?: string }[];
};

const BRAND_NAMES: Record<string, string> = Object.fromEntries(
  (brandsFile as { slug: string; name: string }[]).map((b) => [b.slug, b.name])
);

export function brandDisplayName(slug: string): string {
  return BRAND_NAMES[slug] || slug.replace(/-/g, " ");
}

export function loadPartnerOps(): PartnerOpsView[] {
  const file = partnersFile as PartnersFile;
  return file.partners
    .filter((p) => p.id !== "plantilla")
    .map((p) => {
      const pairs = p.brand_slugs.map((brandSlug) => {
        const competitorSlug = p.competitor_by_brand?.[brandSlug];
        return {
          brandSlug,
          brandName: brandDisplayName(brandSlug),
          competitorSlug,
          competitorName: competitorSlug ? brandDisplayName(competitorSlug) : undefined,
        };
      });
      return {
        ...p,
        competitorSlugs: partnerCompetitorSlugs(p),
        pairs,
      };
    });
}

export function parseParesString(pares: string): {
  brand_slugs: string[];
  competitor_by_brand: Record<string, string>;
} {
  const competitor_by_brand: Record<string, string> = {};
  const brand_slugs: string[] = [];

  for (const pair of pares.split(",")) {
    const trimmed = pair.trim();
    if (!trimmed || !trimmed.includes(":")) continue;
    const [left, right] = trimmed.split(":", 2);
    const brand = left.trim();
    const comp = right.trim();
    if (!brand || !comp) continue;
    if (!brand_slugs.includes(brand)) brand_slugs.push(brand);
    competitor_by_brand[brand] = comp;
  }

  return { brand_slugs, competitor_by_brand };
}

export function buildOnboardCommand(opts: {
  id: string;
  name: string;
  pares: string;
  email?: string;
}): string {
  const parts = [
    "cd pipeline && source .venv/bin/activate",
    `python onboard_partner.py \\\n  --id ${opts.id.trim()} \\\n  --name "${opts.name.trim()}" \\\n  --pares "${opts.pares.trim()}"`,
  ];
  if (opts.email?.trim()) {
    parts[1] += ` \\\n  --email ${opts.email.trim()}`;
  }
  parts.push("git add webapp/src/data/partners.json && git commit -m 'Alta design partner' && git push");
  parts.push('# Vercel: ECO_ACCESS_MODE=partners + ECO_PARTNER_PASSWORDS={"' + opts.id.trim() + '":"..."}');
  return parts.join("\n\n");
}

/** Cuándo dar acceso a la plataforma en el flujo design partner */
export const ACCESS_TIMELINE = [
  {
    fase: "1. Call / interés",
    plataforma: "No",
    entregable: "Nada todavía — anotá marcas y competidores (1 comp. por marca).",
  },
  {
    fase: "2. Gancho (post-call)",
    plataforma: "No",
    entregable: "Demo del brief — podés crear borrador en backoffice (sin acceso).",
  },
  {
    fase: "3. Cierran design partner (pagan)",
    plataforma: "Sí — mismo día",
    entregable: "Activar acceso → copiás mail + link y se lo mandás al cliente.",
  },
  {
    fase: "4. Cada viernes",
    plataforma: "Ya tienen acceso",
    entregable: "El cliente: Marca → Informes → Descargar resumen PDF. Vos no enviás nada.",
  },
] as const;

export const WEEKLY_CHECKLIST = [
  "Verificar pipeline al día (Resumen → último run)",
  "Confirmar marcas del partner con datos frescos en el corpus",
  "El brief lo genera el cliente desde su espacio — no enviar PDFs manualmente",
  "Opcional: ping si llevan >7 días sin entrar a la plataforma",
] as const;

/** Pasos que el cliente sigue en la plataforma (marca / agencia). */
export const BRIEF_STEPS_MARCA = [
  "Entrá con tu link de acceso",
  "Elegí una de tus marcas en el menú lateral (o desde Inicio)",
  'Abrí la pestaña "Informes"',
  'Clic en "Descargar resumen PDF" → Imprimir → Guardar como PDF',
] as const;

/** Pasos para ICP canal. */
export const BRIEF_STEPS_CANAL = [
  "Entrá con tu link de acceso",
  "Tu canal está en el menú lateral",
  "Certificado de emisión y benchmark desde el perfil del canal",
] as const;

export function briefStepsForIcp(icp: PartnerIcp): readonly string[] {
  return icp === "canal" ? BRIEF_STEPS_CANAL : BRIEF_STEPS_MARCA;
}

export function briefMailBlock(icp: PartnerIcp): string {
  const steps = briefStepsForIcp(icp);
  const intro =
    icp === "canal"
      ? "Desde la plataforma accedés a tu canal, certificados, novedades y tendencias del mercado cuando lo necesites."
      : "Desde la plataforma generás tu brief semanal en PDF cuando lo necesites: marcas, competidores y evidencia minuto a minuto.";
  const howTo = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return `${intro}\n\nCómo hacerlo:\n${howTo}`;
}

export function buildPartnerWelcomeMail(opts: {
  name: string;
  link: string;
  icp: PartnerIcp;
  accessMonths: number;
}): string {
  const validity =
    opts.accessMonths > 0
      ? `El acceso vence en ${opts.accessMonths} mes${opts.accessMonths === 1 ? "" : "es"} — renovalo desde el backoffice cuando paguen.`
      : "El link no vence (hasta que lo revoques manualmente).";
  const scopeLine =
    opts.icp === "canal"
      ? "Ves tu canal, benchmark del mercado, certificados, novedades y tendencias."
      : "Ves tus marcas y competidores del contrato, más el mercado de streaming (canales, programas, novedades y tendencias).";
  return `Hola,

Tu espacio en ECO Intelligence está listo.

Entrá acá (un click, sin contraseña):
${opts.link}

Solo funciona para ${opts.name} — ${scopeLine}
${validity}

${briefMailBlock(opts.icp)}

—
ECO Intelligence`;
}
