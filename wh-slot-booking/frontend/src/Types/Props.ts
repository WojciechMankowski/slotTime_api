import { Slot } from "./SlotType";
import { DokTyp } from "./DokType";
import { Company, UserOut } from "./types";

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
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string | number;
  text: string;
}

export interface SelectProps {
  options: (string | number | { value: string | number; label: string })[]; // Możemy mieć wartości proste lub obiekty z etykietą
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string | number;
  defaultValue?: string | number;
}

export interface TableProps {
  columns: string[];
  rows: Slot[];
  docks?: DokTyp[];
  onDockChange?: (slotId: number, newDock: number) => void;
  onStatusChange?: (slotId: number, newStatus: string) => void;
  className?: string;
}
export interface TablePropsAdmin {
  columns: string[];
  rows: Slot[];
  docks?: DokTyp[];
  onDockChange?: (slotId: number, newDock: number) => void;
  onStatusChange?: (slotId: number, newStatus: string) => void;
  className?: string;
}
export interface SlotFormData {
  date: string; // Najlepiej trzymać jako string 'YYYY-MM-DD' dla <input type="date">
  startTime: string; // String w formacie 'HH:mm' dla <input type="time">
  endTime: string; // String w formacie 'HH:mm'
  slotType: "INBOUND" | "OUTBOUND" | "ANY"; // Zmieniona nazwa na bardziej czytelną
  quantity: number; // Zmieniona nazwa z howSlot na standardowe quantity
  interval: number; // Nowe pole dla interwału w minutach
}

export interface FormProps {
  serverError: string | null;
  initialValues?: Partial<SlotFormData>;
}

export interface FormCompanyProps {
  serverError: string | null;
  initialValues?: Partial<SlotFormData>;
}
export interface AdminCompaniesTableProps {
  columns: string[];
  rows: Company[];
  className?: string;
}

export interface AdminUsersTableProps {
  columns: string[];
  rows: UserOut[];
  className?: string;
  isEdit: boolean;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  setUser: React.Dispatch<React.SetStateAction<UserOut>>;
}

export interface AdminDocksTableProps {
  columns: string[];
  rows: DokTyp[];
  className?: string;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  setDock: React.Dispatch<React.SetStateAction<DokTyp>>;
}
