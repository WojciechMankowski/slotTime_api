import { useState, useCallback } from 'react'
import { api } from '../API/api'
import { getApiError } from '../Helper/helper'
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
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = async (data: SlotTemplateCreate): Promise<SlotTemplate> => {
    try {
      const res = await api.post<SlotTemplate>('/api/templates', data)
      setTemplates(prev => [...prev, res.data])
      return res.data
    } catch (err) {
      setError(getApiError(err))
      throw err
    }
  }

  const updateTemplate = async (id: number, data: SlotTemplatePatch): Promise<SlotTemplate> => {
    try {
      const res = await api.patch<SlotTemplate>(`/api/templates/${id}`, data)
      setTemplates(prev => prev.map(t => (t.id === id ? res.data : t)))
      return res.data
    } catch (err) {
      setError(getApiError(err))
      throw err
    }
  }

  const deleteTemplate = async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/templates/${id}`)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(getApiError(err))
      throw err
    }
  }

  return { templates, loading, error, fetchTemplates, createTemplate, updateTemplate, deleteTemplate }
}
