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
  const initialValue = defaultValue ?? (typeof options[0] === "object" && options[0] !== null ? (options[0] as any).value : options[0]) ?? "";
  const [value, setValue] = useState(initialValue);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(event.target.value);
    onChange(event.target.value);
  };

  return (
    <select
      onChange={handleChange}
      className={`w-full px-3 py-2 rounded-lg border border-(--border) text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15 disabled:opacity-70 disabled:bg-gray-100 ${className || ""}`}
      name={name}
      id={id?.toString() ?? name}
      value={value}
      disabled={disabled}
    >
      {options.map((option, index) => {
        const isObject = typeof option === "object" && option !== null;
        const optValue = isObject ? (option as any).value : option;
        const optLabel = isObject ? (option as any).label : option;
        return (
          <option key={index} value={optValue}>
            {optLabel}
          </option>
        );
      })}
    </select>
  );
};

export default Select;