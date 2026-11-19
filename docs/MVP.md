# MVP — Menaxho

Ky dokument është burimi i së vërtetës për versionin që duhet të jetë i përdorshëm tani.

## Produkti

Menaxho është një qendër personale e parave, jo program kontabiliteti.

Pyetjet që duhet t’i përgjigjet menjëherë:

1. Sa kam fituar këtë muaj?
2. Sa kam shpenzuar?
3. Ku shkuan?
4. Sa mund të shpenzoj në ditë pa prishur faturat dhe objektivin e kursimit?
5. Çfarë ndodh nëse shpenzoj më pak çdo muaj?

## Përdoruesi i parë

Një person me rrogë mujore, që paguan qira ose kredi, që shpenzon cash ose kartë, dhe që do ta shënojë shpenzimin në disa sekonda.

Gjuha e parë: shqip. E dyta: anglisht.

## Në këtë MVP

- Llogari lokale (regjistrim, hyrje, dalje, reset në terminal, fshirje)
- Onboarding 1–2 minuta, me anashkalim
- Të ardhura mujore / njëherëshe
- Shpenzime + kategori default + kategori të personalizuara
- Fatura të përsëritura (mujore, javore, vjetore)
- Kredi e thjeshtë: emër, shuma fillestare, mbetja, kësti, data
- Objektiv kursimi mujor + qëllime
- Buxhete sipas kategorie
- Dashboard me tepricë, fatura të papaguara, safe-to-spend
- Historik me kërkim dhe filtrim
- Raport javor / mujor / vjetor
- Një simulim “sa më pak në muaj”
- Docker për ta xhiruar në PC

## Jashtë MVP-së

- Integrim banke
- AI / këshilltar financiar
- Investime, kriptomonedha, taksa
- Llogari të përbashkëta / familje
- Transferta mes llogarive (nuk ka llogari bankare në sistem)
- OCR, aplikacione native
- Email i vërtetë, hostim publik, Kubernetes
- Amortizim i plotë i kredisë
- Shumë monedha njëherësh

## Udhëtimi i përdoruesit

Regjistrohu → zgjidh shqip + EUR → fus rrogën dhe faturat e mëdha → hap panelin → shto një shpenzim të shpejtë → shih tepricën dhe shumën e ditës.

## Përkufizimi i “u bë”

Një veçori është gati kur:

- ka UI
- ka ruajtje në bazë
- ka validim dhe gabime
- llogaritjet janë të testuara ku prekin paratë
- tekstet janë në shqip dhe anglisht
- nuk pret git/commit nga agjenti

## Faza e ardhshme (jo tani)

- Shpenzime vjetore / të parregullta
- Fond emergjence si shabllon
- Eksport CSV
- Më shumë insight-e
- Email dhe hostim, nëse produkti del nga ky PC
