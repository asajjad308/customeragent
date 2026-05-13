import { google } from 'googleapis';

export interface GoogleTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  token_type?: string | null;
  scope?: string | null;
}

export interface TimeSlot {
  start: string; // ISO
  end: string;   // ISO
  label: string; // "2:00 PM"
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl(tenantId: string): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.freebusy',
    ],
    state: tenantId,
  });
}

export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens as GoogleTokens;
}

function calendarClient(tokens: GoogleTokens) {
  const auth = getOAuthClient();
  auth.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth });
}

// ── Availability ──────────────────────────────────────────────────────────────
// Returns up to 6 free slots on a given date (9 AM – 6 PM, business hours)
export async function getAvailableSlots(
  tokens: GoogleTokens,
  dateStr: string,        // YYYY-MM-DD
  durationMins = 30,
  timezone = 'UTC',
): Promise<TimeSlot[]> {
  const cal = calendarClient(tokens);

  // Build day window in the target timezone
  const dayStart = new Date(`${dateStr}T09:00:00`);
  const dayEnd   = new Date(`${dateStr}T18:00:00`);

  const freeBusy = await cal.freebusy.query({
    requestBody: {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      timeZone: timezone,
      items: [{ id: 'primary' }],
    },
  });

  const busy = (freeBusy.data.calendars?.primary?.busy ?? []).map((b) => ({
    start: new Date(b.start!).getTime(),
    end:   new Date(b.end!).getTime(),
  }));

  // Walk through day in `durationMins` increments, collect free slots
  const slots: TimeSlot[] = [];
  const step = durationMins * 60 * 1000;
  let cursor = dayStart.getTime();

  while (cursor + step <= dayEnd.getTime() && slots.length < 6) {
    const slotEnd = cursor + step;
    const conflict = busy.some((b) => cursor < b.end && slotEnd > b.start);
    if (!conflict) {
      const startDate = new Date(cursor);
      slots.push({
        start: startDate.toISOString(),
        end:   new Date(slotEnd).toISOString(),
        label: startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      });
    }
    cursor += step;
  }

  return slots;
}

// ── Create event ──────────────────────────────────────────────────────────────
export interface BookingDetails {
  summary: string;
  guestName: string;
  guestEmail: string;
  startIso: string;
  endIso: string;
  description?: string;
}

export async function createEvent(tokens: GoogleTokens, details: BookingDetails) {
  const cal = calendarClient(tokens);

  const event = await cal.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all',  // sends email to guest
    requestBody: {
      summary: details.summary,
      description: details.description ?? '',
      start: { dateTime: details.startIso, timeZone: 'UTC' },
      end:   { dateTime: details.endIso,   timeZone: 'UTC' },
      attendees: [{ email: details.guestEmail, displayName: details.guestName }],
      conferenceData: undefined,
    },
  });

  return {
    id:       event.data.id,
    htmlLink: event.data.htmlLink,
    summary:  event.data.summary,
    start:    event.data.start?.dateTime,
    end:      event.data.end?.dateTime,
  };
}

// ── Parse natural date from AI ────────────────────────────────────────────────
// Converts relative phrases to YYYY-MM-DD.
export function resolveDateStr(phrase: string): string {
  const today = new Date();
  const p = phrase.toLowerCase().trim();

  if (p === 'today')     return toDateStr(today);
  if (p === 'tomorrow')  { today.setDate(today.getDate() + 1); return toDateStr(today); }
  if (p.startsWith('next ')) {
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const target = days.indexOf(p.slice(5));
    if (target !== -1) {
      const diff = (target - today.getDay() + 7) % 7 || 7;
      today.setDate(today.getDate() + diff);
      return toDateStr(today);
    }
  }
  // Try direct parse (e.g., "May 15", "2026-05-15")
  const parsed = new Date(phrase);
  if (!isNaN(parsed.getTime())) return toDateStr(parsed);

  // Fallback: tomorrow
  today.setDate(today.getDate() + 1);
  return toDateStr(today);
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
