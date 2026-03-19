import React from "react";

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

const Checkbox = ({ id, checked, onChange, label, disabled }: CheckboxProps) => {
  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded cursor-pointer focus:ring-blue-500 focus:ring-2 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
      />
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
