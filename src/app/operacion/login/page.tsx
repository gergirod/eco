"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/backoffice";
  const configErr = params.get("err") === "config";

  const [password, setPassword] = useState("");
  const [error, setError] = useState(configErr ? "Falta BACK_OFFICE_PASSWORD en el servidor." : "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/operacion/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Contraseña incorrecta");
        return;
      }
      router.replace(from.startsWith("/") ? from : "/backoffice");
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="card p-6">
        <h1 className="text-[18px] font-semibold mb-1">Operación</h1>
        <p className="text-[13px] text-gray-500 mb-5">
          Backoffice, runbook y casos de uso — acceso interno.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-[13px] text-gray-600">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-[#ececec] rounded-lg text-[14px]"
              autoFocus
            />
          </label>
          {error && <p className="text-[13px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OpsLoginPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-gray-400 mt-16 text-center">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
