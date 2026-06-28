"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { loadLocalAgenciaSetup } from "@/lib/agencia-setup-storage";
import { useAgenciaConfig } from "@/lib/use-agencia-config";
import { usePartner } from "@/contexts/PartnerContext";

/** Redirige a configurar si el partner aún no eligió marcas. */
export default function AgenciaSetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { loading, isScoped, partner } = usePartner();
  const { config } = useAgenciaConfig();

  useEffect(() => {
    if (loading) return;
    if (path.startsWith(`${AGENCIA_BASE}/configurar`)) return;

    const hasLocal = Boolean(loadLocalAgenciaSetup()?.brandSlugs.length);
    const needsSetup =
      !config.isPreview &&
      ((isScoped && partner && !partner.brand_slugs.length) ||
        (!isScoped && !hasLocal && path.startsWith(AGENCIA_BASE)));

    if (needsSetup) {
      router.replace(`${AGENCIA_BASE}/configurar`);
    }
  }, [loading, path, isScoped, partner, config.isPreview, router]);

  return <>{children}</>;
}
