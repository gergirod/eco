"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ACCESS_TIMELINE,
  WEEKLY_CHECKLIST,
  brandDisplayName,
  parseParesString,
} from "@/lib/design-partners";
import { formatAccessExpiry } from "@/lib/partner-invite";

type PartnerApiRow = {
  id: string;
  name: string;
  brand_slugs: string[];
  competitor_slugs: string[];
  competitor_by_brand: Record<string, string>;
  active: boolean;
  contact_email?: string;
  notes?: string;
  has_password: boolean;
  pending_invite?: boolean;
  invite_expires_at?: string;
};

function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="text-[11px] px-2 py-1 rounded border border-[#ececec] text-gray-500 hover:bg-gray-50"
    >
      {copied ? "Copiado" : label}
    </button>
  );
}

function InviteLinkBox({
  url,
  label,
  expiresAt,
  months,
}: {
  url: string;
  label?: string;
  expiresAt?: string | null;
  months?: number;
}) {
  const validity =
    months && months > 0
      ? `Válido ${months} mes${months === 1 ? "" : "es"} (hasta ${formatAccessExpiry(expiresAt)})`
      : expiresAt
        ? `Válido hasta ${formatAccessExpiry(expiresAt)}`
        : "Sin vencimiento";
  return (
    <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-[13px] space-y-2">
      <div className="font-medium text-green-900">{label || "Link de acceso del cliente"}</div>
      <p className="text-[12px] text-green-800 break-all font-mono">{url}</p>
      <p className="text-[11px] text-green-700">
        {validity} · solo para este cliente · vos entrás por /backoffice
      </p>
      <CopyButton text={url} label="Copiar link" />
    </div>
  );
}

function PartnerCard({
  partner,
  accessMonths,
  onRegenerateInvite,
}: {
  partner: PartnerApiRow;
  accessMonths: number;
  onRegenerateInvite: (
    id: string,
    reset: boolean,
    months: number
  ) => Promise<{ url: string | null; expiresAt: string | null }>;
}) {
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const pairs = partner.brand_slugs.map((brandSlug) => ({
    brandSlug,
    brandName: brandDisplayName(brandSlug),
    competitorSlug: partner.competitor_by_brand[brandSlug],
    competitorName: partner.competitor_by_brand[brandSlug]
      ? brandDisplayName(partner.competitor_by_brand[brandSlug])
      : undefined,
  }));

  return (
    <div className={`card p-5 ${partner.active ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[16px] font-semibold text-ink">{partner.name}</h3>
          <p className="text-[12px] text-gray-400 font-mono mt-0.5">id: {partner.id}</p>
          {partner.contact_email && (
            <p className="text-[12px] text-gray-500 mt-1">{partner.contact_email}</p>
          )}
        </div>
        <span
          className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded font-medium ${
            partner.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {partner.active
            ? partner.pending_invite
              ? "Link activo"
              : partner.has_password
                ? "Activo"
                : "Sin link"
            : "Inactivo"}
        </span>
      </div>

      <div className="space-y-3 mb-5">
        {pairs.map((pair) => (
          <div
            key={pair.brandSlug}
            className="flex flex-wrap items-center gap-2 text-[13px] bg-gray-50 rounded-lg px-3 py-2"
          >
            <Link href={`/marcas/${pair.brandSlug}`} className="font-medium text-accent hover:underline">
              {pair.brandName}
            </Link>
            {pair.competitorSlug ? (
              <>
                <span className="text-gray-300">vs</span>
                <Link
                  href={`/marcas/${pair.competitorSlug}`}
                  className="text-gray-600 hover:text-accent hover:underline"
                >
                  {pair.competitorName}
                </Link>
              </>
            ) : (
              <span className="text-gray-400 text-[12px]">sin competidor</span>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-[#ececec] pt-4 mb-4 space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Acceso plataforma</div>
        {partner.pending_invite ? (
          <p className="text-[12px] text-green-700">
            Link activo
            {partner.invite_expires_at
              ? ` — vence ${formatAccessExpiry(partner.invite_expires_at)}`
              : " — sin vencimiento"}
          </p>
        ) : (
          <p className="text-[12px] text-gray-500">Sin link — generá uno</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            disabled={inviteBusy || !partner.active}
            onClick={async () => {
              setInviteBusy(true);
              const result = await onRegenerateInvite(partner.id, false, accessMonths);
              if (result.url) {
                setInviteUrl(result.url);
                setInviteExpiresAt(result.expiresAt);
              }
              setInviteBusy(false);
            }}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-[#ececec] hover:bg-gray-50 disabled:opacity-50"
          >
            {inviteBusy ? "Generando…" : "Generar / renovar link"}
          </button>
          {partner.pending_invite && (
            <button
              type="button"
              disabled={inviteBusy || !partner.active}
              onClick={async () => {
                if (!confirm("¿Revocar el link actual y generar uno nuevo?")) return;
                setInviteBusy(true);
                const result = await onRegenerateInvite(partner.id, true, accessMonths);
                if (result.url) {
                  setInviteUrl(result.url);
                  setInviteExpiresAt(result.expiresAt);
                }
                setInviteBusy(false);
              }}
              className="text-[12px] px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
            >
              Revocar y renovar
            </button>
          )}
        </div>
        {inviteUrl && (
          <div className="mt-3">
            <InviteLinkBox
              url={inviteUrl}
              expiresAt={inviteExpiresAt}
              months={accessMonths}
            />
          </div>
        )}
      </div>

      <div className="border-t border-[#ececec] pt-4">
        <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
          Generar brief (viernes o gancho gratis)
        </div>
        <ul className="space-y-2">
          {partner.brand_slugs.map((slug) => (
            <li key={slug} className="text-[13px]">
              <Link
                href={`/marcas/${slug}?tab=informes`}
                className="text-accent hover:underline font-medium"
              >
                {brandDisplayName(slug)} → Informes → PDF
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {partner.notes && (
        <p className="text-[12px] text-gray-500 mt-4 border-t border-[#ececec] pt-3">
          {partner.notes}
        </p>
      )}
    </div>
  );
}

export default function DesignPartnersPanel() {
  const [storeMode, setStoreMode] = useState<"supabase" | "json" | "loading">("loading");
  const [partners, setPartners] = useState<PartnerApiRow[]>([]);
  const [loadError, setLoadError] = useState("");

  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPares, setFormPares] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);
  const [formAccessMonths, setFormAccessMonths] = useState("12");

  const loadPartners = useCallback(async () => {
    setLoadError("");
    try {
      const res = await fetch("/api/operacion/partners", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "No se pudo cargar clientes");
        return;
      }
      setStoreMode(data.mode);
      setPartners(data.partners || []);
    } catch {
      setLoadError("Error de red al cargar clientes");
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  async function regenerateInvite(
    id: string,
    reset: boolean,
    months: number
  ): Promise<{ url: string | null; expiresAt: string | null }> {
    try {
      const res = await fetch("/api/operacion/partners/invite", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reset, access_months: months }),
      });
      const data = await res.json();
      if (!res.ok) return { url: null, expiresAt: null };
      await loadPartners();
      return {
        url: data.accessUrl || null,
        expiresAt: data.accessExpiresAt ?? null,
      };
    } catch {
      return { url: null, expiresAt: null };
    }
  }

  const parsedAccessMonths = useMemo(() => {
    const n = parseInt(formAccessMonths, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [formAccessMonths]);

  async function savePartner(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    setAccessUrl("");
    setAccessExpiresAt(null);

    const { brand_slugs, competitor_by_brand } = parseParesString(formPares);
    if (!brand_slugs.length) {
      setSaveMsg("Usá slugs en pares: iol-inversiones:geniol");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/operacion/partners", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId.trim(),
          name: formName.trim(),
          brand_slugs,
          competitor_by_brand,
          contact_email: formEmail.trim() || undefined,
          access_months: parsedAccessMonths,
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg(data.error || "Error al guardar");
        return;
      }
      setSaveMsg("Cliente guardado. Mandá el link de acceso al cliente.");
      if (data.accessUrl) {
        setAccessUrl(data.accessUrl);
        setAccessExpiresAt(data.accessExpiresAt ?? null);
      }
      await loadPartners();
    } catch {
      setSaveMsg("Error de red");
    } finally {
      setSaving(false);
    }
  }

  const mailTemplate = useMemo(() => {
    if (!formName && !accessUrl && !partners[0]) return "";
    const name = formName || partners[0]?.name || "[Agencia]";
    const link = accessUrl || "https://[tu-dominio]/acceso/entrar/[link-unico]";
    const validity =
      parsedAccessMonths > 0
        ? `El link vence en ${parsedAccessMonths} mes${parsedAccessMonths === 1 ? "" : "es"}.`
        : "El link no vence (hasta que lo revoques).";
    return `Hola,

Tu espacio en ECO Intelligence está listo.

Entrá acá (un click, sin contraseña):
${link}

Solo funciona para ${name} — ves únicamente tus marcas y competidores del contrato.
${validity}

El brief semanal sigue por mail. La plataforma es para profundizar con evidencia al minuto.

—
ECO Intelligence`;
  }, [formName, partners, accessUrl, parsedAccessMonths]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div
        className={`card p-4 text-[13px] ${
          storeMode === "supabase"
            ? "bg-green-50 border-green-100 text-green-900"
            : storeMode === "json"
              ? "bg-amber-50 border-amber-100 text-amber-900"
              : "bg-gray-50"
        }`}
      >
        {storeMode === "loading" && "Cargando configuración…"}
        {storeMode === "supabase" && (
          <>
            <strong>Supabase activo.</strong> Los clientes se guardan desde este formulario — sin
            deploy ni editar JSON.
          </>
        )}
        {storeMode === "json" && (
          <>
            <strong>Modo fallback (JSON).</strong> Agregá{" "}
            <code className="text-[11px] bg-white/60 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> en
            Vercel para alta desde acá.
          </>
        )}
      </div>

      <div className="card p-5 border-accent/20 bg-accent-soft/30">
        <h2 className="text-[15px] font-semibold mb-2">¿Cuándo les doy la plataforma?</h2>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
          Brief gratis = solo PDF. <strong>Plataforma = día que pagan.</strong>
        </p>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-gray-400 border-b border-[#ececec]">
              <th className="py-2 text-left">Fase</th>
              <th className="py-2 text-left w-28">¿Plataforma?</th>
              <th className="py-2 text-left">Qué hacés</th>
            </tr>
          </thead>
          <tbody>
            {ACCESS_TIMELINE.map((row) => (
              <tr key={row.fase} className="border-b border-[#f5f5f5]">
                <td className="py-2.5 font-medium">{row.fase}</td>
                <td className="py-2.5">{row.plataforma}</td>
                <td className="py-2.5 text-gray-600">{row.entregable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h2 className="text-[15px] font-semibold mb-1">Alta de cliente</h2>
        <p className="text-[13px] text-gray-500 mb-4">
          Slugs de <code className="text-[11px] bg-gray-100 px-1 rounded">brands.json</code> — 1
          competidor por marca. Se genera un <strong>link único de acceso</strong> — el cliente entra
          con un click; vos usás /backoffice.
        </p>
        <form onSubmit={savePartner} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-[12px] text-gray-600">
              ID agencia
              <input
                value={formId}
                onChange={(e) => setFormId(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px]"
                placeholder="agencia-acme"
                required
              />
            </label>
            <label className="text-[12px] text-gray-600">
              Nombre
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px]"
                required
              />
            </label>
            <label className="text-[12px] text-gray-600 sm:col-span-2">
              Pares <span className="text-gray-400">slug-marca:slug-competidor</span>
              <input
                value={formPares}
                onChange={(e) => setFormPares(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px] font-mono"
                placeholder="iol-inversiones:geniol,wanderlust:rexona"
                required
              />
            </label>
            <label className="text-[12px] text-gray-600 sm:col-span-2">
              Email contacto
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px]"
                placeholder="para tu referencia — el link lo mandás vos"
              />
            </label>
            <label className="text-[12px] text-gray-600">
              Validez del link (meses)
              <input
                type="number"
                min={0}
                max={120}
                value={formAccessMonths}
                onChange={(e) => setFormAccessMonths(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px]"
                placeholder="12"
              />
              <span className="text-[11px] text-gray-400">0 = sin vencimiento</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={saving || storeMode !== "supabase"}
            className="btn btn-primary disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cliente en Supabase"}
          </button>
          {saveMsg && <p className="text-[13px] text-gray-700">{saveMsg}</p>}
          {accessUrl && (
            <InviteLinkBox
              url={accessUrl}
              label="Link para mandar al cliente"
              expiresAt={accessExpiresAt}
              months={parsedAccessMonths}
            />
          )}
        </form>
        <p className="text-[11px] text-gray-400 mt-3">
          Buscar slugs:{" "}
          <code className="bg-gray-100 px-1 rounded">
            python onboard_partner.py --search &quot;marca&quot;
          </code>
        </p>
      </div>

      <div className="card p-5">
        <h2 className="text-[15px] font-semibold mb-3">Checklist viernes</h2>
        <ul className="space-y-2">
          {WEEKLY_CHECKLIST.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] text-gray-700">
              <span className="text-gray-300">□</span>
              {item}
            </li>
          ))}
        </ul>
        {mailTemplate && (
          <div className="mt-4 pt-4 border-t border-[#ececec]">
            <div className="flex justify-between mb-2">
              <span className="text-[12px] font-medium text-gray-600">Plantilla mail</span>
              <CopyButton text={mailTemplate} />
            </div>
            <pre className="text-[12px] text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
              {mailTemplate}
            </pre>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-[15px] font-semibold mb-3">
          Clientes ({partners.filter((p) => p.active).length} activos)
        </h2>
        {loadError && <p className="text-[13px] text-red-600 mb-3">{loadError}</p>}
        {partners.length === 0 ? (
          <p className="text-[13px] text-gray-500 card p-5">Sin clientes todavía.</p>
        ) : (
          <div className="space-y-4">
            {partners.map((p) => (
              <PartnerCard
                key={p.id}
                partner={p}
                accessMonths={parsedAccessMonths}
                onRegenerateInvite={regenerateInvite}
              />
            ))}
          </div>
        )}
      </div>

      <div className="card p-5 bg-gray-50 text-[12px] text-gray-600 space-y-2">
        <p>
          <strong>Setup Supabase (una vez):</strong> corré{" "}
          <code className="bg-white px-1 rounded">webapp/supabase_partners_schema.sql</code> y{" "}
          <code className="bg-white px-1 rounded">supabase_partners_invite_migration.sql</code> en SQL
          Editor.
        </p>
        <p>
          <strong>Vercel:</strong>{" "}
          <code className="bg-white px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> +{" "}
          <code className="bg-white px-1 rounded">ECO_ACCESS_MODE=partners</code>
        </p>
      </div>
    </div>
  );
}
