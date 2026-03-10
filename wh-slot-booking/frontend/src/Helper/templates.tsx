import React from 'react'
import { Lang, t } from '../i18n'

/**
 * UWAGA:
 * - NIE zmieniamy logiki formularzy
 * - Tutaj tylko struktura + hierarchia UI
 *
 * Podmień <TemplatesForm /> i <LimitsForm />
 * na swoje istniejące komponenty
 */

function TemplatesForm() {
  return (
    <div>
      {/* TU WKLEJ SWÓJ OBECNY FORMULARZ SZABLONÓW */}
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        (tu jest Twój istniejący formularz szablonów)
      </div>
    </div>
  )
}

function LimitsForm() {
  return (
    <div>
      {/* TU WKLEJ SWÓJ OBECNY FORMULARZ + TABELĘ LIMITÓW */}
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        (tu jest Twój istniejący formularz + tabela limitów)
      </div>
    </div>
  )
}

export default function TemplatesPage({ lang }: { lang: Lang }) {
  return (
    <div className="section">

      {/* ===== NAGŁÓWEK STRONY (jak w starym UI) ===== */}
	<div className="section-card" style={{ marginBottom: '1.8rem' }}>
	  <div className="section-title" style={{ fontSize: '1.3rem' }}>
		Szablony i limity dzienne
	  </div>
	  <div className="section-desc">
		Konfiguracja struktury dnia pracy magazynu oraz globalnych limitów
		inbound / outbound.
	  </div>
	</div>

      {/* ===== GŁÓWNY UKŁAD – 2 KOLUMNY ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr'
          gap: '1.8rem',
        }}
      >
        {/* ===== LEWA KOLUMNA – SZABLONY ===== */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">Szablony dzienne</div>
            <div className="section-desc">
              Definiujesz godziny pracy, interwały czasowe oraz typy slotów.
              Zmiany wpływają na wszystkie kolejne dni.
            </div>
          </div>

          <TemplatesForm />
        </div>

        {/* ===== PRAWA KOLUMNA – LIMITY ===== */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title">
              Limity dzienne Inbound / Outbound
            </div>
            <div className="section-desc">
              Limity obowiązują globalnie dla magazynu.
              Wartość 0 oznacza brak limitu.
            </div>
          </div>

          <LimitsForm />
        </div>
      </div>
    </div>
  )
}
