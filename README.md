# Menaxho

Kontroll personal i parave, lokalisht në kompjuter. Nuk ka host, bankë, apo email të jashtëm në këtë version.

## Çfarë bën tani

- Llogari: regjistrim, hyrje, dalje, rivendosje fjalëkalimi, fshirje
- Shqip dhe anglisht
- Monedha: EUR, ALL, MKD, USD, GBP
- Të ardhura mujore dhe njëherëshe
- Shpenzim i shpejtë me kategori
- Paneli: sa fitove, sa shpenzove, sa të mbetet, sa sot
- Historik me kërkim dhe filtrim

Rivendosja e fjalëkalimit e shkruan lidhjen në terminalin ku xhiron `npm run dev`.

## Supozime

- Të ardhurat mujore janë shuma e planifikuar për gjithë muajin, jo “sa ka hyrë deri sot”.
- Shumat ruhen në njësi të vogla (centë), jo si numra me presje të paqëndrueshme.
- Ndryshimi i monedhës bllokohet pasi ke futur të ardhura ose shpenzime, që numrat e vjetër të mos ndërrojnë kuptim.
- Fjalëkalimi lokal i bazës (`menaxho`) është vetëm për këtë kompjuter.

## Si e nis

Docker Desktop duhet të jetë i hapur.

```powershell
copy .env.example .env
docker compose up -d
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Hape [http://localhost:3000](http://localhost:3000).

Baza dëgjon në portin **5433**, që të mos përzihet me një PostgreSQL tjetër në portin 5432.

Në `.env`, `SESSION_SECRET` duhet të jetë të paktën 32 shenja. Shembulli në `.env.example` duhet zëvendësuar.

## Teste

```powershell
npm test
```

## Çfarë vjen më vonë

Shpenzime të përsëritura, qira dhe kredi si detyrime, “sa mund të shpenzosh në ditë”, objektiva kursimi, pastaj hostimi.
