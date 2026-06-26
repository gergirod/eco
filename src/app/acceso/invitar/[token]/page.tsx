"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { brandDisplayName } from "@/lib/design-partners";

function InvitarInner() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";

  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState("");
  const [brandSlugs, setBrandSlugs] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("Link inválido.");
      setLoading(false);
      return;
    }
    fetch(`/api/partner/invite/${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setLoadError(data.error || "Invitación no válida");
          return;
        }
        setPartnerName(data.partnerName);
        setBrandSlugs(data.brandSlugs || []);
      })
      .catch(() => setLoadError("Error de red"))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (password.length < 8) {
      setSubmitError("Mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setSubmitError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/partner/invite/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "No pudimos activar tu cuenta");
        return;
      }
      router.replace("/marcas");
      router.refresh();
    } catch {
      setSubmitError("Error de red");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-[13px] text-gray-400 mt-16 text-center">Verificando invitación…</div>;
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="card p-6">
          <h1 className="text-[18px] font-semibold mb-2">Invitación no disponible</h1>
          <p className="text-[13px] text-gray-600 mb-4">{loadError}</p>
          <Link href="/acceso" className="text-[13px] text-accent hover:underline">
            Ir a inicio de sesión →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="card p-6">
        <h1 className="text-[20px] font-semibold mb-1">Activá tu acceso</h1>
        <p className="text-[13px] text-gray-500 mb-1">
          <strong>{partnerName}</strong> — ECO Intelligence
        </p>
        {brandSlugs.length > 0 && (
          <p className="text-[12px] text-gray-400 mb-6">
            Marcas: {brandSlugs.map((s) => brandDisplayName(s)).join(", ")}
          </p>
        )}

        <p className="text-[13px] text-gray-600 mb-5 leading-relaxed">
          Este link es solo para tu agencia. Elegí una contraseña — después entrás en{" "}
          <code className="text-[11px] bg-gray-100 px-1 rounded">/acceso</code> con tu agencia y
          esta clave.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-[13px] text-gray-600">
            Contraseña
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-[#ececec] rounded-lg text-[14px]"
              required
              minLength={8}
            />
          </label>
          <label className="block text-[13px] text-gray-600">
            Confirmar contraseña
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-[#ececec] rounded-lg text-[14px]"
              required
              minLength={8}
            />
          </label>
          {submitError && <p className="text-[13px] text-red-600">{submitError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {submitting ? "Activando…" : "Activar y entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function InvitarPage() {
  return (
    <Suspense
      fallback={<div className="text-[13px] text-gray-400 mt-16 text-center">Cargando…</div>}
    >
      <InvitarInner />
    </Suspense>
  );
}
