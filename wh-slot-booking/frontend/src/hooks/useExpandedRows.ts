import { useState, useCallback } from 'react'

export function useExpandedRows() {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const toggle = useCallback((id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const isExpanded = useCallback((id: number) => expandedIds.has(id), [expandedIds])

  const collapseAll = useCallback(() => setExpandedIds(new Set()), [])

  return { toggle, isExpanded, collapseAll }
}
