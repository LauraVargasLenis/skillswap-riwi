import { Star, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/skillswap/avatar";
import { ratingsFor } from "@/lib/skillswap/insights";
import type { DemoState, Profile } from "@/lib/skillswap/types";

export function PublicProfileDialog({ person, state }: { person: Profile; state: DemoState }) {
  const reviews = (state.reviews ?? []).filter((r) => r.targetId === person.id);
  const rating = ratingsFor(state.reviews ?? [], person.id);
  return <Dialog><DialogTrigger asChild><Button variant="outline" size="sm" className="w-full">Ver perfil y reseñas</Button></DialogTrigger>
    <DialogContent className="max-h-[86vh] max-w-xl overflow-y-auto">
      <DialogHeader><DialogTitle>Perfil de {person.name}</DialogTitle><DialogDescription>Especialidades, experiencia y valoraciones verificadas por intercambios completados.</DialogDescription></DialogHeader>
      <div className="flex items-center gap-4"><UserAvatar userId={person.id} src={person.photoUrl} name={person.name} size="lg" /><div><h3 className="font-bold">{person.name}</h3><p className="text-sm text-muted-foreground">{person.tagline}</p><p className="mt-1 flex items-center gap-1 text-sm"><Star className="size-4 fill-current text-brand" /> {rating.average === null ? "Aún sin valoraciones" : `${rating.average.toFixed(1)}/5 · ${rating.count} reseñas`}</p></div></div>
      {person.bio && <p className="text-sm leading-relaxed">{person.bio}</p>}
      <div><h3 className="font-semibold">Especialidades</h3><ul className="mt-2 space-y-2">{person.teaches.map((skill) => <li className="rounded-xl bg-brand-softer p-3 text-sm" key={skill.id}><strong>{skill.name}</strong> · {skill.category} <span className="text-muted-foreground">· {skill.level ?? "Inicial"}</span></li>)}</ul></div>
      <div className="flex flex-wrap gap-4 text-sm">
        {person.portfolioUrl && <a className="inline-flex items-center gap-1 font-semibold text-brand underline" href={person.portfolioUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> Portafolio</a>}
        {person.githubUrl && <a className="inline-flex items-center gap-1 font-semibold text-brand underline" href={person.githubUrl} target="_blank" rel="noopener noreferrer"><Github className="size-4" /> GitHub</a>}
      </div>
      <div><h3 className="font-semibold">Reseñas verificadas</h3>
        {reviews.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Sin reseñas todavía.</p> : <ul className="mt-2 space-y-2">{reviews.slice().reverse().map((r) => <li className="rounded-xl border border-border p-3 text-sm" key={r.id}><div className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-current text-brand" /> {r.rating}/5 · {state.profiles[r.authorId]?.name ?? "Participante"}</div><p className="mt-2">{r.comment}</p><p className="mt-1 text-xs text-muted-foreground">Valoración posterior a sesión completada</p></li>)}</ul>}
      </div>
    </DialogContent>
  </Dialog>;
}
