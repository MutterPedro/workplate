import type { CalendarEvent, OAuthTokens, TimeBlock } from "../types/calendar";

export interface CalendarService {
  getTokens(): Promise<OAuthTokens | null>;
  saveTokens(tokens: OAuthTokens): Promise<void>;
  clearTokens(): Promise<void>;
  exchangeAuthCode(code: string, clientId: string, clientSecret: string): Promise<OAuthTokens>;
  refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<OAuthTokens>;
  fetchTodayEvents(accessToken: string): Promise<CalendarEvent[]>;
  saveSetting(key: string, value: string): Promise<void>;
  getSetting(key: string): Promise<string | null>;
}

export function classifyEvent(summary: string, attendeeCount: number): CalendarEvent["type"] {
  if (attendeeCount > 0) return "meeting";
  const lower = summary.toLowerCase();
  if (lower.includes("focus") || lower.includes("deep work")) return "focus";
  return "other";
}

export function computeTimeBlocks(events: CalendarEvent[], dateStr: string, workHours?: { workStart: string; workEnd: string }): TimeBlock[] {
  const dayStart = `${dateStr}T${workHours?.workStart ?? "09:00"}:00`;
  const dayEnd = `${dateStr}T${workHours?.workEnd ?? "17:00"}:00`;

  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));

  const blocks: TimeBlock[] = [];
  let cursor = dayStart;

  for (const event of sorted) {
    const eventStart = event.start < dayStart ? dayStart : event.start;
    const eventEnd = event.end > dayEnd ? dayEnd : event.end;

    if (eventStart > cursor) {
      blocks.push({ start: cursor, end: eventStart, kind: "free" });
    }

    blocks.push({ start: eventStart, end: eventEnd, kind: "event", event });
    cursor = eventEnd > cursor ? eventEnd : cursor;
  }

  if (cursor < dayEnd) {
    blocks.push({ start: cursor, end: dayEnd, kind: "free" });
  }

  return blocks;
}

function formatLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function computePomodoroBlocks(
  blocks: TimeBlock[],
  config: { pomodoroDuration: number; restDuration: number }
): TimeBlock[] {
  const result: TimeBlock[] = [];

  for (const block of blocks) {
    if (block.kind !== "free") {
      result.push(block);
      continue;
    }

    const blockStart = new Date(block.start);
    const blockEnd = new Date(block.end);
    const totalMinutes = (blockEnd.getTime() - blockStart.getTime()) / 60000;

    if (totalMinutes < config.pomodoroDuration) {
      result.push(block);
      continue;
    }

    let cursor = blockStart.getTime();
    const pomodoroMs = config.pomodoroDuration * 60000;
    const restMs = config.restDuration * 60000;

    while (true) {
      const remaining = blockEnd.getTime() - cursor;
      if (remaining < pomodoroMs) {
        if (remaining > 0) {
          result.push({
            start: formatLocal(new Date(cursor)),
            end: formatLocal(new Date(cursor + remaining)),
            kind: "free",
          });
        }
        break;
      }

      result.push({
        start: formatLocal(new Date(cursor)),
        end: formatLocal(new Date(cursor + pomodoroMs)),
        kind: "pomodoro",
      });
      cursor += pomodoroMs;

      const remainingAfterPom = blockEnd.getTime() - cursor;
      if (remainingAfterPom >= pomodoroMs + restMs) {
        result.push({
          start: formatLocal(new Date(cursor)),
          end: formatLocal(new Date(cursor + restMs)),
          kind: "rest",
        });
        cursor += restMs;
      } else {
        if (remainingAfterPom > 0) {
          result.push({
            start: formatLocal(new Date(cursor)),
            end: formatLocal(new Date(cursor + remainingAfterPom)),
            kind: "free",
          });
        }
        break;
      }
    }
  }

  return result;
}

export function computeBlockHeight(start: string, end: string, pxPerMin: number = 2): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const minutes = (endDate.getTime() - startDate.getTime()) / 60000;
  return Math.round(minutes * pxPerMin);
}

const GOOGLE_COLOR_MAP: Record<string, string> = {
  "1": "#7986CB",  // lavender
  "2": "#33B679",  // sage
  "3": "#8E24AA",  // grape
  "4": "#E67C73",  // flamingo
  "5": "#F6BF26",  // banana
  "6": "#F4511E",  // tangerine
  "7": "#039BE5",  // peacock
  "8": "#616161",  // graphite
  "9": "#3F51B5",  // blueberry
  "10": "#0B8043", // basil
  "11": "#D50000", // tomato
};

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function eventColor(colorId?: string, summary?: string): string {
  if (colorId && GOOGLE_COLOR_MAP[colorId]) {
    return GOOGLE_COLOR_MAP[colorId];
  }
  const hash = djb2Hash(summary ?? "");
  const hue = hash % 360;
  const s = 65;
  const l = 45;
  // Convert HSL to hex
  const h = hue / 360;
  const a = s / 100 * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function insertLunchBlock(blocks: TimeBlock[], lunchStart: string, lunchDurationMinutes: number): TimeBlock[] {
  const result: TimeBlock[] = [];

  // Extract date from first block
  const dateStr = blocks[0]?.start.substring(0, 10) ?? "";
  const lunchStartISO = `${dateStr}T${lunchStart}:00`;
  const lunchEndDate = new Date(lunchStartISO);
  lunchEndDate.setMinutes(lunchEndDate.getMinutes() + lunchDurationMinutes);
  const lunchEndISO = formatLocal(lunchEndDate);

  // Check if lunch would overlap any event block
  for (const block of blocks) {
    if (block.kind === "event") {
      if (lunchStartISO < block.end && lunchEndISO > block.start) {
        return blocks; // overlap, return unchanged
      }
    }
  }

  for (const block of blocks) {
    if (block.kind !== "free") {
      result.push(block);
      continue;
    }

    // Check if this free block contains the lunch period
    if (lunchStartISO >= block.start && lunchEndISO <= block.end) {
      // Free block before lunch
      if (lunchStartISO > block.start) {
        result.push({ start: block.start, end: lunchStartISO, kind: "free" });
      }
      // Lunch block
      result.push({ start: lunchStartISO, end: lunchEndISO, kind: "lunch" });
      // Free block after lunch
      if (lunchEndISO < block.end) {
        result.push({ start: lunchEndISO, end: block.end, kind: "free" });
      }
    } else {
      result.push(block);
    }
  }

  return result;
}

export function reorderTaskAssignments(blocks: TimeBlock[], fromPomodoroIndex: number, toPomodoroIndex: number): TimeBlock[] {
  const pomodoroIndices: number[] = [];
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].kind === "pomodoro") {
      pomodoroIndices.push(i);
    }
  }

  if (fromPomodoroIndex >= pomodoroIndices.length || toPomodoroIndex >= pomodoroIndices.length) {
    return blocks;
  }

  const result = blocks.map((b) => ({ ...b }));
  const fromIdx = pomodoroIndices[fromPomodoroIndex];
  const toIdx = pomodoroIndices[toPomodoroIndex];
  const tempTask = result[fromIdx].assignedTask;
  result[fromIdx].assignedTask = result[toIdx].assignedTask;
  result[toIdx].assignedTask = tempTask;
  return result;
}

export function moveLunchBlock(
  currentLunchStart: string,
  newLunchStart: string,
  events: CalendarEvent[],
  dateStr: string,
  lunchDurationMinutes: number = 60,
): string {
  const lunchStartISO = `${dateStr}T${newLunchStart}:00`;
  const lunchEndDate = new Date(lunchStartISO);
  lunchEndDate.setMinutes(lunchEndDate.getMinutes() + lunchDurationMinutes);
  const lunchEndISO = formatLocal(lunchEndDate);

  // Check overlap with events
  for (const event of events) {
    if (lunchStartISO < event.end && lunchEndISO > event.start) {
      return currentLunchStart; // overlap, return unchanged
    }
  }

  return newLunchStart;
}

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const REDIRECT_URI = "http://localhost:8085";

export class TauriCalendarService implements CalendarService {
  private async getDb() {
    const Database = (await import("@tauri-apps/plugin-sql")).default;
    return Database.load("sqlite:workplate.db");
  }

  async getTokens(): Promise<OAuthTokens | null> {
    const db = await this.getDb();
    const rows: { value: string }[] = await db.select(
      "SELECT value FROM settings WHERE key = ?",
      ["oauth_tokens"],
    );
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].value);
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      ["oauth_tokens", JSON.stringify(tokens)],
    );
  }

  async clearTokens(): Promise<void> {
    const db = await this.getDb();
    await db.execute("DELETE FROM settings WHERE key = ?", ["oauth_tokens"]);
  }

  async exchangeAuthCode(code: string, clientId: string, clientSecret: string): Promise<OAuthTokens> {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  async refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<OAuthTokens> {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  async fetchTodayEvents(accessToken: string): Promise<CalendarEvent[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const params = new URLSearchParams({
      timeMin: startOfDay,
      timeMax: endOfDay,
      singleEvents: "true",
      orderBy: "startTime",
    });

    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
    const data = await res.json();

    return (data.items ?? []).map((item: any) => ({
      id: item.id,
      summary: item.summary ?? "(No title)",
      start: item.start?.dateTime ?? item.start?.date ?? "",
      end: item.end?.dateTime ?? item.end?.date ?? "",
      type: classifyEvent(item.summary ?? "", (item.attendees ?? []).length),
      htmlLink: item.htmlLink,
      color: eventColor(item.colorId, item.summary ?? "(No title)"),
    }));
  }

  async saveSetting(key: string, value: string): Promise<void> {
    const db = await this.getDb();
    await db.execute(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [key, value],
    );
  }

  async getSetting(key: string): Promise<string | null> {
    const db = await this.getDb();
    const rows: { value: string }[] = await db.select(
      "SELECT value FROM settings WHERE key = ?",
      [key],
    );
    return rows.length > 0 ? rows[0].value : null;
  }
}
