"use client";

import { useRouter } from "next/navigation";

export default function OpsLogout() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE", credentials: "same-origin" });
    router.replace("/acceso");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="text-[12px] text-gray-400 hover:text-gray-600 transition"
    >
      Cerrar sesión
    </button>
  );
}
