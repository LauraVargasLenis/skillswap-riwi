import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { authenticate } from "@/lib/skillswap/accounts.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [ { title: "Tu cuenta — SkillSwap" }, { name: "description", content: "Regístrate o inicia sesión con correo en SkillSwap." }, { property: "og:title", content: "Tu cuenta — SkillSwap" }, { property: "og:description", content: "Tu perfil y tus intercambios, desde cualquier dispositivo." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" } ] }),
  component: AuthPage,
});
function AuthPage() {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const login = useServerFn(authenticate);
  const queries = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const result = await login({ data: { email, password, name, signup, origin: window.location.origin } });
      setMessage(result.message);
      if (result.ok && result.signedIn) { await queries.invalidateQueries(); await router.invalidate(); await navigate({ to: "/", search: {} }); }
    } catch { setMessage("No pudimos conectar. Intenta otra vez."); }
    finally { setBusy(false); }
  }
  const input = "mt-2 h-11 w-full rounded-lg border border-input bg-card px-3";
  return <section className="mx-auto max-w-md py-8">
    <h1 className="text-3xl font-bold">{signup ? "Crea tu cuenta" : "Inicia sesión"}</h1>
    <form onSubmit={submit} className="mt-6 space-y-5">
      {signup && <label className="block font-medium">Nombre<input aria-label="Nombre" className={input} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" /></label>}
      <label className="block font-medium">Correo<input aria-label="Correo" className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
      <label className="block font-medium">Contraseña<input aria-label="Contraseña" className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={signup ? "new-password" : "current-password"} /></label>
      {message && <p role="status" className="text-sm text-brand">{message}</p>}
      <Button className="w-full" disabled={busy} type="submit">{busy ? "Un momento…" : signup ? "Registrarme" : "Entrar"}</Button>
      <Button variant="ghost" className="w-full" type="button" onClick={() => { setSignup(!signup); setMessage(""); }}>{signup ? "Ya tengo cuenta" : "Crear cuenta"}</Button>
    </form>
  </section>;
}