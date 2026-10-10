/**
 * voyage.js — Voyage AI embeddings (via REST).
 * voyage-3 outputs 1024-dim vectors, matching the resume_embeddings schema.
 */
import { env } from '../config/env.js';

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';

/**
 * Embed one or more texts.
 * @param {string[]} inputs
 * @param {'document'|'query'} inputType
 * @returns {Promise<number[][]>} one embedding vector per input
 */
export async function embed(inputs, inputType = 'document') {
  if (!env.VOYAGE_API_KEY) {
    throw Object.assign(new Error('RAG is not configured (missing VOYAGE_API_KEY)'), {
      status: 503,
    });
  }
  if (!inputs.length) return [];

  const res = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: inputs,
      model: env.VOYAGE_MODEL,
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Voyage embeddings failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  // Preserve input order via the index field.
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
