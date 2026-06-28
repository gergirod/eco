import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import AppShell from "@/components/AppShell";
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
          <AppShell>{children}</AppShell>
        </PartnerProvider>
      </body>
    </html>
  );
}
