APLICACIÓN: 
- SKILLSWAP

INTEGRANTES:
1. Daniel Ortiz
2. Emmanuel Silva
3. Laura Vargas
4. Juan Manuel Zapata


PROMPTS  UTILIZADOS

Se realizó la mayor parte de la aplicación en Lovable
Se terminó en ChatGPT debido a que no se contaban con más tokens en lovable

________________________________________________
PROMPT 1
________________________________________________
Construye SkillSwap, una aplicación web en español para que los coders de RIWI intercambien ayuda usando minutos como créditos. Usa la imagen adjunta como referencia de la interfaz. Conserva su composición, la marca SkillSwap y la adaptación a celular. Mantén limpia la parte inferior de la barra izquierda, sin la ilustración de las manos ni el texto promocional. Usa violeta #6B5CFF como color principal, violeta oscuro #4E35DF para botones con texto blanco, verde menta #5ACCA4 para créditos y disponibilidad, fondo claro #F9FAFC y texto oscuro #1A1A3E. Prioriza el botón «Pide un rescate». Usa «Personas que te pueden ayudar» como título de la sección de perfiles. Implementa cuatro vistas:

Explorar. Muestra perfiles con habilidad, disponibilidad y botón «Solicitar sesión». Incluye un buscador y filtros que funcionen.
Rescates. Permite publicar una duda con título, descripción, categoría y duración de 15 o 30 minutos. Otra persona puede aceptar el rescate. Muestra los estados «Abierto», «Aceptado» y «Completado».
Mis intercambios. Muestra sesiones pendientes, confirmaciones, saldo en minutos e historial de movimientos. Las solicitudes de sesión desde Explorar deben aparecer aquí.
Mi perfil. Permite editar qué enseño, qué quiero aprender y cuándo estoy disponible. Incluye tres perfiles de prueba y un selector visible para cambiar entre ellos desde el mismo navegador. Emmanuel empieza con 30 minutos y una duda de CSS lista para publicar. Laura empieza con 0 minutos y ofrece ayuda en HTML y CSS. Vanessa empieza con 30 minutos y ofrece conversación en inglés. La persona que recibe ayuda transfiere a quien la ofrece los minutos que dura la sesión. Registra el movimiento una sola vez y únicamente cuando ambas personas hayan confirmado. Al aceptar una sesión, reserva esos minutos del saldo disponible para evitar que se gasten en otra. Impide aceptar tu propio rescate, aceptar sesiones con saldo insuficiente y duplicar transferencias al pulsar dos veces o recargar. Una solicitud pendiente no transfiere minutos. Construye primero el flujo de Rescates y Mis intercambios. Desde la vista previa debo poder cambiar de perfil, publicar, aceptar, confirmar desde ambos lados y ver el saldo actualizado. Luego completa Explorar y Mi perfil. Incluye en el README cómo ejecutar la app y cómo reproducir la demo. Para esta primera versión, guarda los datos en localStorage y permite reiniciar la demo. Usa avatares de ejemplo, botones funcionales, formularios con etiquetas y navegación por teclado. Verifica que el flujo completo se pueda demostrar desde un solo navegador sin configurar cuentas ni servicios externos.

_______________________________________________
PROMPT 2
_______________________________________________
Actualiza el proyecto existente de SkillSwap sobre el código actual. Reutiliza sus pantallas y componentes. Conserva Explorar, Rescates, Mis intercambios y Mi perfil, así como el diseño violeta y menta.

Actualiza los perfiles de la demo. Cambia el nombre del perfil existente de Vanessa a Juan Daniel y reemplaza su avatar. Conserva la habilidad de inglés conversacional, el saldo, el historial y las referencias del perfil. Si adjunto una foto de Juan Daniel, úsala como avatar. Si no hay foto, usa un avatar ilustrado provisional. Agrega un perfil nuevo para Juan Manuel, con un avatar distinto, 30 minutos iniciales de prueba y Git y GitHub como habilidad editable de ejemplo. Conserva los perfiles de Emmanuel y Laura. Actualiza las tarjetas, el selector «Ver como», las solicitudes y los textos de ejemplo para que muestren los nombres correctos.

Cuentas y datos. Agrega registro, inicio y cierre de sesión con correo. Guarda perfiles, habilidades, disponibilidad, rescates, sesiones, confirmaciones, reservas y movimientos de minutos en la base de datos. Una cuenta debe ver la misma información al entrar desde otro dispositivo. En el modo con cuentas reales, elimina la dependencia de localStorage para los datos y la autenticación. Mantén el modo demo separado y claramente identificado, con su selector de cuatro perfiles. Cada cuenta real actúa únicamente desde su propio perfil.

Permisos y reglas. Muestra en Explorar solo los campos públicos de los perfiles. Restringe los detalles de cada intercambio a sus participantes y el historial de minutos a su titular. Ejecuta las operaciones de saldo en el servidor.

Al aceptar una sesión, comprueba el saldo disponible de quien recibe ayuda y reserva 15 o 30 minutos. Publicar un rescate o enviar una solicitud deja el saldo intacto.
La primera confirmación mantiene la reserva. La segunda completa la sesión y registra una sola transferencia. Aplica los cambios en una transacción para impedir que se gasten o se transfieran los mismos minutos dos veces.
Permite que cualquiera de los dos participantes cancele una sesión aceptada mientras falte alguna confirmación. Pide confirmación antes de cancelar, libera los minutos y guarda la cancelación en el historial. Si la sesión venía de un rescate, vuelve a abrirlo para que otra persona pueda aceptarlo.
Verifica que la demo muestre a Emmanuel, Juan Daniel, Laura y Juan Manuel, con el avatar nuevo de Juan Daniel y el historial del perfil conservado. Con dos cuentas de prueba en navegadores separados, comprueba que un rescate se pueda aceptar, cancelar después de la primera confirmación y volver a aceptar. Completa el segundo intento y verifica que el saldo persista al volver a iniciar sesión y que exista una sola transferencia

_______________________________________________
PROMPT 3
_______________________________________________
Sobre la versión actualizada de SkillSwap, agrega «Recargar minutos» junto al saldo y en Mis intercambios. Ofrece paquetes configurables de 15, 30 y 60 minutos con precios de ejemplo en pesos colombianos.

Cuando alguien prepare una solicitud y le falten minutos, indica cuánto le falta y ofrece recargar. Conserva el perfil elegido, el tema y la duración. Al regresar, muestra el borrador para que la persona revise y envíe la solicitud.

Implementa la recarga en un modo de prueba claramente identificado, separado de las cuentas y los saldos reales. Permite simular un pago aprobado o rechazado. Guarda la recarga y su estado en la base de datos de prueba. Acredita los minutos desde el servidor una sola vez cuando se apruebe. Una recarga pendiente o rechazada deja el saldo intacto. Distingue en el historial «Recarga de minutos», «Minutos ganados» y «Minutos usados». Mantén el cobro real deshabilitado hasta configurar la pasarela y los precios definitivos.

Verifica este recorrido. Laura tiene 0 minutos e intenta pedir 15 minutos de inglés a Juan Daniel. Prueba primero una recarga rechazada y comprueba que siga con 0. Después aprueba una recarga de 30 minutos, retoma la solicitud y complétala desde ambos perfiles. Laura debe quedar con 15 minutos y ver un único abono de +30 y un intercambio de −15.

_______________________________________________
PROMT 4
_______________________________________________
Actualiza el proyecto existente de SkillSwap sobre el código actual. Conserva el diseño violeta y menta y mantén los minutos como unidad de todos los intercambios. Agrega la recarga y el retiro simbólico al mismo modo demo, con saldos e historial separados de las cuentas reales. Los valores en COP son referencias para la simulación.

1. Recargar minutos

Conserva el diseño de «Recargar minutos · Prueba» y los tres paquetes con sus precios de referencia:

15 minutos · $5.000 COP
30 minutos · $9.000 COP
60 minutos · $16.000 COP
Cambia «Preparar recarga de prueba» por «Recargar» y muestra debajo «Recarga simbólica. No se realizará ningún cobro». Al pulsar el botón, abona de inmediato los minutos al perfil activo y registra un solo movimiento, por ejemplo, «Recarga simbólica · +30 min». Completa la recarga dentro de la misma pantalla, sin pasarela ni datos de pago.

Corrige el error «No pudimos guardar la prueba. Intenta de nuevo». Usa el mecanismo con el que la demo ya guarda sus saldos y movimientos. Actualiza la pantalla y muestra la confirmación después de guardar el abono. Si el usuario llegó desde una solicitud con saldo insuficiente, conserva el perfil elegido, el tema y la duración. Tras la recarga, habilita «Volver y revisar solicitud» para que pueda enviarla manualmente.

2. Usar minutos en intercambios

Cuando se acepta una sesión, reserva los minutos de quien solicita ayuda. Cuando ambos participantes confirman, descuenta los minutos reservados y abónalos a quien enseñó como minutos ganados en un intercambio. Si la sesión se cancela, libera la reserva y conserva el origen de los minutos.

Distingue dos tipos de minutos dentro del mismo saldo:

Minutos de bienvenida o recarga simbólica. Se pueden usar para solicitar ayuda.
Minutos ganados al enseñar. Se pueden usar para solicitar ayuda o para hacer un retiro simbólico, siempre que estén disponibles y sin reservar.
Al reservar minutos para una sesión, usa primero los de bienvenida o recarga y luego los ganados. Registra cuántos se reservaron de cada tipo. En «Mis intercambios», muestra minutos disponibles para aprender, minutos reservados y minutos ganados disponibles para retiro. Aclara que estos últimos son parte del saldo disponible, para que la persona no los sume dos veces.

3. Retirar minutos ganados

Agrega el botón «Retirar» junto a la equivalencia «60 minutos ganados = $16.000 COP». Permite retirar en bloques completos de 60 minutos. Antes de confirmar, muestra cuántos minutos se descontarán y el importe simulado. Si hay menos de 60 minutos ganados disponibles, indica cuántos faltan.

Al confirmar, descuenta los minutos ganados disponibles y registra un único movimiento, por ejemplo, «Retiro simbólico · −60 min · $16.000 COP». Identifica el flujo como «Simulación · Sin transferencia de dinero real» y complétalo dentro de SkillSwap, sin solicitar datos bancarios.

4. Guardado y pruebas de aceptación

Usa el mismo historial de la demo para distinguir recargas, minutos ganados, minutos usados y retiros. Guarda cada cambio de saldo junto con su movimiento. Evita que un doble clic o un reintento duplique una recarga o un retiro. Vuelve a validar el saldo al guardar para impedir que los mismos minutos se reserven y se retiren a la vez.

Recarga. Juan Daniel empieza con 30 minutos y recarga otros 30 por $9.000 COP de referencia. Queda con 60 minutos disponibles para aprender, aparece un solo movimiento de +30 min y se conserva al actualizar la página. Los saldos de los demás perfiles siguen iguales.
Retiro. Juan Manuel tiene 75 minutos ganados disponibles y retira 60. La app muestra $16.000 COP de retiro simulado, deja 15 minutos disponibles para aprender y registra un solo retiro.
Origen del saldo. Un perfil con 60 minutos obtenidos únicamente por recarga simbólica puede usarlos para solicitar ayuda. Su saldo disponible para retiro es 0.
Reserva. Un perfil tiene 75 minutos ganados, de los cuales 30 están reservados para una sesión. Solo tiene 45 minutos disponibles para retiro, así que todavía no puede retirar un bloque. Si cancela la sesión antes de que ambos confirmen, recupera los 30 minutos reservados y vuelve a poder retirar.

_____________________________________________
PROMT 5
_____________________________________________
Actualiza la sección «Cuándo estoy disponible» de Mi perfil en el proyecto actual de SkillSwap. Actualmente, los días seleccionados comparten los mismos campos «Desde» y «Hasta». Quiero que cada día seleccionado tenga su propio horario.

Interfaz. Conserva los botones de lunes a domingo y el estilo violeta y menta. Al seleccionar un día, muestra una fila con su nombre y sus propios campos «Desde» y «Hasta». Ordena las filas de lunes a domingo. Si cambio el horario del martes, los horarios del lunes y el miércoles deben conservarse. Al desmarcar un día y guardar, ese día debe dejar de aparecer como disponible. Adapta las filas a celular para que se puedan editar sin desplazamiento horizontal.

Guardado y validación. Guarda la disponibilidad como una lista de días con su hora de inicio y fin. Si un perfil ya tiene un horario compartido, asígnalo inicialmente a cada uno de sus días seleccionados para conservar su disponibilidad. Antes de guardar, verifica que cada día activo tenga ambas horas y que «Hasta» sea posterior a «Desde». Si hay un error, indica el día que se debe corregir.

Explorar. Actualiza las tarjetas para mostrar el horario de cada día. Puedes agrupar los días que coincidan, por ejemplo, «Lun y mié · 2:00–4:00 p. m.» y «Mar · 8:00–10:00 a. m.». Haz que el filtro por día siga funcionando con la nueva disponibilidad.

Prueba de aceptación. Guarda lunes y miércoles de 2:00 a 4:00 p. m. y martes de 8:00 a 10:00 a. m.. Actualiza la página y comprueba que los tres horarios se conserven en «Mi perfil» y se vean correctamente en «Explorar». Luego cambia solo el martes a 9:00–11:00 a. m. y verifica que lunes y miércoles sigan de 2:00 a 4:00 p. m..


______________________________________________
PROMT 6 (Realizado en chatGPT, no se usó codex)
______________________________________________
# SkillSwap PRO — Completar funcionalidades y crear modo presentación con cuatro perfiles

Quiero evolucionar la versión actual de SkillSwap para completar las ocho mejoras estratégicas y disponer de un modo demostración completamente funcional utilizando los cuatro perfiles existentes.

**No reconstruyas el proyecto ni elimines lo implementado.** Trabaja sobre la arquitectura actual y revisa primero `roadmap.md`, `AGENTS.md`, las fases anteriores, los componentes y la lógica de negocio.

## 1. Estado actual y objetivo

Ya están desarrolladas funcionalidades importantes:

- Agenda con disponibilidad independiente por día, múltiples franjas y fechas bloqueadas.
- Solicitud y programación de asesorías.
- Reprogramación y prevención de conflictos.
- Chat privado por intercambio.
- Centro de notificaciones.
- Sistema de minutos y confirmación bilateral.
- Rescates.
- Finalización anticipada de sesiones demo mediante autorización administrativa.

Conserva todo lo anterior.

Las mejoras pendientes son:

1. Completar perfiles y reputación.
2. Implementar onboarding.
3. Implementar matching inteligente de habilidades.
4. Incorporar gamificación y estadísticas.
5. Implementar administración y moderación comunitaria.
6. Mejorar las recomendaciones de rescates.
7. Completar la integración de estas funcionalidades en los cuatro perfiles demo.

**Requisito fundamental:** cada nueva funcionalidad deberá funcionar tanto en la plataforma real como en el entorno de demostración, respetando las diferencias de persistencia y permisos.

## 2. Modo demostración con cuatro perfiles

Conservar los cuatro perfiles:

- Emmanuel: enseña Python y quiere mejorar CSS.
- Laura: enseña HTML y CSS y quiere aprender inglés.
- Juan Daniel: enseña inglés y quiere aprender programación.
- Juan Manuel: enseña Git y GitHub y quiere mejorar Python.

Mantener sus nombres, imágenes y características actuales.

El identificador interno heredado `vanessa` corresponde actualmente al perfil visible Juan Daniel. No cambiarlo sin una migración que preserve las referencias y los intercambios históricos.

### Selector de perfiles

Mantener el selector «Ver como» para cambiar entre los cuatro usuarios.

Al cambiar de perfil debe actualizarse:

- Saldo individual.
- Sesiones enviadas y recibidas.
- Mensajes.
- Notificaciones.
- Disponibilidad.
- Perfil y valoraciones.
- Recomendaciones personalizadas.
- Insignias y estadísticas.
- Rescates relevantes.

Los datos demostrativos deben mantenerse al actualizar la página y al cambiar de perfil.

El usuario activo solo debe observar su propia información privada, salvo las funciones explícitas de administración simulada.

## 3. Nuevo modo presentación

Incorporar un control discreto llamado «Modo presentación» visible únicamente dentro del entorno demo.

No agregar elementos permanentes en la parte inferior de la barra lateral.

Al activarlo, mostrar un panel compacto con:

- Escenarios disponibles.
- Perfil activo.
- Funcionalidad que se está demostrando.
- Acción siguiente sugerida.
- Botón «Preparar demostración».
- Botón «Reiniciar demostración».

El panel debe poder contraerse para mostrar la interfaz sin distracciones.

### Escenarios demostrativos

Permitir preparar escenarios funcionales para:

**Escenario 1: Agenda inteligente**

Mostrar disponibilidad diferente entre los cuatro perfiles, múltiples franjas, elección de fecha, reserva de horario, detección de conflictos y reprogramación.

**Escenario 2: Chat y notificaciones**

Preparar una solicitud entre Laura y Emmanuel para demostrar aceptación, conversación privada, envío de mensajes, enlace de Meet y notificaciones individuales.

**Escenario 3: Perfiles y reputación**

Mostrar perfiles completos, niveles de experiencia, valoraciones y reseñas verificadas.

**Escenario 4: Onboarding**

Permitir demostrar el recorrido de bienvenida y configuración de habilidades como si uno de los cuatro perfiles acabara de registrarse, sin borrar definitivamente su información.

**Escenario 5: Matching inteligente**

Mostrar recomendaciones relevantes entre los cuatro perfiles y explicar por qué fueron recomendados.

**Escenario 6: Gamificación**

Mostrar insignias, minutos enseñados, minutos aprendidos y progreso individual.

**Escenario 7: Administración**

Mostrar el panel de moderación con reportes ficticios claramente identificados como demostración, así como la finalización anticipada de asesorías demo.

**Escenario 8: Rescates inteligentes**

Mostrar rescates relacionados con las habilidades de los perfiles, recomendaciones de ayuda y finalización del intercambio.

Los escenarios pueden utilizar datos precargados de prueba, pero todas sus acciones deben ejecutarse mediante las reglas funcionales de SkillSwap. No crear botones decorativos o resultados falsamente presentados como operaciones reales.

Cada escenario debe poder reiniciarse de manera independiente sin eliminar los demás, salvo cuando exista una dependencia explícita.

## 4. Finalización anticipada para demostraciones

Actualmente el cierre anticipado necesita una cuenta real con rol administrador.

Quiero que exista una alternativa para presentaciones en el entorno demo aislado.

### Implementar dos comportamientos separados

**Administración real:**

- Mantener la verificación del rol administrador en el servidor.
- No conceder privilegios administrativos automáticamente.
- No permitir finalizar anticipadamente sesiones reales mediante la función demo.

**Administración simulada dentro del modo demo:**

- Permitir activar el rol «Administrador demo» desde el panel de presentación.
- Mostrar «Finalizar ahora (demo)» en las asesorías demostrativas aceptadas.
- Permitir cerrar anticipadamente la asesoría sin esperar 15 o 30 minutos.
- Generar las notificaciones correspondientes.
- Conservar la confirmación de ambos participantes.
- Registrar una única transferencia de minutos demostrativos.
- Mostrar el resultado en los historiales de ambos perfiles.

La administración demo no debe conceder permisos en la base de datos real ni utilizar endpoints administrativos privilegiados.

Este modo debe estar completamente aislado del entorno productivo.

## 5. Completar perfiles y reputación

Implementar:

- Fotografía editable.
- Biografía.
- Especialidades.
- Nivel de experiencia por habilidad.
- Enlaces opcionales a portafolio y GitHub.
- Estadísticas de sesiones.
- Valoraciones de 1 a 5 estrellas.
- Reseñas posteriores a sesiones completadas.

Las valoraciones deben corresponder a intercambios efectivamente completados, con una valoración por participante y sesión.

En la demo preparar ejemplos de perfiles con distinta experiencia y valoraciones.

Permitir completar un intercambio entre dos perfiles y demostrar cómo se registra una nueva reseña, actualizando los indicadores.

## 6. Onboarding

Crear un recorrido inicial que permita:

1. Conocer cómo funciona SkillSwap.
2. Seleccionar habilidades que se pueden enseñar.
3. Seleccionar conocimientos que se quieren adquirir.
4. Configurar disponibilidad.
5. Descubrir personas compatibles.

Guardar el progreso y no volver a mostrar el onboarding completo una vez terminado.

En el modo demo permitir reiniciar únicamente el onboarding del perfil seleccionado para mostrarlo durante una presentación.

## 7. Matching inteligente

Implementar recomendaciones a partir de:

- Habilidades ofrecidas.
- Habilidades que se quieren aprender.
- Horarios compatibles.
- Experiencia.
- Valoraciones.
- Posibilidad de intercambio recíproco.

Ejemplo:

Laura quiere aprender inglés y Juan Daniel enseña inglés. El sistema debe mostrarlo como una coincidencia relevante.

Si existe reciprocidad, destacarla con un mensaje claro.

Mostrar una sección «Recomendados para ti» en Explorar, sin reemplazar el buscador ni los filtros existentes.

El algoritmo debe funcionar con las cuentas reales y con los cuatro perfiles de demostración.

No implementar inteligencia artificial generativa si las coincidencias pueden resolverse de forma transparente con la información disponible.

## 8. Gamificación y estadísticas

Implementar en Mi perfil una sección «Mi impacto en SkillSwap».

Mostrar:

- Minutos enseñados.
- Minutos aprendidos.
- Sesiones completadas.
- Personas ayudadas.
- Valoración promedio.
- Insignias obtenidas.

Crear insignias automáticas por logros comprobables, como primera sesión, primera ayuda y cinco intercambios completados.

En demo, preparar diferentes niveles de avance para los cuatro perfiles y permitir demostrar cómo una sesión completada actualiza las estadísticas.

No contabilizar sesiones canceladas o duplicadas como logros.

## 9. Administración y confianza comunitaria

Implementar un panel administrativo independiente de las cuatro secciones principales.

Funciones:

- Resumen de usuarios y actividad.
- Reportes de comportamiento.
- Revisión de conflictos.
- Historial de decisiones administrativas.
- Seguimiento de intercambios disputados.
- Gestión de restricciones, con permisos adecuados.

Permitir reportar problemas desde Mis intercambios.

En demo, mostrar datos y reportes ficticios exclusivamente dentro del entorno aislado.

Las acciones administrativas reales deben seguir protegidas por validación del servidor.

## 10. Rescates inteligentes

Conservar la publicación y aceptación actual de rescates.

Agregar:

- Recomendaciones de rescates por habilidad.
- Priorización de rescates relevantes.
- Diferenciación entre ayuda inmediata y programada.
- Notificaciones a posibles colaboradores.
- Historial de rescates completados.

Preparar al menos un rescate apropiado para cada uno de los cuatro perfiles.

Permitir demostrar el flujo de publicación, recomendación, aceptación, conversación, confirmación y actualización de minutos.

## 11. Requisitos visuales

Conservar la estética violeta y menta de SkillSwap.

- Mantener las cuatro secciones principales.
- No saturar el menú lateral.
- Mantener su parte inferior despejada.
- Utilizar tarjetas y componentes existentes.
- Mantener el diseño adaptable a celulares.
- Evitar secciones repetidas.
- Incorporar mensajes claros de éxito y error.
- Garantizar accesibilidad.
- Integrar las mejoras dentro de los flujos actuales cuando sea posible.

El modo presentación debe ser una herramienta auxiliar, no una modificación radical de la experiencia de los usuarios normales.

## 12. Persistencia y datos

- Mantener los datos productivos separados de los demostrativos.
- Conservar saldos, reservas, movimientos e historiales reales.
- No realizar transferencias económicas reales.
- Mantener las recargas y retiros demostrativos como simulaciones.
- Conservar la integridad del libro de movimientos.
- Evitar movimientos duplicados.
- Preservar los datos existentes del almacenamiento local durante las actualizaciones.
- Implementar migraciones compatibles para nuevos campos.
- Permitir reiniciar exclusivamente la información demostrativa.

## 13. Implementación por fases

No te limites a cambiar un componente y declarar todo terminado.

Desarrolla en este orden:

**Fase A:** modo presentación para los cuatro perfiles, escenarios de agenda, chat, notificaciones y finalización anticipada.

**Fase B:** perfiles completos y reputación, tanto real como demo.

**Fase C:** onboarding y recomendaciones inteligentes, tanto real como demo.

**Fase D:** gamificación, rescates inteligentes y administración comunitaria, tanto real como demo.

**Fase E:** validación integral de los ocho escenarios.

Al completar cada fase, verificar las funciones reales y sus equivalentes de demostración.

Si no puedes completar todas las fases en una sola ejecución, detente en un límite funcional claro e indica exactamente qué quedó pendiente. No declares completadas funciones que solamente tienen interfaz.

## 14. Pruebas obligatorias

Verificar:

1. Los cuatro perfiles pueden seleccionarse sin perder información.
2. Cada perfil muestra únicamente sus mensajes y notificaciones privados.
3. Las solicitudes y los mensajes funcionan entre perfiles.
4. Los cambios persisten al recargar.
5. Las reservas respetan horarios y restricciones.
6. El modo presentación permite finalizar anticipadamente una sesión demo.
7. La finalización requiere confirmaciones y transfiere minutos una sola vez.
8. Las nuevas reseñas y estadísticas corresponden a eventos reales dentro del escenario demo.
9. Las recomendaciones cambian según el perfil activo.
10. Los reportes y controles administrativos simulados no afectan la plataforma real.
11. El modo demo funciona correctamente en celular y computador.
12. Los datos reales no se modifican al preparar, completar o reiniciar escenarios demo.

Actualizar `roadmap.md` y la documentación para reflejar los cuatro perfiles actuales y el estado real de cada funcionalidad.

**Resultado esperado:** una versión de SkillSwap que permita demostrar, desde los cuatro perfiles existentes, todas las funcionalidades principales de una plataforma profesional: descubrir personas, configurar horarios, reservar asesorías, conversar, recibir notificaciones, completar intercambios, valorar, obtener logros, recibir recomendaciones y gestionar la comunidad.

La demostración debe ser clara, interactiva, reproducible y totalmente independiente de las operaciones reales.