// persist.js — Writes changes back to Supabase.
//
// IMPORTANT: roster persistence is SEPARATE from profile persistence.
// - persistProfile: updates points/packs/daily/etc. only. Safe to
//   call frequently (e.g. from the points ticker).
// - persistRoster: atomically replaces the user's owned_cards. Called
//   ONLY after deliberate card-changing actions (pack open, mint,
//   sell, AI trade). Uses an RPC so DELETE+INSERT is one transaction.
// - Trades go through sendTrade / updateTradeStatus / applyTradeAccept.

import { supabase } from './supabase.js';

// Update only the profile row (points, packs, daily, tracks).
// Safe to call from the points ticker — does NOT touch cards.
export async function persistProfile(user) {
  if (!user || !user.id) return;
  const { error } = await supabase
    .from('profiles')
    .update({
      points: Math.round(user.points),
      packs_available: user.packsAvailable,
      daily_claimed: !!user.dailyClaimed,
      last_daily_date: user.lastDailyDate || null,
      unlocked_tracks: user.unlockedTracks || ['vibes','practice'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
  if (error) console.error('[persistProfile] failed:', error);
}

// Atomically replace the signed-in user's roster.
// Refuses to commit an empty roster (safety net against bugs).
// Caller is responsible for only calling this when cards actually changed.
export async function persistRoster(user) {
  if (!user || !user.id) return;
  if (!Array.isArray(user.ownedCards) || user.ownedCards.length === 0) {
    // Safety: never empty the roster automatically. If someone wants
    // to sell their last card, we'd need a specific delete-one helper.
    console.warn('[persistRoster] refused: empty roster (safety guard)');
    return;
  }
  const cards = user.ownedCards.map(cardToJson);
  const { error } = await supabase.rpc('replace_my_roster', { p_cards: cards });
  if (error) console.error('[persistRoster] failed:', error);
}

// Combined: persist profile + roster. Use after any card-changing action.
export async function persistUser(user) {
  await persistProfile(user);
  await persistRoster(user);
}

function cardToJson(card) {
  return {
    card_uid: card.id,
    first_name: card.first,
    last_name: card.last,
    number: card.number ?? null,
    pps: card.pps ?? 0,
    rarity: card.rarity,
    material: card.material,
    team: card.team || null,
    tag: card.tag || null,
    pose: card.pose || null,
    qty: card.qty || 1,
  };
}

// Insert a new pending trade.
export async function sendTrade(trade, fromUserId, toUserId) {
  const { error } = await supabase.from('pending_trades').insert({
    from_id: fromUserId,
    to_id: toUserId,
    give_cards: trade.give || [],
    receive_cards: trade.receive || [],
    give_points: trade.givePoints || 0,
    receive_points: trade.receivePoints || 0,
    message: trade.message || null,
    status: 'pending',
  });
  if (error) throw error;
}

// Update a trade's status (rejected / canceled). For acceptance use applyTradeAccept.
export async function updateTradeStatus(tradeId, status) {
  const { error } = await supabase
    .from('pending_trades')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', tradeId);
  if (error) throw error;
}

// Accept a trade: atomic across both users via SECURITY DEFINER RPC.
export async function applyTradeAccept(tradeId, senderState, recipientState) {
  const { error } = await supabase.rpc('apply_trade_accept', {
    p_trade_id: tradeId,
    p_sender_state: serializeUserState(senderState),
    p_recipient_state: serializeUserState(recipientState),
  });
  if (error) throw error;
}

function serializeUserState(user) {
  return {
    points: Math.round(user.points),
    cards: user.ownedCards.map(c => ({
      card_uid: c.id,
      first_name: c.first,
      last_name: c.last,
      number: c.number ?? null,
      pps: c.pps ?? 0,
      rarity: c.rarity,
      material: c.material,
      team: c.team || null,
      tag: c.tag || null,
      pose: c.pose || null,
      qty: c.qty || 1,
    })),
  };
}

// Light refresh: fetch only the current user's profile + roster.
// Used by manual pulls (e.g. inbox open) instead of refetching everyone.
export async function loadMyProfileAndCards(userId) {
  const [pRes, cRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('owned_cards').select('*').eq('owner_id', userId),
  ]);
  if (pRes.error) throw pRes.error;
  if (cRes.error) throw cRes.error;
  return { profile: pRes.data, cards: cRes.data || [] };
}

// Load only trades (cheap, ~6 rows). Used to refresh inbox without
// disturbing in-memory rosters.
export async function loadTradesOnly() {
  const { data, error } = await supabase
    .from('pending_trades')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

