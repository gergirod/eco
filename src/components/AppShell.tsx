"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import PartnerBar from "@/components/PartnerBar";
import AgenciaShell from "@/components/agencia/AgenciaShell";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const isAgencia = path.startsWith("/agencia");
  const isPalco = path.startsWith("/palco");

  if (isPalco) {
    return <>{children}</>;
  }

  if (isAgencia) {
    return <AgenciaShell>{children}</AgenciaShell>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-8 py-7 max-w-[1180px]">
        <PartnerBar />
        {children}
      </main>
    </div>
  );
}
