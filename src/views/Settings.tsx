import { useState, useEffect } from "react";
import { useCalendarService } from "../services/calendar-context";

export function Settings() {
  const service = useCalendarService();

  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [pomodoroDuration, setPomodoroDuration] = useState(30);
  const [restDuration, setRestDuration] = useState(5);
  const [lunchDuration, setLunchDuration] = useState(60);

  useEffect(() => {
    (async () => {
      const ws = await service.getSetting("work_start");
      const we = await service.getSetting("work_end");
      const pom = await service.getSetting("pomodoro_duration");
      const rest = await service.getSetting("rest_duration");
      const lunch = await service.getSetting("lunch_duration");
      if (ws) setWorkStart(ws);
      if (we) setWorkEnd(we);
      if (pom) setPomodoroDuration(parseInt(pom));
      if (rest) setRestDuration(parseInt(rest));
      if (lunch) setLunchDuration(parseInt(lunch));
    })();
  }, [service]);

  const handleSave = async () => {
    await service.saveSetting("work_start", workStart);
    await service.saveSetting("work_end", workEnd);
    await service.saveSetting("pomodoro_duration", String(pomodoroDuration));
    await service.saveSetting("rest_duration", String(restDuration));
    await service.saveSetting("lunch_duration", String(lunchDuration));
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-text mb-6">Settings</h1>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label htmlFor="work-start" className="text-sm text-text">Work Start</label>
          <input
            id="work-start"
            type="time"
            value={workStart}
            onChange={(e) => setWorkStart(e.target.value)}
            className="border border-border rounded px-2 py-1 text-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="work-end" className="text-sm text-text">Work End</label>
          <input
            id="work-end"
            type="time"
            value={workEnd}
            onChange={(e) => setWorkEnd(e.target.value)}
            className="border border-border rounded px-2 py-1 text-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="pomodoro-duration" className="text-sm text-text">Pomodoro Duration</label>
          <input
            id="pomodoro-duration"
            type="number"
            value={pomodoroDuration}
            onChange={(e) => setPomodoroDuration(parseInt(e.target.value) || 0)}
            className="border border-border rounded px-2 py-1 text-sm w-20"
          />
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="rest-duration" className="text-sm text-text">Rest Duration</label>
          <input
            id="rest-duration"
            type="number"
            value={restDuration}
            onChange={(e) => setRestDuration(parseInt(e.target.value) || 0)}
            className="border border-border rounded px-2 py-1 text-sm w-20"
          />
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="lunch-duration" className="text-sm text-text">Lunch Duration</label>
          <input
            id="lunch-duration"
            type="number"
            value={lunchDuration}
            onChange={(e) => setLunchDuration(parseInt(e.target.value) || 0)}
            className="border border-border rounded px-2 py-1 text-sm w-20"
          />
        </div>

        <button
          onClick={handleSave}
          className="px-3 py-1 rounded bg-plate text-white text-sm font-medium hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </div>
  );
}
