# Daily task tracker

A small Next.js app with the same grid UI as the Claude artifact version, backed by a Supabase table instead of local storage. Every save writes straight to Supabase, so the whole team sees the same board from a real URL.

## 1. Create the Supabase table

1. Go to [supabase.com](https://supabase.com) and open (or create) your project.
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`. This creates a `tasks` table with columns `date`, `person`, `task`, `jira_link`, plus a unique constraint on `(date, person)` and an open read/write policy.
3. Go to **Settings → API** and copy your **Project URL** and **anon public key** — you'll need both next.

## 2. Run it locally

```bash
npm install
cp .env.local.example .env.local
# paste your Project URL and anon key into .env.local
npm run dev
```

Open `http://localhost:3000` — you should see the empty tracker. Click "+ Add day" and fill in a cell to confirm it's writing to Supabase (check the `tasks` table in the Supabase dashboard).

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In [vercel.com](https://vercel.com), click **New Project** and import that repo.
3. In the project's **Environment Variables** settings, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (same values as your `.env.local`)
4. Deploy. Vercel gives you a live URL — share that with Tahmina, Hasnat, Nitol, and Hridoy.

## Notes

- The `tasks` table's row-level security policy currently allows full read/write access to anyone with the anon key (i.e. anyone with the deployed URL, since the key is public in the client bundle). That's normal for a small internal tool behind a private link, but if you ever want to restrict who can edit, add Supabase Auth and scope the policy to `auth.uid()`.
- "Add day" only creates a row locally until you save a cell for it — that mirrors the artifact version's behavior and avoids empty rows piling up in the database.
- Removing a day deletes all four people's entries for that date from Supabase — there's no undo.
