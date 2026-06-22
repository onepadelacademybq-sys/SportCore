function getEmbedInfo(url: string): { type: 'youtube' | 'vimeo' | 'direct' | 'link'; src: string } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (yt) return { type: 'youtube', src: `https://www.youtube.com/embed/${yt[1]}` }

  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return { type: 'vimeo', src: `https://player.vimeo.com/video/${vimeo[1]}` }

  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) return { type: 'direct', src: url }

  return { type: 'link', src: url }
}

interface Props {
  url: string
  title?: string
}

export function VideoEmbed({ url, title = 'Video del ejercicio' }: Props) {
  const { type, src } = getEmbedInfo(url)

  if (type === 'youtube' || type === 'vimeo') {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    )
  }

  if (type === 'direct') {
    return (
      <video
        src={src}
        controls
        className="w-full rounded-lg bg-black max-h-[400px]"
        title={title}
      />
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-brand hover:underline"
    >
      Ver video externo ↗
    </a>
  )
}
