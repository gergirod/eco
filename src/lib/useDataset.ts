"use client";
import { useState, useEffect } from "react";
import { fetchDataset } from "./supabase";
import metaFb from "@/data/meta.json";

function bundleTs() {
  return Date.parse((metaFb as any).exported_at || "") || 0;
}

// Devuelve el fallback (JSON del bundle) al instante. Solo reemplaza por Supabase
// si su meta es más nueva Y tiene el schema actual (n_pauta_mentions).
export function useDataset<T>(key: string, fallback: T): T {
  const [data, setData] = useState<T>(fallback);
  useEffect(() => {
    let active = true;
    (async () => {
      const remoteMeta = await fetchDataset<any>("meta");
      if (!active) return;
      const bundle = metaFb as any;
      const remoteTs = Date.parse(remoteMeta?.exported_at || "") || 0;
      const bundleHasSchema = bundle.n_pauta_mentions != null;
      const remoteHasSchema = remoteMeta?.n_pauta_mentions != null;
      // Supabase stale: más viejo, o schema viejo (420 marcas sin distinción PNT)
      if (remoteTs <= bundleTs()) return;
      if (bundleHasSchema && !remoteHasSchema) return;

      const remote = await fetchDataset<T>(key);
      if (active && remote != null) setData(remote);
    })();
    return () => {
      active = false;
    };
  }, [key]);
  return data;
}
