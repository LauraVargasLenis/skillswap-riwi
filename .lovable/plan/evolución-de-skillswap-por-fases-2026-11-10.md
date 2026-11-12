# Evolución de SkillSwap por fases

## Alcance y continuidad
Trabajar sobre SkillSwap existente, conservando la identidad violeta y menta, la tipografía, los cuatro destinos de navegación y la barra lateral despejada. Conservar perfiles, horarios, sesiones, rescates y movimientos; no sustituir la aplicación ni activar operaciones de dinero real.

Cada fase tendrá implementación funcional, guardado, controles de permisos, pruebas y un resumen de resultados antes de pasar a la siguiente. La primera entrega será la **Fase 1 completa**; las demás quedan ordenadas en la hoja de trabajo, no presentadas como funcionalidades terminadas.

## Fase 1 — Reservas y agenda
- Ampliar «Cuándo estoy disponible» para agregar y quitar varias franjas por día, ordenadas de lunes a domingo, sin superposiciones. Reutilizar los campos actuales y conservar horarios antiguos.
- Incorporar fechas bloqueadas y una zona horaria editable, inicialmente `America/Bogota`. Mostrar la zona horaria durante la reserva para evitar ambigüedades.
- En «Solicitar sesión», conservar habilidad, duración de 15 o 30 minutos y mensaje; añadir calendario de fechas disponibles y selección de hora. Mostrar solo intervalos que contengan toda la duración y no choquen con reservas aceptadas de los participantes ni fechas bloqueadas.
- Guardar fecha, hora y zona horaria también en el borrador recuperable después de recargar minutos. Revalidarlas al enviar y al aceptar: una solicitud pendiente no bloquea un horario, una aceptada sí.
- Proteger las reservas frente a solicitudes concurrentes con la misma escritura atómica que ya protege los minutos. No exponer sesiones privadas de terceros para mostrar horarios ocupados.
- Mostrar programación y acción pendiente en Mis intercambios. Permitir proponer, aceptar o rechazar una reprogramación. Mantener la reserva original hasta que la otra persona acepte la nueva, con una nueva validación de conflictos.
- Impedir confirmaciones de sesiones programadas antes de su hora de finalización. Para rescates inmediatos nuevos, registrar inicio y atención terminada antes de las confirmaciones bilaterales; conservar el flujo compatible de sesiones antiguas sin fecha.
- Ordenar «Tu próxima sesión» por fecha y hora, excluyendo sesiones terminadas y sin programación; no usar el orden de creación como sustituto de una fecha.

### Verificación de la Fase 1
Probar dos franjas de lunes (08:00–10:00 y 14:00–16:00), martes independiente, persistencia y compatibilidad con horarios anteriores. Probar franjas inválidas o superpuestas, fecha bloqueada, sesiones de 15 y 30 minutos, reserva simultánea, cancelación que libera horario y minutos, rechazo de reprogramación y aceptación bilateral sin perder la reserva anterior. Verificar confirmación anticipada bloqueada, transferencia única tras doble confirmación, próxima sesión por fecha y edición en celular sin desplazamiento horizontal. Comprobar el recorrido tanto en demo como con cuentas reales autorizadas disponibles.

## Fase 2 — Comunicación y notificaciones
- Conversación privada por intercambio, integrada en un panel desde Mis intercambios: texto, código, hora, mensajes propios/recibidos, persistencia, actualizaciones y errores de envío.
- Enlace de reunión opcional, sin construir videollamadas.
- Campana con notificaciones persistentes, leídas/no leídas, contador, apertura del intercambio correspondiente y deduplicación por evento.
- Incluir recordatorios de sesiones próximas y preferencias. Correos solo si un servicio real está configurado y comprobado; no simular entregas.

## Fase 3 — Perfiles y reputación
- Foto, nombre, descripción, niveles de habilidades y enlaces profesionales opcionales.
- Valoraciones de 1 a 5 estrellas y reseña breve, una por participante y sesión completada con doble confirmación.
- Promedios y conteos derivados de datos reales; «Nuevo en SkillSwap» cuando no haya reseñas.
- Estadísticas verificadas de enseñanza, aprendizaje, sesiones y personas ayudadas.

## Fase 4 — Incorporación y recomendaciones
- Bienvenida guiada con cinco pasos, indicador de progreso, retorno, omisión y guardado; no repetirla tras terminarla.
- Reutilizar la edición de habilidades y horarios.
- «Recomendados para ti», compacta, sin reemplazar buscador ni listado general: coincidencias pertinentes, reciprocidad, disponibilidad compatible, experiencia y reputación verificadas. Mostrar motivos comprensibles, sin calificaciones inventadas ni recomendaciones de uno mismo.

## Fase 5 — Comunidad y confianza
- Rescates relevantes según habilidades, distinción entre atención inmediata y programada, historial y avisos según preferencias; nunca asignar ayudas automáticamente.
- «Mi impacto en SkillSwap» con insignias derivadas de intercambios efectivamente completados, sin duplicados.
- Reportes y disputas desde Mis intercambios; una disputa abierta bloquea la transferencia pendiente hasta resolución autorizada.
- Administración separada de la navegación normal, accesible solo a administradores verificados: usuarios, métricas, moderación, restricciones y registro auditable de decisiones. No conceder administración a ninguna cuenta por defecto.

## Fase 6 — Pulido final
Verificar escritorio, tableta y celular; teclado, foco, contraste, etiquetas, estados vacíos y errores; rendimiento y consistencia visual. Ejecutar pruebas de regresión y revisar las comprobaciones automáticas del entorno, sin dar por terminada una función que solo muestre ejemplos.

## Detalles técnicos
- Conservar `engine.ts` como autoridad de reglas y `types.ts` como contratos; ampliar `availability.ts` para compatibilidad y reutilizar `use-app.ts` para acciones.
- Mantener los saldos derivados del libro de movimientos, las reservas de minutos y las transferencias únicas por sesión.
- Reutilizar el agregado privado con revisión compare-and-swap para que reservas, cambios de horario y minutos se validen juntos en el servidor. La demo conserva su guardado serializado, separado de cuentas reales.
- Almacenar instantes programados inequívocos y zona horaria IANA. Incorporar datos de disponibilidad libre como proyección autorizada, sin revelar identidad, tema ni conversación de reservas ajenas.
- Usar cambios aditivos y las migraciones administradas cuando haga falta ampliar estructuras o permisos; no editar archivos generados ni borrar historial.
- Mantener la identidad verificada por cookies HttpOnly existente. Filtrar nuevos datos privados por participante o titular; roles administrativos en una estructura protegida separada, nunca en datos de perfil editables.
- Añadir pruebas concretas junto a las actuales para cada regla nueva y ejecutar las pruebas afectadas y de regresión. Revisar metadatos propios de todas las páginas de contenido.

## Condiciones reales
La asignación del primer administrador requerirá identificar una cuenta autorizada, sin elevar privilegios automáticamente. Los correos dependerán de una integración comprobada. Si una verificación con cuentas reales requiere una autorización o identidad no disponible, se informará el límite y no se presentará como aprobada.