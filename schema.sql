-- ============================================================
-- Eco Heroes - Supabase schema setup
-- Mirrors Hardwood Heroes exactly: bigint points, int pps,
-- the empty-roster guard, row-locking trade RPC, full RLS.
-- Run this entire file in the Supabase SQL Editor.
-- ============================================================

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  color text not null,
  emoji text not null,
  points bigint not null default 0,
  packs_available integer not null default 1,
  daily_claimed boolean not null default false,
  last_daily_date date,
  unlocked_tracks text[] not null default array['vibes','practice'],
  binder_data jsonb default '{"binders":[],"cardStates":{}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- OWNED CARDS ----------
create table if not exists public.owned_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  card_uid text not null,
  first_name text not null,
  last_name text not null,
  number integer,
  pps integer not null default 0,
  rarity text not null,
  material text not null,
  team text,
  tag text,
  pose text,
  qty integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists owned_cards_owner_idx on public.owned_cards(owner_id);

-- ---------- PENDING TRADES ----------
create table if not exists public.pending_trades (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  give_cards jsonb not null default '[]'::jsonb,
  receive_cards jsonb not null default '[]'::jsonb,
  give_points integer not null default 0,
  receive_points integer not null default 0,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists pending_trades_to_idx on public.pending_trades(to_id);
create index if not exists pending_trades_from_idx on public.pending_trades(from_id);

-- ---------- ROW-LEVEL SECURITY ----------
alter table public.profiles enable row level security;
alter table public.owned_cards enable row level security;
alter table public.pending_trades enable row level security;

-- profiles: anon can read (so LoginScreen can list users before auth)
drop policy if exists "anon can read basic profile info" on public.profiles;
create policy "anon can read basic profile info" on public.profiles for select to anon using (true);

-- profiles: authenticated can read all
drop policy if exists "read all profiles" on public.profiles;
create policy "read all profiles" on public.profiles for select using (true);

-- profiles: update own
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- owned_cards policies (matching HH exactly)
drop policy if exists "read all cards" on public.owned_cards;
create policy "read all cards" on public.owned_cards for select using (true);

drop policy if exists "insert own cards" on public.owned_cards;
create policy "insert own cards" on public.owned_cards for insert with check (auth.uid() = owner_id);

drop policy if exists "update own cards" on public.owned_cards;
create policy "update own cards" on public.owned_cards for update using (auth.uid() = owner_id);

drop policy if exists "delete own cards" on public.owned_cards;
create policy "delete own cards" on public.owned_cards for delete using (auth.uid() = owner_id);

-- pending_trades policies
drop policy if exists "read trades involving you" on public.pending_trades;
create policy "read trades involving you" on public.pending_trades for select
  using ((auth.uid() = from_id) or (auth.uid() = to_id));

drop policy if exists "send trades from yourself" on public.pending_trades;
create policy "send trades from yourself" on public.pending_trades for insert
  with check (auth.uid() = from_id);

-- ---------- RPC: replace_my_roster (with empty-roster safety guard) ----------
create or replace function public.replace_my_roster(p_cards jsonb)
returns void
language plpgsql
security definer
as $function$
declare
  v_user_id uuid := auth.uid();
  v_card jsonb;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  -- Refuse to commit an empty roster (protects against accidental wipes).
  if jsonb_array_length(coalesce(p_cards, '[]'::jsonb)) = 0 then
    raise exception 'replace_my_roster refused: empty roster; pass NULL to skip or use specific delete';
  end if;
  delete from owned_cards where owner_id = v_user_id;
  for v_card in select * from jsonb_array_elements(p_cards) loop
    insert into owned_cards (
      owner_id, card_uid, first_name, last_name, number, pps,
      rarity, material, team, tag, pose, qty
    ) values (
      v_user_id,
      v_card->>'card_uid',
      v_card->>'first_name',
      v_card->>'last_name',
      nullif(v_card->>'number','')::int,
      coalesce(nullif(v_card->>'pps','')::int, 0),
      v_card->>'rarity',
      v_card->>'material',
      v_card->>'team',
      v_card->>'tag',
      v_card->>'pose',
      coalesce(nullif(v_card->>'qty','')::int, 1)
    );
  end loop;
end;
$function$;

grant execute on function public.replace_my_roster(jsonb) to authenticated;

-- ---------- RPC: apply_trade_accept (with row lock + status check) ----------
create or replace function public.apply_trade_accept(
  p_trade_id uuid,
  p_sender_state jsonb,
  p_recipient_state jsonb
)
returns void
language plpgsql
security definer
as $function$
declare
  v_trade pending_trades%rowtype;
  v_card  jsonb;
begin
  -- Lock the trade row
  select * into v_trade from pending_trades where id = p_trade_id for update;
  if not found then raise exception 'Trade not found'; end if;
  if v_trade.status <> 'pending' then raise exception 'Trade is not pending'; end if;
  if auth.uid() <> v_trade.to_id then raise exception 'Only recipient can accept this trade'; end if;
  -- Update sender (from_id) profile + roster
  update profiles
    set points = (p_sender_state->>'points')::bigint,
        updated_at = now()
    where id = v_trade.from_id;
  delete from owned_cards where owner_id = v_trade.from_id;
  for v_card in select * from jsonb_array_elements(p_sender_state->'cards') loop
    insert into owned_cards (
      owner_id, card_uid, first_name, last_name, number, pps,
      rarity, material, team, tag, pose, qty
    ) values (
      v_trade.from_id,
      v_card->>'card_uid',
      v_card->>'first_name',
      v_card->>'last_name',
      nullif(v_card->>'number','')::int,
      coalesce(nullif(v_card->>'pps','')::int, 0),
      v_card->>'rarity',
      v_card->>'material',
      v_card->>'team',
      v_card->>'tag',
      v_card->>'pose',
      coalesce(nullif(v_card->>'qty','')::int, 1)
    );
  end loop;
  -- Update recipient (to_id) profile + roster
  update profiles
    set points = (p_recipient_state->>'points')::bigint,
        updated_at = now()
    where id = v_trade.to_id;
  delete from owned_cards where owner_id = v_trade.to_id;
  for v_card in select * from jsonb_array_elements(p_recipient_state->'cards') loop
    insert into owned_cards (
      owner_id, card_uid, first_name, last_name, number, pps,
      rarity, material, team, tag, pose, qty
    ) values (
      v_trade.to_id,
      v_card->>'card_uid',
      v_card->>'first_name',
      v_card->>'last_name',
      nullif(v_card->>'number','')::int,
      coalesce(nullif(v_card->>'pps','')::int, 0),
      v_card->>'rarity',
      v_card->>'material',
      v_card->>'team',
      v_card->>'tag',
      v_card->>'pose',
      coalesce(nullif(v_card->>'qty','')::int, 1)
    );
  end loop;
  -- Mark trade accepted
  update pending_trades
    set status = 'accepted', resolved_at = now()
    where id = p_trade_id;
end;
$function$;

grant execute on function public.apply_trade_accept(uuid, jsonb, jsonb) to authenticated;

-- ---------- REALTIME ----------
alter publication supabase_realtime add table public.pending_trades;

-- ============================================================
-- DONE. Now:
-- 1. Create 6 auth users via Authentication > Users > Add user
--    Use fake emails like tyler@eco-heroes.local. Set a 4-6 digit
--    PIN as each user's password.
-- 2. Insert profile rows below (replace UUIDs with what Supabase
--    generated for each user — find them in Authentication > Users).
-- ============================================================

-- Example profile inserts (uncomment and fill in real UUIDs from auth.users):
/*
insert into public.profiles (id, username, display_name, color, emoji, points) values
  ('<tyler-uuid>',   'tyler',   'Tyler',   '#fb923c', '🦊', 3000),
  ('<carter-uuid>',  'carter',  'Carter',  '#22d3ee', '🐺', 3000),
  ('<mama-uuid>',    'mama',    'Mama',    '#f472b6', '🦋', 3000),
  ('<grandma-uuid>', 'grandma', 'Grandma', '#a78bfa', '🦉', 3000),
  ('<grandpa-uuid>', 'grandpa', 'Grandpa', '#86efac', '🦅', 3000),
  ('<kyle-uuid>',    'kyle',    'Kyle',    '#fde68a', '🦝', 3000);
*/
