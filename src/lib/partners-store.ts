import {
  partnerCompetitorSlugs,
  normalizePartnerIcp,
  normalizePartnerPlan,
  validatePartnerContract,
  type PartnerRecord,
} from "@/lib/partners";
import { partnerSessionSuffix } from "@/lib/partner-auth";
import {
  generateAccessToken,
  hashAccessToken,
  accessLinkExpiresAt,
  isAccessLinkExpired,
  isInviteExpired,
} from "@/lib/partner-invite";
import { supabaseRest, supabaseServiceConfig } from "@/lib/supabase-server";
import partnersFile from "@/data/partners.json";
import type { PartnersFile } from "@/lib/partners";

export const SUPABASE_PARTNERS_SETUP_HINT =
  "La tabla eco_partners no existe. Abrí Supabase → SQL Editor y ejecutá webapp/supabase_partners_full_setup.sql (una sola vez).";

type DbPartnerRow = {
  id: string;
  name: string;
  icp?: string | null;
  plan?: string | null;
  brand_slugs: string[];
  competitor_slugs: string[];
  competitor_by_brand: Record<string, string>;
  channel_ids?: string[];
  benchmark_channel_ids?: string[];
  active: boolean;
  contact_email: string | null;
  notes: string | null;
  password_hash: string;
  invite_token_hash: string | null;
  invite_expires_at: string | null;
  price_ars_month?: number | null;
  contract_started_at?: string | null;
  updated_at?: string;
};

export type PartnerWithSecret = PartnerRecord & {
  password_hash?: string;
  invite_token_hash?: string | null;
  invite_expires_at?: string | null;
};

function rowToRecord(row: DbPartnerRow): PartnerWithSecret {
  const icp = normalizePartnerIcp(row.icp);
  const base: PartnerRecord = {
    id: row.id,
    name: row.name,
    icp,
    plan: normalizePartnerPlan(row.plan, icp),
    brand_slugs: row.brand_slugs || [],
    competitor_slugs: row.competitor_slugs?.length
      ? row.competitor_slugs
      : partnerCompetitorSlugs({
          id: row.id,
          name: row.name,
          brand_slugs: row.brand_slugs || [],
          competitor_slugs: [],
          competitor_by_brand: row.competitor_by_brand,
        }),
    competitor_by_brand: row.competitor_by_brand || undefined,
    channel_ids: row.channel_ids?.length ? row.channel_ids : undefined,
    benchmark_channel_ids: row.benchmark_channel_ids?.length
      ? row.benchmark_channel_ids
      : undefined,
    active: row.active,
    contact_email: row.contact_email || undefined,
    notes: row.notes || undefined,
    price_ars_month: row.price_ars_month ?? undefined,
    contract_started_at: row.contract_started_at ?? undefined,
  };
  return {
    ...base,
    password_hash: row.password_hash,
    invite_token_hash: row.invite_token_hash,
    invite_expires_at: row.invite_expires_at,
  };
}

function loadJsonPartners(): PartnerWithSecret[] {
  return (partnersFile as PartnersFile).partners.filter((p) => p.id !== "plantilla");
}

export async function listPartners(): Promise<PartnerWithSecret[]> {
  const { enabled } = supabaseServiceConfig();
  if (!enabled) return loadJsonPartners();

  const { ok, data } = await supabaseRest<DbPartnerRow[]>(
    "/eco_partners?select=*&order=updated_at.desc"
  );
  if (!ok || !data?.length) return loadJsonPartners();
  return data.map(rowToRecord);
}

export async function getPartnerById(id: string): Promise<PartnerWithSecret | undefined> {
  const { enabled } = supabaseServiceConfig();
  if (!enabled) return loadJsonPartners().find((p) => p.id === id);

  const { ok, data } = await supabaseRest<DbPartnerRow[]>(
    `/eco_partners?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  if (!ok || !data?.[0]) return loadJsonPartners().find((p) => p.id === id);
  return rowToRecord(data[0]);
}

export async function getPartnerByAccessToken(
  token: string
): Promise<PartnerWithSecret | null> {
  const { enabled } = supabaseServiceConfig();
  if (!enabled) return null;

  const hash = await hashAccessToken(token);
  const { ok, data } = await supabaseRest<DbPartnerRow[]>(
    `/eco_partners?invite_token_hash=eq.${encodeURIComponent(hash)}&select=*&limit=1`
  );
  if (!ok || !data?.[0]) return null;
  return rowToRecord(data[0]);
}

/** @deprecated */
export const getPartnerByInviteToken = getPartnerByAccessToken;

export async function verifyPartnerLogin(
  partnerId: string,
  password: string
): Promise<PartnerRecord | null> {
  const partner = await getPartnerById(partnerId);
  if (!partner || partner.active === false) return null;

  const suffix = await partnerSessionSuffix(partnerId, password);
  if (partner.password_hash && partner.password_hash === suffix) {
    const { password_hash: _, invite_token_hash: __, invite_expires_at: ___, ...rest } =
      partner;
    return rest;
  }

  const { parsePartnerPasswords } = await import("@/lib/partner-auth");
  const legacy = parsePartnerPasswords()[partnerId];
  if (legacy && legacy === password) {
    const { password_hash: _, invite_token_hash: __, invite_expires_at: ___, ...rest } =
      partner;
    return rest;
  }
  return null;
}

export type UpsertPartnerInput = {
  id: string;
  name: string;
  icp?: PartnerRecord["icp"];
  plan?: PartnerRecord["plan"];
  brand_slugs: string[];
  competitor_by_brand?: Record<string, string>;
  competitor_slugs?: string[];
  channel_ids?: string[];
  benchmark_channel_ids?: string[];
  contact_email?: string;
  notes?: string;
  password?: string;
  active?: boolean;
  access_months?: number;
  price_ars_month?: number;
  contract_started_at?: string;
};

export type UpsertPartnerResult = {
  ok: boolean;
  error?: string;
  inviteToken?: string;
};

async function patchPartnerRow(
  id: string,
  fields: Record<string, unknown>
): Promise<{ ok: boolean; status: number }> {
  const { ok, status } = await supabaseRest<unknown>(
    `/eco_partners?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ ...fields, updated_at: new Date().toISOString() }),
    }
  );
  return { ok, status };
}

export async function createPartnerInvite(
  partnerId: string,
  options?: { clearPassword?: boolean; accessMonths?: number }
): Promise<{ ok: boolean; error?: string; inviteToken?: string }> {
  const { enabled } = supabaseServiceConfig();
  if (!enabled) {
    return { ok: false, error: "Supabase no configurado." };
  }

  const partner = await getPartnerById(partnerId);
  if (!partner) return { ok: false, error: "Cliente no encontrado." };
  if (partner.active === false) return { ok: false, error: "Cliente inactivo." };

  const inviteToken = generateAccessToken();
  const invite_token_hash = await hashAccessToken(inviteToken);
  const fields: Record<string, unknown> = {
    invite_token_hash,
    invite_expires_at: accessLinkExpiresAt(options?.accessMonths),
  };
  if (options?.clearPassword) fields.password_hash = "";

  const { ok, status } = await patchPartnerRow(partnerId, fields);
  if (!ok) return { ok: false, error: `Supabase error ${status}` };
  return { ok: true, inviteToken };
}

export async function acceptPartnerInvite(
  token: string,
  password: string
): Promise<{ ok: boolean; error?: string; partner?: PartnerRecord }> {
  if (password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const partner = await getPartnerByInviteToken(token);
  if (!partner || partner.active === false) {
    return { ok: false, error: "Invitación inválida o ya usada." };
  }
  if (isInviteExpired(partner.invite_expires_at)) {
    return { ok: false, error: "Esta invitación expiró. Pedile a ECO un link nuevo." };
  }

  const password_hash = await partnerSessionSuffix(partner.id, password);
  const { ok, status } = await patchPartnerRow(partner.id, {
    password_hash,
    invite_token_hash: null,
    invite_expires_at: null,
  });
  if (!ok) return { ok: false, error: `No pudimos activar la cuenta (${status}).` };

  const { password_hash: _, invite_token_hash: __, invite_expires_at: ___, ...rest } =
    partner;
  return { ok: true, partner: rest };
}

export async function upsertPartner(input: UpsertPartnerInput): Promise<UpsertPartnerResult> {
  const { enabled } = supabaseServiceConfig();
  if (!enabled) {
    return {
      ok: false,
      error: "Supabase no configurado. Agregá SUPABASE_SERVICE_ROLE_KEY en Vercel.",
    };
  }

  const competitor_by_brand = input.competitor_by_brand || {};
  const competitor_slugs =
    input.competitor_slugs || [...new Set(Object.values(competitor_by_brand))];
  const icp = normalizePartnerIcp(input.icp);
  const plan = normalizePartnerPlan(input.plan, icp);

  const record: PartnerRecord = {
    id: input.id,
    name: input.name,
    icp,
    plan,
    brand_slugs: input.brand_slugs,
    competitor_slugs,
    competitor_by_brand: Object.keys(competitor_by_brand).length
      ? competitor_by_brand
      : undefined,
    channel_ids: input.channel_ids?.length ? input.channel_ids : undefined,
    benchmark_channel_ids: input.benchmark_channel_ids?.length
      ? input.benchmark_channel_ids
      : undefined,
    active: input.active !== false,
    contact_email: input.contact_email,
    notes: input.notes,
    price_ars_month: input.price_ars_month,
    contract_started_at: input.contract_started_at,
  };

  const err = validatePartnerContract(record);
  if (err) return { ok: false, error: err };

  const existing = await getPartnerById(input.id);
  let password_hash = existing?.password_hash || "";
  let invite_token_hash = existing?.invite_token_hash ?? null;
  let invite_expires_at: string | null = existing?.invite_expires_at ?? null;
  let inviteToken: string | undefined;

  if (input.password?.trim()) {
    password_hash = await partnerSessionSuffix(input.id, input.password.trim());
  }

  const isNew = !existing;
  const needsInvite = isNew && !input.password?.trim();

  if (needsInvite) {
    inviteToken = generateAccessToken();
    invite_token_hash = await hashAccessToken(inviteToken);
    invite_expires_at = accessLinkExpiresAt(input.access_months);
    password_hash = "";
  }

  const row = {
    id: input.id,
    name: input.name,
    icp,
    plan,
    brand_slugs: input.brand_slugs,
    competitor_slugs,
    competitor_by_brand,
    channel_ids: input.channel_ids || [],
    benchmark_channel_ids: input.benchmark_channel_ids || [],
    active: input.active !== false,
    contact_email: input.contact_email || null,
    notes: input.notes || null,
    price_ars_month: input.price_ars_month ?? null,
    contract_started_at: input.contract_started_at || null,
    password_hash,
    invite_token_hash,
    invite_expires_at,
    updated_at: new Date().toISOString(),
  };

  const { ok, status } = await supabaseRest<unknown>("/eco_partners?on_conflict=id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify(row),
  });

  if (!ok) {
    if (status === 404) return { ok: false, error: SUPABASE_PARTNERS_SETUP_HINT };
    return { ok: false, error: `Supabase error ${status}` };
  }
  return { ok: true, inviteToken };
}

export async function partnersStoreStatus(): Promise<{
  mode: "supabase" | "json";
  tableReady: boolean;
  setupHint?: string;
}> {
  const cfg = supabaseServiceConfig();
  if (!cfg.enabled) {
    return { mode: "json", tableReady: false };
  }

  const { ok, status } = await supabaseRest<DbPartnerRow[]>(
    "/eco_partners?select=id&limit=1"
  );
  if (!ok && status === 404) {
    return { mode: "json", tableReady: false, setupHint: SUPABASE_PARTNERS_SETUP_HINT };
  }
  if (!ok) {
    return {
      mode: "json",
      tableReady: false,
      setupHint: `Supabase respondió ${status}. Revisá NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel.`,
    };
  }
  return { mode: "supabase", tableReady: true };
}

/** @deprecated Usar partnersStoreStatus() — solo indica credenciales, no si la tabla existe */
export function partnersStoreMode(): "supabase" | "json" {
  return supabaseServiceConfig().enabled ? "supabase" : "json";
}

export function partnerHasAccessLink(partner: PartnerWithSecret): boolean {
  return Boolean(
    partner.invite_token_hash && !isAccessLinkExpired(partner.invite_expires_at)
  );
}

/** @deprecated */
export const partnerHasPendingInvite = partnerHasAccessLink;
