"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import reportsFb from "@/data/reports.json";

function MarcaRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const brand = searchParams.get("brand");
    const reports = reportsFb as Record<string, { kind?: string; mentions?: number }>;
    let slug = brand;

    if (!slug || !reports[slug]) {
      const fallback = Object.entries(reports)
        .filter(([, r]) => r.kind === "marca")
        .sort((a, b) => (b[1].mentions ?? 0) - (a[1].mentions ?? 0))[0]?.[0];
      slug = fallback || "iol";
    }

    const tab = searchParams.get("tab") || "resumen";
    const url = tab === "resumen" ? `/marcas/${slug}` : `/marcas/${slug}?tab=${tab}`;
    router.replace(url);
  }, [router, searchParams]);

  return <div className="text-[13px] text-gray-400">Redirigiendo al perfil de marca…</div>;
}

/** Legacy route — consolidado en /marcas/[slug] (ARCH-001). */
export default function MarcaLegacyRedirect() {
  return (
    <Suspense fallback={<div className="text-[13px] text-gray-400">Redirigiendo…</div>}>
      <MarcaRedirectInner />
    </Suspense>
  );
}
