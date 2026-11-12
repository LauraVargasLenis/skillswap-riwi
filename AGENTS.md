<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.

<!-- LOVABLE:END -->

## Project rules

- SkillSwap business rules (balances, reservations, confirmations, transfers) live only in the pure module `src/lib/skillswap/engine.ts` with tests beside it; UI calls them through `dispatch`, so rules stay testable and UI-independent.
- Balances are derived from the movements ledger (never stored as a number), and a transfer is keyed by session id, so a session can never move minutes twice.
- Demo actions use `dispatchSaved` in `src/lib/skillswap/store.ts`, with Web Locks and fresh ledger reads before atomic storage writes; this serializes balance validation across browser tabs.
- Real accounts use HttpOnly Cloud Auth cookies and server-verified identities, never browser token storage; this keeps the demo isolated from account authentication.
- Real account state is a private aggregate with atomic revision compare-and-swap; server actions re-run the pure engine on conflicts to prevent concurrent overspending and duplicate transfers.
- Aggregate reads project public profile/rescue fields and only participant sessions and holder movements after verifying identity; direct Data API access to aggregate state is denied.
- Active simulation uses the ordinary local demo ledger, never the legacy Cloud test functions; the testing context only selects the demo while signed into a real account, keeping real data isolated.
- Ledger debits carry source allocations and accepted sessions carry reservation allocations; derived earned availability excludes reservations, so withdrawals cannot spend held minutes.
- Symbolic topups and withdrawals use stable operation IDs and commit a single ledger movement with each balance change; retrying an operation cannot duplicate it.
- Availability uses multiple non-overlapping per-day entries and legacy normalization at read/action boundaries; the pure engine validates schedules, blocked dates and reservations so demo/account rules remain identical.
- Scheduled instants use Temporal with IANA zones; anonymous busy intervals are projected separately from participant-only sessions to preserve reservation privacy.
- Reprogramming keeps the original accepted reservation until the other participant accepts under aggregate CAS; scheduled completion is time-gated and new immediate rescues require recorded attention.
- Exchange messages and notifications use the private aggregate with participant/owner projections, stable event keys and atomic writes; clients refresh them automatically without exposing other users' rows.
- Early demo completion requires a server-verified protected admin role and an audit record, then changes only the isolated local demo ledger; real aggregate actions reject it so real balances cannot be affected.

- Nuevos datos (reseñas, onboarding, reportes y restricciones) se guardan como campos aditivos dentro del agregado existente; no modificar migraciones gestionadas por Lovable sin su canal autorizado.
- Las reseñas requieren sesión `completed` de un participante, con clave lógica `(sessionId, authorId)`; los contadores y logros se derivan de sesiones completadas, jamás de contadores editables.
- `src/lib/skillswap/insights.ts` concentra matching explicable y estadísticas; no usar generadores externos para estas decisiones.
- El modo presentación (`presentation`, `scenarioId`) funciona exclusivamente sobre la demo local; sus acciones se rechazan en `applySharedAction`. Las operaciones administrativas reales usan verificación `has_role(admin)` del servidor.
- El identificador demo `vanessa` pertenece al perfil visible **Juan Daniel**; preservarlo durante migraciones futuras.
