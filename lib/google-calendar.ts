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
  auth.setCredentials({ ...tokens, scope: tokens.scope ?? undefined });
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

  // Build 9 AM – 6 PM window in the user's local timezone
  const dayStart = zonedHourToUTC(dateStr, 9,  timezone);
  const dayEnd   = zonedHourToUTC(dateStr, 18, timezone);

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
        label: startDate.toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: true }),
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
  timezone?: string;
}

// ── Timezone helpers ──────────────────────────────────────────────────────────
function getTimezoneOffsetMs(date: Date, timezone: string): number {
  const fmt = (tz: string) => {
    const f = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const p = Object.fromEntries(
      f.formatToParts(date).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value])
    );
    return new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`).getTime();
  };
  return fmt(timezone) - fmt('UTC');
}

// Returns the UTC Date that corresponds to `hour:00` on `dateStr` in `timezone`
function zonedHourToUTC(dateStr: string, hour: number, timezone: string): Date {
  const hourStr = String(hour).padStart(2, '0');
  const naiveUTC = new Date(`${dateStr}T${hourStr}:00:00.000Z`);
  const offsetMs = getTimezoneOffsetMs(naiveUTC, timezone);
  return new Date(naiveUTC.getTime() - offsetMs);
}

export async function createEvent(tokens: GoogleTokens, details: BookingDetails) {
  const cal = calendarClient(tokens);

  const event = await cal.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all',  // sends email to guest
    requestBody: {
      summary: details.summary,
      description: details.description ?? '',
      start: { dateTime: details.startIso, timeZone: details.timezone ?? 'UTC' },
      end:   { dateTime: details.endIso,   timeZone: details.timezone ?? 'UTC' },
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

  if (p === 'today')    return toDateStr(today);
  if (p === 'tomorrow') { today.setDate(today.getDate() + 1); return toDateStr(today); }

  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

  // "next monday", "this friday", bare "friday" — all resolve to the nearest future occurrence
  const stripped = p.startsWith('next ') ? p.slice(5) : p.startsWith('this ') ? p.slice(5) : p;
  const targetDay = DAYS.indexOf(stripped);
  if (targetDay !== -1) {
    // diff=0 means today — push to next week so we don't book on the same day
    const diff = (targetDay - today.getDay() + 7) % 7 || 7;
    today.setDate(today.getDate() + diff);
    return toDateStr(today);
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
