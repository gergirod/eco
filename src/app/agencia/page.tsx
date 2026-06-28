"use client";

import Link from "next/link";
import { useMemo } from "react";
import AgenciaAlertCard from "@/components/agencia/AgenciaAlertCard";
import AgenciaGuardStatus from "@/components/agencia/AgenciaGuardStatus";
import AgenciaPageHeader from "@/components/agencia/AgenciaPageHeader";
import AgenciaPlanTeaser from "@/components/agencia/AgenciaPlanTeaser";
import AgenciaQuestionBlock from "@/components/agencia/AgenciaQuestionBlock";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { buildGuardStatus } from "@/lib/agencia-guard";
import { buildBrandSlots } from "@/lib/agencia-donde";
import { buildAgenciaPlanTeaser } from "@/lib/agencia-plan";
import { useActiveBrand } from "@/lib/use-active-brand";
import { buildAgenciaAlerts } from "@/lib/agencia-product";
import { compact, vodLink } from "@/lib/format";
import { useCorpus } from "@/lib/useCorpus";

export default function AgenciaGuardPage() {
  const { activePair, activeSlug, loading, hasRival } = useActiveBrand();
  const { reports, meta, brands, brand_history } = useCorpus(["reports", "meta", "brands", "brand_history"] as const);

  const reportsMap = reports as Record<string, never>;

  const brandName = useMemo(() => {
    const row = (brands as { slug: string; name: string }[]).find((b) => b.slug === activeSlug);
    return row?.name ?? activeSlug ?? "tu cliente";
  }, [brands, activeSlug]);

  const guardStatus = useMemo(
    () =>
      buildGuardStatus(
        activePair ? [activePair] : [],
        activeSlug ? [activeSlug] : [],
        activePair?.competitorSlug ? [activePair.competitorSlug] : [],
        reportsMap,
        (meta as { exported_at?: string }).exported_at
      ),
    [activePair, activeSlug, reports, meta]
  );

  const clientAlerts = useMemo(() => {
    if (!activePair) return [];
    const all = buildAgenciaAlerts([activePair], reportsMap);
    return all.filter((a) => a.brandSlug === activePair.slug);
  }, [activePair, reports]);

  const topAlert = clientAlerts[0] ?? null;

  const rivalAlerts = useMemo(() => {
    if (!activePair?.competitorSlug) return [];
    const all = buildAgenciaAlerts([activePair], reportsMap);
    return all.filter((a) => a.brandSlug === activePair.competitorSlug);
  }, [activePair, reports]);

  const valleyWarnings = useMemo(() => {
    if (!activeSlug) return [];
    return buildBrandSlots(activeSlug, reportsMap[activeSlug] as never, "cliente").filter(
      (s) => s.isValley
    );
  }, [activeSlug, reports]);

  const planTeaser = useMemo(() => {
    if (!activeSlug) return null;
    return buildAgenciaPlanTeaser({
      brandSlug: activeSlug,
      brandName,
      periodActivations: clientAlerts.length,
      bestConc: topAlert?.concAt ?? null,
      valleyCount: valleyWarnings.length,
      brandHistory: brand_history as never,
    });
  }, [activeSlug, brandName, clientAlerts.length, topAlert, valleyWarnings.length, brand_history]);

  if (loading) {
    return <div className="text-[13px] text-gray-400 py-8">Cargando…</div>;
  }

  if (!activePair) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto">
        <p className="text-[14px] text-gray-600 mb-4">Todavía no elegiste ninguna marca.</p>
        <Link href={`${AGENCIA_BASE}/elegir`} className="btn btn-primary text-[13px]">
          Elegir marca →
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-2xl">
      <AgenciaPageHeader
        question="¿Rindió la placa?"
        when={`Cuando salió ${brandName} en stream — cuánta gente miraba y el link al video.`}
      />

      <p className="text-[13px] text-gray-600 mb-6 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
        Seenka confirma que salió. Acá ves cuánta gente miraba en ese segundo — listo para reenviar
        al cliente.
      </p>

      <AgenciaGuardStatus status={guardStatus} brandName={brandName} />

      {planTeaser && (
        <div className="mt-6">
          <AgenciaPlanTeaser brandName={brandName} line={planTeaser} />
        </div>
      )}

      {topAlert?.concAt ? (
        <div className="mt-6 rounded-xl border border-[#ececec] bg-white px-5 py-4">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">
            Mejor placa de la semana
          </p>
          <p className="text-[28px] font-bold tabular-nums text-ink leading-none">
            {compact(topAlert.concAt)}
            <span className="text-[13px] font-normal text-gray-500 ml-2">mirando</span>
          </p>
          <p className="text-[13px] text-gray-500 mt-1">
            {topAlert.channel}
            {topAlert.program ? ` · ${topAlert.program}` : ""}
          </p>
        </div>
      ) : null}

      <div className="mt-10 space-y-8">
        <AgenciaQuestionBlock question="¿Cuánta gente miraba cuando salió?">
          {clientAlerts.length === 0 ? (
            <div className="space-y-4">
              <p className="text-[14px] text-gray-500">
                Todavía no detectamos placas de {brandName} esta semana.
              </p>
              <Link href={`${AGENCIA_BASE}/donde`} className="text-[13px] text-accent hover:underline">
                Ver el mercado del rubro →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {clientAlerts.map((alert) => (
                <AgenciaAlertCard key={alert.id} alert={alert} role="cliente" />
              ))}
            </div>
          )}
        </AgenciaQuestionBlock>

        {hasRival && rivalAlerts.length > 0 && (
          <details className="group">
            <summary className="text-[14px] text-gray-500 cursor-pointer hover:text-ink list-none flex items-center gap-2">
              <span className="group-open:rotate-90 transition">▸</span>
              También salió el rival ({rivalAlerts.length})
            </summary>
            <div className="mt-4 space-y-4 pl-4">
              {rivalAlerts.map((alert) => (
                <AgenciaAlertCard key={alert.id} alert={alert} role="competidor" />
              ))}
            </div>
          </details>
        )}

        {valleyWarnings.length > 0 && (
          <AgenciaQuestionBlock question="¿Dónde no conviene volver a pautar?">
            <ul className="space-y-2">
              {valleyWarnings.slice(0, 3).map((s, i) => (
                <li
                  key={`${s.videoId}-${i}`}
                  className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-[14px] text-gray-800"
                >
                  <strong>{s.brandName}</strong> · {s.channelName}
                  {s.program ? ` · ${s.program}` : ""} · solo {compact(s.concAt)} mirando
                  {s.videoId && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={vodLink(s.videoId, s.tSeconds)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        ver ↗
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </AgenciaQuestionBlock>
        )}
      </div>

      <footer className="mt-14 pt-8 border-t border-gray-100">
        <p className="text-[13px] text-gray-500 mb-4">
          Placa confirmada → mirá dónde conviene la próxima.
        </p>
        <Link href={`${AGENCIA_BASE}/donde`} className="btn btn-primary text-[13px]">
          ¿Dónde pautar? →
        </Link>
      </footer>
    </div>
  );
}
