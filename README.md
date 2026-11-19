# Menaxho

Aplikacion lokal për kontrollin e parave personale. Të dhënat rrinë në kompjuterin tënd. Nuk ka bankë, host publik, as email të jashtëm në këtë version.

Ky folder është projekti. Git-in e bën ti kur të duash, nga ky folder. Nuk nevojitet branch apo commit nga Cursor.

## Çfarë bën MVP-ja

- Llogari: regjistrim, hyrje, dalje, rivendosje fjalëkalimi, fshirje
- Shqip dhe anglisht
- Monedha: EUR, ALL, MKD, USD, GBP
- Onboarding i shkurtër (rroga, qira, kredi, abonim, objektiv kursimi)
- Shpenzim i shpejtë me kategori
- Të ardhura mujore dhe njëherëshe
- Fatura të përsëritura: shënoji të paguara kur i paguan, nuk postohen vetë
- Kredi: kësti mujor + mbetja
- Qëllime kursimi dhe objektiv mujor
- Buxhete sipas kategorie, me sinjal 75% / 100% / mbi kufi
- Paneli: të ardhura, shpenzime, tepricë, fatura të papaguara, sa mund të shpenzosh në ditë
- Historik, raporte javorë/mujorë/vjetorë, një simulim “po sikur të shpenzoja më pak”

Rivendosja e fjalëkalimit e shkruan lidhjen në terminalin ku xhiron aplikacioni.

## Si e niset me Docker

Duhet Docker Desktop i hapur.

Në PowerShell, brenda këtij folderi:

```powershell
copy .env.example .env
docker compose up --build
```

Hape [http://localhost:3000](http://localhost:3000).

Në `.env`, `SESSION_SECRET` duhet të jetë të paktën 32 shenja. Zëvendëso shembullin.

Baza dëgjon në portin **5433** në PC, që të mos përzihet me një PostgreSQL tjetër në 5432. Brenda Docker-it, aplikacioni flet me bazën në portin e brendshëm 5432.

Ndalimi:

```powershell
docker compose down
```

Të dhënat e bazës mbeten në volume-in `menaxho_pg` derisa ta fshish me `docker compose down -v`.

## Si e niset për zhvillim (opsionale)

Vetëm baza në Docker, Next.js në PC:

```powershell
copy .env.example .env
npm install
docker compose up -d db
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## Teste

```powershell
npm test
```

## Dokumente

- [docs/MVP.md](docs/MVP.md) — çfarë hyn në këtë version, çfarë jo
- [docs/DECISIONS.md](docs/DECISIONS.md) — vendimet e motorit të parave

## Çfarë nuk është këtu

Bankë, AI, investime, kriptomonedha, taksa, llogari familjare, aplikacion native, hostim në internet.
