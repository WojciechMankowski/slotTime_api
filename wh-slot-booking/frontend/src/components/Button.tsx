import { ButtonProps } from "../Types/Props";
import React from "react";

const Button = ({
  type,
  onClick,
  className,
  disabled,
  name,
  id,
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      disabled={disabled}
      name={name}
      id={id?.toString() ?? name}
    />
  );
};

export default Button;
