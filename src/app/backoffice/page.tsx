"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui";
import OpsLogout from "@/components/OpsLogout";
import RunsPanel from "@/components/backoffice/RunsPanel";
import RunbookPanel from "@/components/backoffice/RunbookPanel";
import CasosPanel from "@/components/backoffice/CasosPanel";
import InteligenciaPanel from "@/components/backoffice/InteligenciaPanel";
import DesignPartnersPanel from "@/components/backoffice/DesignPartnersPanel";
import ResumenPanel from "@/components/backoffice/ResumenPanel";

const TABS = [
  { id: "resumen", label: "Resumen", sub: "Salud del pipeline y métricas operativas del corpus." },
  { id: "clientes", label: "Clientes", sub: "Design partners: alta, marcas, competidores, brief semanal y cuándo dar acceso." },
  { id: "runs", label: "Runs", sub: "Canales, estado en vivo y disparar el pipeline." },
  { id: "runbook", label: "Runbook", sub: "Comandos para captura, pipeline y Supabase." },
  { id: "inteligencia", label: "Inteligencia", sub: "Qué vendemos hoy vs en 90 días — guía para calls." },
  { id: "casos", label: "Casos de uso", sub: "Preguntas y respuestas por marca, agencia y canal." },
] as const;

type TabId = (typeof TABS)[number]["id"];

function BackofficeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const tabParam = params.get("tab");
  const initial: TabId =
    tabParam === "clientes" ||
    tabParam === "runs" ||
    tabParam === "runbook" ||
    tabParam === "casos" ||
    tabParam === "inteligencia"
      ? tabParam
      : "resumen";
  const [tab, setTab] = useState<TabId>(initial);

  useEffect(() => {
    if (
      tabParam === "resumen" ||
      tabParam === "clientes" ||
      tabParam === "runs" ||
      tabParam === "runbook" ||
      tabParam === "casos" ||
      tabParam === "inteligencia"
    ) {
      setTab(tabParam);
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
          sub="Operación interna: resumen, runs, runbook, inteligencia comercial y casos de uso."
        />
        <OpsLogout />
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
      {tab === "clientes" && <DesignPartnersPanel />}
      {tab === "runs" && <RunsPanel />}
      {tab === "runbook" && <RunbookPanel />}
      {tab === "inteligencia" && <InteligenciaPanel />}
      {tab === "casos" && <CasosPanel />}
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
