import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('❌  Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }

  // PostgREST expone el esquema OpenAPI con todos los enums definidos
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })

  if (!res.ok) {
    console.error('❌  Error al conectar con Supabase:', res.status, await res.text())
    process.exit(1)
  }

  const spec = await res.json() as { definitions?: Record<string, unknown> }

  // Buscar la definición que contenga PadelLevel o padel_level
  const defs = spec.definitions ?? {}
  const padelLevelEnum = Object.entries(defs).find(([key]) =>
    key.toLowerCase().includes('padellevel') || key.toLowerCase().includes('padel_level')
  )

  if (padelLevelEnum) {
    console.log(`\n✅  Enum encontrado como "${padelLevelEnum[0]}":`)
    console.log(JSON.stringify(padelLevelEnum[1], null, 2))
    return
  }

  // Alternativa: buscar en las columnas de tablas que usen el enum
  console.log('⚠️  No se encontró PadelLevel como definición independiente.')
  console.log('🔍  Buscando en columnas de tablas...\n')

  for (const [tableName, def] of Object.entries(defs)) {
    const table = def as { properties?: Record<string, { enum?: string[] }> }
    if (!table.properties) continue
    for (const [col, colDef] of Object.entries(table.properties)) {
      if (col === 'level' || col === 'padel_level') {
        if (colDef.enum) {
          console.log(`📋  ${tableName}.${col} → valores del enum:`)
          console.log(colDef.enum)
          console.log()
        }
      }
    }
  }
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err)
  process.exit(1)
})
