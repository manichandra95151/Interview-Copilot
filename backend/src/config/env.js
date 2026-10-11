/**
 * env.js — validated environment config.
 * Fails fast at boot if required variables are missing, so we never run
 * with a dangerous fallback secret.
 */
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI / integrations (optional at boot; required by the features that use them)
  ANTHROPIC_API_KEY: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(),
  DEEPGRAM_MODEL: z.string().default('nova-2'),
  VOYAGE_API_KEY: z.string().optional(),
  VOYAGE_MODEL: z.string().default('voyage-3'),

  // Gmail API (interview invites) — OAuth2 refresh-token flow
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REFRESH_TOKEN: z.string().optional(),
  GMAIL_SENDER: z.string().optional(), // e.g. "CopilotHire <you@gmail.com>"

  // LiveKit (in-app video interview)
  LIVEKIT_URL: z.string().optional(),        // wss://<project>.livekit.cloud
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(`\n❌ Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
