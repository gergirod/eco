"use client";
import { useState, useEffect } from "react";
import { fetchDataset } from "./supabase";

// Devuelve el fallback (JSON del bundle) al instante y, si Supabase está
// configurado y responde, lo reemplaza por la data fresca.
export function useDataset<T>(key: string, fallback: T): T {
  const [data, setData] = useState<T>(fallback);
  useEffect(() => {
    let active = true;
    fetchDataset<T>(key).then((d) => {
      if (active && d != null) setData(d);
    });
    return () => {
      active = false;
    };
  }, [key]);
  return data;
}
