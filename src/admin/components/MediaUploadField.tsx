import { useId, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { uploadCmsMedia } from '#/lib/cms/uploadMedia'

type MediaUploadFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  folder: string
  accept?: string
  hint?: string
}

export function MediaUploadField({
  label,
  value,
  onChange,
  folder,
  accept = 'image/jpeg,image/png,image/webp,application/pdf,audio/mpeg,audio/mp3,audio/wav',
  hint,
}: MediaUploadFieldProps) {
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const publicUrl = await uploadCmsMedia(file, folder)
      onChange(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="block space-y-2 md:col-span-2">
      <span className="admin-label font-medium">{label}</span>
      {hint ? <p className="admin-muted text-xs">{hint}</p> : null}
      <input
        className="admin-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste URL or upload a file"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => void handleFileChange(e.target.files?.[0])}
        />
        <button
          type="button"
          className="admin-btn-secondary inline-flex items-center gap-2"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading…' : 'Upload file'}
        </button>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
