"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "admin" | "cliente";

function AccesoForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/marcas";
  const scopeErr = params.get("err") === "scope";

  const [mode, setMode] = useState<Mode>("admin");

  // Admin
  const [adminUser, setAdminUser] = useState("ECO");
  const [adminPass, setAdminPass] = useState("");

  // Cliente
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);
  const [partnerId, setPartnerId] = useState("");
  const [clientPass, setClientPass] = useState("");

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

  async function submitAdmin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username: adminUser, password: adminPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No pudimos iniciar sesión");
        return;
      }
      window.location.href = from.startsWith("/") ? from : "/marcas";
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  async function submitCliente(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/partner/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ partner_id: partnerId, password: clientPass }),
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

        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("admin");
              setError("");
            }}
            className={`flex-1 py-2 text-[13px] rounded-md transition ${
              mode === "admin"
                ? "bg-white shadow-sm font-medium text-ink"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Admin ECO
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("cliente");
              setError("");
            }}
            className={`flex-1 py-2 text-[13px] rounded-md transition ${
              mode === "cliente"
                ? "bg-white shadow-sm font-medium text-ink"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Cliente
          </button>
        </div>

        {mode === "admin" ? (
          <>
            <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
              Acceso completo a la plataforma — todas las marcas, canales y mercado.
            </p>
            <form onSubmit={submitAdmin} className="space-y-4">
              <label className="block text-[13px] text-gray-600">
                Usuario
                <input
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 border border-[#ececec] rounded-lg text-[14px]"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="block text-[13px] text-gray-600">
                Contraseña
                <input
                  type="password"
                  autoComplete="current-password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 border border-[#ececec] rounded-lg text-[14px]"
                  required
                />
              </label>
              {error && <p className="text-[13px] text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading || !adminUser || !adminPass}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {loading ? "Entrando…" : "Entrar a la plataforma"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
              Si tenés un link de acceso, abrilo directamente — entrás sin contraseña. Este
              formulario es para quien ya tiene usuario y clave de cliente.
            </p>
            <form onSubmit={submitCliente} className="space-y-4">
              <label className="block text-[13px] text-gray-600">
                Agencia / cliente
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
                  value={clientPass}
                  onChange={(e) => setClientPass(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 border border-[#ececec] rounded-lg text-[14px]"
                  required
                />
              </label>
              {error && <p className="text-[13px] text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading || !partnerId || !clientPass}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </form>
          </>
        )}
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
