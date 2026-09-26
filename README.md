# Times Table Diary

A times tables practice game (1 × 1 to 12 × 12) styled like a doodled-in diary, built as an installable web app for iPad.

Each session is a short "diary entry" of about 20 questions. At the end she gets an auto-written diary page and a sticker. Her "doodle page" (the 12 × 12 grid) fills in as facts go from blank → pencil → inked → colored in → sparkly → gold star.

**Live:** https://www.todd.sh/timesTableDiary/App · **How it works and why:** https://www.todd.sh/timesTableDiary

## Running it

```bash
npm install
vercel env pull    # once: fetches DATABASE_URL and DIARY_SECRET into .env.local
vercel dev         # app + API at http://localhost:3000/timesTableDiary/App
npm test           # engine, sync, and API unit tests
npm run build      # production build in dist/
vercel deploy --prod
```

`npm run dev` (plain Vite) also works for the game itself, but without the API it can't create or open diaries.

## Installing on the iPad

1. Open the live URL in Safari.
2. Share → Add to Home Screen.
3. Launch it from the Home Screen icon. It runs full screen and works offline, and Safari's storage cleanup doesn't apply to Home Screen apps the way it does to websites.

Optional: Settings → Accessibility → Guided Access locks the iPad to the app during practice.

## Diaries online: name + family PIN

- **Starting:** the first page asks for her name and a family PIN (4–8 digits; easy ones like 1234, repeats, and years are refused).
- **Another device:** tap "Already have a diary? Open it" and enter the same name and PIN. Capitals, accents, and extra spaces in the name don't matter.
- **Privacy:** the server turns name + PIN into the diary's ID with an HMAC keyed by `DIARY_SECRET`. The name and PIN are never stored, and IDs can't be guessed or reversed. Two kids with the same name get separate diaries unless they also pick the same PIN.
- **Guessing:** PIN attempts are rate-limited to 20 per 15 minutes per device and 40 per hour per name.
- **Never change `DIARY_SECRET`.** Every diary's ID depends on it; changing it makes every existing diary unreachable by name and PIN.

Progress saves on the device first (so it works offline) and syncs to the server:
- when the app opens or comes back to the foreground
- after each diary entry
- when settings change
- when it's being closed

Saves are version-checked, so two devices never silently overwrite each other; when they both changed, the app merges them (`src/engine/sync.ts`): each fact keeps whichever copy has more practice, and diary pages are pooled.

## Grown-ups area

Press and hold "Grown-ups: hold" on the home screen for about a second. It has:

- the progress report
- online sync status and a "Save now" button
- questions per session and sound
- backup files
- "Use a different diary" (forget it on this device) and "Delete this diary everywhere"

**Progress report** (`src/screens/Report.tsx`):
- facts mastered, over time
- each times table's progress
- a 4-week practice calendar
- the trickiest facts
- retention:
  - **Remembered on re-tests:** of the mastered facts that came back for review a week or more later (or in a check-up), how many she still got right, over the last 30 days. Built from the answer log: every answer is uploaded.
  - **Check-ups:** every two weeks, a diary entry starts with up to 10 mastered facts she hasn't practiced for a week or more. Each score is kept.

## Server

- **API:** one Vercel Function, `api/diary.ts`: create/open, get/save progress, the answer log, delete. Its logic is tested against an in-memory store in `test/api.test.ts`.
- **Database:** Neon Postgres (free plan, from the Vercel Marketplace). Three tables (`diaries`, `answers`, `attempts`) are created automatically on first use.
- **Environment variables:**
  - `DATABASE_URL`: set by the Neon integration.
  - `DIARY_SECRET`: a random 32-byte hex string; secret in production and preview.
  - `DIARY_PROXY_KEY`: another random 32-byte hex string, set on both this project and todd.sh (production and preview). See the next section.

## Served from todd.sh

The app's address is www.todd.sh/timesTableDiary/App, one level below its write-up. todd.sh ([toddsherman/todd.sh](https://github.com/toddsherman/todd.sh)) is a separate Next.js site that fronts this Vercel project:

- **The app** comes through a rewrite in todd.sh's `next.config.ts` that keeps the path unchanged. Vite builds with `/timesTableDiary/App/` as its base into `dist/timesTableDiary/App/`, so this deployment serves the app from that same path.
- **The API** goes through a todd.sh route handler instead (`app/timesTableDiary/App/api/diary/route.ts`). Behind a plain rewrite, every request would seem to come from todd.sh, but the PIN rate limits need each visitor's IP address. The handler sends it in `x-diary-client-ip`, which the API believes only alongside `DIARY_PROXY_KEY`.
- **No trailing slash.** todd.sh removes trailing slashes, so the page is `/timesTableDiary/App`. A service worker at `/timesTableDiary/App/sw.js` wouldn't cover that page by default, so it registers with scope `/timesTableDiary/App`. The `Service-Worker-Allowed` header in `vercel.json` permits that.
- **The old address.** Everything else on times-table-diary.vercel.app redirects to the new one, except `/sw.js`. That file is `old-address/sw.js`, which replaces the service worker that used to cache the app there; without it, returning visitors would keep opening the cached old app and never reach the redirect.

Storage belongs to each site, so a device that used the old address starts fresh at the new one: open the diary there with the same name and family PIN. A Home Screen icon added from the old address should be deleted and added again from the new one.

## How the learning engine works

All of it lives in `src/engine/` and is covered by `src/engine/*.test.ts`.

- **Strategy order** (`facts.ts`). Facts are introduced by strategy stage: ×1/×10 rules → ×2/×5 → ×11/×9 → ×4/×3/×12 → the final six (6s, 7s, 8s). Turnarounds come as pairs. Every fact has a kid-sized hint.
- **Doodle levels = a Leitner schedule** (`progress.ts`).
  - Levels 1–5 are due again after 0, 1, 3, 7, and 21 days.
  - A fact moves up one level when she answers it correctly *and fast* on a day it's due.
  - Wrong answers drop it back. Right but slow keeps it where it is.
- **"Fast" adapts to her.** The speed goal is based on how quickly she answers ×1 and ×10 facts (between 2.5 and 5 seconds), so typing speed isn't mistaken for not knowing. No timer is ever shown.
- **Sessions** (`session.ts`).
  - Most questions are facts she knows. A new or still-learning fact is slotted in every 1–4 questions, depending on how she's doing.
  - At most 8 facts are in "learning" at once.
  - Misses come back 2 and 6 questions later.
  - If she answers the first 4 facts of a table fast, the rest of that table is inked straight away and checked in reviews over the next few days.
- **Fix-ups.** After a miss she sees the answer, a strategy hint, and a dot array, then types the answer from memory. The answer gets covered as soon as she starts typing.

## Making it hers

- Diary voice and exclamations: `src/engine/diary.ts` and `FAST_CHEERS` in `src/screens/Practice.tsx`
- Stickers: `src/components/Sticker.tsx` (plain SVG doodles)
- Colors and fonts: the variables at the top of `src/styles.css`
- App icon: edit `public/icon.svg`, then run `npx pwa-assets-generator`
