export interface CalendarEvent {
  id: string;
  summary: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  type: "meeting" | "focus" | "other";
  htmlLink?: string;
  color?: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix ms
}

export interface TimeBlock {
  start: string; // ISO datetime
  end: string;
  kind: "free" | "event" | "pomodoro" | "rest" | "lunch";
  event?: CalendarEvent;
  assignedTask?: string;
}
