import type { CalendarEvent, OAuthTokens } from "../types/calendar";
import type { CalendarService } from "./calendar-service";

export class MockCalendarService implements CalendarService {
  private tokens: OAuthTokens | null = null;
  private settings: Map<string, string> = new Map();
  private mockEvents: CalendarEvent[] = [];

  setMockEvents(events: CalendarEvent[]): void {
    this.mockEvents = events;
  }

  async getTokens(): Promise<OAuthTokens | null> {
    return this.tokens;
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    this.tokens = tokens;
  }

  async clearTokens(): Promise<void> {
    this.tokens = null;
  }

  async exchangeAuthCode(_code: string, _clientId: string, _clientSecret: string): Promise<OAuthTokens> {
    const tokens: OAuthTokens = {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresAt: Date.now() + 3600_000,
    };
    this.tokens = tokens;
    return tokens;
  }

  async refreshAccessToken(_refreshToken: string, _clientId: string, _clientSecret: string): Promise<OAuthTokens> {
    const tokens: OAuthTokens = {
      accessToken: "mock-refreshed-access-token",
      refreshToken: _refreshToken,
      expiresAt: Date.now() + 3600_000,
    };
    this.tokens = tokens;
    return tokens;
  }

  async fetchTodayEvents(_accessToken: string): Promise<CalendarEvent[]> {
    return this.mockEvents;
  }

  async saveSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
  }

  async getSetting(key: string): Promise<string | null> {
    return this.settings.get(key) ?? null;
  }

  clear(): void {
    this.tokens = null;
    this.settings.clear();
    this.mockEvents = [];
  }
}
