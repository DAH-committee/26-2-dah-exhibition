import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// 이미지 확대 보기. Esc나 바깥을 누르면 닫힌다.
export default function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    if (!src) return undefined
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
    document.getElementById('scroller')?.classList.add('locked')
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.getElementById('scroller')?.classList.remove('locked')
      window.removeEventListener('keydown', onKey, true)
    }
  }, [src, onClose])
  if (!src) return null
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-lightbox flex items-center justify-center bg-[rgba(6,12,28,0.86)] p-s5 md:p-s8"
      onClick={onClose}
    >
      <img src={src} alt={alt} className="max-h-full max-w-full rounded object-contain shadow-e3" />
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-page top-s6 flex h-s7 w-s7 items-center justify-center text-paper"
      >
        <X size={32} strokeWidth={1.5} />
      </button>
    </div>,
    document.body,
  )
}
