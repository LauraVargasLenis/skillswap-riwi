import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dispatchSaved } from "./store";
import type { DemoState } from "./types";

const TestingContext = createContext<{ enabled: boolean; state: DemoState | null; loading: boolean; enter: (id: string) => Promise<void>; exit: () => void }>({ enabled: false, state: null, loading: false, enter: async () => {}, exit: () => {} });
export function TestingProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { setEnabled(window.localStorage.getItem("skillswap-testing-mode") === "true"); }, []);
  async function enter(id: string) {
    const result = await dispatchSaved({ type: "switchUser", userId: id });
    if (!result.ok) throw new Error(result.error);
    window.localStorage.setItem("skillswap-testing-mode", "true");
    setEnabled(true);
  }
  function exit() { window.localStorage.removeItem("skillswap-testing-mode"); setEnabled(false); }
  return <TestingContext.Provider value={{ enabled, state: null, loading: false, enter, exit }}>{children}</TestingContext.Provider>;
}
export const useTesting = () => useContext(TestingContext);