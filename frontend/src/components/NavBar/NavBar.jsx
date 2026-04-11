import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../LanguageSelector/LanguageSelector'
import DarkModeToggle from '../DarkModeToggle/DarkModeToggle'

const NAV_LINKS = [
  { path: '/', key: 'home' },
  { path: '/evaluate', key: 'evaluate' },
  { path: '/dashboard', key: 'dashboard' },
  { path: '/market', key: 'market' },
  { path: '/forum', key: 'forum' },
  { path: '/scripts', key: 'scripts' },
]

export default function NavBar() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold text-brand-600 dark:text-brand-400 shrink-0"
        >
          OfferLift
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ path, key }) => (
            <Link
              key={path}
              to={path}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === path
                  ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t(`nav.${key}`)}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <DarkModeToggle />
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex flex-wrap gap-1 px-4 pb-3">
        {NAV_LINKS.map(({ path, key }) => (
          <Link
            key={path}
            to={path}
            className={`px-2 py-1 rounded text-xs font-medium ${
              location.pathname === path
                ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {t(`nav.${key}`)}
          </Link>
        ))}
      </div>
    </nav>
  )
}
