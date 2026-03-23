import { useState } from 'react'
import { t, Lang } from '../../Helper/i18n'
import { errorText } from '../../Helper/i18n'
import type { SlotTemplate, SlotTemplateCreate } from '../../Types/apiType'
import Overlay from '../UI/Overlay'
import Spinner from '../UI/Spinner'

interface Props {
  lang: Lang
  initialData?: SlotTemplate
  onSubmit: (data: SlotTemplateCreate) => Promise<void>
  onCancel: () => void
}

const DEFAULT: SlotTemplateCreate = {
  name: '',
  start_hour: 6,
  end_hour: 18,
  slot_minutes: 30,
  slot_type: 'ANY',
  is_active: true,
}

export default function TemplateForm({ lang, initialData, onSubmit, onCancel }: Props) {
  const isEdit = !!initialData

  const [form, setForm] = useState<SlotTemplateCreate>(
    initialData
      ? {
          name: initialData.name,
          start_hour: initialData.start_hour,
          end_hour: initialData.end_hour,
          slot_minutes: initialData.slot_minutes,
          slot_type: initialData.slot_type,
          is_active: initialData.is_active,
        }
      : DEFAULT
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof SlotTemplateCreate, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('template_name_required')
      return
    }
    if (form.end_hour <= form.start_hour) {
      setError('end_after_start')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err: any) {
      const code = err?.response?.data?.detail?.error_code
      setError(code || 'UNEXPECTED_ERROR')
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all'

  return (
    <Overlay onClose={onCancel}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 px-7 py-5">
          <h3 className="text-xl font-bold text-white leading-none">
            {isEdit ? t('template_edit', lang) : t('template_create', lang)}
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('name', lang)} *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={inputCls}
              placeholder={lang === 'pl' ? 'np. Standardowy dzień roboczy' : 'e.g. Standard working day'}
              autoFocus
            />
          </div>

          {/* Start / End hour */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('start', lang)} (h)
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={form.start_hour}
                onChange={e => set('start_hour', Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('end', lang)} (h)
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={form.end_hour}
                onChange={e => set('end_hour', Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Interval + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('interval_minutes', lang)}
              </label>
              <input
                type="number"
                min={5}
                max={240}
                value={form.slot_minutes}
                onChange={e => set('slot_minutes', Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('type', lang)}
              </label>
              <select
                value={form.slot_type}
                onChange={e => set('slot_type', e.target.value as 'ANY' | 'INBOUND' | 'OUTBOUND')}
                className={`${inputCls} bg-white`}
              >
                <option value="ANY">{t('any', lang)}</option>
                <option value="INBOUND">{t('inbound', lang)}</option>
                <option value="OUTBOUND">{t('outbound', lang)}</option>
              </select>
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => set('is_active', e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{t('is_active', lang)}</span>
          </label>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              {t(error as any, lang) || errorText[error]?.[lang] || error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-60"
            >
              {t('cancel_btn', lang)}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving && <Spinner />}
              {t('save_changes', lang)}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  )
}
