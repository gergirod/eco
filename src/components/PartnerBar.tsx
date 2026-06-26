"use client";

import Link from "next/link";
import { usePartner } from "@/contexts/PartnerContext";

export default function PartnerBar() {
  const { loading, isScoped, partner, logout } = usePartner();

  if (loading || !isScoped || !partner) return null;

  return (
    <div className="mb-6 -mt-1 px-4 py-3 rounded-lg bg-accent-soft border border-accent/10 flex flex-wrap items-center justify-between gap-3">
      <div className="text-[13px] text-gray-700">
        <span className="font-medium text-ink">{partner.name}</span>
        <span className="text-gray-400 mx-2">·</span>
        <span>
          {partner.brand_slugs.length} marca
          {partner.brand_slugs.length === 1 ? "" : "s"}
          {partner.competitor_slugs.length > 0 &&
            ` · ${partner.competitor_slugs.length} competidor${
              partner.competitor_slugs.length === 1 ? "" : "es"
            }`}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[12px]">
        {partner.brand_slugs.map((slug) => (
          <Link key={slug} href={`/marcas/${slug}`} className="text-accent hover:underline">
            {slug.replace(/-/g, " ")}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => logout()}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          Salir
        </button>
      </div>
    </div>
  );
}
