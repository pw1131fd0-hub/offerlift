import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import ScoreCard from '../components/ScoreCard/ScoreCard'
import { api } from '../api/client'

const EXPERIENCE_OPTIONS = [
  { value: 'junior', label: 'Junior (1-2年)' },
  { value: 'mid', label: 'Mid (3-5年)' },
  { value: 'senior', label: 'Senior (6-9年)' },
  { value: 'staff', label: 'Staff (10+年)' },
]

const CITY_OPTIONS = [
  { value: 'taipei', label: '台北' },
  { value: 'new_taipei', label: '新北' },
  { value: 'taichung', label: '台中' },
  { value: 'kaohsiung', label: '高雄' },
  { value: 'other', label: '其他' },
]

export default function Evaluate() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    jobTitle: '',
    experienceLevel: 'mid',
    baseSalary: '',
    bonus: '',
    equity: '',
    city: 'taipei',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.evaluate({
        ...form,
        baseSalary: Number(form.baseSalary),
        bonus: Number(form.bonus),
        equity: Number(form.equity),
      })
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        {t('evaluate.title')}
      </h1>

      <Card className="mb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('evaluate.jobTitle')}
            value={form.jobTitle}
            onChange={handleChange('jobTitle')}
            required
            placeholder="e.g. Frontend Engineer"
          />

          <Select
            label={t('evaluate.experienceLevel')}
            value={form.experienceLevel}
            onChange={handleChange('experienceLevel')}
            options={EXPERIENCE_OPTIONS}
          />

          <Input
            label={t('evaluate.baseSalary')}
            type="number"
            value={form.baseSalary}
            onChange={handleChange('baseSalary')}
            required
            placeholder="120000"
          />

          <Input
            label={t('evaluate.bonus')}
            type="number"
            value={form.bonus}
            onChange={handleChange('bonus')}
            placeholder="2"
          />

          <Input
            label={t('evaluate.equity')}
            type="number"
            value={form.equity}
            onChange={handleChange('equity')}
            placeholder="0"
          />

          <Select
            label={t('evaluate.city')}
            value={form.city}
            onChange={handleChange('city')}
            options={CITY_OPTIONS}
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t('common.loading') : t('evaluate.submit')}
          </Button>
        </form>
      </Card>

      {result && <ScoreCard result={result} />}
    </div>
  )
}
