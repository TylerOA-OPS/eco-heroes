// dataStore.js - Reads all family data from Supabase.

import { supabase } from './supabase.js';

function buildUser(profile, cardRows) {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    color: profile.color,
    emoji: profile.emoji,
    points: Number(profile.points),
    packsAvailable: profile.packs_available,
    dailyClaimed: !!profile.daily_claimed,
    lastDailyDate: profile.last_daily_date,
    unlockedTracks: profile.unlocked_tracks || ['vibes','practice'],
    binderData: profile.binder_data || { binders: [], cardStates: {} },
    ownedCards: cardRows.map(rowToCard),
    // ── Eco systems ──
    shelters:      profile.greenhouses    || [],   // Supabase col = greenhouses, app = shelters
    materials:     profile.materials      || {},
    expeditions:   profile.expeditions    || {},
    cardHunger:    profile.card_hunger    || {},
    cardInjury:    profile.card_injury    || {},
    foodInventory: profile.food_inventory || {},
    vetInventory:  profile.vet_inventory  || {},
  };
}

function rowToCard(row) {
  return {
    id: row.card_uid,
    _rowId: row.id,
    first: row.first_name,
    last: row.last_name,
    number: row.number,
    pps: row.pps,
    rarity: row.rarity,
    material: row.material,
    team: row.team,
    tag: row.tag,
    pose: row.pose || undefined,
    qty: row.qty || 1,
  };
}

function rowToTrade(row, usernameById) {
  return {
    id: row.id,
    from: usernameById.get(row.from_id),
    to: usernameById.get(row.to_id),
    give: Array.isArray(row.give_cards) ? row.give_cards : [],
    receive: Array.isArray(row.receive_cards) ? row.receive_cards : [],
    givePoints: row.give_points || 0,
    receivePoints: row.receive_points || 0,
    message: row.message || '',
    status: row.status,
    sentAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

export async function loadAllData() {
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (pErr) throw pErr;

  const { data: cards, error: cErr } = await supabase
    .from('owned_cards')
    .select('*');
  if (cErr) throw cErr;

  const { data: trades, error: tErr } = await supabase
    .from('pending_trades')
    .select('*')
    .order('created_at', { ascending: false });
  if (tErr) throw tErr;

  const usernameById = new Map();
  for (const p of profiles) usernameById.set(p.id, p.username);

  const cardsByOwner = new Map();
  for (const c of cards) {
    if (!cardsByOwner.has(c.owner_id)) cardsByOwner.set(c.owner_id, []);
    cardsByOwner.get(c.owner_id).push(c);
  }

  const users = {};
  for (const p of profiles) {
    users[p.username] = buildUser(p, cardsByOwner.get(p.id) || []);
  }

  const pendingTrades = trades.map(t => rowToTrade(t, usernameById));

  return { users, pendingTrades };
}

export function subscribeToTrades(onChange) {
  const channel = supabase
    .channel('pending_trades_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_trades' }, () => {
      onChange();
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
