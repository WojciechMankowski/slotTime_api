import React from "react";

interface ErrorBannerProps {
  msg: string;
  compact?: boolean;
}

export default function ErrorBanner({ msg, compact }: ErrorBannerProps) {
  return (
    <div
      className={`flex items-center gap-3 bg-red-50 border border-red-300 text-red-700 rounded-xl px-5 py-3 shadow-sm ${
        compact ? "text-sm mb-4" : "mb-6"
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  );
}