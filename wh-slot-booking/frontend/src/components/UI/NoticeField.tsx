import React from "react";

interface NoticeFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  error?: string;
  type?: string;
}

export default function NoticeField({
  label,
  value,
  onChange,
  onFocus,
  error,
  type = "text",
}: NoticeFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
          error
            ? "border-red-400 focus:ring-red-400 bg-red-50"
            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
        }`}
      />
      {error && (
        <p className="text-xs text-red-600 font-medium mt-0.5">{error}</p>
      )}
    </div>
  );
}
