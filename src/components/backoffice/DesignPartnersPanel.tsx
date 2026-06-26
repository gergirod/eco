"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import BrandPortfolioPicker from "@/components/backoffice/BrandPortfolioPicker";
import ChannelContractPicker from "@/components/backoffice/ChannelContractPicker";
import PlanPriceField from "@/components/backoffice/PlanPriceField";
import AccessValidityField from "@/components/backoffice/AccessValidityField";
import {
  ACCESS_TIMELINE,
  WEEKLY_CHECKLIST,
  brandDisplayName,
  buildPartnerWelcomeMail,
  BRIEF_STEPS_MARCA,
} from "@/lib/design-partners";
import {
  emptyBrandPair,
  pairsToPartnerPayload,
  type BrandPair,
} from "@/lib/brand-catalog";
import { PLAN_PRICE_GUIDES } from "@/lib/plan-pricing";
import { formatAccessExpiry } from "@/lib/partner-invite";
import {
  ICP_DEFAULT_PLAN,
  ICP_LABELS,
  PARTNER_ICPS,
  PLAN_LABELS,
  PLAN_MAX_BRANDS,
  plansForIcp,
  type PartnerIcp,
  type PartnerPlan,
} from "@/lib/partners";

type PartnerApiRow = {
  id: string;
  name: string;
  icp?: PartnerIcp;
  plan?: PartnerPlan;
  brand_slugs: string[];
  competitor_slugs: string[];
  competitor_by_brand: Record<string, string>;
  channel_ids?: string[];
  benchmark_channel_ids?: string[];
  active: boolean;
  contact_email?: string;
  notes?: string;
  price_ars_month?: number;
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
  onRegenerateInvite,
  onExtendAccess,
  onSetActive,
  onActivateAccess,
}: {
  partner: PartnerApiRow;
  onRegenerateInvite: (
    id: string,
    reset: boolean,
    months: number
  ) => Promise<{ url: string | null; expiresAt: string | null }>;
  onExtendAccess: (id: string, months: number) => Promise<string | null>;
  onSetActive: (id: string, active: boolean) => Promise<boolean>;
  onActivateAccess: (
    id: string,
    months: number
  ) => Promise<{ url: string | null; expiresAt: string | null }>;
}) {
  const [inviteBusy, setInviteBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const icp = partner.icp || "agencia";
  const plan = partner.plan || ICP_DEFAULT_PLAN[icp];
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
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-accent-soft text-accent font-medium">
              {ICP_LABELS[icp]}
            </span>
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
              {PLAN_LABELS[plan]}
            </span>
            {partner.price_ars_month ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-50 text-gray-500">
                ARS {partner.price_ars_month.toLocaleString("es-AR")}/mes
              </span>
            ) : null}
          </div>
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
                : "Activo — sin link"
            : "Pendiente / baja"}
        </span>
      </div>

      {icp === "canal" ? (
        <div className="space-y-2 mb-5 text-[13px] bg-gray-50 rounded-lg px-3 py-2">
          <div>
            <span className="text-gray-500">Canal: </span>
            {partner.channel_ids?.map((ch) => (
              <Link
                key={ch}
                href={`/canales/${ch}`}
                className="font-medium text-accent hover:underline mr-2"
              >
                {ch}
              </Link>
            ))}
          </div>
          {partner.benchmark_channel_ids?.length ? (
            <div>
              <span className="text-gray-500">Benchmark: </span>
              {partner.benchmark_channel_ids.join(", ")}
            </div>
          ) : null}
        </div>
      ) : (
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
      )}

      <div className="border-t border-[#ececec] pt-4 mb-4 space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Acceso plataforma</div>
        {!partner.active ? (
          <p className="text-[12px] text-amber-800">
            Borrador o dado de baja — sin acceso. Activá cuando confirmes el pago.
          </p>
        ) : partner.pending_invite ? (
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
          {partner.active && (
            <>
              <button
                type="button"
                disabled={inviteBusy || statusBusy}
                onClick={async () => {
                  setStatusBusy(true);
                  await onExtendAccess(partner.id, 1);
                  setStatusBusy(false);
                }}
                className="text-[12px] px-3 py-1.5 rounded-lg border border-green-200 text-green-800 hover:bg-green-50 disabled:opacity-50"
              >
                {statusBusy ? "Renovando…" : "Renovar +1 mes (pagó)"}
              </button>
              <button
                type="button"
                disabled={inviteBusy || statusBusy}
                onClick={async () => {
                  setInviteBusy(true);
                  const result = await onRegenerateInvite(partner.id, false, 1);
                  if (result.url) {
                    setInviteUrl(result.url);
                    setInviteExpiresAt(result.expiresAt);
                  }
                  setInviteBusy(false);
                }}
                className="text-[12px] px-3 py-1.5 rounded-lg border border-[#ececec] hover:bg-gray-50 disabled:opacity-50"
              >
                {inviteBusy ? "Generando…" : "Generar link (1 mes)"}
              </button>
              {partner.pending_invite && (
                <button
                  type="button"
                  disabled={inviteBusy || statusBusy}
                  onClick={async () => {
                    if (!confirm("¿Revocar el link actual y generar uno nuevo?")) return;
                    setInviteBusy(true);
                    const result = await onRegenerateInvite(partner.id, true, 1);
                    if (result.url) {
                      setInviteUrl(result.url);
                      setInviteExpiresAt(result.expiresAt);
                    }
                    setInviteBusy(false);
                  }}
                  className="text-[12px] px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                >
                  Nuevo link
                </button>
              )}
              <button
                type="button"
                disabled={inviteBusy || statusBusy}
                onClick={async () => {
                  if (
                    !confirm(
                      `¿Dar de baja a ${partner.name}? Corta acceso al instante (no pagó).`
                    )
                  )
                    return;
                  setStatusBusy(true);
                  await onSetActive(partner.id, false);
                  setStatusBusy(false);
                }}
                className="text-[12px] px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Dar de baja
              </button>
            </>
          )}
          {!partner.active && (
            <button
              type="button"
              disabled={statusBusy || inviteBusy}
              onClick={async () => {
                setStatusBusy(true);
                const result = await onActivateAccess(partner.id, 1);
                if (result.url) {
                  setInviteUrl(result.url);
                  setInviteExpiresAt(result.expiresAt);
                }
                setStatusBusy(false);
              }}
              className="text-[12px] px-3 py-1.5 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-50"
            >
              {statusBusy ? "Activando…" : "Activar acceso (pagó)"}
            </button>
          )}
        </div>
        {inviteUrl && (
          <div className="mt-3 space-y-3">
            <InviteLinkBox
              url={inviteUrl}
              expiresAt={inviteExpiresAt}
              months={1}
              label="Link para mandar al cliente"
            />
            <div className="p-3 rounded-lg bg-gray-50 border border-[#ececec]">
              <div className="flex justify-between mb-2">
                <span className="text-[12px] font-medium text-gray-600">Mail de bienvenida</span>
                <CopyButton
                  text={buildPartnerWelcomeMail({
                    name: partner.name,
                    link: inviteUrl,
                    icp: icp,
                    accessMonths: 1,
                  })}
                />
              </div>
              <pre className="text-[11px] text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {buildPartnerWelcomeMail({
                  name: partner.name,
                  link: inviteUrl,
                  icp: icp,
                  accessMonths: 1,
                })}
              </pre>
            </div>
          </div>
        )}
      </div>

      {icp !== "canal" && partner.brand_slugs.length > 0 && (
        <div className="border-t border-[#ececec] pt-4">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
            Brief semanal (self-service)
          </div>
          <p className="text-[12px] text-gray-500 mb-2">
            El cliente lo genera solo — pasos:
          </p>
          <ol className="text-[12px] text-gray-600 list-decimal list-inside space-y-0.5 mb-3">
            {BRIEF_STEPS_MARCA.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <ul className="space-y-2">
            {partner.brand_slugs.map((slug) => (
              <li key={slug} className="text-[13px]">
                <Link
                  href={`/marcas/${slug}?tab=informes`}
                  className="text-accent hover:underline font-medium"
                >
                  {brandDisplayName(slug)} → Informes → PDF
                </Link>
                <span className="text-gray-400 text-[12px]"> (vista previa operador)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {partner.notes && (
        <p className="text-[12px] text-gray-500 mt-4 border-t border-[#ececec] pt-3">
          {partner.notes}
        </p>
      )}
    </div>
  );
}

export default function DesignPartnersPanel() {
  const [storeMode, setStoreMode] = useState<
    "supabase" | "json" | "setup_required" | "loading"
  >("loading");
  const [setupHint, setSetupHint] = useState("");
  const [partners, setPartners] = useState<PartnerApiRow[]>([]);
  const [loadError, setLoadError] = useState("");

  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formIcp, setFormIcp] = useState<PartnerIcp>("agencia");
  const [formPlan, setFormPlan] = useState<PartnerPlan>(ICP_DEFAULT_PLAN.agencia);
  const [formBrandPairs, setFormBrandPairs] = useState<BrandPair[]>([emptyBrandPair()]);
  const [formChannelId, setFormChannelId] = useState("");
  const [formBenchmarkIds, setFormBenchmarkIds] = useState<string[]>([]);
  const [formEmail, setFormEmail] = useState("");
  const [formPriceArs, setFormPriceArs] = useState(
    String(PLAN_PRICE_GUIDES[ICP_DEFAULT_PLAN.agencia].arsSuggested)
  );
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);
  const [formAccessMonths, setFormAccessMonths] = useState("1");

  const planOptions = useMemo(() => plansForIcp(formIcp), [formIcp]);
  const maxBrands = PLAN_MAX_BRANDS[formPlan];

  useEffect(() => {
    if (!planOptions.includes(formPlan)) {
      setFormPlan(ICP_DEFAULT_PLAN[formIcp]);
    }
  }, [formIcp, formPlan, planOptions]);

  useEffect(() => {
    setFormBrandPairs((prev) => {
      if (prev.length <= maxBrands) return prev;
      return prev.slice(0, maxBrands);
    });
  }, [maxBrands]);

  const loadPartners = useCallback(async () => {
    setLoadError("");
    try {
      const res = await fetch("/api/operacion/partners", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "No se pudo cargar clientes");
        return;
      }
      setStoreMode(
        data.tableReady ? "supabase" : data.setupHint ? "setup_required" : "json"
      );
      setSetupHint(data.setupHint || "");
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

  async function extendAccess(id: string, months: number): Promise<string | null> {
    try {
      const res = await fetch("/api/operacion/partners", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, extend_months: months }),
      });
      const data = await res.json();
      if (!res.ok) return null;
      await loadPartners();
      return data.accessExpiresAt ?? null;
    } catch {
      return null;
    }
  }

  async function setPartnerActiveStatus(id: string, active: boolean): Promise<boolean> {
    try {
      const res = await fetch("/api/operacion/partners", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      if (!res.ok) return false;
      await loadPartners();
      return true;
    } catch {
      return false;
    }
  }

  const parsedAccessMonths = useMemo(() => {
    const n = parseInt(formAccessMonths, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [formAccessMonths]);

  async function activateAccess(
    id: string,
    months: number
  ): Promise<{ url: string | null; expiresAt: string | null }> {
    try {
      const res = await fetch("/api/operacion/partners", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, activate_and_invite: true, access_months: months }),
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

  async function savePartner(e: React.FormEvent, opts?: { asDraft?: boolean }) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    setAccessUrl("");
    setAccessExpiresAt(null);

    const isCanal = formIcp === "canal";
    let brand_slugs: string[] = [];
    let competitor_by_brand: Record<string, string> = {};

    if (!isCanal) {
      const missingBrand = formBrandPairs.some((p) => !p.brandSlug);
      if (missingBrand) {
        setSaveMsg("Elegí al menos una marca en cada fila.");
        setSaving(false);
        return;
      }
      const slugs = formBrandPairs.map((p) => p.brandSlug).filter(Boolean);
      if (new Set(slugs).size !== slugs.length) {
        setSaveMsg("No podés repetir la misma marca en dos filas.");
        setSaving(false);
        return;
      }
      const parsed = pairsToPartnerPayload(formBrandPairs);
      brand_slugs = parsed.brand_slugs;
      competitor_by_brand = parsed.competitor_by_brand;
      if (!brand_slugs.length) {
        setSaveMsg("Agregá al menos una marca del contrato.");
        setSaving(false);
        return;
      }
    }

    const channel_ids = formChannelId.trim() ? [formChannelId.trim()] : [];
    const benchmark_channel_ids = formBenchmarkIds;

    if (isCanal && !channel_ids.length) {
      setSaveMsg("Elegí el canal principal del contrato.");
      setSaving(false);
      return;
    }

    const priceParsed = parseInt(formPriceArs.replace(/\D/g, ""), 10);
    const price_ars_month = Number.isFinite(priceParsed) && priceParsed > 0 ? priceParsed : undefined;

    const asDraft = opts?.asDraft === true;

    try {
      const res = await fetch("/api/operacion/partners", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId.trim(),
          name: formName.trim(),
          icp: formIcp,
          plan: formPlan,
          brand_slugs,
          competitor_by_brand,
          channel_ids: isCanal ? channel_ids : undefined,
          benchmark_channel_ids: isCanal ? benchmark_channel_ids : undefined,
          contact_email: formEmail.trim() || undefined,
          access_months: parsedAccessMonths,
          price_ars_month,
          contract_started_at: new Date().toISOString().slice(0, 10),
          active: !asDraft,
          skip_invite: asDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg(data.error || "Error al guardar");
        return;
      }
      setSaveMsg(
        asDraft
          ? "Borrador guardado. Activá el acceso cuando confirmes el pago."
          : "Cliente activado. Copiá el mail abajo y mandá el link."
      );
      if (data.accessUrl) {
        setAccessUrl(data.accessUrl);
        setAccessExpiresAt(data.accessExpiresAt ?? null);
      } else {
        setAccessUrl("");
        setAccessExpiresAt(null);
      }
      await loadPartners();
    } catch {
      setSaveMsg("Error de red");
    } finally {
      setSaving(false);
    }
  }

  const mailTemplate = useMemo(() => {
    if (!formName && !accessUrl) return "";
    const name = formName || "[Cliente]";
    const link = accessUrl || "https://[tu-dominio]/acceso/entrar/[link-unico]";
    if (!accessUrl) return "";
    return buildPartnerWelcomeMail({
      name,
      link,
      icp: formIcp,
      accessMonths: parsedAccessMonths || 1,
    });
  }, [formName, formIcp, accessUrl, parsedAccessMonths]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div
        className={`card p-4 text-[13px] ${
          storeMode === "supabase"
            ? "bg-green-50 border-green-100 text-green-900"
            : storeMode === "setup_required"
              ? "bg-red-50 border-red-100 text-red-900"
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
        {storeMode === "setup_required" && (
          <>
            <strong>Falta crear la tabla en Supabase.</strong> Tenés credenciales en Vercel pero{" "}
            <code className="text-[11px] bg-white/60 px-1 rounded">eco_partners</code> no existe.
            <p className="mt-2 leading-relaxed">{setupHint}</p>
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
          Creá el borrador en la call; activá acceso el día que paguen. El mail lo mandás vos
          (copiás plantilla + link).
        </p>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-[12px] text-gray-600">
              ID cliente
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
            <label className="text-[12px] text-gray-600">
              ICP
              <select
                value={formIcp}
                onChange={(e) => setFormIcp(e.target.value as PartnerIcp)}
                className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px] bg-white"
              >
                {PARTNER_ICPS.map((icp) => (
                  <option key={icp} value={icp}>
                    {ICP_LABELS[icp]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[12px] text-gray-600">
              Plan
              <select
                value={formPlan}
                onChange={(e) => setFormPlan(e.target.value as PartnerPlan)}
                className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px] bg-white"
              >
                {planOptions.map((plan) => (
                  <option key={plan} value={plan}>
                    {PLAN_LABELS[plan]}
                  </option>
                ))}
              </select>
              {formIcp !== "canal" && (
                <span className="text-[11px] text-gray-400">
                  Máx. {maxBrands} marca{maxBrands === 1 ? "" : "s"}
                </span>
              )}
            </label>

            {formIcp === "canal" ? (
              <ChannelContractPicker
                channelId={formChannelId}
                benchmarkIds={formBenchmarkIds}
                onChannelId={setFormChannelId}
                onBenchmarkIds={setFormBenchmarkIds}
              />
            ) : (
              <BrandPortfolioPicker
                value={formBrandPairs}
                onChange={setFormBrandPairs}
                maxPairs={maxBrands}
              />
            )}

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
            <PlanPriceField
              plan={formPlan}
              value={formPriceArs}
              onChange={setFormPriceArs}
              clientId={formId.trim() || undefined}
              clientName={formName.trim() || undefined}
            />
            <div className="sm:col-span-2">
              <AccessValidityField value={formAccessMonths} onChange={setFormAccessMonths} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              disabled={saving || storeMode !== "supabase"}
              onClick={(e) => savePartner(e, { asDraft: true })}
              className="btn border border-[#ececec] disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              type="button"
              disabled={saving || storeMode !== "supabase"}
              onClick={(e) => savePartner(e, { asDraft: false })}
              className="btn btn-primary disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar y activar (ya pagó)"}
            </button>
          </div>
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
          Marcas y canales del corpus ECO · Specs: MARKET-002 · SPEC-010
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
          Clientes ({partners.filter((p) => p.active).length} activos ·{" "}
          {partners.filter((p) => !p.active).length} pendientes)
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
                onRegenerateInvite={regenerateInvite}
                onExtendAccess={extendAccess}
                onSetActive={setPartnerActiveStatus}
                onActivateAccess={activateAccess}
              />
            ))}
          </div>
        )}
      </div>

      <div className="card p-5 bg-gray-50 text-[12px] text-gray-600 space-y-2">
        <p>
          <strong>Setup Supabase (una vez):</strong> corré{" "}
          <code className="bg-white px-1 rounded">webapp/supabase_partners_full_setup.sql</code> en
          SQL Editor (un solo archivo — crea la tabla completa).
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
