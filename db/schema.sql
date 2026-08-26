-- TODO(db): Apply this PostgreSQL-compatible schema through a database migration later.
CREATE TABLE cases (id TEXT PRIMARY KEY, state TEXT NOT NULL, amount INTEGER NOT NULL, created_at TIMESTAMP NOT NULL);
CREATE TABLE events (id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id), event_type TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE, from_state TEXT, to_state TEXT NOT NULL, occurred_at TIMESTAMP NOT NULL, payload TEXT NOT NULL);
CREATE TABLE personas (id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id), consent_recorded_at TIMESTAMP, consent_text TEXT);
CREATE TABLE verdicts (id TEXT PRIMARY KEY, case_id TEXT NOT NULL UNIQUE REFERENCES cases(id), blocker TEXT NOT NULL, sub_cause TEXT NOT NULL, status_code TEXT NOT NULL, created_at TIMESTAMP NOT NULL);
