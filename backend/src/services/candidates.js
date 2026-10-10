/**
 * candidates.js — candidate pool CRUD (DB access).
 */
import { supabase } from '../db/supabase.js';

export async function createCandidate(userId, { name, email, resumeText, resumePath }) {
  const { data, error } = await supabase
    .from('candidates')
    .insert({
      user_id: userId,
      name,
      email: email || null,
      resume_text: resumeText || null,
      resume_path: resumePath || null,
    })
    .select('id, name, email, created_at')
    .single();
  if (error) throw new Error('DB createCandidate: ' + error.message);
  return data;
}

export async function listCandidates(userId) {
  const { data, error } = await supabase
    .from('candidates')
    .select('id, name, email, created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error('DB listCandidates: ' + error.message);
  return data;
}

export async function getCandidate(userId, id) {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();
  if (error || !data) throw Object.assign(new Error('Candidate not found'), { status: 404 });
  return data;
}

/** Soft delete. */
export async function deleteCandidate(userId, id) {
  const { error } = await supabase
    .from('candidates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error('DB deleteCandidate: ' + error.message);
}
