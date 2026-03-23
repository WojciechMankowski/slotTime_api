import { useState, useCallback } from 'react'
import { api } from '../API/api'
import type { SlotTemplate, SlotTemplateCreate, SlotTemplatePatch } from '../Types/apiType'

export default function useTemplates() {
  const [templates, setTemplates] = useState<SlotTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<SlotTemplate[]>('/api/templates')
      setTemplates(res.data)
    } catch {
      setError('FETCH_ERROR')
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = async (data: SlotTemplateCreate): Promise<SlotTemplate> => {
    const res = await api.post<SlotTemplate>('/api/templates', data)
    setTemplates(prev => [...prev, res.data])
    return res.data
  }

  const updateTemplate = async (id: number, data: SlotTemplatePatch): Promise<SlotTemplate> => {
    const res = await api.patch<SlotTemplate>(`/api/templates/${id}`, data)
    setTemplates(prev => prev.map(t => (t.id === id ? res.data : t)))
    return res.data
  }

  const deleteTemplate = async (id: number): Promise<void> => {
    await api.delete(`/api/templates/${id}`)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return { templates, loading, error, fetchTemplates, createTemplate, updateTemplate, deleteTemplate }
}
