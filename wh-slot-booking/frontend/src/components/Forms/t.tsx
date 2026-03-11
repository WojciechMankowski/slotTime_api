import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = "text" | "email" | "tel" | "textarea" | "select";

interface SelectOption {
  value: string;
  label: string;
}

interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[]; // tylko dla type: "select"
  validation?: (value: string) => string | null;
}

type FormValues = Record<string, string>;
type FormErrors = Record<string, string>;

// ─── Konfiguracja pól ─────────────────────────────────────────────────────────
// Edytuj tę tablicę, aby dostosować formularz do swoich potrzeb

const FIELDS: FieldConfig[] = [
  {
    name: "fullName",
    label: "Imię i nazwisko",
    type: "text",
    placeholder: "Jan Kowalski",
    required: true,
    validation: (v) =>
      v.trim().length < 3
        ? "Imię i nazwisko muszą mieć co najmniej 3 znaki"
        : null,
  },
  {
    name: "email",
    label: "Adres e-mail",
    type: "email",
    placeholder: "jan@firma.pl",
    required: true,
    validation: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? null
        : "Podaj poprawny adres e-mail",
  },
  {
    name: "phone",
    label: "Telefon",
    type: "tel",
    placeholder: "+48 123 456 789",
    required: false,
    validation: (v) =>
      v === "" || /^[\d\s+\-()]{7,15}$/.test(v)
        ? null
        : "Podaj poprawny numer telefonu",
  },
  {
    name: "category",
    label: "Kategoria",
    type: "select",
    required: true,
    options: [
      { value: "", label: "Wybierz kategorię..." },
      { value: "general", label: "Zapytanie ogólne" },
      { value: "support", label: "Wsparcie techniczne" },
      { value: "sales", label: "Sprzedaż" },
      { value: "other", label: "Inne" },
    ],
    validation: (v) => (v === "" ? "Wybierz kategorię" : null),
  },
  {
    name: "priority",
    label: "Priorytet",
    type: "select",
    required: false,
    options: [
      { value: "", label: "Opcjonalnie..." },
      { value: "low", label: "Niski" },
      { value: "medium", label: "Średni" },
      { value: "high", label: "Wysoki" },
    ],
  },
  {
    name: "message",
    label: "Wiadomość",
    type: "textarea",
    placeholder: "Opisz swoje zapytanie...",
    required: true,
    validation: (v) =>
      v.trim().length < 10 ? "Wiadomość musi mieć co najmniej 10 znaków" : null,
  },
];

// ─── Inicjalne wartości ───────────────────────────────────────────────────────

const buildInitialValues = (fields: FieldConfig[]): FormValues =>
  Object.fromEntries(fields.map((f) => [f.name, ""]));

// ─── Hook walidacji ───────────────────────────────────────────────────────────

function useFormValidation(fields: FieldConfig[]) {
  const validateField = useCallback(
    (name: string, value: string): string | null => {
      const field = fields.find((f) => f.name === name);
      if (!field) return null;

      if (field.required && value.trim() === "") {
        return `Pole "${field.label}" jest wymagane`;
      }
      if (field.validation && value !== "") {
        return field.validation(value);
      }
      return null;
    },
    [fields],
  );

  const validateAll = useCallback(
    (values: FormValues): FormErrors => {
      const errors: FormErrors = {};
      fields.forEach((field) => {
        const error = validateField(field.name, values[field.name]);
        if (error) errors[field.name] = error;
      });
      return errors;
    },
    [fields, validateField],
  );

  return { validateField, validateAll };
}

// ─── Komponenty pól ───────────────────────────────────────────────────────────

interface FieldProps {
  config: FieldConfig;
  value: string;
  error?: string;
  touched: boolean;
  onChange: (name: string, value: string) => void;
  onBlur: (name: string) => void;
}

function FormField({
  config,
  value,
  error,
  touched,
  onChange,
  onBlur,
}: FieldProps) {
  const showError = touched && !!error;

  const baseInputClass = `
    w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 outline-none
    bg-[#0f0f14] text-slate-100 placeholder-slate-500
    ${
      showError
        ? "border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
        : "border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
    }
  `;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">
        {config.label}
        {config.required && <span className="text-violet-400 ml-1">*</span>}
      </label>

      {config.type === "textarea" ? (
        <textarea
          name={config.name}
          value={value}
          placeholder={config.placeholder}
          rows={4}
          className={`${baseInputClass} resize-y min-h-[100px]`}
          onChange={(e) => onChange(config.name, e.target.value)}
          onBlur={() => onBlur(config.name)}
        />
      ) : config.type === "select" ? (
        <select
          name={config.name}
          value={value}
          className={`${baseInputClass} cursor-pointer`}
          onChange={(e) => onChange(config.name, e.target.value)}
          onBlur={() => onBlur(config.name)}
        >
          {config.options?.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.value === ""}
            >
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={config.type}
          name={config.name}
          value={value}
          placeholder={config.placeholder}
          className={baseInputClass}
          onChange={(e) => onChange(config.name, e.target.value)}
          onBlur={() => onBlur(config.name)}
        />
      )}

      {showError && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── Główny formularz ─────────────────────────────────────────────────────────

export default function FormTemplate() {
  const [values, setValues] = useState<FormValues>(buildInitialValues(FIELDS));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { validateField, validateAll } = useFormValidation(FIELDS);

  const handleChange = useCallback(
    (name: string, value: string) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error ?? "" }));
      }
    },
    [touched, validateField],
  );

  const handleBlur = useCallback(
    (name: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error ?? "" }));
    },
    [values, validateField],
  );

  const handleSubmit = async () => {
    // Oznacz wszystkie pola jako dotknięte
    const allTouched = Object.fromEntries(FIELDS.map((f) => [f.name, true]));
    setTouched(allTouched);

    const newErrors = validateAll(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    // Symulacja wysyłki - zastąp własną logiką (fetch, axios, itp.)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    console.log("Dane formularza:", values);
    setIsLoading(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setValues(buildInitialValues(FIELDS));
    setErrors({});
    setTouched({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center p-6">
        <div className="bg-[#0f0f14] border border-violet-500/30 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-5 text-3xl">
            ✓
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">
            Wysłano pomyślnie
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Formularz został przesłany.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Wyślij ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070d] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
            Formularz
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pola oznaczone <span className="text-violet-400">*</span> są
            wymagane
          </p>
        </div>

        {/* Pola */}
        <div className="flex flex-col gap-5">
          {FIELDS.map((field) => (
            <FormField
              key={field.name}
              config={field}
              value={values[field.name]}
              error={errors[field.name]}
              touched={!!touched[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          ))}
        </div>

        {/* Submit */}
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isLoading ? "Wysyłanie..." : "Wyślij"}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-3 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300 text-sm rounded-lg transition-colors"
          >
            Resetuj
          </button>
        </div>

        {/* Liczba błędów */}
        {Object.values(errors).some(Boolean) &&
          Object.values(touched).some(Boolean) && (
            <p className="mt-3 text-xs text-red-400 text-center">
              Formularz zawiera {Object.values(errors).filter(Boolean).length}{" "}
              błąd(ów) do poprawienia
            </p>
          )}
      </div>
    </div>
  );
}
