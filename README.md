# Eco Heroes

A family card-collecting game themed around animals and expeditions to
different ecosystems. Engine is a clone of Hardwood Heroes.

## Setup (one-time)

Do these in order. End state: a working local preview + a live Netlify URL.

### 1. Create a new GitHub repo

1. github.com -> new repo named `eco-heroes` (empty, no README).
2. In PowerShell:

```powershell
cd C:\Users\TylerDren
git clone https://github.com/<YOUR-USER>/eco-heroes.git
cd eco-heroes
```

### 2. Drop in these starter files

Copy ALL files from this starter bundle into `C:\Users\TylerDren\eco-heroes`,
preserving the folder structure:

```
eco-heroes/
  package.json
  vite.config.js
  index.html
  .gitignore
  schema.sql
  README.md
  src/
    main.jsx
    App.jsx
    LoginScreen.jsx
    lib/
      supabase.js
      persist.js
      dataStore.js
```

### 3. Copy your Hardwood Heroes main app file

```powershell
copy C:\Users\TylerDren\hardwood-heroes\src\HardwoodHeroes.jsx C:\Users\TylerDren\eco-heroes\src\EcoHeroes.jsx
```

NOTE: This file will still say "Hardwood Heroes" and have NBA players in it.
That's expected. The next message from Claude will be a transformation script
that swaps the title to "Eco Heroes", renames the function from HardwoodHome
to EcoHome, replaces NBA teams with animal habitats, and replaces the player
pool with a placeholder animal pool that Carter will iterate on.

### 4. Install dependencies

```powershell
cd C:\Users\TylerDren\eco-heroes
npm install
```

### 5. Create a new Supabase project

1. supabase.com -> New project. Name: `eco-heroes`. Pick a strong DB password.
2. Once provisioning finishes, open it.
3. SQL Editor -> New query -> paste the entire contents of `schema.sql` -> Run.
4. Expect: "Success. No rows returned."

### 6. Create 6 auth users + profile rows

In Supabase dashboard:

1. Authentication -> Users -> Add user. For each family member, create with:
   - Email: `<username>@eco-heroes.local` (fake email — e.g. tyler@eco-heroes.local)
   - Password: their 4-6 digit PIN
   - Auto Confirm User: YES (or they won't be able to log in)
2. After creating all 6, copy each one's UUID (from the Users list).
3. SQL Editor -> insert profile rows (replace UUIDs):

```sql
insert into public.profiles (id, username, display_name, color, emoji, points) values
  ('<tyler-uuid>',   'tyler',   'Tyler',   '#fb923c', '🦊', 3000),
  ('<carter-uuid>',  'carter',  'Carter',  '#22d3ee', '🐺', 3000),
  ('<mama-uuid>',    'mama',    'Mama',    '#f472b6', '🦋', 3000),
  ('<grandma-uuid>', 'grandma', 'Grandma', '#a78bfa', '🦉', 3000),
  ('<grandpa-uuid>', 'grandpa', 'Grandpa', '#86efac', '🦅', 3000),
  ('<kyle-uuid>',    'kyle',    'Kyle',    '#fde68a', '🦝', 3000);
```

Carter can later swap the emojis/colors however he likes.

### 7. Wire local app to Supabase

1. Supabase -> Project Settings -> API. Copy:
   - Project URL
   - anon public key
2. In `C:\Users\TylerDren\eco-heroes`, create `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
```

3. Start the dev server:

```powershell
npm run dev
```

The Eco Heroes login screen should appear. You should see all 6 family
members and be able to sign in with the PIN you set up.

### 8. Push to GitHub

```powershell
git add .
git commit -m "Initial Eco Heroes starter"
git push
```

### 9. Connect Netlify

1. netlify.com -> Add new site -> Import from GitHub -> pick `eco-heroes`.
2. Build command: `npm run build`. Publish directory: `dist`.
3. Site settings -> Environment variables, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

### 10. Run the Eco theme transformation

Ask Claude for the transformation script. It will swap the title, function
name, NBA teams, and player pool to Eco theme. After running it and pushing,
the app fully becomes Eco Heroes.

## Notes

- Auth: Email provider with `@eco-heroes.local` fake emails + PIN passwords.
- Schema matches Hardwood Heroes: bigint points, int pps, `binder_data` jsonb,
  the empty-roster guard, row-locking trade RPC.
- Friends/sharing will come later. For now it's a closed family app, same as HH.
