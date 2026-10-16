// Plain SQL migrations. They run once each, in order, when the server starts.
export interface Migration {
  name: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    name: '001_create_history_and_preferences',
    sql: `
      CREATE TABLE IF NOT EXISTS calculation_history (
        id          UUID PRIMARY KEY,
        client_id   VARCHAR(64)  NOT NULL,
        expression  VARCHAR(500) NOT NULL,
        tokens      JSONB        NOT NULL,
        result      VARCHAR(60)  NOT NULL,
        mode        VARCHAR(16)  NOT NULL DEFAULT 'standard',
        angle       VARCHAR(8)   NOT NULL DEFAULT 'deg',
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        deleted_at  TIMESTAMPTZ  NULL
      );

      CREATE INDEX IF NOT EXISTS idx_history_client_created
        ON calculation_history (client_id, created_at);

      CREATE TABLE IF NOT EXISTS user_preferences (
        client_id   VARCHAR(64) PRIMARY KEY,
        theme       VARCHAR(8)  NULL,
        mode        VARCHAR(16) NOT NULL DEFAULT 'standard',
        angle       VARCHAR(8)  NOT NULL DEFAULT 'deg',
        memory      DOUBLE PRECISION NULL,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE OR REPLACE VIEW calculation AS SELECT * FROM calculation_history;
    `,
  },
];
