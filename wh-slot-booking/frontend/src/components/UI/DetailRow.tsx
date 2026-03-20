import React from "react";

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export default function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span className="text-gray-500 w-16 shrink-0">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
