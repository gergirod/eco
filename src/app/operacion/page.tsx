import { redirect } from "next/navigation";

export default function OperacionRedirect() {
  redirect("/backoffice?tab=runbook");
}
