import { useState, useEffect, useCallback } from "react";
import type { CalendarEvent, OAuthTokens, TimeBlock } from "../types/calendar";
import { useCalendarService } from "../services/calendar-context";
import { computeTimeBlocks } from "../services/calendar-service";
import { format } from "date-fns";

interface UseCalendarResult {
  connected: boolean;
  loading: boolean;
  events: CalendarEvent[];
  timeBlocks: TimeBlock[];
  error: string | null;
  connect: (code: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCalendar(selectedDate?: string, workHours?: { workStart: string; workEnd: string }): UseCalendarResult {
  const service = useCalendarService();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (tokens: OAuthTokens) => {
    try {
      const clientId = await service.getSetting("google_client_id") ?? "";
      const clientSecret = await service.getSetting("google_client_secret") ?? "";

      let activeTokens = tokens;
      if (Date.now() >= tokens.expiresAt) {
        activeTokens = await service.refreshAccessToken(tokens.refreshToken, clientId, clientSecret);
        await service.saveTokens(activeTokens);
      }

      const dateStr = selectedDate ?? format(new Date(), "yyyy-MM-dd");
      const todayEvents = await service.fetchTodayEvents(activeTokens.accessToken);
      setEvents(todayEvents);
      setTimeBlocks(computeTimeBlocks(todayEvents, dateStr, workHours));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch events");
    }
  }, [service, selectedDate, workHours]);

  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      const tokens = await service.getTokens();
      if (tokens) {
        setConnected(true);
        await fetchEvents(tokens);
      } else {
        setConnected(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initialize");
    } finally {
      setLoading(false);
    }
  }, [service, fetchEvents]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const connect = useCallback(async (code: string) => {
    try {
      setLoading(true);
      setError(null);
      const clientId = await service.getSetting("google_client_id") ?? "";
      const clientSecret = await service.getSetting("google_client_secret") ?? "";
      const tokens = await service.exchangeAuthCode(code, clientId, clientSecret);
      await service.saveTokens(tokens);
      setConnected(true);
      await fetchEvents(tokens);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
    } finally {
      setLoading(false);
    }
  }, [service, fetchEvents]);

  const disconnect = useCallback(async () => {
    await service.clearTokens();
    setConnected(false);
    setEvents([]);
    setTimeBlocks([]);
    setError(null);
  }, [service]);

  const refresh = useCallback(async () => {
    const tokens = await service.getTokens();
    if (tokens) {
      setLoading(true);
      await fetchEvents(tokens);
      setLoading(false);
    }
  }, [service, fetchEvents]);

  return { connected, loading, events, timeBlocks, error, connect, disconnect, refresh };
}
