# Connecting to the database

The backend uses **Flask-SQLAlchemy**, and defaults to a local **SQLite**
file so there's zero setup for development. You can swap in Postgres
(e.g. Supabase, Railway, RDS) any time without changing app code.

## Option A — SQLite (default, already working)

The database lives at `backend/vaani.db`. It's created automatically the
first time you run the app (`db.create_all()` in `app/__init__.py`).

To look inside it directly:

1. Install **[DB Browser for SQLite](https://sqlitebrowser.org/)** (free, GUI, Win/Mac/Linux).
2. Open `backend/vaani.db`.
3. Browse the `documents` and `conversations` tables, or run SQL in the
   "Execute SQL" tab, e.g.:
   ```sql
   select id, doc_type, created_at from documents order by created_at desc limit 20;
   ```

Or from the command line:
```bash
sqlite3 backend/vaani.db "select doc_type, count(*) from documents group by doc_type;"
```

## Option B — Postgres (recommended once you have real users)

1. Get a connection string. The easiest free option is
   **[Supabase](https://supabase.com)** (already a frontend dependency,
   unused today — this is where it'd plug in): create a project, then
   copy the connection string from Project Settings → Database →
   Connection string ("URI" tab, "Session pooler" if deploying serverless).

2. Add the Postgres driver:
   ```bash
   pip install psycopg2-binary
   echo "psycopg2-binary==2.9.9" >> backend/requirements.txt
   ```

3. Set `DATABASE_URL` in `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres
   ```
   That's the only change needed — `app/config.py` already reads
   `DATABASE_URL` and falls back to SQLite only if it's unset.

4. Restart the backend. `db.create_all()` will create the tables in
   Postgres the same way it did in SQLite.

   Note: `db.create_all()` only creates tables that don't exist yet — it
   won't alter existing ones if you later change a model. For real schema
   migrations over time, add **Flask-Migrate** (`pip install Flask-Migrate`)
   once the schema starts changing after you have live data.

## Inspecting a Postgres/Supabase database

- Supabase's own dashboard has a full table editor and SQL runner —
  no extra tooling needed.
- Or connect with any Postgres client (TablePlus, DBeaver, `psql`) using
  the same connection string from step 1.
