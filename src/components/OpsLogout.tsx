"use client";

import { useRouter } from "next/navigation";

export default function OpsLogout() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/operacion/auth", { method: "DELETE" });
    router.replace("/backoffice/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="text-[12px] text-gray-400 hover:text-gray-600 transition"
    >
      Cerrar sesión operación
    </button>
  );
}
