import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { api } from '../api/client'

export default function Market() {
  const { t } = useTranslation()
  const [data, setData] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSalaryData()
      .then((res) => setData(Array.isArray(res) ? res : (res.data || [])))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = data.filter(
    (item) =>
      !filter ||
      item.title?.toLowerCase().includes(filter.toLowerCase()) ||
      item.city?.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        {t('market.title')}
      </h1>

      <div className="mb-6">
        <Input
          placeholder={`${t('market.filter')}...`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12 text-gray-500">{t('common.noData')}</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                <th className="pb-3 font-medium text-gray-600 dark:text-gray-400">{t('market.position')}</th>
                <th className="pb-3 font-medium text-gray-600 dark:text-gray-400">{t('evaluate.city')}</th>
                <th className="pb-3 font-medium text-gray-600 dark:text-gray-400">{t('market.salary')}</th>
                <th className="pb-3 font-medium text-gray-600 dark:text-gray-400">{t('market.experience')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-3 text-gray-900 dark:text-gray-100">{item.title}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{item.city}</td>
                  <td className="py-3 text-brand-600 dark:text-brand-400 font-medium">
                    {item.min && item.max ? `$${Number(item.min).toLocaleString()} ~ $${Number(item.max).toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{item.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
