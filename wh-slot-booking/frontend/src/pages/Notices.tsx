import React, { useEffect, useState, useCallback } from "react";
import { Lang, t } from "../Helper/i18n";
import { api } from "../API/api";
import type { Company } from "../Types/types";

import { useNotices } from "../hooks/useNotices";
import { useNoticeFilters } from "../hooks/useNoticeFilters";
import { useExpandedRows } from "../hooks/useExpandedRows";

import NoticeFiltersBar from "../components/Notice/NoticeFiltersBar";
import NoticeTable from "../components/Notice/NoticeTable";

export default function Notices({ lang }: { lang: Lang }) {
  const { filters, updateFilter } = useNoticeFilters();
  const { notices, loading, error, load } = useNotices();
  const { toggle, isExpanded, collapseAll } = useExpandedRows();

  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    api
      .get<Company[]>("/api/companies")
      .then((res) => setCompanies(res.data.map((c) => c.alias)))
      .catch(() => {});
  }, []);

  const handleApply = useCallback(() => {
    collapseAll();
    load(filters);
  }, [filters, load, collapseAll]);

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t("notices_title", lang)}
        </h1>
        <p className="text-gray-500 text-sm">
          {t("notices_desc", lang)}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-300 text-red-800 rounded-xl px-5 py-3 mb-5 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-5 mb-6">
        <NoticeFiltersBar
          lang={lang}
          filters={filters}
          companies={companies}
          loading={loading}
          onFilterChange={updateFilter}
          onApply={handleApply}
        />
      </div>

      {/* Summary */}
      {notices.length > 0 && (
        <div className="mb-4 text-sm text-gray-500">
          {t("notices_count", lang)}:{" "}
          <strong className="text-gray-900">{notices.length}</strong>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400">
            <svg
              className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t("generating", lang)}
          </div>
        ) : (
          <NoticeTable
            lang={lang}
            notices={notices}
            isExpanded={isExpanded}
            onToggle={toggle}
          />
        )}
      </div>
    </div>
  );
}