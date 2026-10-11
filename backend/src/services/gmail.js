/**
 * gmail.js — send interview invites via the Gmail API.
 *
 * Uses the OAuth2 refresh-token flow (no SDK): we exchange the long-lived
 * refresh token for a short-lived access token, then call the Gmail REST
 * send endpoint. If Gmail isn't configured, callers treat email as optional
 * and fall back to sharing the join link manually.
 */
import { env } from '../config/env.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

export function isConfigured() {
  return Boolean(
    env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN
  );
}

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: env.GMAIL_CLIENT_ID,
    client_secret: env.GMAIL_CLIENT_SECRET,
    refresh_token: env.GMAIL_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gmail token exchange failed (${res.status}): ${detail.slice(0, 160)}`);
  }
  const data = await res.json();
  return data.access_token;
}

/** URL-safe base64 per RFC 2045 §6.8 (Gmail raw format). */
function base64Url(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildMime({ to, from, subject, html }) {
  // Encode subject as UTF-8 (RFC 2047) so emoji/accents survive.
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
  ].join('\r\n');
}

function inviteHtml({ candidateName, role, companyLine, whenText, joinUrl, joinCode }) {
  return `
  <div style="background:#FBFAF7;padding:32px 0;font-family:Inter,Arial,sans-serif;color:#1A1A1A;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #ECE8DF;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#4F46E5,#6366F1);padding:22px 28px;color:#fff;">
        <div style="font-weight:700;font-size:15px;letter-spacing:-0.01em;">CopilotHire</div>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 6px;font-size:13px;color:#6A665E;">Hi ${candidateName || 'there'},</p>
        <h1 style="margin:0 0 14px;font-size:22px;font-weight:600;">You're invited to interview${role ? ` for <span style="color:#4F46E5;">${role}</span>` : ''}.</h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6A665E;">
          ${companyLine || ''}${whenText ? `Your interview is scheduled for <strong style="color:#1A1A1A;">${whenText}</strong>. ` : ''}
          When it's time, click the button below to join — it's a quick voice conversation, right in your browser.
        </p>
        <a href="${joinUrl}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">Join your interview →</a>
        ${joinCode ? `
        <div style="margin:22px 0 0;padding:14px 16px;background:#FBFAF7;border:1px solid #ECE8DF;border-radius:10px;">
          <div style="font-size:11px;color:#9C978C;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Your access code</div>
          <div style="font-size:24px;font-weight:700;letter-spacing:0.18em;color:#1A1A1A;">${joinCode}</div>
        </div>` : ''}
        <p style="margin:22px 0 0;font-size:12px;color:#9C978C;line-height:1.6;">
          If the button doesn't work, copy this link into your browser:<br/>
          <a href="${joinUrl}" style="color:#4F46E5;word-break:break-all;">${joinUrl}</a>
        </p>
      </div>
      <div style="padding:16px 28px;border-top:1px solid #ECE8DF;font-size:11px;color:#9C978C;">
        Sent by CopilotHire on behalf of the hiring team.
      </div>
    </div>
  </div>`;
}

/**
 * Send an interview invite. Returns { sent: boolean, reason? }.
 * Never throws for "not configured" — that's an expected soft state.
 */
export async function sendInterviewInvite({
  to,
  candidateName,
  role,
  companyLine,
  whenText,
  joinUrl,
  joinCode,
}) {
  if (!isConfigured()) return { sent: false, reason: 'not_configured' };

  const from = env.GMAIL_SENDER || 'CopilotHire';
  const html = inviteHtml({ candidateName, role, companyLine, whenText, joinUrl, joinCode });
  const subject = `Interview invitation${role ? ` — ${role}` : ''}`;
  const raw = base64Url(buildMime({ to, from, subject, html }));

  const accessToken = await getAccessToken();
  const res = await fetch(SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gmail send failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return { sent: true };
}
