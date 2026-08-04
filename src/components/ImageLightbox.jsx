import { useLanguage } from '../i18n/LanguageContext'

export default function ImageLightbox({ url, onClose }) {
  const { t } = useLanguage()
  if (!url) return null
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <img
        src={url}
        alt=""
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label={t('Đóng')}
        className="absolute top-4 right-4 text-white text-3xl leading-none hover:opacity-70"
      >
        &times;
      </button>
    </div>
  )
}
