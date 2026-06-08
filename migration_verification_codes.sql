-- Tabela 6-cyfrowych kodów weryfikacyjnych (reset hasła, weryfikacja e-mail).
-- W bazie przechowywany jest WYŁĄCZNIE hash kodu (pbkdf2), nigdy plaintext.
CREATE TABLE verification_codes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   TEXT NOT NULL,
  purpose     TEXT NOT NULL,                 -- 'password_reset' | 'email_verify'
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,                   -- NULL = jeszcze nieużyty/aktywny
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_codes_user_purpose
  ON verification_codes (user_id, purpose);
