import { useId, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { uploadCmsMedia } from '#/lib/cms/uploadMedia'

type ImageUploadFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  folder: string
  accept?: string
  hint?: string
}

export function ImageUploadField({
  label,
  value,
  onChange,
  folder,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  hint,
}: ImageUploadFieldProps) {
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {value ? (
          <img src={value} alt="" className="h-28 w-full max-w-[10rem] shrink-0 rounded-xl object-cover sm:w-40" />
        ) : (
          <div className="admin-muted flex h-28 w-full max-w-[10rem] items-center justify-center rounded-xl border border-dashed border-[#d4d4d4] bg-[#fafafa] text-xs sm:w-40">
            No image
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
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
              disabled={uploading}
              onChange={(e) => void handleFileChange(e.target.files?.[0])}
            />
            <button
              type="button"
              className="admin-btn-secondary inline-flex items-center gap-2"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? 'Uploading…' : 'Upload image'}
            </button>
            {value ? (
              <button type="button" className="admin-btn-secondary" disabled={uploading} onClick={() => onChange('')}>
                Remove
              </button>
            ) : null}
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {hint ? <p className="admin-muted text-xs">{hint}</p> : null}
          <p className="admin-muted text-xs">Uploads go to Supabase Storage (`dq-cms-media`). You can still paste an external URL.</p>
        </div>
      </div>
    </div>
  )
}
