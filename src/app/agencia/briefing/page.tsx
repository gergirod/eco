import { redirect } from "next/navigation";

/** Briefing = reporte. Producto = Guard + Pulse + Ask. Ruta interna redirige a Ask. */
export default function BriefingRedirect() {
  redirect("/agencia/pregunta");
}
