import React, { Component, ErrorInfo, ReactNode } from 'react'
import { getLang, t } from '../Helper/i18n'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const lang = getLang()

    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-xl font-semibold text-(--text-main)">{t('error_boundary_title', lang)}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {t('error_boundary_refresh', lang)}
        </button>
      </div>
    )
  }
}
