import { useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogIn, LogOut, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/lib/skillswap/account-context";
import { logoutAccount } from "@/lib/skillswap/accounts.functions";
import { useTesting } from "@/lib/skillswap/testing-context";

export function AccountControls() {
  const { real, account } = useAccount();
  const { enabled } = useTesting();
  const queries = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const logout = useServerFn(logoutAccount);
  async function signOut() {
    await queries.cancelQueries(); queries.clear(); await logout();
    await router.invalidate(); await navigate({ to: "/auth", replace: true });
  }
  return <div className="flex items-center gap-1">
    <span className="text-xs font-semibold text-brand">{enabled ? "Prueba" : real ? "Mi cuenta" : "Demo"}</span>
    {account && <Button variant="ghost" size="icon" title={real ? "Ir a la demo" : "Volver a mi cuenta"} aria-label={real ? "Ir a la demo" : "Volver a mi cuenta"} onClick={() => navigate({ to: "/", search: real ? { demo: true } : {} })}><FlaskConical /></Button>}
    <Button variant="ghost" size="icon" aria-label={account ? "Cerrar sesión" : "Iniciar sesión"} title={account ? "Cerrar sesión" : "Iniciar sesión"} onClick={() => account ? signOut() : navigate({ to: "/auth" })}>{account ? <LogOut /> : <LogIn />}</Button>
  </div>;
}