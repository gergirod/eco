import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PartnerBar from "@/components/PartnerBar";
import { PartnerProvider } from "@/contexts/PartnerContext";
import { ADMIN_COOKIE, adminSessionValid } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Eco — Inteligencia comercial en streaming",
  description: "Quién pauta, dónde y con qué respaldo — streaming en vivo argentino",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await adminSessionValid(cookies().get(ADMIN_COOKIE)?.value);

  return (
    <html lang="es">
      <body>
        <PartnerProvider initialIsAdmin={isAdmin}>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 px-8 py-7 max-w-[1180px]">
              <PartnerBar />
              {children}
            </main>
          </div>
        </PartnerProvider>
      </body>
    </html>
  );
}
