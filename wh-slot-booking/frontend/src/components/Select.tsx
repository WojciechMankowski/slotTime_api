import { SelectProps } from "../Types/Props";
import React, { useState } from "react";

const Select = ({
  options,
  onChange,
  className,
  disabled,
  name,
  id,
  defaultValue,
}: SelectProps) => {
  const [value, setValue] = useState(defaultValue ?? options[0] ?? "");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(event.target.value);
    onChange(event.target.value);
  };

  return (
    <select
      onChange={handleChange}
      className={`w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15 disabled:opacity-70 disabled:bg-gray-100 ${className || ""}`}
      name={name}
      id={id?.toString() ?? name}
      value={value}
      disabled={disabled}
    >
      {options.map((option, index) => (
        <option key={index} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default Select;