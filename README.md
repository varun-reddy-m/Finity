# Finity — Personal Finance App

A lightweight personal finance tracking web app with a FastAPI backend and a React + Vite TypeScript frontend. Features include transaction management, receipts OCR parsing, reporting (daily/monthly/forecast), and a responsive dashboard.

---

## Table of contents
- [Features](#features)
- [Repository structure](#repository-structure)
- [Quickstart](#quickstart)
  - [Prerequisites](#prerequisites)
  - [Backend (local dev)](#backend-local-dev)
  - [Frontend](#frontend)
- [Environment & configuration](#environment--configuration)
- [API highlights](#api-highlights)
- [Frontend highlights](#frontend-highlights)
- [Screenshots](#screenshots)
- [Troubleshooting & notes](#troubleshooting--notes)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- CRUD for transactions with ownership and server-side timestamps.
  - Create, list (with pagination & filters), get, update, delete.
- Receipts parsing via Gemini / Generative Language API (parse-only endpoint).
  - Upload file, resumable upload to Gemini, parse structured JSON.
- Reporting endpoints for dashboards and charts: daily series, monthly series, category pie, MoM compare, forecast.
- Frontend dashboard, charts and receipts review flow implemented in React + TypeScript (Vite).
- Works with Postgres (Supabase) or local SQLite for quick development.

---

## Repository structure (high level)
- backend/
  - app/main.py — FastAPI application entry point.
  - app/api/v1/ — API routes (auth, categories, transactions, reports, receipts).
  - app/models/ — SQLModel models (Transaction, Category, Receipt, User).
  - .env — environment variables (database, Gemini key, Supabase auth).
  - app.db — SQLite DB used in development (optional).
- frontend/
  - src/ — React app (components, contexts, utils).
  - vite.config.ts — dev server proxy to backend.
  - package.json — frontend scripts & dependencies.

---

## Quickstart

### Prerequisites
- Node.js >=16 and npm or pnpm
- Python 3.10+
- PostgreSQL (optional — use DATABASE_URL for remote DB or Supabase)

### Backend (local dev)
1. Open a terminal and change into the backend folder:
   ```sh
   cd backend
   ```
2. Create and activate a virtualenv:
   - macOS / Linux:
     ```sh
     python -m venv .venv
     source .venv/bin/activate
     ```
   - Windows (PowerShell):
     ```ps1
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
3. Install dependencies (if `requirements.txt` exists):
   ```sh
   pip install -r requirements.txt
   ```
4. Configure `.env` in `backend/` (see Environment & configuration).
5. Start the dev server:
   ```sh
   uvicorn app.main:app --reload --port 8000
   ```
6. API docs: http://localhost:8000/docs or http://localhost:8000/redoc

### Frontend
1. Open a separate terminal and change into the frontend folder:
   ```sh
   cd frontend
   ```
2. Install dependencies and run the Vite dev server:
   ```sh
   npm install
   npm run dev
   ```
The Vite dev server runs at http://localhost:5173 and proxies `/api/v1` to the backend (see `vite.config.ts`).

---

## Environment & configuration
Backend `.env` (important vars):
- DATABASE_URL — database connection string (SQLite or Postgres)
- GEMINI_API_KEY — required for receipts parsing (Gemini)
- SUPABASE_* — optional Supabase storage keys used by receipts upload flow

Do not commit real secrets. Use a secrets manager for deployment.

---

## API highlights (examples)
Transactions
- Create: POST /api/v1/transactions
- List: GET /api/v1/transactions
- Get: GET /api/v1/transactions/{id}
- Update: PUT /api/v1/transactions/{id}
- Delete: DELETE /api/v1/transactions/{id}

Receipts (parse only)
- Parse file: POST /api/v1/receipts/parse-file

Reports
- Daily series: GET /api/v1/reports/series/daily
- Monthly series: GET /api/v1/reports/series/monthly
- Category pie: GET /api/v1/reports/pie/categories
- Forecast next month: GET /api/v1/reports/forecast/next-month
- Summary cards: GET /api/v1/reports/summary/cards
- By-day rollup: GET /api/v1/reports/by-day

Refer to the backend routes in `backend/app/api/v1/`.

---

## Frontend highlights & where to look
- App container & routing: `src/App.tsx`
- Global app context: `src/contexts/AppContext.tsx` (or similar)
- Theme context: `src/contexts/ThemeContext.tsx`
- Dashboard components: `src/components/dashboard/*`
- Receipts UI: `src/components/receipts/*`


## Troubleshooting & notes
- CORS: Vite proxies `/api/v1` to the backend by default. If front/back run on different hosts, ensure CORS in `main.py` is configured.
- DB: dev uses `app.db` (SQLite) if no `DATABASE_URL` is set. Use Postgres for production.
- Gemini / parsing: receipts parsing needs a valid `GEMINI_API_KEY`.
- Rotate or remove real API keys before sharing/publishing.


## Contributing
- Follow existing code style (TypeScript strict mode, React functional components).
- Backend uses FastAPI + SQLModel; keep API signatures stable.
- Add tests and document new env vars when adding features.

---

## License
Add your preferred license here.
