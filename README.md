# Menaxho

A local application for personal money management. Data stays on your computer. This version does not include banking integration, public hosting, or external email services.

This folder contains the project. You manage Git whenever you want from this folder. No branch or commit is required from Cursor.

## MVP Features

- Accounts: registration, login, logout, password reset, and account deletion
- Albanian and English
- Currencies: EUR, ALL, MKD, USD, and GBP
- Short onboarding (salary, rent, loan, subscription, and savings goal)
- Quick expense entry by category
- Monthly and one-time income
- Recurring bills: mark them as paid when you pay them; they are not posted automatically
- Loans: monthly installment and remaining balance
- Savings goals and monthly targets
- Category budgets with 75%, 100%, and over-limit indicators
- Dashboard: income, expenses, remaining balance, unpaid bills, and the amount available to spend per day
- History, weekly/monthly/yearly reports, and a “What if I spent less?” simulation

Password reset writes the reset link to the terminal where the application is running.

## Run with Docker

Docker Desktop must be open.

In PowerShell, inside this folder, run:

```powershell
copy .env.example .env
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

In `.env`, `SESSION_SECRET` must contain at least 32 characters. Replace the example value.

The database listens on port **5433** on your PC to avoid conflicts with another PostgreSQL instance on port 5432. Inside Docker, the application communicates with the database on its internal port 5432.

To stop the application:

```powershell
docker compose down
```

Database data remains in the `menaxho_pg` volume until you remove it with `docker compose down -v`.

## Development Setup (Optional)

Run only the database in Docker and Next.js on your PC:

```powershell
copy .env.example .env
npm install
docker compose up -d db
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## Tests

```powershell
npm test
```

## Documentation

- [docs/MVP.md](docs/MVP.md) — what is and is not included in this version
- [docs/DECISIONS.md](docs/DECISIONS.md) — money-engine decisions

## What Is Not Included

Banking, AI, investments, cryptocurrencies, taxes, family accounts, a native application, or internet hosting.
