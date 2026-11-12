# SkillSwap PRO · RIWI

Plataforma de intercambio de conocimientos y asesorías por minutos. Evoluciona la aplicación existente: **no reemplaza** el motor de transferencias, la agenda, el chat ni las cuatro secciones originales.

## Ejecutar el proyecto

```bash
npm install
npm run dev
npm run test
npm run build
```

También puedes utilizar Bun (`bun install`, `bun run dev`, `bun run test`). Es un proyecto TanStack Start + React + TypeScript + Tailwind. Las cuentas reales usan Supabase y deben tener las variables de entorno adecuadas. La demo emplea el almacenamiento local del navegador y no modifica cuentas ni saldos reales.

## Las cuatro pantallas

| Pantalla | Funciones |
| --- | --- |
| **Explorar** | Buscar, filtrar, ver perfiles completos, reseñas verificadas, recomendaciones personalizadas y solicitar asesorías. |
| **Rescates** | Publicar ayudas inmediatas o programadas, priorizar rescates compatibles, aceptar, programar y consultar resueltos. |
| **Mis intercambios** | Solicitudes, reservas, chat privado con Meet, reprogramaciones, confirmación bilateral, reportes, reseñas e historial de minutos. |
| **Mi perfil** | Biografía, foto, enlaces, especialidades, experiencia, habilidades, agenda de múltiples franjas, onboarding e impacto/insignias. |

El acceso a **Moderación** es un control contextual en la barra superior, no una quinta sección del menú. Solo se habilita para un administrador real verificado en el servidor o para el **Administrador demo** dentro del panel de presentación local.

## Perfiles de la demostración

| Perfil visible | ID interno | Enseña | Quiere aprender | Saldo inicial |
| --- | --- | --- | --- | --- |
| Emmanuel | `emmanuel` | Python | CSS y Flexbox | 30 min |
| Laura | `laura` | HTML y CSS | Inglés | 0 min |
| Juan Daniel | `vanessa` | Inglés | Python y Git | 30 min |
| Juan Manuel | `juan-manuel` | Git y GitHub | Python | 75 min ganados |

El identificador heredado `vanessa` se conserva deliberadamente para no romper referencias históricas.

## Presentación interactiva

1. Entra a la demo sin iniciar sesión, o abre el entorno demo desde la aplicación.
2. En el aviso superior pulsa **Modo presentación**.
3. Elige un escenario y pulsa **Preparar demostración**. Se precargan datos de ejemplo, pero la aprobación, los mensajes y las confirmaciones usan las mismas acciones del motor.
4. Cambia de persona mediante **Ver como**. Observa sus sesiones, avisos, recomendaciones y saldos individuales.
5. Para cerrar una sesión de prueba sin esperar, activa **Administrador demo**, entra a **Mis intercambios** con uno de los participantes, pulsa **Finalizar ahora (demo)** y confirma desde ambos perfiles. La transferencia se registra una vez.
6. **Reiniciar escenario** borra los datos vinculados a ese escenario sin borrar los demás. El botón general ↺ reinicia toda la demo local.

### Escenarios disponibles

1. **Agenda inteligente:** horarios distintos según día y persona, múltiples franjas y reprogramación.
2. **Chat y notificaciones:** solicitud Laura → Emmanuel; cambiar de perfil para aceptar, conversar y mostrar avisos privados.
3. **Perfiles y reputación:** sesión de ejemplo completada, reseña verificada y estadísticas.
4. **Onboarding:** reinicia temporalmente la bienvenida del perfil seleccionado, sin borrar permanentemente su información.
5. **Matching:** Laura → Juan Daniel por inglés, con explicaciones de compatibilidad.
6. **Gamificación:** cinco sesiones de ejemplo completadas de Emmanuel, logros comprobables y diferentes niveles entre participantes.
7. **Administración:** reporte ficticio, resolución, historial y restricciones simuladas.
8. **Rescates:** cuatro ayudas de ejemplo compatibles con los diferentes perfiles.

## Arquitectura y seguridad

- **Motor:** `src/lib/skillswap/engine.ts` centraliza validación, acciones, permisos entre participantes, reservas, cierres y movimientos idempotentes.
- **Indicadores:** `src/lib/skillswap/insights.ts` calcula reputación, impacto, insignias y coincidencias sin IA generativa.
- **Demo:** `src/lib/skillswap/store.ts` mantiene datos bajo `skillswap-demo-v1`, con Web Locks entre pestañas. `migrate-demo.ts` conserva los campos existentes.
- **Cuentas reales:** `accounts.functions.ts` obtiene la identidad con cookies seguras, proyecta únicamente mensajes/sesiones privados y usa una operación atómica con verificación de revisión. Las nuevas propiedades viajan dentro del agregado JSON; no se han editado migraciones protegidas por Lovable.
- **Moderación real:** las acciones `moderateReport` y `setUserRestriction` se autorizan en servidor consultando `has_role(admin)`. Ninguna acción demo puede afectar el agregado productivo.
- **Auditoría demo:** local, descriptiva y claramente ficticia. No otorga un rol real.

## Pruebas y limitaciones verificadas

Se añadieron pruebas en `src/lib/skillswap/pro-evolution.test.ts`. Se ejecutaron **10 pruebas del motor** con transpilación de TypeScript y sustitutos de dependencias para la validación aislada, además de comprobación estática de tipos del núcleo. El entorno actual no pudo instalar dependencias para ejecutar Vite/Vitest completos ni una sesión real de Supabase. Por ello **no se afirma que la experiencia en navegadores o con cuentas reales esté verificada**. Ver `VALIDACION_PRO.md` y `roadmap.md` para detalles y pendientes.
