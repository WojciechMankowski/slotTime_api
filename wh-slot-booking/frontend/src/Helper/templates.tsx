import React from 'react'
import { Lang, t } from './i18n'

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
      <div className="text-[13px] text-gray-500">
        (tu jest Twój istniejący formularz szablonów)
      </div>
    </div>
  )
}

function LimitsForm() {
  return (
    <div>
      {/* TU WKLEJ SWÓJ OBECNY FORMULARZ + TABELĘ LIMITÓW */}
      <div className="text-[13px] text-gray-500">
        (tu jest Twój istniejący formularz + tabela limitów)
      </div>
    </div>
  )
}

export default function TemplatesPage({ lang }: { lang: Lang }) {
  return (
    <div className="mb-6">

      {/* ===== NAGŁÓWEK STRONY (jak w starym UI) ===== */}
      <div className="bg-white rounded-xl border border-(--border) shadow-sm p-6 mb-[1.8rem]">
        <div className="text-[1.3rem] font-bold mb-1">
          Szablony i limity dzienne
        </div>
        <div className="text-[0.9rem] text-gray-500">
          Konfiguracja struktury dnia pracy magazynu oraz globalnych limitów
          inbound / outbound.
        </div>
      </div>

      {/* ===== GŁÓWNY UKŁAD – 2 KOLUMNY ===== */}
      <div className="grid grid-cols-[1.1fr_0.9fr] gap-[1.8rem]">
        {/* ===== LEWA KOLUMNA – SZABLONY ===== */}
        <div className="bg-white rounded-xl border border-(--border) shadow-sm p-5">
          <div className="mb-4">
            <div className="text-[1.05rem] font-bold flex items-center gap-[0.6rem] mb-1">Szablony dzienne</div>
            <div className="text-[0.9rem] text-gray-500">
              Definiujesz godziny pracy, interwały czasowe oraz typy slotów.
              Zmiany wpływają na wszystkie kolejne dni.
            </div>
          </div>

          <TemplatesForm />
        </div>

        {/* ===== PRAWA KOLUMNA – LIMITY ===== */}
        <div className="bg-white rounded-xl border border-(--border) shadow-sm p-5">
          <div className="mb-4">
            <div className="text-[1.05rem] font-bold flex items-center gap-[0.6rem] mb-1">
              Limity dzienne Inbound / Outbound
            </div>
            <div className="text-[0.9rem] text-gray-500">
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
