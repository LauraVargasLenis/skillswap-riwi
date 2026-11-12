# Fase 1 — Resultados y límites

## Implementado
Disponibilidad de varias franjas por día, rechazo de superposiciones y horas incompletas, fechas bloqueadas y zona horaria IANA; compatibilidad con horarios previos. Calendario y horas que contienen la duración completa y excluyen reservas de participantes. Borradores con programación, guardado privado para cuentas y local para demo. Aceptación con revalidación en el servidor bajo el compare-and-swap existente. Reprogramación propuesta y aceptada por la otra persona, sin sustituir anticipadamente la reserva original. Confirmación bloqueada antes del fin de sesiones programadas. Registro de inicio y fin de atención para nuevos rescates inmediatos, manteniendo sesiones antiguas. Próxima sesión ordenada por fecha.

## Archivos afectados
- Reglas y contratos: `engine.ts`, `types.ts`, `format.ts`, nuevo `time.ts`.
- Lectura y acciones privadas: `accounts.functions.ts`, conservando verificación por cookies y escritura CAS.
- Interfaz: `perfil.tsx`, `index.tsx`, `intercambios.tsx`, `request-session-dialog.tsx`; nuevos `availability-editor.tsx`, `schedule-picker.tsx`, `reschedule-dialog.tsx`.
- Pruebas: nuevo `scheduling.test.ts`; adaptación de pruebas de rescates en `engine.test.ts` y `account-rules.test.ts` para registrar atención.
- Arquitectura y dependencias: `AGENTS.md`, `package.json`, archivo de bloqueo de dependencias.

## Persistencia
No se necesitó una migración: el agregado JSON privado existente admite campos aditivos. Se conservaron el esquema, los registros y la función de escritura atómica. La lectura devuelve solo sesiones propias y horarios ocupados anónimos de terceros, sin temas, participantes ni datos privados de sus sesiones. Borradores se filtran por identidad.

## Verificación
- 58 pruebas automáticas aprobadas en 7 archivos, incluidas 15 nuevas pruebas de agenda: disponibilidad, conflictos, reservas, cancelación, reprogramación, confirmación, zona horaria y atención.
- Lint completo de archivos nuevos y modificados aprobado. La comprobación general de todo el proyecto reporta problemas de formato en archivos no normalizados (801 errores y 11 avisos antes de normalizar los afectados); no se reescribieron archivos ajenos a esta fase.
- Comprobación automática del entorno: último resultado `build OK`.
- Navegador: guardado de dos franjas del lunes y martes, recarga de página, solicitud de Juan Manuel a Emmanuel, aceptación, bloqueo de confirmación anticipada, propuesta y aceptación del cambio de hora desde ambos perfiles y conservación tras recargar. Sin errores de ejecución.
- Capturas de escritorio y celular revisadas; calendario y franjas sin desplazamiento horizontal en 390 px.

## Bloqueo real
No se pudo obtener una sesión autorizada para la cuenta de la solicitante: no hay una cuenta de la aplicación que coincida con su identidad. No se eligieron otras cuentas ni se fabricaron credenciales. El recorrido de cuentas reales y concurrencia real queda sin verificar hasta contar con una sesión autorizada; las pruebas de reglas y la demo no sustituyen esa comprobación.

## Pendiente
Las fases 2 a 6 permanecen pendientes siguiendo el orden aprobado; esta entrega no incorpora chat, notificaciones, reputación, incorporación, recomendaciones ni administración. La primera fase no se considera verificada por completo hasta completar el recorrido con cuentas reales.