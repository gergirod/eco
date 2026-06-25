/**
 * Genera el HTML de referencia del informe de campaña (misma salida que window.print).
 * Uso: cd webapp && npx --yes tsx scripts/export-campaign-reference.ts [slug]
 * Salida: docs/deliverables/campaign-intelligence/reference/{slug}-reference.html
 */

import fs from "fs";
import path from "path";
import reports from "../src/data/reports.json";
import channels from "../src/data/channels.json";
import { buildCampaignReportHTML } from "../src/lib/campaignReport";

const slug = process.argv[2] || "iol-jun-2026";
const key = `campaign-${slug}`;
const report = (reports as Record<string, unknown>)[key];

if (!report) {
  console.error(`No se encontró entrada "${key}" en reports.json`);
  process.exit(1);
}

const chName: Record<string, string> = {};
for (const ch of channels as { id: string; name: string }[]) {
  chName[ch.id] = ch.name;
}

const html = buildCampaignReportHTML(report, { chName });
const outDir = path.resolve(
  __dirname,
  "../../docs/deliverables/campaign-intelligence/reference"
);
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${slug}-reference.html`);
fs.writeFileSync(outPath, html, "utf8");
console.log(`Escrito: ${outPath}`);
