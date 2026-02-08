import { useState, useEffect, useCallback, useMemo } from "react";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns";
import { useCalendarService } from "../services/calendar-context";
import { computePomodoroBlocks, insertLunchBlock, reorderTaskAssignments, moveLunchBlock } from "../services/calendar-service";
import { useCalendar } from "../hooks/use-calendar";
import { DayTimeline } from "../components/calendar/DayTimeline";
import { CalendarConnect } from "../components/calendar/CalendarConnect";

export function MyDay() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const dateLabel = isToday(selectedDate)
    ? format(selectedDate, "EEEE, MMMM d")
    : isTomorrow(selectedDate)
      ? `Tomorrow, ${format(selectedDate, "MMMM d")}`
      : isYesterday(selectedDate)
        ? `Yesterday, ${format(selectedDate, "MMMM d")}`
        : format(selectedDate, "EEEE, MMMM d");
  const service = useCalendarService();
  const { connected, loading, events, timeBlocks, error, connect, disconnect, refresh } = useCalendar(format(selectedDate, "yyyy-MM-dd"));

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [pomodoroDuration, setPomodoroDuration] = useState(30);
  const [restDuration, setRestDuration] = useState(5);
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchDuration, setLunchDuration] = useState(60);
  const [taskAssignments, setTaskAssignments] = useState<Map<number, string>>(new Map());

  // Full pipeline: events → time blocks → insert lunch → compute pomodoros → apply task assignments
  const finalBlocks = useMemo(() => {
    const withLunch = insertLunchBlock(timeBlocks, lunchStart, lunchDuration);
    const withPomodoros = computePomodoroBlocks(withLunch, { pomodoroDuration, restDuration });
    // Apply task assignments to pomodoro blocks
    let pomodoroIndex = 0;
    return withPomodoros.map((block) => {
      if (block.kind === "pomodoro") {
        const task = taskAssignments.get(pomodoroIndex);
        pomodoroIndex++;
        if (task) return { ...block, assignedTask: task };
      }
      return block;
    });
  }, [timeBlocks, lunchStart, lunchDuration, pomodoroDuration, restDuration, taskAssignments]);

  useEffect(() => {
    (async () => {
      const id = await service.getSetting("google_client_id");
      const secret = await service.getSetting("google_client_secret");
      if (id) setClientId(id);
      if (secret) setClientSecret(secret);
      const pom = await service.getSetting("pomodoro_duration");
      const rest = await service.getSetting("rest_duration");
      if (pom) setPomodoroDuration(parseInt(pom));
      if (rest) setRestDuration(parseInt(rest));
      const lunch = await service.getSetting("lunch_start");
      const lunchDur = await service.getSetting("lunch_duration");
      if (lunch) setLunchStart(lunch);
      if (lunchDur) setLunchDuration(parseInt(lunchDur));
    })();
  }, [service]);

  const handleSaveConfig = useCallback(
    async (key: "clientId" | "clientSecret", value: string) => {
      if (key === "clientId") {
        setClientId(value);
        await service.saveSetting("google_client_id", value);
      } else {
        setClientSecret(value);
        await service.saveSetting("google_client_secret", value);
      }
    },
    [service],
  );

  const handleConnect = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const { open } = await import("@tauri-apps/plugin-shell");

      const port = 8085;
      const redirectUri = `http://localhost:${port}`;
      const scope = "https://www.googleapis.com/auth/calendar.readonly";
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scope)}` +
        `&access_type=offline` +
        `&prompt=consent`;

      await open(authUrl);
      const code: string = await invoke("listen_for_oauth_redirect", { port, timeoutSecs: 120 });
      await connect(code);
    } catch (e) {
      console.error("OAuth flow failed:", e);
    }
  }, [clientId, connect]);

  const handleLunchMove = useCallback((newLunchStart: string) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const result = moveLunchBlock(lunchStart, newLunchStart, events, dateStr, lunchDuration);
    setLunchStart(result);
    service.saveSetting("lunch_start", result);
  }, [lunchStart, events, selectedDate, lunchDuration, service]);

  const handleTaskReorder = useCallback((fromPomodoroIndex: number, toPomodoroIndex: number) => {
    const reordered = reorderTaskAssignments(finalBlocks, fromPomodoroIndex, toPomodoroIndex);
    const newAssignments = new Map<number, string>();
    let pomIdx = 0;
    for (const block of reordered) {
      if (block.kind === "pomodoro") {
        if (block.assignedTask) {
          newAssignments.set(pomIdx, block.assignedTask);
        }
        pomIdx++;
      }
    }
    setTaskAssignments(newAssignments);
  }, [finalBlocks]);

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-text mb-1">My Day</h1>
      <div className="flex items-center gap-2 mb-6">
        <button
          aria-label="Previous day"
          onClick={() => setSelectedDate((d) => subDays(d, 1))}
          className="p-1 rounded hover:bg-surface-hover text-text-muted"
        >
          &larr;
        </button>
        <p className="text-text-muted">{dateLabel}</p>
        <button
          aria-label="Next day"
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          className="p-1 rounded hover:bg-surface-hover text-text-muted"
        >
          &rarr;
        </button>
        <button
          aria-label="Settings"
          onClick={() => setShowSettings((s) => !s)}
          className="ml-auto p-1 rounded hover:bg-surface-hover text-text-muted"
        >
          &#9881;
        </button>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 rounded bg-surface border border-border space-y-3">
          <div className="flex items-center gap-4">
            <label htmlFor="work-start" className="text-sm text-text">Work Start</label>
            <input id="work-start" type="time" defaultValue="09:00" className="border border-border rounded px-2 py-1 text-sm" />
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="work-end" className="text-sm text-text">Work End</label>
            <input id="work-end" type="time" defaultValue="17:00" className="border border-border rounded px-2 py-1 text-sm" />
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="pomodoro-duration" className="text-sm text-text">Pomodoro Duration</label>
            <input id="pomodoro-duration" type="number" value={pomodoroDuration} onChange={(e) => { const v = parseInt(e.target.value) || 0; setPomodoroDuration(v); service.saveSetting("pomodoro_duration", String(v)); }} className="border border-border rounded px-2 py-1 text-sm w-20" />
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="rest-duration" className="text-sm text-text">Rest Duration</label>
            <input id="rest-duration" type="number" value={restDuration} onChange={(e) => { const v = parseInt(e.target.value) || 0; setRestDuration(v); service.saveSetting("rest_duration", String(v)); }} className="border border-border rounded px-2 py-1 text-sm w-20" />
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="lunch-duration" className="text-sm text-text">Lunch Duration</label>
            <input id="lunch-duration" type="number" value={lunchDuration} onChange={(e) => { const v = parseInt(e.target.value) || 0; setLunchDuration(v); service.saveSetting("lunch_duration", String(v)); }} className="border border-border rounded px-2 py-1 text-sm w-20" />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <CalendarConnect
          connected={connected}
          loading={loading}
          error={error}
          clientId={clientId}
          clientSecret={clientSecret}
          onConnect={handleConnect}
          onDisconnect={disconnect}
          onSaveConfig={handleSaveConfig}
        />

        {connected && !loading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">Today&apos;s Schedule</h2>
              <button
                onClick={refresh}
                className="text-sm text-plate hover:text-blue-600 font-medium"
              >
                Refresh
              </button>
            </div>
            <DayTimeline
              blocks={finalBlocks}
              onLunchMove={handleLunchMove}
              onTaskReorder={handleTaskReorder}
            />
          </div>
        )}
      </div>
    </div>
  );
}
