import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { readAccount, readSharedState, adoptConfirmation } from "./accounts.functions";
import type { DemoState } from "./types";

const AccountContext = createContext<{ real: boolean; account: { id: string; email: string | undefined } | null; state: DemoState | null; loading: boolean }>({ real: false, account: null, state: null, loading: true });
export function AccountProvider({ children }: { children: ReactNode }) {
  const fetchAccount = useServerFn(readAccount);
  const fetchState = useServerFn(readSharedState);
  const confirm = useServerFn(adoptConfirmation);
  const queryClient = useQueryClient();
  const router = useRouter();
  const location = useLocation();
  const account = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount(), refetchOnWindowFocus: true, retry: false });
  const real = Boolean(account.data) && !new URLSearchParams(location.searchStr).has("demo");
  const shared = useQuery({ queryKey: ["shared", account.data?.id], queryFn: () => fetchState(), enabled: real, refetchInterval: 3000, retry: false });
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access = hash.get("access_token"), refresh = hash.get("refresh_token");
    if (!access || !refresh || hash.get("type") === "recovery") return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    void confirm({ data: { access, refresh } }).then(() => { void queryClient.invalidateQueries(); void router.invalidate(); });
  }, [confirm, queryClient, router]);
  return <AccountContext.Provider value={{ real, account: account.data ?? null, state: shared.data ?? null, loading: account.isPending || (real && shared.isPending) }}>{children}</AccountContext.Provider>;
}
export const useAccount = () => useContext(AccountContext);