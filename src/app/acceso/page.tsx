"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function AccesoForm() {
  const params = useSearchParams();
  const from = params.get("from") || "/marcas";
  const scopeErr = params.get("err") === "scope";

  const [adminUser, setAdminUser] = useState("ECO");
  const [adminPass, setAdminPass] = useState("");
  const [error, setError] = useState(
    scopeErr
      ? "Esa marca no está en tu plan."
      : params.get("err") === "link"
        ? "Link inválido o expirado. Pedile a ECO uno nuevo."
        : ""
  );
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="card p-6">
        <h1 className="text-[20px] font-semibold mb-1">ECO Intelligence</h1>
        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
          Acceso operador — vista completa de la plataforma y backoffice.
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
            {loading ? "Entrando…" : "Entrar como operador ECO"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#ececec]">
          <p className="text-[12px] text-gray-500 leading-relaxed">
            <strong className="text-gray-700">¿Sos cliente?</strong> Entrá con el link
            personal que te mandó ECO — no uses esta pantalla. Es un click, sin contraseña.
          </p>
        </div>
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
