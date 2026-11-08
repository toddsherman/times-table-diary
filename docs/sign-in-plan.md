# Grown-up sign-in: plan

Written 2026-11-07. Step 1 is built; the rest isn't.

## What changes, for whom

- **Kids:** nothing changes on an iPad that's already set up. A new iPad shows a short code where it used to ask for a name and PIN, and a grown-up approves it.
- **Grown-ups:** sign in with Google or Apple on your own phone or computer. From there you can see your kids' diaries and progress reports, add a kid, and link or remove an iPad.
- **The two existing diaries:** attached to your account where they already are. Nothing is exported or reloaded, and the practice history comes along.

## Decided (2026-11-07)

1. **Both existing diaries are your kids',** so both go in your account.
2. **A second grown-up comes later.** The database allows it from the start; the invite screen gets built when you want it.
3. **Apple and Google** sign-in, both.
4. **Accounts only.** Every new diary comes from a grown-up account. Name + PIN is retired once both diaries are attached.

## How it works

### Accounts

[Better Auth](https://better-auth.com/docs) 1.7, a free open-source sign-in library, runs inside the app's own API and keeps its tables in the same Neon database as the diaries.

- **It works in Safari.** The sign-in cookie belongs to www.todd.sh, because requests reach it through todd.sh like everything else. Safari blocks cookies from other sites, and Better Auth's own docs warn that a separate sign-in host breaks there. That rules out hosted options that run on their own domain.
- **One database.** Linking a diary to an account is a small table, not a sync between two services.
- **No new company holds family data, and there's no new bill.**
- **Sign-in methods:**
  - **Google:** free.
  - **Apple:** needs an Apple Developer membership. Apple's secret expires every six months, so the API makes a fresh one as it runs and there's nothing to renew.
  - **No passwords or email codes,** so there's no password reset or mail service to run.
- **Return addresses:**
  - `https://www.todd.sh/timesTableDiary/App/api/auth/callback/google`
  - `https://www.todd.sh/timesTableDiary/App/api/auth/callback/apple`

### Linking a kid's iPad: a code, not a sign-in

The iPad shows a short code and a QR code. You open the QR on your phone, where you're already signed in, and tap Approve. The iPad gets its own session: it lasts a year and renews whenever it's used. This uses Better Auth's [device authorization](https://better-auth.com/docs/plugins/device-authorization) plugin, the same pattern TVs use.

Why not just sign in on the iPad:
- Developers report that Google sign-in from an iOS home-screen app can leave the app for Safari.
- The home-screen app keeps its own cookies, separate from Safari's, so a sign-in finished in Safari doesn't carry back.
- A kid's iPad shouldn't need your Google account on it.

A linked iPad can open and save its kid's diary. Deleting a diary, removing an iPad, or adding a kid needs your own sign-in, not the iPad's.

### Diaries and who can open them

- **One new table,** `diary_access (diary_id, user_id, added_at)`. A diary can have more than one grown-up.
- **`diaries` and `answers` don't change.** `DIARY_SECRET` stays exactly as it is.
- **Rules in `api/diary.ts`:**
  - *A diary with a grown-up:* only that grown-up's sessions can open it, save it or read its answers, including iPads they linked. Only their own sign-in can delete it. A bare diary ID stops working, which closes today's gap where the ID saved on a device works as a key.
  - *A diary with no grown-up yet:* works by its ID as it does today, until the switch.
- **New calls:**
  - list my kids;
  - add a kid (a new diary, no PIN);
  - attach an existing diary;
  - list linked iPads and remove one.

### Moving the two existing diaries

On each kid's iPad:
1. A new "Link this iPad" button on the Grown-ups screen shows the code.
2. You approve it on your phone.
3. The approval sees that this iPad already has a diary and offers to add it to your account.

That's the whole move. A diary that was only on the iPad and never saved online gets uploaded at that moment.

The other way in, from any device: "Add a diary you already have" on the grown-up page, with the kid's name and PIN, checked the same way as today.

Any other device that has a diary open stops working once that diary has a grown-up. It shows the link code and needs approving too.

Before any of this, take a Neon branch of the production database: an instant copy to roll back to.

### What todd.sh has to change

Today's forwarder (`app/timesTableDiary/App/api/diary/route.ts` in todd.sh) only handles `/api/diary`. It passes on just `content-type`, which drops cookies and the `Authorization` header, and it follows redirects itself. Sign-in needs all three.

The change is one forwarder for all of the app's API paths, `app/timesTableDiary/App/api/[...path]/route.ts`. It:
- passes `Cookie` and `Authorization` in, and `Set-Cookie` and `Location` back out, without following redirects;
- accepts form bodies, because Apple posts its callback as a form;
- keeps sending the visitor's address with `DIARY_PROXY_KEY`. Better Auth's rate limits need the real address too.

A catch-all route is only checked after next.config's rewrites, so the app's rewrite (`/timesTableDiary/App/:path*`) now leaves out `api/`.

As before: make the change in a scratch clone of todd.sh, check what production serves first, and push only with your OK.

## Steps

1. **Prove the risky parts, with nothing kids can see.** Add the Better Auth endpoints, the todd.sh forwarder, a Google sign-in app, and a grown-up page reachable only by its address. Then prove:
   - Google sign-in and Apple sign-in on your phone through www.todd.sh, and still signed in after closing and reopening. Apple sends its answer back as a form post from its own site, so it gets tried separately from Google.
   - Approving a link code on your phone for "Test: link this browser" on another device.
   - That Better Auth runs on the production database, and the API paths reach it through todd.sh.

   Linking a home-screen install moves to step 4, where the kid's side gets built. Linking is plain requests with no redirects, the same kind the diary already makes from the home-screen app, so it's not the risky part. The risky part is Google and Apple sign-in through todd.sh.

   **Built and pushed on 2026-11-07,** with the todd.sh forwarder. Better Auth runs inside the app's API (`api/auth.ts`, `server/auth.ts`), with tables named `auth_user`, `auth_session`, `auth_account`, `auth_verification` and `auth_device_code`. The page is `?grownups`. Until `BETTER_AUTH_SECRET` is set, the sign-in API answers "not ready". Trying Google and Apple sign-in waits on their keys.
2. **Accounts and access on the server:** the `diary_access` table, the rules above, the new calls, and tests in `test/api.test.ts` against the fake store.
3. **The grown-up page:**
   - sign in and out;
   - your kids with their reports (the existing Report screen);
   - add a kid;
   - approve a code;
   - add an existing diary;
   - linked iPads, each with a Remove button.
4. **The kid's side:**
   - the link code on the welcome screen, styled in each of the eight looks;
   - "Link this iPad" on the Grown-ups screen;
   - a calm "Ask a grown-up to link this iPad" if an iPad's session ends. The diary stays on the iPad and syncs again once relinked.
5. **Move the two diaries,** with you, on the iPads.
6. **The switch:**
   - stop making name + PIN diaries;
   - once both diaries are attached, retire the name + PIN open route and its rate limits;
   - update the README and the todd.sh write-up, which both describe name + PIN.

## Checks

- **Tests:** the access rules, through the same fake-store tests the API has now.
- **Browser runs** in Chromium and WebKit for each flow, using Better Auth's test helpers in place of a real Google sign-in.
- **Element-box comparison** against live in all eight looks, with motion reduced. Every screen except the welcome and Grown-ups screens must match.
- **On real devices, by you:**
  - Google (and Apple) sign-in on your phone;
  - linking the home-screen app on her iPad.

## What you'll need to do

- **Google Cloud:**
  - create a web OAuth client with the Google return address above;
  - publish its consent screen;
  - it asks only for name and email.
- **Apple:**
  - an Apple Developer membership;
  - an App ID and Services ID with Sign in with Apple, with www.todd.sh as the domain;
  - the Apple return address above;
  - a key file (downloadable once).
- **Add the secrets to Vercel yourself:**
  - `BETTER_AUTH_SECRET`;
  - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`;
  - `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` and `APPLE_PRIVATE_KEY`.
- **Approve the todd.sh push.**

## Cost

- Better Auth and Google: free.
- Apple: $99 a year for the developer membership.
- The new tables are small and fit easily on Neon's free plan.

## Not in this plan

- Two kids sharing one iPad. It stays one diary per iPad.
- Inviting a second grown-up. The `diary_access` table allows it; the invite screen comes later.
- Passwords, email codes and magic links.
- Sign-up or invites aimed at other families. It would work for them, but nothing extra is built for it.
