import { redirect } from "next/navigation";

export default function CasosRedirect() {
  redirect("/backoffice?tab=comercial");
}
