import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data: existing } = await supabase.storage.listBuckets()
  const bucketIds = (existing ?? []).map((b) => b.id)

  if (bucketIds.includes('payment-proofs')) {
    console.log('✓ Bucket "payment-proofs" ya existe')
    return
  }

  const { error } = await supabase.storage.createBucket('payment-proofs', {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  })

  if (error) {
    console.error('✗ Error al crear bucket:', error.message)
    process.exit(1)
  }

  console.log('✓ Bucket "payment-proofs" creado (privado, máx 5 MB)')
}

main()
