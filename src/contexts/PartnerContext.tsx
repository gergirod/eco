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
  isAdmin: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const PartnerContext = createContext<PartnerContextValue | null>(null);

export function PartnerProvider({
  children,
  initialIsAdmin = false,
}: {
  children: ReactNode;
  initialIsAdmin?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"open" | "partners">("open");
  const [partner, setPartner] = useState<PartnerView | null>(null);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);

  const refresh = useCallback(async () => {
    try {
      const [meRes, adminRes] = await Promise.all([
        fetch("/api/partner/me", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/admin/me", { credentials: "same-origin", cache: "no-store" }),
      ]);
      const meData = await meRes.json();
      const adminData = await adminRes.json();
      setMode(meData.mode === "partners" ? "partners" : "open");
      setPartner(meData.partner ?? null);
      setIsAdmin(adminData.isAdmin === true || meData.isAdmin === true || initialIsAdmin);
    } catch {
      setMode("open");
      setPartner(null);
      setIsAdmin(initialIsAdmin);
    } finally {
      setLoading(false);
    }
  }, [initialIsAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await Promise.all([
      fetch("/api/admin/auth", { method: "DELETE", credentials: "same-origin" }),
      fetch("/api/partner/auth", { method: "DELETE", credentials: "same-origin" }),
    ]);
    setPartner(null);
    setIsAdmin(false);
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
      isAdmin,
      refresh,
      logout,
    }),
    [loading, mode, partner, allSlugs, isAdmin, refresh, logout]
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
