# Vendime inxhinierike

Këto vendime janë të mbyllura për MVP. Ndryshoji vetëm nëse ndryshon produkti, jo për komoditet të ekranit.

## 1. Ku rri projekti

Kodi rri në këtë folder në PC. Git-in e bën përdoruesi manualisht. Agjenti nuk krijon branch dhe nuk bën commit.

## 2. Si xhirohet

Docker Compose: PostgreSQL + aplikacioni Next.js.

Zhvillimi opsional: vetëm baza në Docker, `npm run dev` në PC.

## 3. Arkitektura

Modular monolith: Next.js + TypeScript + Prisma + PostgreSQL.

Nuk ka FastAPI të veçantë dhe nuk ka monorepo. Një backend i dytë do ta vononte MVP-në pa fitim për këtë madhësi.

## 4. Modeli i parave

Burimi i së vërtetës është libri (ledger):

- Teprica e muajit = të ardhura të muajit − shpenzime të muajit
- Shumat ruhen si numra të plotë në njësi të vogla (centë), jo float
- “Sa kam në xhep tani” nuk rishkruhet çdo muaj; nuk është cash-on-hand i veçantë

## 5. Cikli i muajit

Muaji kalendarik, në zonën kohore të përdoruesit.

Default: `Europe/Tirane`.

Nuk përdoret “30 ditë = 1 muaj”. Dita 31 në shkurt shkon në ditën e fundit reale të muajit, përfshirë 29 shkurtin e brishtë.

## 6. Faturat e përsëritura

Janë detyrime të planifikuara, jo transaksione automatike.

Hynë te “të papaguara këtë muaj” derisa përdoruesi t’i shënojë të paguara. Shënim i paguar krijon shpenzimin. Kjo shmang numërimin dy herë.

## 7. Kursimi

Tre numra të ndryshëm:

- Teprica e muajit = të ardhura − shpenzime
- Objektivi mujor = sa do të rezervosh
- Qëllimi = enë e veçantë (laptop, fond, pushime)

Safe-to-spend i zbrit faturat e papaguara dhe objektivin mujor nga teprica, pastaj pjesëton me ditët e mbetura, përfshirë sot.

Është vlerësim, jo këshillë financiare.

## 8. Kredi

MVP mban mbetjen dhe këstin. Nuk llogarit amortizim. Kësti është detyrim mujor. Mbetja zbret kur kësti shënohet i paguar.

## 9. Monedha

Një monedhë për përdorues. Nuk ndryshon pasi ke futur shuma, që numrat e vjetër të mos ndërrojnë kuptim.

## 10. Privatësia

Të dhënat rrinë lokale. Reset i fjalëkalimit del në terminal. Nuk ka analytics me shuma. Fshirja e llogarisë fshin të dhënat e atij përdoruesi.
