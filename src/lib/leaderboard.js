// leaderboard.js — mini-game high scores shared across the whole family.
//
// Backed by a `mini_game_scores` table + `submit_mini_game_score` RPC that do
// NOT exist yet (see the proposed schema handed to the owner). Every call here
// is guarded, so the arcade keeps working — it simply shows no scores and
// swallows submissions — until that migration is applied. Once the table and
// RPC exist, the leaderboard goes live with no further code changes.

import { supabase } from './supabase.js';

// Record a run for the current signed-in user + game. The RPC keeps the
// family-wide best (GREATEST), so posting a lower score is harmless.
// Returns true on success, false if the backend is not ready yet.
export async function submitMiniGameScore(gameId, score){
  try {
    const { error } = await supabase.rpc('submit_mini_game_score', {
      p_game_id: gameId,
      p_score: Math.max(0, Math.round(score || 0)),
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[submitMiniGameScore] skipped (leaderboard backend not ready):', e && e.message ? e.message : e);
    return false;
  }
}

// Load every family member high score for one game, best first.
// Returns an array of { ownerId, gameId, highScore, updatedAt }. Empty on error.
export async function loadMiniGameHighScores(gameId){
  try {
    const { data, error } = await supabase
      .from('mini_game_scores')
      .select('owner_id, game_id, high_score, updated_at')
      .eq('game_id', gameId)
      .order('high_score', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      ownerId: r.owner_id,
      gameId: r.game_id,
      highScore: r.high_score,
      updatedAt: r.updated_at,
    }));
  } catch (e) {
    console.warn('[loadMiniGameHighScores] skipped (leaderboard backend not ready):', e && e.message ? e.message : e);
    return [];
  }
}
