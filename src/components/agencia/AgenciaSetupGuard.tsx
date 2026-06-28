"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { loadLocalAgenciaSetup } from "@/lib/agencia-setup-storage";
import { useAgenciaConfig } from "@/lib/use-agencia-config";
import { usePartner } from "@/contexts/PartnerContext";

const OPEN_PATHS = ["/configurar", "/elegir", "/ejemplo", "/demo", "/marcas"];

function isOpenPath(path: string): boolean {
  return OPEN_PATHS.some((p) => path.startsWith(`${AGENCIA_BASE}${p}`));
}

/** Sin marca elegida → /elegir. Partner sin marcas → /configurar. */
export default function AgenciaSetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { loading, isScoped, partner } = usePartner();
  const { config } = useAgenciaConfig();

  useEffect(() => {
    if (loading) return;
    if (isOpenPath(path)) return;

    const hasLocal = Boolean(loadLocalAgenciaSetup()?.brandSlugs.length);

    if (isScoped && partner && !partner.brand_slugs.length) {
      router.replace(`${AGENCIA_BASE}/configurar`);
      return;
    }

    if (!isScoped && config.isPreview && !hasLocal) {
      router.replace(`${AGENCIA_BASE}/elegir`);
      return;
    }

    if (!isScoped && !config.isPreview && !hasLocal && config.brandSlugs.length === 0) {
      router.replace(`${AGENCIA_BASE}/configurar`);
    }
  }, [loading, path, isScoped, partner, config.isPreview, config.brandSlugs.length, router]);

  return <>{children}</>;
}
