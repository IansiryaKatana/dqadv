type AdminTableImageCellProps = {
  src?: string | null
  label: string
  onClick: () => void
}

export function AdminTableImageCell({ src, label, onClick }: AdminTableImageCellProps) {
  return (
    <button
      type="button"
      className="block overflow-hidden border border-[#e5e5e5] bg-[#fafafa]"
      onClick={onClick}
      title={label}
    >
      {src ? (
        <img src={src} alt="" className="size-11 object-cover" />
      ) : (
        <div className="admin-muted flex size-11 items-center justify-center text-[10px]">No image</div>
      )}
    </button>
  )
}
