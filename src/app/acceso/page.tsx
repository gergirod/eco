"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AccesoForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/marcas";
  const scopeErr = params.get("err") === "scope";

  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);
  const [partnerId, setPartnerId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    scopeErr
      ? "Esa marca no está en tu plan."
      : params.get("err") === "link"
        ? "Link inválido o expirado. Pedile a ECO uno nuevo."
        : ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/partner/list")
      .then((r) => r.json())
      .then((d) => {
        const list = d.partners || [];
        setPartners(list);
        if (list.length === 1) setPartnerId(list[0].id);
      })
      .catch(() => setPartners([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/partner/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ partner_id: partnerId, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No pudimos iniciar sesión");
        return;
      }
      router.replace(from.startsWith("/") ? from : "/marcas");
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="card p-6">
        <h1 className="text-[20px] font-semibold mb-1">ECO Intelligence</h1>
        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
          Si tenés un link de acceso de ECO, abrilo directamente — entrás sin contraseña. Este
          formulario es para quien ya tiene usuario y clave.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-[13px] text-gray-600">
            Agencia
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-[#ececec] rounded-lg text-[14px] bg-white"
              required
            >
              <option value="">Seleccioná…</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] text-gray-600">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-[#ececec] rounded-lg text-[14px]"
              required
            />
          </label>
          {error && <p className="text-[13px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !partnerId || !password}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="text-[11px] text-gray-400 mt-5 leading-relaxed">
          El brief semanal llega por mail. Esta plataforma es para profundizar en cada
          aparición con evidencia verificable.
        </p>
        <p className="text-[12px] text-gray-500 mt-4 pt-4 border-t border-[#ececec]">
          ¿Sos operador ECO?{" "}
          <Link href="/backoffice/login" className="text-accent font-medium hover:underline">
            Entrá por backoffice
          </Link>{" "}
          — desde ahí ves la plataforma completa.
        </p>
      </div>
    </div>
  );
}

export default function AccesoPage() {
  return (
    <Suspense
      fallback={<div className="text-[13px] text-gray-400 mt-16 text-center">Cargando…</div>}
    >
      <AccesoForm />
    </Suspense>
  );
}
