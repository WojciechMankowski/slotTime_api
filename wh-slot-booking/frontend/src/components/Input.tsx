import { InputProps } from "../Types/Props";
import React from "react";

const Input = ({
  type,
  value,
  onChange,
  className,
  placeholder,
  disabled,
  label, // Pamiętaj o renderowaniu labela, jeśli go przekazujesz!
  name,
  id,
}: InputProps) => {

  // POPRAWKA: Wyciągamy wartość z eventu i przekazujemy ją do onChange
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? Number(event.target.value) : event.target.value;
    
    // Wywołujemy onChange zgodnie z definicją w InputProps: (value, name?)
    onChange(newValue, name);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label htmlFor={id?.toString() ?? name} className="text-[0.85rem] text-[var(--text-muted)] font-medium mb-0.5 block">{label}</label>}
      <input
        min={1}
        type={type}
        value={value}
        onChange={handleChange} // Tutaj przekazujemy naszą funkcję pośredniczącą
        className={`w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/15 disabled:opacity-70 disabled:bg-gray-100 ${className || ''}`}
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        id={id?.toString() ?? name}
      />
    </div>
  );
};

export default Input;