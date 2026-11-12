import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAccount } from "./account-context";
import { applySharedAction } from "./accounts.functions";
import { useTesting } from "./testing-context";
import { toast } from "sonner";

import type { Action } from "./engine";
import { dispatchSaved, useDemoState } from "./store";

export function useApp() {
  const account = useAccount();
  const testing = useTesting();
  const real = !testing.enabled && account.real;
  const demo = useDemoState(testing.enabled || (!account.real && !account.loading));
  const state = testing.enabled ? demo : account.loading ? null : real ? account.state : demo;
  const queryClient = useQueryClient();
  const change = useServerFn(applySharedAction);
  const me = state ? state.profiles[state.activeUserId] : null;

  /** Runs an action and shows the outcome. Returns true when it succeeded. */
  const act = useCallback(async (action: Action, opts?: { silent?: boolean }) => {
    if (real) {
      try {
        const result = await change({ data: action });
        if (result.ok) { await queryClient.invalidateQueries({ queryKey: ["shared"] }); if (!opts?.silent) toast.success(result.message); }
        else toast.error(result.message);
        return result.ok;
      } catch { toast.error("No pudimos guardar el cambio. Intenta otra vez."); return false; }
    }
    const res = await dispatchSaved(action);
    if (res.ok) {
      if (!opts?.silent) toast.success(res.message);
      return true;
    }
    toast.error(res.error);
    return false;
  }, [real, change, queryClient]);

  return { state, me, act, real, testing: Boolean(state && !real) };
}
