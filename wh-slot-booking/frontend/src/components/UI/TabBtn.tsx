import React from "react";

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

export default function TabBtn({ active, onClick, icon, label, badge }: TabBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-white text-blue-700 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {icon}
      {label}
      {badge && (
        <span
          className={`text-[0.75rem] px-2 py-0.5 rounded-lg font-black shadow-xs ${
            active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
