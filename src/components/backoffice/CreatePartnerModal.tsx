"use client";

import { useEffect, useMemo, useState } from "react";
import BrandPortfolioPicker from "@/components/backoffice/BrandPortfolioPicker";
import ChannelContractPicker from "@/components/backoffice/ChannelContractPicker";
import PlanPriceField from "@/components/backoffice/PlanPriceField";
import AccessValidityField from "@/components/backoffice/AccessValidityField";
import { buildPartnerWelcomeMail } from "@/lib/design-partners";
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
  expiresAt,
  months,
}: {
  url: string;
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
      <div className="font-medium text-green-900">Link para mandar al cliente</div>
      <p className="text-[12px] text-green-800 break-all font-mono">{url}</p>
      <p className="text-[11px] text-green-700">
        {validity} · solo para este cliente · vos entrás por /backoffice
      </p>
      <CopyButton text={url} label="Copiar link" />
    </div>
  );
}

function defaultFormState() {
  return {
    formId: "",
    formName: "",
    formIcp: "agencia" as PartnerIcp,
    formPlan: ICP_DEFAULT_PLAN.agencia,
    formBrandPairs: [emptyBrandPair()] as BrandPair[],
    formChannelId: "",
    formBenchmarkIds: [] as string[],
    formEmail: "",
    formPriceArs: String(PLAN_PRICE_GUIDES[ICP_DEFAULT_PLAN.agencia].arsSuggested),
    formAccessMonths: "1",
    formSelfSetup: false,
  };
}

export default function CreatePartnerModal({
  open,
  onClose,
  storeReady,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  storeReady: boolean;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);

  const {
    formId,
    formName,
    formIcp,
    formPlan,
    formBrandPairs,
    formChannelId,
    formBenchmarkIds,
    formEmail,
    formPriceArs,
    formAccessMonths,
    formSelfSetup,
  } = form;

  const planOptions = useMemo(() => plansForIcp(formIcp), [formIcp]);
  const maxBrands = PLAN_MAX_BRANDS[formPlan];

  const parsedAccessMonths = useMemo(() => {
    const n = parseInt(formAccessMonths, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [formAccessMonths]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  useEffect(() => {
    if (!planOptions.includes(formPlan)) {
      setForm((f) => ({ ...f, formPlan: ICP_DEFAULT_PLAN[formIcp] }));
    }
  }, [formIcp, formPlan, planOptions]);

  useEffect(() => {
    setForm((f) => {
      if (f.formBrandPairs.length <= maxBrands) return f;
      return { ...f, formBrandPairs: f.formBrandPairs.slice(0, maxBrands) };
    });
  }, [maxBrands]);

  function resetAndClose() {
    setForm(defaultFormState());
    setSaveMsg("");
    setAccessUrl("");
    setAccessExpiresAt(null);
    onClose();
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
      if (!brand_slugs.length && !formSelfSetup) {
        setSaveMsg("Agregá al menos una marca del contrato, o marcá «Setup lo hace el cliente».");
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
    const price_ars_month =
      formPriceArs.trim() !== "" && Number.isFinite(priceParsed) && priceParsed >= 0
        ? priceParsed
        : undefined;

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
          self_setup: formSelfSetup && !brand_slugs.length,
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
          : "Cliente activado. Copiá el link y mandá el mail.",
      );
      if (data.accessUrl) {
        setAccessUrl(data.accessUrl);
        setAccessExpiresAt(data.accessExpiresAt ?? null);
      }
      await onSaved();
    } catch {
      setSaveMsg("Error de red");
    } finally {
      setSaving(false);
    }
  }

  const mailTemplate = useMemo(() => {
    if (!formName || !accessUrl) return "";
    return buildPartnerWelcomeMail({
      name: formName,
      link: accessUrl,
      icp: formIcp,
      accessMonths: parsedAccessMonths || 1,
    });
  }, [formName, formIcp, accessUrl, parsedAccessMonths]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={() => !saving && resetAndClose()}
    >
      <div
        className="card w-full max-w-[640px] max-h-[90vh] overflow-auto p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[17px] font-semibold">Nuevo cliente</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Borrador en la call; activá acceso el día que paguen.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost shrink-0"
            disabled={saving}
            onClick={resetAndClose}
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-[12px] text-gray-600">
              ID cliente
              <input
                value={formId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    formId: e.target.value.replace(/\s+/g, "-").toLowerCase(),
                  }))
                }
                className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px]"
                placeholder="agencia-acme"
                required
              />
            </label>
            <label className="text-[12px] text-gray-600">
              Nombre
              <input
                value={formName}
                onChange={(e) => setForm((f) => ({ ...f, formName: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px]"
                required
              />
            </label>
            <label className="text-[12px] text-gray-600">
              ICP
              <select
                value={formIcp}
                onChange={(e) =>
                  setForm((f) => ({ ...f, formIcp: e.target.value as PartnerIcp }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, formPlan: e.target.value as PartnerPlan }))
                }
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

            <div className="sm:col-span-2">
              <label className="flex items-start gap-2 text-[13px] text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSelfSetup}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, formSelfSetup: e.target.checked }))
                  }
                  className="mt-1"
                />
                <span>
                  <strong>Setup lo hace el cliente</strong> — sin marcas al alta. Entra al link y
                  elige sus marcas en /agencia/configurar.
                </span>
              </label>
            </div>

            {formIcp === "canal" ? (
              <ChannelContractPicker
                channelId={formChannelId}
                benchmarkIds={formBenchmarkIds}
                onChannelId={(id) => setForm((f) => ({ ...f, formChannelId: id }))}
                onBenchmarkIds={(ids) => setForm((f) => ({ ...f, formBenchmarkIds: ids }))}
              />
            ) : (
              <BrandPortfolioPicker
                value={formBrandPairs}
                onChange={(pairs) => setForm((f) => ({ ...f, formBrandPairs: pairs }))}
                maxPairs={maxBrands}
              />
            )}

            <label className="text-[12px] text-gray-600 sm:col-span-2">
              Email contacto
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setForm((f) => ({ ...f, formEmail: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px]"
                placeholder="para tu referencia — el link lo mandás vos"
              />
            </label>
            <PlanPriceField
              plan={formPlan}
              value={formPriceArs}
              onChange={(v) => setForm((f) => ({ ...f, formPriceArs: v }))}
              clientId={formId.trim() || undefined}
              clientName={formName.trim() || undefined}
            />
            <div className="sm:col-span-2">
              <AccessValidityField
                value={formAccessMonths}
                onChange={(v) => setForm((f) => ({ ...f, formAccessMonths: v }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              disabled={saving || !storeReady}
              onClick={(e) => savePartner(e, { asDraft: true })}
              className="btn border border-[#ececec] disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              type="button"
              disabled={saving || !storeReady}
              onClick={(e) => savePartner(e, { asDraft: false })}
              className="btn btn-primary disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar y activar (ya pagó)"}
            </button>
          </div>

          {!storeReady && (
            <p className="text-[12px] text-amber-700">
              Falta Supabase — no podés dar de alta desde acá todavía.
            </p>
          )}
          {saveMsg && <p className="text-[13px] text-gray-700">{saveMsg}</p>}
          {accessUrl && (
            <InviteLinkBox
              url={accessUrl}
              expiresAt={accessExpiresAt}
              months={parsedAccessMonths}
            />
          )}
          {mailTemplate && (
            <div className="pt-2 border-t border-[#ececec]">
              <div className="flex justify-between mb-2">
                <span className="text-[12px] font-medium text-gray-600">Plantilla mail</span>
                <CopyButton text={mailTemplate} />
              </div>
              <pre className="text-[12px] text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-40 overflow-auto">
                {mailTemplate}
              </pre>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
