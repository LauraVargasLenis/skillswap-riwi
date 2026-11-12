- [x] Guardar horarios independientes por día y conservar horarios anteriores.
- [x] Actualizar Mi perfil, tarjetas y filtro de Explorar.
- [x] Verificar persistencia, edición aislada, validación y celular en la demo.
- [x] Integrar recargas inmediatas y borradores en el guardado de la demo.
- [x] Separar origen de minutos, reservas y retiros simbólicos únicos.
- [x] Verificar los cuatro casos de aceptación y persistencia en escritorio y móvil.
- [x] Añadir paquetes configurables y recargas simuladas aisladas en Cloud.
- [x] Conservar solicitudes sin saldo y permitir revisarlas tras recargar.
- [x] Verificar rechazo, aprobación única y sesión de Laura con saldo final de 15.
- [x] Actualizar y migrar los cuatro perfiles de demo conservando historial.
- [x] Añadir cuentas por correo y datos compartidos con permisos privados.
- [x] Ejecutar reglas en servidor con transacciones y cancelación de sesiones.
- [x] Verificar demo, dos cuentas, cancelación, transferencia única y persistencia.

## Evolución profesional — fases solicitadas

- [x] Fase 1: implementar franjas múltiples, fechas bloqueadas, zona horaria, validación de reservas, reprogramación bilateral y próxima sesión por fecha.
- [x] Fase 1: verificar guardado, solicitud, aceptación, reprogramación y celular en demo; ejecutar 58 pruebas y lint de archivos afectados.
- [ ] Fase 1: verificar recorrido con dos cuentas reales y concurrencia real; bloqueado por falta de sesión autorizada de cuenta real.
- [x] Fase 2: chat privado por intercambio, persistente y con actualización automática, enlaces de reunión y acceso móvil.
- [x] Fase 2: centro de notificaciones persistente, deduplicado, con lectura, contador, recordatorios y apertura del intercambio.
- [x] Fase 2: cierre anticipado de sesiones demo con rol administrador verificado, auditoría y transferencia única aislada de cuentas reales.
- [x] Fase 2: verificar chat, avisos, cierre bilateral, transferencia única, lectura, persistencia, rechazo sin rol y móvil/escritorio en demo; 65 pruebas y lint aprobados.
- [ ] Fase 2: verificar con dos cuentas reales y con administrador autorizado; bloqueado por falta de sesión real disponible y porque ninguna cuenta tiene asignado ese rol.
- [x] Fase 3 (código): biografía, fotografía editable, especialidades y experiencia, enlaces a portafolio/GitHub, reseñas posteriores a sesiones completadas (máximo una por participante/sesión) y visualización del perfil público.
- [ ] Fase 3 (verificación): comprobar interfaz final y reseñas entre dos cuentas reales.
- [x] Fase 4 (código): onboarding progresivo persistido por perfil y recomendaciones explicables por habilidades, reciprocidad, experiencia, horarios y valoración. Demostrables desde los cuatro perfiles.
- [ ] Fase 4 (verificación): pruebas de navegación real con cuenta nueva y distintos husos horarios.
- [x] Fase 5 (código): rescates inmediatos/programados con notificaciones a perfiles compatibles, ordenación por relevancia y registro de completados; insignias derivadas de sesiones confirmadas; reportes de participantes, decisiones administrativas auditadas y restricciones con autorización real de rol `admin`.
- [x] Modo presentación (código): ocho escenarios independientes, cambios de los cuatro perfiles, administrador demo exclusivamente local, preparación/reinicio por escenario y conservación de confirmación bilateral.
- [x] Pruebas nuevas del núcleo: 10 escenarios de reglas probados con transpilación y stubs de librerías ausentes; TypeScript del núcleo verificado.
- [ ] Validación de integración con dependencias reales: ejecutar `npm run build`, `npm run test` y pruebas end-to-end reales.
- [ ] Fase 6: validar exhaustivamente permisos, regresiones, accesibilidad y experiencia en celular, tableta y computador; no ejecutada por indisponibilidad de instalación de dependencias/navegador.
- [ ] Finalizar con dos cuentas autenticadas y un administrador real autorizado; pendiente de acceso al entorno en vivo.

Ver `VALIDACION_PRO.md` para el estado exacto y las limitaciones de prueba. No se considera cerrada la fase de integración hasta ejecutar la suite y los recorridos end-to-end.
