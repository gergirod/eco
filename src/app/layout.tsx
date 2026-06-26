import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PartnerBar from "@/components/PartnerBar";
import { PartnerProvider } from "@/contexts/PartnerContext";

export const metadata: Metadata = {
  title: "Eco — Inteligencia comercial en streaming",
  description: "Quién pauta, dónde y con qué respaldo — streaming en vivo argentino",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <PartnerProvider>
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
