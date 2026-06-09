-- Logowanie dwuetapowe (2FA): flaga włączenia na koncie użytkownika.
-- Uruchom ręcznie w Supabase (SQL editor).
-- Kody weryfikacyjne reuse z istniejącej tabeli verification_codes (purpose = 'login_2fa').

ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;
