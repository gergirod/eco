import { redirect } from "next/navigation";

export default function DiscoverSlugRedirect({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/marcas/${params.slug}`);
}
