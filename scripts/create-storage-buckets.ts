import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const BUCKETS = [
  {
    id: 'payment-proofs',
    public: false,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    description: 'privado, máx 5 MB',
  },
  {
    id: 'avatars',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    description: 'público, máx 5 MB',
  },
]

async function main() {
  const { data: existing, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('✗ No se pudo listar buckets:', listError.message)
    process.exit(1)
  }

  const existingIds = new Set((existing ?? []).map((b) => b.id))

  for (const bucket of BUCKETS) {
    if (existingIds.has(bucket.id)) {
      console.log(`✓ Bucket "${bucket.id}" ya existe`)
      continue
    }

    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    })

    if (error) {
      console.error(`✗ Error al crear "${bucket.id}":`, error.message)
      process.exit(1)
    }

    console.log(`✓ Bucket "${bucket.id}" creado (${bucket.description})`)
  }
}

main()
