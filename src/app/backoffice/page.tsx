"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui";
import OpsLogout from "@/components/OpsLogout";
import CapturaPanel from "@/components/backoffice/CapturaPanel";
import RunbookPanel from "@/components/backoffice/RunbookPanel";
import ComercialPanel from "@/components/backoffice/ComercialPanel";
import DesignPartnersPanel from "@/components/backoffice/DesignPartnersPanel";
import ResumenPanel from "@/components/backoffice/ResumenPanel";

const TABS = [
  { id: "resumen", label: "Resumen", sub: "Salud del corpus y métricas del pipeline." },
  { id: "captura", label: "Captura", sub: "Grilla por canal, franjas activas y estado en vivo." },
  { id: "clientes", label: "Clientes", sub: "Design partners: alta, marcas, competidores, acceso y onboarding." },
  { id: "comercial", label: "Comercial", sub: "Pitch, casos de uso, Q&A y referencia por ICP." },
  { id: "runbook", label: "Runbook", sub: "Comandos para supervisor, pipeline y Supabase." },
] as const;

type TabId = (typeof TABS)[number]["id"];

function BackofficeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const tabParam = params.get("tab");
  const initial: TabId =
    tabParam === "captura" || tabParam === "runs"
      ? "captura"
      : tabParam === "inteligencia" || tabParam === "casos"
        ? "comercial"
        : tabParam === "clientes" || tabParam === "runbook" || tabParam === "comercial"
          ? tabParam
          : "resumen";
  const [tab, setTab] = useState<TabId>(initial);

  useEffect(() => {
    if (
      tabParam === "resumen" ||
      tabParam === "captura" ||
      tabParam === "runs" ||
      tabParam === "clientes" ||
      tabParam === "runbook" ||
      tabParam === "comercial" ||
      tabParam === "casos" ||
      tabParam === "inteligencia"
    ) {
      const mapped =
        tabParam === "runs"
          ? "captura"
          : tabParam === "casos" || tabParam === "inteligencia"
            ? "comercial"
            : tabParam;
      setTab(mapped as TabId);
    } else if (!tabParam) {
      setTab("resumen");
    }
  }, [tabParam]);

  function selectTab(id: TabId) {
    setTab(id);
    const url = id === "resumen" ? "/backoffice" : `/backoffice?tab=${id}`;
    router.replace(url, { scroll: false });
  }

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <PageHeader
          title="Backoffice"
          sub="Operación interna: resumen, captura, clientes, comercial y runbook."
        />
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/marcas"
            className="text-[12px] px-3 py-1.5 rounded-lg border border-[#ececec] text-gray-600 hover:bg-gray-50 hover:text-accent"
          >
            Plataforma completa →
          </Link>
          <OpsLogout />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#ececec] pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`px-4 py-2 rounded-lg text-[13px] border transition ${
              tab === t.id
                ? "bg-accent-soft border-accent text-accent font-medium"
                : "bg-white border-[#ececec] text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-gray-500 mb-5">{active.sub}</p>

      {params.get("err") === "client-link" && (
        <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-100 text-[13px] text-amber-900">
          Ese link es <strong>solo para el cliente</strong>. Vos operás desde acá — copiá el link y
          mandalo por mail; no lo abras vos.
        </div>
      )}

      {tab === "resumen" && <ResumenPanel />}
      {tab === "captura" && <CapturaPanel />}
      {tab === "clientes" && <DesignPartnersPanel />}
      {tab === "comercial" && <ComercialPanel />}
      {tab === "runbook" && <RunbookPanel />}
    </div>
  );
}

export default function BackofficePage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-gray-400">Cargando…</div>}>
      <BackofficeInner />
    </Suspense>
  );
}
