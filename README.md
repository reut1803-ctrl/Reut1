# Matchmaking & Interview Management Platform

A community matchmaking and interview-management platform built on
**Supabase (PostgreSQL)** + **React (Vite)**. Designed for a community
coordinator with an admin and a team of matchmakers.

## Features

- **Staff** — 1:1 with `auth.users`, role-based (`admin`, `matchmaker`).
- **Candidates** — unique `access_token` public registration links, flexible profile.
- **Questions** — dynamic, gender-specific, sortable, admin-controlled via the UI.
- **Answers** — normalised, one row per `(candidate, question)`.
- **Interviews** — slot-based (15 min), overlap-proof per matchmaker (unique + GiST exclusion constraint).
- **Brainstorming notes** (private per matchmaker) and **admin summaries** (admin-written) in separate tables.
- **Theme settings** — singleton table driving dynamic branding (logo, colors, fonts) loaded on page load.
- **Strict RLS** — matchmakers see only their own interviews/notes; admins have full access; branding + registration are public.

## Project structure

```
.
├── supabase/
│   ├── schema.sql          # tables, enums, triggers, storage buckets
│   ├── rls_policies.sql    # RLS helper fns + policies + storage policies
│   └── seed.sql            # optional starter questions + theme
├── src/
│   ├── main.jsx            # React entry (Router + AppProvider)
│   ├── App.jsx             # routes & guards
│   ├── index.css           # theme-variable-driven styles
│   ├── shared/             # cross-cutting logic
│   │   ├── supabase.js     # centralised Supabase client
│   │   ├── api.js          # typed-by-convention data access layer
│   │   ├── AppContext.jsx  # auth + global theme context
│   │   └── theme.js        # theme -> CSS variables
│   ├── components/
│   │   ├── Header.jsx              # prominent, high-res logo area
│   │   ├── Navigation.jsx
│   │   ├── RegistrationForm.jsx    # dynamic form from questions table
│   │   ├── Scheduler.jsx           # 15-min slot calendar grid
│   │   ├── MatchmakerDashboard.jsx # interviews + candidate profile + notes
│   │   └── AdminControlPanel.jsx   # CRUD for themes & questions
│   └── pages/
│       ├── LoginPage.jsx
│       ├── RegisterPage.jsx        # /register/:token (public)
│       ├── DashboardPage.jsx
│       ├── SchedulePage.jsx
│       └── AdminPage.jsx
├── index.html
├── vite.config.js
└── package.json
```

## Getting started

### 1. Database

Run the SQL files against your Supabase project (SQL editor or `psql`),
in order:

```sql
\i supabase/schema.sql
\i supabase/rls_policies.sql
\i supabase/seed.sql      -- optional
```

### 2. Make a user an admin

Sign a staff member up through Supabase Auth (the `handle_new_user`
trigger creates their `staff` row as a `matchmaker`), then promote:

```sql
update public.staff set role = 'admin' where email = 'coordinator@example.com';
```

### 3. Frontend

```bash
cp .env.example .env     # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Security model

| Table                 | matchmaker            | admin       | public/anon            |
|-----------------------|-----------------------|-------------|------------------------|
| staff                 | read self             | full        | —                      |
| candidates            | read / update         | full        | via service-role only  |
| questions             | read                  | full        | —                      |
| answers               | read                  | full        | via service-role only  |
| interviews            | **own only** r/w      | full        | —                      |
| brainstorming_notes   | **own only** r/w      | full        | —                      |
| admin_summaries       | read                  | full        | —                      |
| theme_settings        | read                  | full        | **read** (branding)    |

The browser only ever uses the **anon** key — RLS enforces every rule.
Public candidate registration that needs to bypass RLS (creating
candidates / writing answers without a login) should run server-side
with the **service-role** key (e.g. a Supabase Edge Function); never ship
that key to the client.
