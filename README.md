# tikkie-donation-platform

Open-source donatieplatform met Tikkie betalingen. Gebouwd met Next.js, Express en SQLite.

Ideaal voor verenigingen, stichtingen en clubs die een crowdfunding of donatieactie willen opzetten met iDEAL-betalingen via Tikkie.

## Features

- **Tikkie betalingen** — Donaties worden afgehandeld via Tikkie (ABN AMRO). Stub-modus voor ontwikkeling, productie-modus met echte betalingen.
- **Realtime voortgang** — Live voortgangsbalk met doelbedrag en deadline countdown.
- **Donatiemuur** — Recente donaties worden automatisch getoond.
- **Activity ticker** — Live notificaties van nieuwe donaties in de hoek van het scherm.
- **TV-modus** — Fullscreen display met automatisch roterende slides: voortgang, donaties, brief en QR-code. Perfect voor op een scherm in je clubhuis of kantoor.
- **Admin panel** — Beveiligd dashboard voor het beheren van donaties en campagne-instellingen.
- **Slack notificaties** — Ontvang alerts bij nieuwe donaties, dagelijkse samenvattingen en server health monitoring.
- **Zakelijke facturen** — Donateurs kunnen optioneel bedrijfsgegevens invullen voor een factuur.
- **Responsive design** — Werkt op desktop, tablet en mobiel.
- **WhatsApp delen** — Eenvoudig de actie delen via WhatsApp.
- **Docker ready** — Eenvoudige deployment met Docker en docker-compose.

## Screenshots

<!-- TODO: Voeg screenshots toe van je donatieplatform -->

## Quick start (lokale ontwikkeling)

```bash
# Clone de repository
git clone https://github.com/jouw-gebruiker/tikkie-donation-platform.git
cd tikkie-donation-platform

# Installeer dependencies
npm install

# Kopieer en configureer environment variabelen
cp .env.example .env

# Start development servers (frontend + backend)
npm run dev
```

De frontend draait op `http://localhost:3000`, de backend API op `http://localhost:3001`.

In development modus worden donaties automatisch als "paid" gemarkeerd (stub mode).

## Productie deployment (Docker)

```bash
# Bouw en start de container
docker compose up -d

# Of handmatig:
docker build -t tikkie-donation-platform .
docker run -d \
  -p 3000:3000 \
  -v tikkie-data:/app/data \
  --env-file .env \
  tikkie-donation-platform
```

**Belangrijk:** Mount `/app/data` als volume voor persistente SQLite data.

## Tikkie API instellen

Om echte betalingen te ontvangen heb je een Tikkie Zakelijk account nodig via ABN AMRO:

1. Ga naar [developer.abnamro.com](https://developer.abnamro.com/)
2. Maak een account aan en registreer een app
3. Vraag toegang aan tot de Tikkie API
4. Je ontvangt een **API Key** en **App Token**
5. Configureer in `.env`:
   ```
   TIKKIE_MODE=production
   TIKKIE_API_KEY=jouw-api-key
   TIKKIE_APP_TOKEN=jouw-app-token
   TIKKIE_SANDBOX=false
   ```

**Sandbox testen:** Zet `TIKKIE_SANDBOX=true` om eerst te testen met de sandbox API.

## Slack notificaties instellen

1. Ga naar [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)
2. Maak een Incoming Webhook aan voor je Slack workspace
3. Kopieer de webhook URL naar `.env`:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
   ```

Je ontvangt:
- Alerts bij nieuwe donaties
- Dagelijks overzicht om 20:00
- Server health monitoring (geheugen, stuck payments)
- Crash alerts

## TV-display instellen

Open `/tv` in een browser op een groot scherm. De pagina roteert automatisch door 4 slides:

1. **Voortgang** — Totaalbedrag met progress bar
2. **Donaties** — Recente donaties met bedragen
3. **De brief** — Je persoonlijke boodschap
4. **QR-code** — Scan om te doneren

Beweeg de muis om de navigatiebalk te tonen. Klik op een slide om er direct naartoe te gaan.

## Aanpassen aan jouw organisatie

Zoek in de codebase naar `TODO:` comments voor alle plekken die je moet aanpassen:

- **Organisatienaam** — Zoek naar "Uw Organisatie" en "Jouw Donatieactie"
- **Hero afbeelding** — Plaats je eigen afbeelding op `/public/images/hero.jpg`
- **OG image** — Plaats een social media preview afbeelding op `/public/images/og-image.jpg`
- **Persoonlijke brief** — Pas de tekst aan in `src/components/PersonalLetter.tsx` en de TV brief slide
- **WhatsApp tekst** — Pas aan in `src/lib/constants.ts`
- **Kleuren** — Pas CSS variabelen aan in `src/app/globals.css` (zoek naar `--brand-`)
- **Domein** — Pas `SITE_URL` aan in `src/app/tv/page.tsx` en metadata in `src/app/layout.tsx`
- **Doelbedrag** — Pas aan via het admin panel of in `server/data/seedOnStart.ts`

## Environment variabelen

| Variabele | Beschrijving | Default |
|---|---|---|
| `PORT` | Server poort | `3000` |
| `NODE_ENV` | `development` of `production` | `development` |
| `ADMIN_SECRET` | Wachtwoord voor admin panel | `change-me-to-a-secure-secret` |
| `DB_PATH` | Pad naar SQLite database | `./data/donatieactie.db` |
| `TIKKIE_MODE` | `stub` (test) of `production` (echt) | `stub` |
| `TIKKIE_API_KEY` | Tikkie API key van ABN AMRO | - |
| `TIKKIE_APP_TOKEN` | Tikkie App Token | - |
| `TIKKIE_SANDBOX` | `true` voor sandbox API | `true` |
| `AFTER_PAYMENT_URL` | Redirect URL na betaling | - |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | - |
| `NEXT_PUBLIC_API_URL` | API URL voor frontend | `http://localhost:3001` |

## Tech stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Express, better-sqlite3
- **Betalingen:** Tikkie API (ABN AMRO)
- **Notificaties:** Slack Incoming Webhooks
- **Deployment:** Docker, docker-compose

## Credits

Created by [Rogier van Wagtendonk](https://rogier.live) (rogier.live)

Betalingen mogelijk gemaakt door [Tikkie](https://www.tikkie.me/) van ABN AMRO.

## Licentie

MIT
