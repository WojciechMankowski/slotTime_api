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
