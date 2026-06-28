import AgenciaSetupGuard from "@/components/agencia/AgenciaSetupGuard";

export default function AgenciaLayout({ children }: { children: React.ReactNode }) {
  return <AgenciaSetupGuard>{children}</AgenciaSetupGuard>;
}
