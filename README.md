# S.U.G.A.M. 2.0 — Smart Unified Grievance & Accountability Matrix

**SIH 2026 · PS 26264 · AICTE Complaint & Accountability Dashboard**

A full-stack grievance management MVP with 7 role-based portals, a validated 10-state case
workflow, explainable automation (routing / SLA / duplicates / escalation), hash-chained audit
trail, simulated imports, and institution accountability scoring.

> **Demo data notice:** every record in this project is synthetic demonstration data.
> Simulated external sources are clearly labeled — no live government system is connected.

---

## 1. Run it locally in VS Code (step by step)

### Requirements

| Tool | Version | Check with |
|------|---------|-----------|
| Node.js | **20 or newer** (LTS recommended) | `node -v` |
| npm | 10+ (ships with Node) | `npm -v` |
| VS Code | any recent version | — |

No database server is needed — the demo uses an embedded **SQLite** file.

### Steps

1. **Extract the zip** to any folder, e.g. `C:\projects\sugam` (Windows) or `~/projects/sugam` (Mac/Linux).

2. **Open the folder in VS Code**
   - `File → Open Folder…` → select the extracted folder.
   - (Recommended) Open the built-in terminal: `` Ctrl+` `` (Windows/Linux) or `` Ctrl+` `` (Mac).

3. **Install dependencies** (this also auto-generates the Prisma client):

   ```bash
   npm install
   ```

4. **Create/update the demo database** (safe to run; uses the seeded `db/custom.db` shipped in the zip, or creates a fresh one):

   ```bash
   npm run db:push
   ```

5. **Start the dev server:**

   ```bash
   npm run dev
   ```

6. **Open the app:** <http://localhost:3000>

7. **Sign in with a demo account** (see table below) — or click a role chip on the login page to autofill.

### One-command alternative

```bash
npm run setup && npm run dev
```

(`setup` = install + prisma generate + db push)

---

## 2. Demo accounts

All demo accounts use the password: **`demo123`**

| Role chip on login page | Email | What you can do |
|---|---|---|
| Student / Faculty | `student@sugam.demo` | File complaints, live automation preview, track, rate, profile |
| Student (second) | `student2@sugam.demo` | Notifications demo (receives status updates) |
| Faculty | `faculty@sugam.demo` | Same portal as student |
| **College Nodal Officer** | `college@sugam.demo` | Institution workspace, respond with templates + evidence, Institution 360°, acknowledge reports |
| Intake Officer | `intake@sugam.demo` | Overview dashboard, intake queue (accept & triage), register, simulated CPGRAMS import |
| Bureau Officer | `bureau@sugam.demo` | My work, assign/act on cases in their bureau |
| Reviewing Officer | `reviewer@sugam.demo` | Cross-bureau review, resolve/close, escalate, audit view, ranking |
| Auditor | `auditor@sugam.demo` | Audit trail + hash-chain integrity verification (lands on Audit view) |
| Platform Admin | `admin@sugam.demo` | Users, integrations & imports, policy view, ranking, reports, demo controls |

**Best first demo path:** Student files a complaint → watch the automation preview (routing + SLA)
→ College Nodal Officer responds with a template + evidence → Reviewing Officer resolves →
Platform Admin runs *Demo controls → Run deadline checks* to trigger SLA escalation.

---

## 3. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on <http://localhost:3000> |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint (currently 0 errors / 0 warnings) |
| `npm run db:push` | Push the Prisma schema to the SQLite database |
| `npm run db:studio` | Open Prisma Studio (browse data in the browser) |
| `npm run smoke:test` | Route/permission smoke test across all 9 demo accounts (server must be running) |
| `npm run setup` | install + generate + db push in one go |

---

## 4. Configuration (`.env`)

The zip ships a **working `.env`** — no changes are needed to run the demo:

```ini
DATABASE_URL=file:../db/custom.db   # relative to prisma/schema.prisma → <project>/db/custom.db
AUTH_SECRET=<local demo secret>
DEMO_MODE=true                      # enables admin "Demo controls → Reset demo data"
```

Optional future-integration keys (Gemini, WhatsApp, SMTP, Bhashini, Redis) are listed as
commented placeholders in `.env` and fully documented in `.env.example`. **The app runs 100%
without them.** For production: generate a new secret (`openssl rand -hex 32`), set
`DEMO_MODE=false`, and migrate the database (see `.env.example` for MongoDB/PostgreSQL notes).

---

## 5. What's inside (feature map)

- **7 portals** — Complainant, Institution Officer, Intake Officer, Bureau Officer,
  Reviewing Officer, Auditor, Platform Admin. Server-side RBAC on **every** API route.
- **10-state validated workflow** — `RECEIVED → NEEDS_TRIAGE → ASSIGNED → IN_REVIEW →
  WAITING_FOR_INFORMATION / ACTION_REQUIRED → PENDING_REVIEW → RESOLVED → CLOSED`, plus
  `REOPENED`. Illegal transitions are rejected by the server with the allowed list in the error.
- **Explainable automation** — category→bureau routing, priority→SLA policy, urgency keyword
  detection, duplicate suggestion (Jaccard similarity, human-reviewed, never auto-merged) —
  every automated decision shows a human-readable "why this fired" explanation.
- **Hash-chained audit log** — every action is attributed; the auditor can verify chain
  integrity in one click.
- **Simulated CPGRAMS import** — CSV with source-ID idempotency (re-import = skipped
  duplicates) and per-row rejection reports.
- **Institution 360° + accountability score** — speed 40% / SLA compliance 35% / feedback 25%,
  formula fully disclosed in the UI.
- **Institution-scoped privacy** — college officers never see complainant identities;
  identity is masked on every projection they receive.
- **Notifications** — in-app, deduplicated, unread badge; role-aware landing pages.

## 6. Project structure

```
├─ prisma/schema.prisma        # data model (users, institutions, cases, events, audit…)
├─ db/custom.db                # pre-seeded SQLite demo database
├─ scripts/smoke_all_routes.mjs# API smoke test across all roles
├─ src/app/api/v1/…            # 34 REST endpoints (auth, cases, dashboard, admin, audit…)
├─ src/components/sugam/…      # role portals (student, college, officer, admin, auditor…)
├─ src/lib/                    # auth, automation engine, audit chain, API helpers, seed
└─ .env / .env.example         # working local config / full reference
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| **Port 3000 already in use** | `npm run dev -- -p 3001` then open <http://localhost:3001> |
| **Login says "session could not be established"** | The dev server was likely just restarted — refresh the page (F5) and sign in again. |
| **"Too many sign-in attempts"** | Built-in rate limit (30/min) — wait one minute. |
| **Weird empty data after editing the schema** | `npm run db:push`, then sign out & in. For a full reset: delete `db/custom.db` → `npm run db:push` → sign in (auto-reseeds). |
| **Want the factory demo data back** | Sign in as `admin@sugam.demo` → *Demo Controls* → *Reset demo data*. |
| **Windows PowerShell blocks npm scripts** | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use `npm` from cmd. |
| **Prisma engine download fails offline** | Run once on an online machine: `npm install` (engines are cached in `node_modules`). |

**Reset everything to scratch:**

```bash
rm db/custom.db        # Windows: del db\custom.db
npm run db:push
npm run dev
```

The first sign-in automatically reseeds the full demo dataset (6 institutions, 11 users,
16 cases across every status, duplicate pair, policies, templates, audit chain).
