import { Slot } from "./SlotType";
import { DokTyp } from "./DokType";

type InputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "search"
  | "tel"
  | "url"
  | "date"
  | "time";

export interface InputProps {
  type?: React.HTMLInputTypeAttribute; // Lepiej użyć wbudowanego typu Reacta
  value: string | number;
  // Zmieniamy typ parametru na string | number, aby pasował do value
  onChange: (value: string | number, name?: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  name?: string;
  id?: string; // HTML ID technicznie zawsze jest stringiem w DOM
}
export interface ButtonProps {
  type?: "button" | "submit" | "reset";
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string | number;
  text: string;
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
  rows: Slot[];
  docks?: DokTyp[];
  onDockChange?: (slotId: number,  newDock: number) => void;
  className?: string;
}
export interface TablePropsAdmin {
  columns: string[];
  rows: Slot[];
  docks?: DokTyp[];
  onDockChange?: (slotId: number,  newDock: number) => void;
  className?: string;
}
export interface SlotFormData {
  date: string; // Najlepiej trzymać jako string 'YYYY-MM-DD' dla <input type="date">
  startTime: string; // String w formacie 'HH:mm' dla <input type="time">
  endTime: string; // String w formacie 'HH:mm'
  slotType: "INBOUND" | "OUTBOUND" | "ANY"; // Zmieniona nazwa na bardziej czytelną
  quantity: number; // Zmieniona nazwa z howSlot na standardowe quantity
}

export interface FormProps {
  onSubmit: (data: SlotFormData) => void;
  isLoading: boolean;
  serverError: string | null;
  initialValues?: Partial<SlotFormData>;
}
export interface TableProps {
  columns: string[];
  rows: string[][];
  className?: string;
  id: string | number;
}
