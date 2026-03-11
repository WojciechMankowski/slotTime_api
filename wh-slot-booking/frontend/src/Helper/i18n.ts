export type Lang = 'pl' | 'en'

const KEY = 'lang'

export function getLang(): Lang {
  const v = localStorage.getItem(KEY)
  return (v === 'en' || v === 'pl') ? v : 'pl'
}

export function setLang(lang: Lang) {
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
  generate_slots: { pl: 'Generowanie slotów', en: 'Generate slots' }, // przeniesione z errorText
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
}