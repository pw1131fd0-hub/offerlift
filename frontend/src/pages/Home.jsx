import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const FEATURES = [
  {
    key: 'evaluate',
    icon: '📊',
    titleKey: 'home.feature_evaluate_title',
    descKey: 'home.feature_evaluate_desc',
    link: '/evaluate',
  },
  {
    key: 'scripts',
    icon: '📝',
    titleKey: 'home.feature_scripts_title',
    descKey: 'home.feature_scripts_desc',
    link: '/scripts',
  },
  {
    key: 'forum',
    icon: '💬',
    titleKey: 'home.feature_forum_title',
    descKey: 'home.feature_forum_desc',
    link: '/forum',
  },
  {
    key: 'market',
    icon: '📈',
    titleKey: 'home.feature_market_title',
    descKey: 'home.feature_market_desc',
    link: '/market',
  },
]

export default function Home() {
  const { t } = useTranslation()

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-50 to-white dark:from-gray-900 dark:to-gray-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
            {t('home.hero_title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            {t('home.hero_subtitle')}
          </p>
          <Link to="/evaluate">
            <Button size="lg" className="text-lg px-8 py-4">
              {t('home.cta')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <Link key={f.key} to={f.link}>
              <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                  {t(f.titleKey)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t(f.descKey)}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
