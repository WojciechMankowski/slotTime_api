import React from "react";

interface FilterFieldProps {
  label: string;
  children: React.ReactNode;
}

export default function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}
