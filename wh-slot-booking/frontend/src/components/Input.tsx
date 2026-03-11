import { InputProps } from "../Types/Props";
import React from "react";

const Input = ({
  type,
  value,
  onChange,
  className,
  placeholder,
  disabled,
  label,
  name,
  id,
}: InputProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };
  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      name={name}
      id={id?.toString() ?? name}
    />
  );
};

export default Input;
