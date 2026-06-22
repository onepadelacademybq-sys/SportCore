# SportCore — Sesión de Trabajo 2026-06-22 (continuación)

## Resumen ejecutivo

Sesión de continuación enfocada en EPIC 8: onboarding wizard multi-paso con selección
visual de deporte y seeds automáticos. Se completó el último EPIC de código pendiente.
Todos los EPICs de desarrollo están ahora cerrados.

---

## Estado del repo al inicio de sesión

- **Último commit:** `1a30346` — docs: resumen sesión 2026-06-22 completo (incluye EPIC 7)
- **Sin versionar:** archivos HTML/MD de documentación externa (no código)
- **Bug detectado en auditoría:** `'baloncesto'` existía en `SPORT_SEEDS` pero no en el enum Zod del onboarding; `'otro'` estaba en el form pero no tenía seeds — inconsistencia entre `actions/onboarding.ts` y `lib/seeds/sports.ts`
- **Gap funcional:** `seedOrganization()` existía en `actions/seeds.ts` pero nunca se llamaba desde `createOrganizationAction`

---

## EPIC 8 — Onboarding wizard multi-paso (`df473e2`)

### Archivos modificados (2)

| Archivo | Cambio |
|---|---|
| `actions/onboarding.ts` | Agrega `'baloncesto'` al enum, importa y llama `seedOrganization()` |
| `app/onboarding/page.tsx` | Reescrito completo como wizard 3 pasos |

### `actions/onboarding.ts` — cambios

**Fix enum Zod:**
```ts
// Antes:
sport: z.enum(['padel', 'futbol', 'tenis', 'natacion', 'otro'])

// Después:
sport: z.enum(['padel', 'futbol', 'tenis', 'natacion', 'baloncesto', 'otro'])
```

**Seeds automáticos (non-blocking):**
```ts
if (sport !== 'otro') {
  try {
    await seedOrganization(org.id, sport as SportKey, user.id)
  } catch (err) {
    console.error('[createOrganizationAction] seed failed (non-blocking):', err)
  }
}
```
- Seeds no-blocking: un fallo de seed no interrumpe el onboarding
- `'otro'` omite seeds explícitamente (`SPORT_SEEDS['otro']` no existe → retorna `{ seeded: false }`)

### Wizard 3 pasos — `app/onboarding/page.tsx`

**Step indicator:**
- 3 pasos numerados con connecting line
- Checkmark verde en pasos completados
- Resalta paso activo con `ring-4 ring-primary/20`
- Labels visibles en sm+: "Tu deporte", "Tu organización", "Confirmar"

**Paso 1 — Elige tu deporte:**

| Deporte | Emoji | Descripción |
|---|---|---|
| Pádel | 🏓 | Canchas, clases y reservas de pádel |
| Tenis | 🎾 | Canchas, programas y rankings |
| Fútbol | ⚽ | Campos, equipos y temporadas |
| Natación | 🏊 | Carriles, grupos y competencias |
| Baloncesto | 🏀 | Canchas, equipos y ligas |
| Otro deporte | 🏆 | Cualquier disciplina deportiva |

- Grid 2 columnas mobile / 3 columnas sm+
- Card seleccionada: `border-primary bg-primary/10 ring-2 ring-primary/20`
- Botón "Continuar" deshabilitado hasta seleccionar deporte

**Paso 2 — Tu organización:**
- Input nombre con auto-generación de slug (mismo algoritmo que versión anterior)
- Input slug editable manualmente — una vez editado deja de auto-generarse
- Preview en tiempo real: `slug.sportcore.co`
- Validación inline: nombre ≥ 2 chars, slug válido `[a-z0-9-]+`
- Botones "Atrás" + "Continuar"

**Paso 3 — Confirmar:**
- Tarjeta de 3 filas (deporte, organización, plan) con botones "Cambiar" inline
- "Cambiar" en deporte → vuelve a paso 1
- "Cambiar" en organización → vuelve a paso 2
- `<form action={formAction}>` con 3 hidden inputs (`sport`, `name`, `slug`)
- Botón submit deshabilitado mientras `pending`
- Error de servidor renderizado sobre los botones

### Flujo completo
```
Paso 1 → Elige deporte (card click) → Continuar
Paso 2 → Nombre + slug → Continuar
Paso 3 → Confirma → submit → seedOrganization() → redirect /admin/dashboard
```

---

## Estado final EPIC 8 — ✅ código completo

| Componente | Estado |
|---|---|
| Wizard 3 pasos UI | ✅ |
| Step indicator visual | ✅ |
| Cards de deporte con emoji | ✅ |
| Auto-slug desde nombre | ✅ |
| Preview URL pública | ✅ |
| Tarjeta de confirmación editable | ✅ |
| Seeds automáticos post-creación | ✅ |
| Fix enum 'baloncesto' | ✅ |
| TypeScript: sin errores (`tsc --noEmit`) | ✅ |

---

## Commits de la sesión

| Hash | Descripción |
|---|---|
| `df473e2` | feat(onboarding): EPIC 8 — wizard multi-paso con selección de deporte y seeds automáticos |

---

## Estado del backlog al cierre

| Item | Tipo | Estado |
|---|---|---|
| EPIC 6 prod — 12 productos Stripe + webhook | No-código | Pendiente |
| Vercel — wildcard `*.sportcore.co` | Infra | Pendiente |
| Legal — DNDA SportCore · SAS · ToS/DPA | Legal | Crítico (antes ventas) |
| node_modules — Prisma WASM faltante | Deuda técnica | `npm install` en próxima sesión |

**Todos los EPICs de código están completos.**
