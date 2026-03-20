import { ButtonProps } from "../../Types/Props";
import React from "react";

const Button = ({
  type,
  onClick,
  className,
  disabled,
  name,
  id, text
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`border-none rounded-full px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-200 shadow-md flex items-center justify-center gap-1 hover:-translate-y-px active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className?.includes('primary') ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-blue-600/30' : className?.includes('outline') ? 'bg-white border border-(--border) text-(--text-main) hover:border-gray-500' : ''} ${(className?.includes('primary') || className?.includes('outline')) ? className.replace(/\b(primary|outline)\b/g, '').trim() : className ?? ''}`}
      disabled={disabled}
      name={name}
      id={id?.toString() ?? name}
    >
      {text}
    </button>
  );
};

export default Button;
