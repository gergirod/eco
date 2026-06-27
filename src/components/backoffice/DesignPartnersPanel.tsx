"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import CreatePartnerModal from "@/components/backoffice/CreatePartnerModal";
import {
  ACCESS_TIMELINE,
  WEEKLY_CHECKLIST,
  brandDisplayName,
  BRIEF_STEPS_MARCA,
} from "@/lib/design-partners";
import { formatAccessExpiry } from "@/lib/partner-invite";
import {
  ICP_DEFAULT_PLAN,
  ICP_LABELS,
  PLAN_LABELS,
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
  accessUrl?: string | null;
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
  const displayUrl = inviteUrl || partner.accessUrl || null;
  const displayExpires = inviteExpiresAt ?? partner.invite_expires_at ?? null;
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
            {partner.price_ars_month != null ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-50 text-gray-500">
                ARS {partner.price_ars_month.toLocaleString("es-AR")}/mes
                {partner.price_ars_month === 0 ? " · sin cargo" : ""}
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
        {partner.active && partner.pending_invite && !displayUrl && (
          <p className="text-[12px] text-amber-800 mt-2">
            Link activo pero no guardado en texto — tocá <strong>Nuevo link</strong> una vez
            para ver la URL copiable (invalida el link anterior).
          </p>
        )}
        {displayUrl && (
          <div className="mt-3 space-y-3">
            <InviteLinkBox
              url={displayUrl}
              expiresAt={displayExpires}
              months={1}
              label="Link para mandar al cliente"
            />
            {(inviteUrl || displayUrl) && (
              <div className="p-3 rounded-lg bg-gray-50 border border-[#ececec]">
                <div className="flex justify-between mb-2">
                  <span className="text-[12px] font-medium text-gray-600">Mail de bienvenida</span>
                  <CopyButton
                    text={buildPartnerWelcomeMail({
                      name: partner.name,
                      link: displayUrl,
                      icp: icp,
                      accessMonths: 1,
                    })}
                  />
                </div>
                <pre className="text-[11px] text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {buildPartnerWelcomeMail({
                    name: partner.name,
                    link: displayUrl,
                    icp: icp,
                    accessMonths: 1,
                  })}
                </pre>
              </div>
            )}
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
  const [createOpen, setCreateOpen] = useState(false);

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

  const activeCount = partners.filter((p) => p.active).length;
  const pendingCount = partners.filter((p) => !p.active).length;
  const storeReady = storeMode === "supabase";

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold">
            Clientes
            <span className="text-[14px] font-normal text-gray-500 ml-2">
              {activeCount} activos · {pendingCount} pendientes
            </span>
          </h2>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Brief gratis = PDF. Plataforma = día que pagan.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setCreateOpen(true)}
        >
          + Nuevo cliente
        </button>
      </div>

      <div
        className={`text-[12px] px-3 py-2 rounded-lg border ${
          storeMode === "supabase"
            ? "bg-green-50 border-green-100 text-green-900"
            : storeMode === "setup_required"
              ? "bg-red-50 border-red-100 text-red-900"
              : storeMode === "json"
                ? "bg-amber-50 border-amber-100 text-amber-900"
                : "bg-gray-50 border-[#ececec] text-gray-600"
        }`}
      >
        {storeMode === "loading" && "Cargando configuración…"}
        {storeMode === "supabase" && (
          <>
            <strong>Supabase OK.</strong> Alta desde el botón de arriba.
          </>
        )}
        {storeMode === "setup_required" && (
          <>
            <strong>Falta la tabla en Supabase.</strong>{" "}
            <code className="text-[11px] bg-white/60 px-1 rounded">eco_partners</code> no existe.{" "}
            {setupHint}
          </>
        )}
        {storeMode === "json" && (
          <>
            <strong>Modo JSON.</strong> Agregá{" "}
            <code className="text-[11px] bg-white/60 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> en
            Vercel.
          </>
        )}
      </div>

      {loadError && <p className="text-[13px] text-red-600">{loadError}</p>}
      {partners.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[14px] text-gray-600 mb-3">Todavía no hay clientes cargados.</p>
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            Crear el primero
          </button>
        </div>
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

      <details className="card p-4 text-[13px] text-gray-600">
        <summary className="font-medium text-gray-800 cursor-pointer select-none">
          Guía rápida y setup
        </summary>
        <div className="mt-4 space-y-4">
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
          <div>
            <h3 className="text-[13px] font-semibold text-gray-800 mb-2">Checklist viernes</h3>
            <ul className="space-y-1.5">
              {WEEKLY_CHECKLIST.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-gray-300">□</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-[12px] space-y-2 border-t border-[#ececec] pt-3">
            <p>
              <strong>Setup (una vez):</strong>{" "}
              <code className="bg-gray-50 px-1 rounded">webapp/supabase_partners_full_setup.sql</code>
            </p>
            <p>
              <strong>Links viejos:</strong>{" "}
              <code className="bg-gray-50 px-1 rounded">supabase_partners_invite_token_migration.sql</code>
            </p>
            <p>
              <strong>Vercel:</strong>{" "}
              <code className="bg-gray-50 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> +{" "}
              <code className="bg-gray-50 px-1 rounded">ECO_ACCESS_MODE=partners</code>
            </p>
          </div>
        </div>
      </details>

      <CreatePartnerModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        storeReady={storeReady}
        onSaved={loadPartners}
      />
    </div>
  );
}
