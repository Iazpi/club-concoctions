import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ROW_ID = "main";
const pinSchema = z.string().min(1).max(64);

async function checkPin(pin: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("club_settings").select("pin").eq("id", "main").maybeSingle();
  if (!data || data.pin !== pin) throw new Error("PIN incorrecto");
  return supabaseAdmin;
}

export const verifyClubPin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ pin: pinSchema.optional() }).parse(d))
  .handler(async ({ data }) => {
    try {
      await checkPin(data.pin);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

export const getSharedState = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ pin: pinSchema.optional() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await admin.from("shared_state").select("state").eq("id", ROW_ID).maybeSingle();
    if (error) throw new Error("No se pudo cargar");
    return { json: row?.state ? JSON.stringify(row.state) : null };
  });

export const saveSharedState = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ pin: pinSchema.optional(), state: z.record(z.string(), z.any()) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    const { error } = await admin
      .from("shared_state")
      .upsert({ id: ROW_ID, state: data.state as any, updated_at: new Date().toISOString() });
    if (error) throw new Error("No se pudo guardar");
    return { ok: true };
  });
