type InputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "search"
  | "tel"
  | "url"
  | "date";

export interface InputProps {
  type?: InputType;
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  name?: string;
  id?: string | number;
}
export interface ButtonProps {
    type?: "button" | "submit" | "reset";
    onClick: () => void;
    className?: string;
    disabled?: boolean;
    name?: string;
    id?: string | number;
}

export interface SelectProps {
    options: string[];
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
    name?: string;
    id?: string | number;
}

export interface TableProps {
    columns: string[];
    rows: string[][];
    className?: string;
    disabled?: boolean;
    name?: string;
    id?: string | number;
}
