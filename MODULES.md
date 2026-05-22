# MODULES.md — One Padel Academy

## Roles de Usuario

| Rol | Descripción |
|---|---|
| **Admin** | Gestión total de la academia. Acceso a todos los módulos. |
| **Coach** | Entrenador asignado a jugadores. Planifica, evalúa y gestiona sus grupos. |
| **Player** | Jugador de la academia. Accede a sus reservas, entrenamientos y perfil. |

Leyenda de permisos: ✅ Acceso total | 👁 Solo lectura | ✏️ Lectura + edición propia | ❌ Sin acceso

---

## Módulo 1 — Autenticación y Gestión de Usuarios

**Propósito:** Registro, login, gestión de perfiles y control de acceso por rol.

### Funcionalidades

- Registro e invitación de usuarios por email
- Login con email/contraseña y Google OAuth
- Recuperación de contraseña
- Gestión de perfil (avatar, datos personales, nivel de pádel)
- Asignación y cambio de roles
- Activación / desactivación de cuentas
- Historial de accesos

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Crear usuarios / invitar | ✅ | ❌ | ❌ |
| Ver lista de todos los usuarios | ✅ | ❌ | ❌ |
| Ver perfil de sus jugadores | ✅ | ✅ | ❌ |
| Editar perfil propio | ✅ | ✅ | ✅ |
| Cambiar rol de usuario | ✅ | ❌ | ❌ |
| Desactivar cuenta | ✅ | ❌ | ❌ |

---

## Módulo 2 — Reservas de Pistas

**Propósito:** Gestión del calendario de uso de las pistas de la academia.

### Funcionalidades

- Vista de calendario semanal/mensual de disponibilidad por pista
- Creación, modificación y cancelación de reservas
- Reservas individuales y recurrentes (clases fijas)
- Reglas de reserva (anticipación mínima/máxima, duración, solapamientos)
- Notificaciones automáticas de confirmación y recordatorio (email)
- Lista de espera cuando la pista está ocupada
- Bloqueo de pistas por mantenimiento o eventos

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Ver calendario completo | ✅ | ✅ | ✅ |
| Crear reserva para cualquier usuario | ✅ | ✅ | ❌ |
| Crear reserva propia | ✅ | ✅ | ✅ |
| Cancelar cualquier reserva | ✅ | ❌ | ❌ |
| Cancelar reserva propia | ✅ | ✅ | ✅ |
| Bloquear pista (mantenimiento) | ✅ | ❌ | ❌ |
| Crear reservas recurrentes | ✅ | ✅ | ❌ |
| Ver lista de espera | ✅ | ✅ | 👁 |

---

## Módulo 3 — Gestión de Instalaciones

**Propósito:** Administrar las pistas, equipamiento y espacios físicos de la academia.

### Funcionalidades

- Alta, edición y baja de pistas (nombre, tipo: indoor/outdoor, superficie)
- Estado de la pista (activa, en mantenimiento, cerrada)
- Gestión de equipamiento (inventario de palas, pelotas, etc.)
- Configuración de tarifas por pista y franja horaria
- Adjuntar imágenes de las instalaciones

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Crear / editar pistas | ✅ | ❌ | ❌ |
| Ver pistas disponibles | ✅ | ✅ | ✅ |
| Gestionar equipamiento | ✅ | ❌ | ❌ |
| Configurar tarifas | ✅ | ❌ | ❌ |

---

## Módulo 4 — Planificación de Entrenamientos

**Propósito:** Crear y gestionar planes de entrenamiento estructurados siguiendo el protocolo de periodización de One Padel.

### Protocolo de Planificación One Padel

La planificación sigue una jerarquía de tres niveles obligatoria:

```
Mesociclo
└── Microciclo (semana 1…N)
    └── Sesión
        ├── 1. Calentamiento
        ├── 2. Central 1 — Defensa
        ├── 3. Central 2 — Ataque
        └── 4. Vuelta a la calma
```

#### Nivel 1 — Mesociclo
Período largo de entrenamiento con un objetivo global definido.

| Campo | Descripción |
|---|---|
| Nombre | Identificador del mesociclo (ej. "Pretemporada Verano 2025") |
| Objetivo general | Foco principal del período (físico, técnico, táctico, competición) |
| Nivel del grupo | Iniciación / Intermedio / Avanzado / Élite |
| Duración | 4 a 8 semanas |
| Asignación | Uno o varios jugadores, o un Grupo de Entrenamiento (Módulo 12) |
| Estado | Borrador / Activo / Completado / Archivado |

#### Nivel 2 — Microciclo
Semana de entrenamiento dentro del mesociclo. Cada mesociclo contiene tantos microciclos como semanas tenga.

| Campo | Descripción |
|---|---|
| Número de semana | Semana 1, 2, 3… dentro del mesociclo |
| Objetivo semanal | Foco específico de esa semana |
| Número de sesiones | Cuántas sesiones se planifican esa semana |

#### Nivel 3 — Sesión
Clase individual dentro de un microciclo. Cada sesión se divide en exactamente **4 bloques obligatorios**:

| Bloque | Propósito | Ejercicios (Módulo 11) |
|---|---|---|
| **1. Calentamiento** | Preparación física y mental. Movilidad, activación. | Filtrado por temática: *Calentamiento* |
| **2. Central 1 — Defensa** | Trabajo técnico-táctico defensivo. Globos, bandeja, víbora, posicionamiento. | Filtrado por temática: *Técnica* / *Táctica* |
| **3. Central 2 — Ataque** | Trabajo técnico-táctico ofensivo. Remates, bajadas, presión en red. | Filtrado por temática: *Técnica* / *Táctica* |
| **4. Vuelta a la calma** | Estiramientos, reflexión táctica, recuperación. | Filtrado por temática: *Vuelta a la calma* |

Cada bloque contiene:
- Duración estimada (minutos)
- Lista de ejercicios seleccionados desde la Biblioteca (Módulo 11), con orden y repeticiones
- Notas del entrenador para ese bloque
- Materiales necesarios (calculado automáticamente desde los ejercicios)

### Funcionalidades

- Creación de mesociclos con generación automática de microciclos según la duración
- Constructor de sesión con los 4 bloques fijos; el entrenador selecciona ejercicios de la Biblioteca filtrados por temática de cada bloque
- Vista de calendario del mesociclo completo (semana a semana)
- Copia y reutilización de mesociclos, microciclos y sesiones anteriores
- Seguimiento de progreso: sesiones completadas vs. planificadas por microciclo y mesociclo
- Registro de asistencia por sesión (quién asistió, quién faltó)
- El jugador ve sus sesiones con el detalle de bloques y ejercicios asignados
- Notificación al jugador cuando se le asigna un nuevo mesociclo

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Crear / editar mesociclo | ✅ | ✅ | ❌ |
| Crear / editar microciclo | ✅ | ✅ | ❌ |
| Crear / editar sesión y sus bloques | ✅ | ✅ | ❌ |
| Asignar ejercicios a cada bloque | ✅ | ✅ | ❌ |
| Asignar mesociclo a jugadores o grupos | ✅ | ✅ | ❌ |
| Ver mesociclos asignados (propios) | ✅ | ✅ | ✅ |
| Ver detalle de sesión y bloques | ✅ | ✅ | ✅ |
| Marcar sesión como completada | ✅ | ✅ | ❌ |
| Registrar asistencia | ✅ | ✅ | ❌ |
| Copiar / reutilizar mesociclo | ✅ | ✅ | ❌ |
| Archivar mesociclo | ✅ | ✅ | ❌ |

---

## Módulo 5 — Evaluaciones y Seguimiento de Jugadores

**Propósito:** Evaluar el nivel técnico y físico de los jugadores con métricas objetivas.

### Funcionalidades

- Plantillas de evaluación personalizables (criterios: técnica, táctica, físico, mental)
- Evaluación por criterios con puntuación numérica y comentarios
- Historial de evaluaciones por jugador con gráfica de evolución
- Comparativa entre evaluaciones (progreso en el tiempo)
- Adjuntar vídeos o imágenes de la evaluación
- Compartir informe de evaluación con el jugador
- Niveles de pádel automáticos según puntuación media (C, B, A, Elite)

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Crear evaluación | ✅ | ✅ | ❌ |
| Editar evaluación propia | ✅ | ✅ | ❌ |
| Ver evaluaciones de sus jugadores | ✅ | ✅ | ❌ |
| Ver sus propias evaluaciones | ✅ | ✅ | ✅ |
| Gestionar plantillas de evaluación | ✅ | ✅ | ❌ |
| Exportar informe PDF | ✅ | ✅ | ✅ |

---

## Módulo 6 — Torneos y Competiciones

**Propósito:** Organizar y gestionar torneos internos de la academia.

### Funcionalidades

- Creación de torneos (nombre, formato: eliminatoria/grupos, fecha, categoría)
- Inscripción de jugadores / parejas
- Cuadro de competición automático (bracket) y manual
- Registro de resultados de partidos
- Clasificaciones en tiempo real
- Publicación del cuadro visible para todos los jugadores
- Historial de torneos pasados y estadísticas

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Crear / editar torneo | ✅ | ❌ | ❌ |
| Inscribir jugadores | ✅ | ✅ | ✅ (propio) |
| Registrar resultados | ✅ | ✅ | ❌ |
| Ver cuadro y clasificaciones | ✅ | ✅ | ✅ |
| Cancelar torneo | ✅ | ❌ | ❌ |
| Exportar resultados | ✅ | 👁 | ❌ |

---

## Módulo 7 — Finanzas y Pagos

**Propósito:** Gestión de cobros, suscripciones y contabilidad básica de la academia.

### Funcionalidades

- Planes de suscripción (mensual, trimestral, anual) con Stripe
- Cobro de reservas y clases individuales
- Generación automática de facturas (PDF descargable)
- Historial de pagos por jugador
- Dashboard financiero: ingresos mensuales, pagos pendientes, morosidad
- Registro de gastos de la academia (equipamiento, mantenimiento)
- Exportación de datos contables (CSV)
- Notificaciones de pago fallido o suscripción vencida

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Ver dashboard financiero | ✅ | ❌ | ❌ |
| Ver historial de pagos (todos) | ✅ | ❌ | ❌ |
| Ver sus propios pagos / facturas | ✅ | ✅ | ✅ |
| Registrar / anular un cobro | ✅ | ❌ | ❌ |
| Gestionar planes de suscripción | ✅ | ❌ | ❌ |
| Registrar gastos | ✅ | ❌ | ❌ |
| Exportar datos contables | ✅ | ❌ | ❌ |

---

## Módulo 8 — Notificaciones y Comunicaciones

**Propósito:** Mantener informados a los usuarios sobre eventos relevantes de la academia.

### Funcionalidades

- Notificaciones in-app en tiempo real (Supabase Realtime)
- Emails transaccionales automáticos (Resend): confirmación de reserva, recordatorio 24h antes, evaluación disponible, pago procesado
- Centro de notificaciones (bandeja de entrada dentro de la app)
- Envío de comunicados masivos del admin a todos los jugadores o a un grupo
- Configuración de preferencias de notificación por usuario
- Historial de comunicados enviados

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Enviar comunicado masivo | ✅ | ❌ | ❌ |
| Enviar mensaje a sus jugadores | ✅ | ✅ | ❌ |
| Recibir notificaciones propias | ✅ | ✅ | ✅ |
| Configurar preferencias propias | ✅ | ✅ | ✅ |
| Ver historial de comunicados | ✅ | ❌ | ❌ |

---

## Módulo 9 — Reportes y Analíticas

**Propósito:** Proporcionar al administrador visibilidad del rendimiento operativo de la academia.

### Funcionalidades

- Dashboard de KPIs: ocupación de pistas, jugadores activos, ingresos, churn
- Informe de uso de pistas por franja horaria y día de la semana
- Informe de asistencia a entrenamientos por jugador
- Informe de progreso de jugadores (evolución de evaluaciones)
- Informe financiero mensual/anual
- Exportación de cualquier informe a CSV / PDF
- Gráficas interactivas con Recharts

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Ver dashboard de KPIs | ✅ | ❌ | ❌ |
| Ver informes de ocupación | ✅ | ❌ | ❌ |
| Ver informe de sus jugadores | ✅ | ✅ | ❌ |
| Ver informe de progreso propio | ✅ | ✅ | ✅ |
| Exportar informes | ✅ | 👁 (propios) | ❌ |

---

## Módulo 10 — Configuración de la Academia

**Propósito:** Parametrización global de la academia (exclusivo del administrador).

### Funcionalidades

- Datos de la academia (nombre, logo, dirección, contacto)
- Configuración de horario de apertura y cierre
- Reglas de reserva: anticipación mínima y máxima, tiempo de cancelación sin penalización
- Gestión de categorías de jugadores y niveles
- Configuración de Stripe (clave API, planes de precios)
- Gestión de integraciones (Resend, Sentry, etc.)
- Registro de auditoría de acciones críticas (quién hizo qué y cuándo)

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Acceder a configuración | ✅ | ❌ | ❌ |
| Editar datos de la academia | ✅ | ❌ | ❌ |
| Configurar reglas de reserva | ✅ | ❌ | ❌ |
| Ver registro de auditoría | ✅ | ❌ | ❌ |

---

---

## Módulo 11 — Biblioteca de Ejercicios

**Propósito:** Repositorio centralizado de ejercicios de pádel reutilizables en planes de entrenamiento.

### Funcionalidades

- Creación de ejercicios con los siguientes campos:
  - **Nombre** del ejercicio
  - **Temática** (técnica, táctica, físico, mental, calentamiento, vuelta a la calma)
  - **Objetivo** (descripción del propósito del ejercicio)
  - **Nivel recomendado** (iniciación, intermedio, avanzado, élite)
  - **Duración estimada** (minutos)
  - **Material necesario** (pelotas, conos, palas, etc.)
  - **Vídeo demostrativo** (URL embebida de YouTube/Vimeo o subida directa a Supabase Storage)
  - **Imagen o diagrama** del ejercicio
  - **Instrucciones paso a paso**
  - **Etiquetas** para búsqueda rápida
- Búsqueda y filtrado por temática, nivel, duración o etiqueta
- Marcado de ejercicios como favoritos por el entrenador
- Vinculación directa de ejercicios a sesiones de planes de entrenamiento (Módulo 4)
- Los jugadores pueden consultar los ejercicios de sus sesiones asignadas

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Crear ejercicio | ✅ | ✅ | ❌ |
| Editar ejercicio propio | ✅ | ✅ | ❌ |
| Editar cualquier ejercicio | ✅ | ❌ | ❌ |
| Eliminar ejercicio | ✅ | ❌ | ❌ |
| Ver biblioteca completa | ✅ | ✅ | ❌ |
| Ver ejercicios de sus sesiones | ✅ | ✅ | 👁 |
| Subir vídeo / imagen | ✅ | ✅ | ❌ |
| Marcar favoritos | ✅ | ✅ | ❌ |

---

## Módulo 12 — Grupos de Entrenamiento

**Propósito:** Gestionar grupos de jugadores con horarios fijos, cupos limitados y control financiero asociado al grupo.

### Funcionalidades

- Creación de grupos con los siguientes atributos:
  - **Nombre** del grupo (ej. "Grupo Martes/Jueves Intermedio")
  - **Entrenador asignado**
  - **Nivel del grupo** (iniciación, intermedio, avanzado, élite)
  - **Cupo máximo de jugadores**
  - **Horario recurrente** (días de la semana, hora inicio/fin)
  - **Pista asignada** por defecto
  - **Tarifa mensual del grupo** (puede diferir de la tarifa individual)
  - **Estado** (activo, en pausa, cerrado)
- Inscripción y baja de jugadores en grupos (con control de cupo)
- Lista de espera automática al llegar al cupo máximo
- Vista de calendario del grupo con sus sesiones
- **Control financiero por grupo:**
  - Ingresos esperados vs. recaudados por grupo (cuota × jugadores inscritos)
  - Registro de pagos mensuales por jugador dentro del grupo
  - Alertas de morosidad por grupo
  - Informe de rentabilidad por grupo
- Asignación automática de un plan de entrenamiento al grupo (Módulo 4)
- Notificación a los jugadores del grupo ante cambios de horario o cancelación

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Crear / editar grupo | ✅ | ❌ | ❌ |
| Ver todos los grupos | ✅ | ❌ | ❌ |
| Ver sus grupos asignados | ✅ | ✅ | ❌ |
| Ver el grupo al que pertenece | ✅ | ✅ | 👁 |
| Inscribir / dar de baja jugadores | ✅ | ❌ | ❌ |
| Solicitar inscripción propia | ✅ | ✅ | ✅ |
| Ver lista de espera del grupo | ✅ | ✅ | 👁 |
| Ver control financiero del grupo | ✅ | 👁 (sus grupos) | ❌ |
| Registrar pago de jugador en grupo | ✅ | ❌ | ❌ |
| Ver informe de rentabilidad | ✅ | ❌ | ❌ |
| Asignar plan de entrenamiento al grupo | ✅ | ✅ | ❌ |

---

## Módulo 13 — Perfil del Entrenador

**Propósito:** Centralizar la información profesional de cada entrenador y su actividad en la academia.

### Funcionalidades

- **Datos personales y de contacto** (nombre, foto, email, teléfono, bio)
- **Formación y titulaciones:**
  - Certificaciones oficiales (FEP, ITF, etc.) con fecha de obtención y documento adjunto
  - Cursos y formaciones complementarias
  - Idiomas de entrenamiento
- **Fortalezas y especialidades:**
  - Áreas de especialización (técnica, física, táctica, mental, iniciación, alto rendimiento)
  - Niveles con los que trabaja mejor
  - Estilo de entrenamiento (descripción libre)
- **Historial de actividad en la academia:**
  - Clases impartidas (total acumulado y por mes)
  - Grupos activos e históricos gestionados
  - Jugadores entrenados (actuales e históricos)
  - Planes de entrenamiento creados
  - Evaluaciones realizadas
- **Disponibilidad:** franjas horarias en las que el entrenador puede impartir clases
- **Valoraciones:** puntuación media recibida por los jugadores (opcional, configurable por el admin)
- Vista pública del perfil visible para los jugadores de sus grupos

### Permisos

| Acción | Admin | Coach | Player |
|---|---|---|---|
| Ver perfiles de todos los entrenadores | ✅ | ❌ | ❌ |
| Ver su propio perfil completo | ✅ | ✅ | ❌ |
| Ver perfil de su entrenador asignado | ✅ | ✅ | 👁 (parcial) |
| Editar perfil propio | ✅ | ✅ | ❌ |
| Editar perfil de cualquier entrenador | ✅ | ❌ | ❌ |
| Ver historial de clases propio | ✅ | ✅ | ❌ |
| Ver historial de clases de todos | ✅ | ❌ | ❌ |
| Añadir / editar formaciones propias | ✅ | ✅ | ❌ |
| Validar/aprobar formaciones | ✅ | ❌ | ❌ |
| Ver disponibilidad del entrenador | ✅ | ✅ | 👁 |
| Editar disponibilidad propia | ✅ | ✅ | ❌ |

---

## Resumen de Permisos por Módulo

| Módulo | Admin | Coach | Player |
|---|---|---|---|
| 1. Usuarios | Gestión total | Ver sus jugadores | Solo perfil propio |
| 2. Reservas | Gestión total | Gestiona reservas de grupo | Reservas propias |
| 3. Instalaciones | Gestión total | Solo visualización | Solo visualización |
| 4. Entrenamientos | Gestión total | Crea y asigna planes | Solo sus planes |
| 5. Evaluaciones | Gestión total | Crea/ve de sus jugadores | Solo las suyas |
| 6. Torneos | Gestión total | Registra resultados | Inscripción y consulta |
| 7. Finanzas | Gestión total | Solo sus propios pagos | Solo sus propios pagos |
| 8. Notificaciones | Comunicados masivos | Mensajes a sus jugadores | Recibe y configura |
| 9. Reportes | Todos los informes | Informes de sus jugadores | Solo progreso propio |
| 10. Configuración | Gestión total | ❌ | ❌ |
| 11. Biblioteca de Ejercicios | Gestión total | Crea y edita ejercicios propios | Solo lectura de sus sesiones |
| 12. Grupos de Entrenamiento | Gestión total + finanzas | Ve y gestiona sus grupos | Solo consulta de su grupo |
| 13. Perfil del Entrenador | Ve y edita todos | Edita el suyo, ve historial propio | Ve perfil de su entrenador |
