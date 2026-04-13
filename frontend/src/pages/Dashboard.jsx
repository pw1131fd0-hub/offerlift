import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOfferStore } from '../store/offerStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'

const EXPERIENCE_OPTIONS = [
  { value: '0-2', label: 'Junior (0-2年)' },
  { value: '2-5', label: 'Mid (2-5年)' },
  { value: '5-10', label: 'Senior (5-10年)' },
  { value: '10+', label: 'Staff (10+年)' },
]

const CITY_OPTIONS = [
  { value: 'taipei', label: '台北' },
  { value: 'new_taipei', label: '新北' },
  { value: 'taichung', label: '台中' },
  { value: 'kaohsiung', label: '高雄' },
  { value: 'other', label: '其他' },
]

const emptyForm = {
  company: '',
  jobTitle: '',
  experienceLevel: 'mid',
  baseSalary: '',
  bonus: '',
  equity: '',
  city: 'taipei',
  status: 'pending',
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { offers, addOffer, removeOffer, updateOffer } = useOfferStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (offer) => {
    setEditingId(offer.id)
    setForm({ ...offer })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (editingId) {
      updateOffer(editingId, form)
    } else {
      addOffer(form)
    }
    setModalOpen(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('dashboard.title')}
        </h1>
        <Button onClick={openAdd}>{t('dashboard.addOffer')}</Button>
      </div>

      {offers.length === 0 ? (
        <Card className="text-center py-12 text-gray-500 dark:text-gray-400">
          {t('common.noData')}
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card key={offer.id} className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {offer.company}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {offer.jobTitle} · {offer.city}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full">
                  {offer.status}
                </span>
                <Button variant="ghost" size="sm" onClick={() => openEdit(offer)}>
                  {t('dashboard.edit')}
                </Button>
                <Button variant="danger" size="sm" onClick={() => removeOffer(offer.id)}>
                  {t('dashboard.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t('dashboard.edit') : t('dashboard.addOffer')}
      >
        <div className="space-y-4">
          <Input
            label={t('dashboard.company')}
            value={form.company}
            onChange={handleChange('company')}
          />
          <Input
            label={t('dashboard.position')}
            value={form.jobTitle}
            onChange={handleChange('jobTitle')}
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
          />
          <Input
            label={t('evaluate.bonus')}
            type="number"
            value={form.bonus}
            onChange={handleChange('bonus')}
          />
          <Input
            label={t('evaluate.equity')}
            type="number"
            value={form.equity}
            onChange={handleChange('equity')}
          />
          <Select
            label={t('evaluate.city')}
            value={form.city}
            onChange={handleChange('city')}
            options={CITY_OPTIONS}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('dashboard.cancel')}
            </Button>
            <Button onClick={handleSave}>{t('dashboard.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
