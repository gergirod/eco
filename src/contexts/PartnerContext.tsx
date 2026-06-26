"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PartnerView = {
  id: string;
  name: string;
  brand_slugs: string[];
  competitor_slugs: string[];
};

type PartnerContextValue = {
  loading: boolean;
  mode: "open" | "partners";
  partner: PartnerView | null;
  allSlugs: string[];
  isScoped: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const PartnerContext = createContext<PartnerContextValue | null>(null);

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"open" | "partners">("open");
  const [partner, setPartner] = useState<PartnerView | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/partner/me", { credentials: "same-origin" });
      const data = await res.json();
      setMode(data.mode === "partners" ? "partners" : "open");
      setPartner(data.partner ?? null);
    } catch {
      setMode("open");
      setPartner(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/partner/auth", { method: "DELETE", credentials: "same-origin" });
    setPartner(null);
    window.location.href = "/acceso";
  }, []);

  const allSlugs = useMemo(() => {
    if (!partner) return [];
    return [...new Set([...partner.brand_slugs, ...partner.competitor_slugs])];
  }, [partner]);

  const value = useMemo(
    () => ({
      loading,
      mode,
      partner,
      allSlugs,
      isScoped: mode === "partners" && partner != null,
      refresh,
      logout,
    }),
    [loading, mode, partner, allSlugs, refresh, logout]
  );

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
}

export function usePartner() {
  const ctx = useContext(PartnerContext);
  if (!ctx) {
    throw new Error("usePartner debe usarse dentro de PartnerProvider");
  }
  return ctx;
}
