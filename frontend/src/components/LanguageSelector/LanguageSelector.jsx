import { useTranslation } from 'react-i18next'
import { useOfferStore } from '../../store/offerStore'

const LANGS = [
  { code: 'zh-TW', label: '繁中' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: 'JA' },
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const setLanguage = useOfferStore((s) => s.setLanguage)

  const handleChange = (e) => {
    const lang = e.target.value
    i18n.changeLanguage(lang)
    setLanguage(lang)
  }

  return (
    <select
      value={i18n.language}
      onChange={handleChange}
      className="text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code} className="bg-white dark:bg-gray-800">
          {l.label}
        </option>
      ))}
    </select>
  )
}
