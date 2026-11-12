import { createClient } from "@supabase/supabase-js";
import { getCookie, setCookie, deleteCookie, getRequest, setResponseHeader } from "@tanstack/react-start/server";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function accountClient() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("Cuentas no disponibles.");
  setResponseHeader("Cache-Control", "no-store");
  const token = getCookie("skillswap-access");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {}, fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}

export function saveAccount(session: Session) {
  const options = { httpOnly: true, secure: new URL(getRequest().url).hostname !== "localhost", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };
  setCookie("skillswap-access", session.access_token, options);
  setCookie("skillswap-refresh", session.refresh_token, options);
}
export function clearAccount() {
  deleteCookie("skillswap-access", { path: "/" });
  deleteCookie("skillswap-refresh", { path: "/" });
}
export async function verifiedAccount() {
  const client = accountClient();
  const access = getCookie("skillswap-access");
  if (!access) return null;
  const { data } = await client.auth.getUser(access);
  if (data.user) return data.user;
  const refresh = getCookie("skillswap-refresh");
  if (!refresh) return null;
  const renewed = await client.auth.refreshSession({ refresh_token: refresh });
  if (!renewed.data.session) { clearAccount(); return null; }
  saveAccount(renewed.data.session);
  return renewed.data.user;
}