import { redirect } from "next/navigation";

export default function DemoIdRedirect({ params }: { params: { id: string } }) {
  redirect(`/agencia/ejemplo/${params.id}`);
}
