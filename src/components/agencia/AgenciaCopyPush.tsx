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
      className="btn border border-[#dcf8c6] bg-white text-[13px] py-2 text-green-800 hover:bg-[#f0fff4]"
    >
      {copied ? "Copiado ✓" : "Copiar para WhatsApp"}
    </button>
  );
}
