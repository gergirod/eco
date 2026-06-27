/** Carriles de evidencia — SPEC-007 / SPEC-009 */

export type EvidenceLane = "audio" | "chat" | "corroborated";

export type ChatProgramSignal = {
  video_id: string;
  channel: string;
  title?: string;
  n_msgs: number;
  n_authors: number;
  ejemplo?: string;
};

export type ChatSignals = {
  n_msgs: number;
  n_authors: number;
  programs: ChatProgramSignal[];
  chat_only_programs?: ChatProgramSignal[];
};

export const EVIDENCE_LANE_LABEL: Record<EvidenceLane, string> = {
  audio: "Charla del conductor",
  chat: "Señal de la sala",
  corroborated: "Conductor + sala",
};

export const EVIDENCE_LANE_HINT: Record<EvidenceLane, string> = {
  audio:
    "Lo dijeron al micrófono — citas del audio transcrito. No afirmamos hechos externos al programa.",
  chat:
    "La audiencia lo comentó en chat — no verificado en audio. Puede incluir rumores o bait.",
  corroborated:
    "Aparece en el audio del conductor y además varias personas lo comentaron en chat.",
};

export const CHAT_DISCLAIMER =
  "Mensajes de chat — no verificamos noticias ni confirmamos hechos fuera del stream.";

export function isEvidenceLane(s: string | null | undefined): s is EvidenceLane {
  return s === "audio" || s === "chat" || s === "corroborated";
}
