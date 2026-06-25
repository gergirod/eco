import { redirect } from "next/navigation";

/** Legacy — SPEC-006 reserva el slot bajo Tendencias. */
export default function MovimientosPage() {
  redirect("/tendencias");
}
