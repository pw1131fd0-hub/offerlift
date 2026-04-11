import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { api } from '../api/client'

export default function Scripts() {
  const { t } = useTranslation()
  const [scripts, setScripts] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [copied, setCopied] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getScripts()
      .then((res) => setScripts(Array.isArray(res) ? res : (res.scripts || [])))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(index)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        {t('scripts.title')}
      </h1>

      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : scripts.length === 0 ? (
        <Card className="text-center py-12 text-gray-500">{t('common.noData')}</Card>
      ) : (
        <div className="space-y-4">
          {scripts.map((script, i) => (
            <Card key={i}>
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="text-left flex-1"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {script.title || script.name || `Script ${i + 1}`}
                  </h3>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(script.content || script.text || '', i)}
                >
                  {copied === i ? t('scripts.copied') : t('scripts.copy')}
                </Button>
              </div>
              {expanded === i && (
                <p className="mt-3 text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-sm">
                  {script.content || script.text}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
