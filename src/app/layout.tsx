import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Streamproof — Brand Intelligence",
  description: "Inteligencia de marca sobre el streaming argentino en vivo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 px-8 py-7 max-w-[1180px]">{children}</main>
        </div>
      </body>
    </html>
  );
}
