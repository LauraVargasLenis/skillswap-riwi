import { getCookie, setCookie, getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { createSeed } from "./seed";
import { normalizeStateAvailability } from "./availability";
import { applyAction, type Action } from "./engine";
import { TEST_PACKAGES } from "./topup-config";
import { USER_IDS, type DemoState } from "./types";

const COOKIE = "skillswap-test-space";
const allowed = new Set(["switchUser", "reset", "publishRescue", "withdrawRescue", "acceptRescue", "requestSession", "respondSession", "cancelRequest", "confirmSession", "cancelSession", "updateProfile", "testCreateTopup", "testResolveTopup", "testSaveDraft", "testConfigurePackages"]);

function checkOrigin() {
  const request = getRequest();
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site" || (origin && origin !== new URL(request.url).origin)) throw new Error("Origen no válido.");
}

async function testRow() {
  setResponseHeader("Cache-Control", "no-store");
  const id = getCookie(COOKIE);
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) throw new Error("Entra al modo de prueba para continuar.");
  // The opaque HttpOnly capability authorizes only this disposable test space,
  // not an account or any real aggregate. Never accept a space id from callers.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const row = await supabaseAdmin.from("skillswap_test_state").select("data,revision").eq("id", id).single();
  if (row.error) throw new Error("No pudimos cargar el modo de prueba.");
  return { id, state: normalizeStateAvailability(row.data.data as unknown as DemoState), revision: row.data.revision, client: supabaseAdmin };
}

export async function startTest(userId: string) {
  checkOrigin();
  if (!USER_IDS.includes(userId)) throw new Error("Perfil de prueba no válido.");
  try { return (await testRow()).state; } catch { /* create isolated seed on explicit entry */ }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const state: DemoState = { ...createSeed(), activeUserId: userId, testing: true, topups: [], requestDrafts: {}, testPackages: [...TEST_PACKAGES] };
  const row = await supabaseAdmin.from("skillswap_test_state").insert({ data: JSON.parse(JSON.stringify(state)) }).select("id").single();
  if (row.error) throw new Error("No pudimos iniciar la prueba.");
  setCookie(COOKIE, row.data.id, { httpOnly: true, secure: new URL(getRequest().url).hostname !== "localhost", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return state;
}

export async function readTest() { return (await testRow()).state; }

export async function changeTest(action: Action) {
  checkOrigin();
  if (!action || !allowed.has(action.type)) return { ok: false, message: "Acción no válida." };
  for (let attempt = 0; attempt < 12; attempt++) {
    const row = await testRow();
    if (action.type !== "reset" && (!("userId" in action) || !USER_IDS.includes(action.userId))) return { ok: false, message: "Perfil de prueba no válido." };
    let result;
    try { result = applyAction(row.state, action); }
    catch { return { ok: false, message: "Datos no válidos." }; }
    if (!result?.ok) return { ok: false, message: result?.error ?? "Acción no válida." };
    const update = await row.client.rpc("skillswap_test_compare_swap", { test_id: row.id, expected: row.revision, replacement: JSON.parse(JSON.stringify(result.state)) });
    if (update.error) throw new Error("No pudimos guardar la prueba.");
    if (update.data) return { ok: true, message: result.message };
  }
  return { ok: false, message: "Hay otro cambio en curso. Intenta de nuevo." };
}