import partnersFile from "@/data/partners.json";
import brandsFile from "@/data/brands.json";
import type { PartnerRecord, PartnersFile } from "@/lib/partners";
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
    entregable: "Brief PDF gratis por mail — generás desde links abajo, sin login.",
  },
  {
    fase: "3. Cierran design partner (pagan)",
    plataforma: "Sí — mismo día",
    entregable: "Alta en backoffice + link único por mail (entra directo, scope automático).",
  },
  {
    fase: "4. Cada viernes",
    plataforma: "Ya tienen acceso",
    entregable: "PDF + 3 bullets de delta por mail. Plataforma para profundizar.",
  },
] as const;

export const WEEKLY_CHECKLIST = [
  "Correr export_ui.py (o verificar cron nocturno)",
  "Por cada marca del partner: abrir perfil → Informes → Descargar PDF",
  "Escribir 3 bullets: qué apareció nuevo / mejor PNT / orgánico o competidor",
  "Enviar mail con PDF adjunto + links a /marcas/{slug}",
  "Call de lectura quincenal el primer mes (opcional)",
] as const;
