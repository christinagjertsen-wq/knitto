# Ull & Pinner — Strikkeapp

## Oversikt
Mobilapp for strikkeprosjekter, garnlager og pinnelager. Bygget med Expo Router + Express backend.

## Arkitektur
- **Frontend**: Expo Router (filbasert ruting), AsyncStorage for lokal lagring
- **Backend**: Express på port 5000 (landingsside + API-ruter)
- **State**: KnittingContext (React Context + AsyncStorage)

## Funksjoner
- **Garnlager**: Hierarki Merke → Kvalitet → Farge, med statistikk (nøster, gram, meter)
- **Pinnelager**: Pinnestørrelser, type, lengde og materiale
- **Prosjekter**: Status (planlagt/aktiv/ferdig), kobling til garn og pinner
- **Garn ↔ Prosjekt**: Trekk garn fra lager til prosjekt, legg tilbake

## Filer
- `context/KnittingContext.tsx` — All state management (brands, qualities, yarnStock, needles, projects)
- `app/(tabs)/_layout.tsx` — Tab-layout (NativeTabs med liquid glass iOS 26+)
- `app/(tabs)/index.tsx` — Hjem/Dashboard
- `app/(tabs)/lager.tsx` — Garnlager og pinnelager
- `app/(tabs)/prosjekter.tsx` — Prosjektliste
- `app/merke/[id].tsx` — Merke-detaljer (kvaliteter)
- `app/kvalitet/[id].tsx` — Kvalitet-detaljer (farger og nøster)
- `app/prosjekt/[id].tsx` — Prosjektdetaljer (garn, pinner, status, notater)
- `constants/colors.ts` — Fargepalette (navy, rose, cream)

## Design
- Font: Inter
- Palett: Navy (#1A2340), Rose (#C97B84), Cream (#F5EDE8)
- Apple-inspirert, 2026-estetikk
- Støtter mørkt og lyst tema

## Navigasjon (tabs)
- **Prosjekter** (index) — hjemmeskjerm med hilsen og statistikk
- **Lager** — garnlager og pinnelager
- **Verktøy** — tellere og nålestørrelseskart
- **Profil** — brukernavn, statistikk, premium-skjerm

## Premium
RevenueCat-integrasjon ble avvist av bruker. Premium er foreløpig kun UI (ingen ekte betaling).
For å koble til ekte betalinger: bruk RevenueCat-integrasjonen i Replit (connector:ccfg_revenuecat_01KED80FZSMH99H5FHQWSX7D4M) eller legg inn REVENUECAT_API_KEY som secret.

## Workflows
- `Start Backend`: Express server (port 5000)
- `Start Frontend`: Expo Metro bundler (port 8081)
