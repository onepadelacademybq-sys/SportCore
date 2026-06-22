'use client'

import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateAvatarUrl } from '@/actions/coach-profile'

interface Props {
  userId: string
  currentUrl: string | null
  fullName: string
}

export function AvatarUpload({ userId, currentUrl, fullName }: Props) {
  const [url, setUrl] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Tamaño máximo: 5 MB.')
      return
    }

    setUploading(true)
    setError(null)

    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      console.error('[AvatarUpload] Supabase Storage error:', uploadError)
      setError(`Error al subir: ${uploadError.message} (status ${uploadError.status ?? 'unknown'})`)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

    const res = await updateAvatarUrl(publicUrl)
    if (res.error) {
      setError(res.error)
    } else {
      setUrl(publicUrl + `?t=${Date.now()}`)
    }
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-5">
      {/* Avatar */}
      <div className="relative shrink-0">
        {url ? (
          <img
            src={url}
            alt={fullName}
            className="w-20 h-20 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-brand/15 border-2 border-brand/30 flex items-center justify-center text-brand text-2xl font-bold">
            {initials}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shadow hover:bg-[#00b3ba] transition-colors disabled:opacity-50"
          title="Cambiar foto"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="text-sm font-medium">{uploading ? 'Subiendo…' : 'Foto de perfil'}</p>
        <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · máx. 5 MB</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
