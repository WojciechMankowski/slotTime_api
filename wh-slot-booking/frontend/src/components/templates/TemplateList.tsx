import { t, Lang } from '../../Helper/i18n'
import type { SlotTemplate } from '../../Types/apiType'
import EmptyState from '../UI/EmptyState'
import Button from '../UI/Button'

interface Props {
  templates: SlotTemplate[]
  lang: Lang
  onAdd: () => void
  onEdit: (template: SlotTemplate) => void
  onDelete: (id: number) => void
}

const TYPE_COLORS: Record<string, string> = {
  INBOUND:  'bg-blue-50 text-blue-700 border-blue-200',
  OUTBOUND: 'bg-orange-50 text-orange-700 border-orange-200',
  ANY:      'bg-purple-50 text-purple-700 border-purple-200',
}

export default function TemplateList({ templates, lang, onAdd, onEdit, onDelete }: Props) {
  if (templates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all"
          >
            {t('template_create', lang)}
          </button>
        </div>
        <EmptyState
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          title={t('no_templates', lang)}
          desc={t('no_templates_desc', lang)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {templates.length} {lang === 'pl' ? 'szablonów' : 'templates'}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all"
        >
          {t('template_create', lang)}
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* Status dot */}
            <div
              className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full shadow-sm ${
                tpl.is_active ? 'bg-emerald-500 shadow-emerald-400' : 'bg-red-400 shadow-red-300'
              }`}
            />

            {/* Name */}
            <div className="flex items-center gap-3 mb-3 pr-5">
              <div className="flex items-center justify-center w-11 h-11 bg-indigo-600 text-white rounded-xl shadow-sm flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="text-base font-bold text-gray-900 truncate">{tpl.name}</span>
            </div>

            {/* Details */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold text-gray-400 w-16 text-xs uppercase tracking-wide">
                  {t('template_hours', lang)}
                </span>
                <span className="font-bold">
                  {String(tpl.start_hour).padStart(2, '0')}:00 – {String(tpl.end_hour).padStart(2, '0')}:00
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold text-gray-400 w-16 text-xs uppercase tracking-wide">
                  {t('template_interval', lang)}
                </span>
                <span className="font-bold">
                  {tpl.slot_minutes} {t('template_interval_min', lang)}
                </span>
              </div>
            </div>

            {/* Type badge + status badge */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold uppercase tracking-wider border ${TYPE_COLORS[tpl.slot_type] ?? TYPE_COLORS.ANY}`}>
                {tpl.slot_type}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold uppercase tracking-wider border ${
                tpl.is_active
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {tpl.is_active ? t('active_male', lang) : t('inactive_male', lang)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => onEdit(tpl)}
                className="outline"
                text={t('edit', lang)}
              />
              <button
                type="button"
                onClick={() => onDelete(tpl.id)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all"
              >
                {t('delete_btn', lang)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
