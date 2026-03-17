export type Lang = 'pl' | 'en'

const KEY = 'lang'

export function getLang(): Lang {
  const v = localStorage.getItem(KEY)
  return (v === 'en' || v === 'pl') ? v : 'pl'
}

export function setLang(lang: Lang, key: string) {
   if (!dict[key]) return key
  localStorage.setItem(KEY, lang)
}

type Dict = Record<string, { pl: string; en: string }>

export const dict: Dict = {
  login_title: { pl: 'Logowanie', en: 'Login' },
  username: { pl: 'Użytkownik', en: 'Username' },
  password: { pl: 'Hasło', en: 'Password' },
  sign_in: { pl: 'Zaloguj', en: 'Sign in' },
  logout: { pl: 'Wyloguj', en: 'Logout' },
  language: { pl: 'Język', en: 'Language' },
  role: { pl: 'Rola', en: 'Role' },
  warehouse: { pl: 'Magazyn', en: 'Warehouse' },
  company: { pl: 'Firma', en: 'Company' },
  slots: { pl: 'Sloty', en: 'Slots' },
  docks: { pl: 'Docki', en: 'Docks' },
  users: { pl: 'Użytkownicy', en: 'Users' },
  companies: { pl: 'Firmy', en: 'Companies' },
  reserve: { pl: 'Rezerwuj', en: 'Reserve' },
  approve: { pl: 'Zatwierdź', en: 'Approve' },
  notice: { pl: 'Awizacja', en: 'Notice' },
  assign_dock: { pl: 'Przypisz dock', en: 'Assign dock' },
  status: { pl: 'Status', en: 'Status' },
  type: { pl: 'Typ', en: 'Type' },
  start: { pl: 'Start', en: 'Start' },
  end: { pl: 'Koniec', en: 'End' },
  dock: { pl: 'Dock', en: 'Dock' },
  reserved_by: { pl: 'Zarezerwował', en: 'Reserved by' },
  date_from: { pl: 'Od', en: 'From' },
  date_to: { pl: 'Do', en: 'To' },
  load: { pl: 'Pobierz', en: 'Load' },
  create: { pl: 'Utwórz', en: 'Create' },
  is_active: { pl: 'Aktywne', en: 'Active' },
  dock_name: {pl: 'Nazwa doku', en: 'Dock name'},
  generate_slots: { pl: 'Generowanie slotów', en: 'Generate slots' }, // przeniesione z errorText
  test: { pl: 'Test', en: 'Test' },
  name: { pl: 'Nazwa', en: 'Name' },
  alias: { pl: 'Alias', en: 'Alias' },
  active_male: { pl: 'Aktywny', en: 'Active' },
  inactive_male: { pl: 'Nie aktywny', en: 'Not active' },
  inactive: { pl: 'Nieaktywny', en: 'Inactive' },
  add_new_dock: { pl: 'Dodaj nowy dock', en: 'Add new dock' },
  form_add_dock: { pl: 'Formularz dodawania nowych docków w magazynie', en: 'Form for adding new docks in the warehouse' },
  active: {pl: 'Aktywne', en: 'Active'},
  user_name: { pl: 'Nazwa użytkownika', en: 'Username' },
  user_name_login: { pl: 'Nazwa użytkownika', en: 'Username' },
  save_user: {pl: "Zapisz zmiany", en: "Save changes"},
  add_user: { pl: 'Dodaj użytkownika', en: 'Add user' },
  form_add_user: { pl: 'Formularz dodawania nowych użytkowników', en: 'Form for adding new users' },
  form_add_company: { pl: 'Formularz tworzenie nowej firmy', en: 'Form for creating a new company' },
  company_name: { pl: 'Nazwa firmy', en: 'Company name' },
  alias_optional: { pl: 'Alias (opcjonalne)', en: 'Alias (optional)' },
  create_new_company: { pl: 'Utwórz nową firmę', en: 'Create new company' },
  add_new_slots: { pl: 'Dodawanie nowych slotów', en: 'Adding new slots' },
  date: { pl: 'Data', en: 'Date' },
  start_time: { pl: 'Godzina rozpoczęcia', en: 'Start time' },
  end_time: { pl: 'Godzina zakończenia', en: 'End time' },
  slot_count: { pl: 'Liczba slotów', en: 'Slot count' },
  interval_minutes: { pl: 'Interwał (minuty)', en: 'Interval (minutes)' },
  create_slots: { pl: 'Utwórz sloty', en: 'Create slots' },
  filter_slots: { pl: 'Filtruj', en: 'Filter' },
  action: { pl: 'Akcja', en: 'Action' },
  date_required: { pl: 'Data jest wymagana.', en: 'Date is required.' },
  start_time_required: { pl: 'Godzina rozpoczęcia jest wymagana.', en: 'Start time is required.' },
  end_time_required: { pl: 'Godzina zakończenia jest wymagana.', en: 'End time is required.' },
  slot_type_required: { pl: 'Typ slotu jest wymagany.', en: 'Slot type is required.' },
  slot_quantity_required: { pl: 'Liczba slotów musi być większa niż 0.', en: 'Slot count must be greater than 0.' },
  company_name_required: { pl: 'Nazwa firmy jest potrzebna do utworzenia nowego klienta', en: 'Company name is required to create a new client' },
  reservation: { pl: 'Rezerwacja', en: 'Reservation' },
  edit: { pl: 'Edytuj', en: 'Edit' },
  slot_params: { pl: 'Parametry slotów', en: 'Slot parameters' },
  template_optional: { pl: 'Szablon (opcjonalnie)', en: 'Template (optional)' },
  none: { pl: '— brak —', en: '— none —' },
  parallel_slots: { pl: 'Równoległe sloty', en: 'Parallel slots' },
  daily_limits: { pl: 'Limity dzienne (Inbound / Outbound)', en: 'Daily limits (Inbound / Outbound)' },
  daily_limits_desc: { pl: '(tu w kolejnym kroku podepniemy DayCapacity – jak w starym narzędziu)', en: '(here we will connect DayCapacity in the next step - like in the old tool)' },
  report_latest: { pl: 'Raport (ostatnia operacja)', en: 'Report (latest operation)' },
  no_data_generate: { pl: 'Brak danych (uruchom generowanie, aby zobaczyć wynik)', en: 'No data (run generation to see the result)' },
  requested: { pl: 'Żądane', en: 'Requested' },
  generated: { pl: 'Wygenerowane', en: 'Generated' },
  skipped: { pl: 'Pominięte', en: 'Skipped' },
  sum: { pl: 'SUMA', en: 'SUM' },
  generating: { pl: 'Generowanie…', en: 'Generating...' },
  end_after_start: { pl: 'Koniec musi być po starcie', en: 'End must be after start' },
  system_subtitle: { pl: 'System awizacji i slotów czasowych', en: 'Notice and time slot system' }
}

export function t(key: keyof typeof dict, lang: Lang): string {
  return dict[key][lang]
}

export const errorText: Dict = {
  BAD_CREDENTIALS: { pl: 'Błędny login lub hasło.', en: 'Invalid username or password.' },
  INVALID_TOKEN: { pl: 'Sesja wygasła. Zaloguj się ponownie.', en: 'Session expired. Please sign in again.' },
  FORBIDDEN: { pl: 'Brak uprawnień.', en: 'Access denied.' },
  TYPE_REQUIRED: { pl: 'Dla typu ANY wybierz INBOUND/OUTBOUND.', en: 'For ANY type you must choose INBOUND/OUTBOUND.' },
  DOCK_CONFLICT: { pl: 'Konflikt czasowy docka.', en: 'Dock time conflict.' },
  FIELD_REQUIRED: { pl: 'Brak wymaganego pola.', en: 'Missing required field.' },
  COMPANY_INACTIVE: { pl: 'Firma nieaktywna: brak dostępu.', en: 'Company inactive: access blocked.' },
  SLOT_NOT_AVAILABLE: { pl: 'Slot jest już zajęty.', en: 'Slot is not available.' },
  INVALID_STATUS: { pl: 'Nieprawidłowy status operacji.', en: 'Invalid status for operation.' },
  test: { pl: 'Test', en: 'Test' },
}