import { format } from "date-fns";

export function MyDay() {
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-text mb-1">My Day</h1>
      <p className="text-text-muted mb-6">{today}</p>

      <div className="rounded-lg border border-border bg-white p-8 text-center">
        <p className="text-text-muted text-lg mb-2">Calendar integration coming soon</p>
        <p className="text-sm text-text-muted">
          This view will show your Google Calendar events alongside free time blocks
          for focused work.
        </p>
      </div>
    </div>
  );
}
