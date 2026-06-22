'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import type { ExerciseTag } from '@/actions/exercises'

interface Props {
  allTags: ExerciseTag[]
  initialTags?: string[]   // tag names already on the exercise
}

export function TagInput({ allTags, initialTags = [] }: Props) {
  const [tags, setTags]       = useState<string[]>(initialTags)
  const [inputVal, setInput]  = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const json = JSON.stringify(tags)

  const suggestions = allTags
    .filter((t) => t.name.includes(inputVal.toLowerCase()) && !tags.includes(t.name))
    .slice(0, 6)

  function addTag(name: string) {
    const trimmed = name.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setInput('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  function removeTag(name: string) {
    setTags((prev) => prev.filter((t) => t !== name))
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && inputVal.trim()) {
      e.preventDefault()
      addTag(inputVal)
    }
    if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="space-y-1.5">
      <input type="hidden" name="tagsJson" value={json} />

      <div
        className="flex flex-wrap gap-1.5 rounded-md border border-border bg-input px-2 py-1.5 min-h-[38px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/15 text-brand text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
          onKeyDown={handleKey}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={tags.length === 0 ? 'Escribe y presiona Enter...' : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (inputVal || suggestions.length > 0) && (
        <div className="relative z-10">
          <div className="absolute top-0 left-0 right-0 rounded-md border border-border bg-card shadow-md">
            {suggestions.length > 0 ? (
              suggestions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onMouseDown={() => addTag(t.name)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
                >
                  {t.name}
                </button>
              ))
            ) : inputVal.trim() ? (
              <button
                type="button"
                onMouseDown={() => addTag(inputVal)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors rounded-md text-brand"
              >
                Crear etiqueta &ldquo;{inputVal.trim()}&rdquo;
              </button>
            ) : null}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Presiona Enter o coma para añadir. Etiquetas existentes aparecen como sugerencias.
      </p>
    </div>
  )
}
