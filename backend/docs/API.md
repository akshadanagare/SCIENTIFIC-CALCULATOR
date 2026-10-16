# MathCorner API

Base path `/api`. Every route except `/api/health` needs the header `x-client-id` (8 to 64 letters, numbers, `-` or `_`). The website creates it automatically.

| Method | Route | What it does |
| --- | --- | --- |
| GET | `/api/health` | Server + database check |
| GET | `/api/history?limit=5&offset=0&q=text` | List history, newest first. Returns `{ items, total, limit, offset }` |
| POST | `/api/history` | Save a calculation. Body: `{ expression, tokens, result, mode?, angle? }` |
| PUT | `/api/history/:id` | Change an existing calculation (same record, no new row). Same body as POST |
| DELETE | `/api/history/:id` | Soft delete one item (204, or 404) |
| DELETE | `/api/history` | Soft delete all items of this browser. Returns `{ deleted }` |
| GET | `/api/preferences` | `{ theme, mode, angle, memory }` |
| PUT | `/api/preferences` | Change any of those fields |

`q` searches the expression and the result text (case-insensitive, partial match).

## Soft delete

Nothing is ever removed from `calculation_history`. Delete sets `deleted_at = now()`, and every query filters `deleted_at IS NULL`.

## Tables

`calculation_history(id, client_id, expression, tokens jsonb, result, mode, angle, created_at, updated_at, deleted_at)`
`user_preferences(client_id, theme, mode, angle, memory, updated_at)`

Tables are created automatically when the server starts (`src/db/migrations.ts`).
