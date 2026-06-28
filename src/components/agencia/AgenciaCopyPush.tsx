"use client";

import { useState } from "react";
import { guardPushPreview } from "@/lib/agencia-guard";
import type { AgenciaAlert } from "@/lib/agencia-product";

export default function AgenciaCopyPush({ alert }: { alert: AgenciaAlert }) {
  const [copied, setCopied] = useState(false);
  const text = guardPushPreview(alert);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="btn w-full sm:w-auto border-0 bg-[#075e54] text-white text-[13px] py-2.5 hover:bg-[#064e45] font-medium"
    >
      {copied ? "Copiado ✓" : "Copiar para WhatsApp"}
    </button>
  );
}
