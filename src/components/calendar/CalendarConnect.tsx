interface CalendarConnectProps {
  connected: boolean;
  loading: boolean;
  error: string | null;
  clientId: string;
  clientSecret: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSaveConfig: (key: "clientId" | "clientSecret", value: string) => void;
}

export function CalendarConnect({
  connected,
  loading,
  error,
  clientId,
  clientSecret,
  onConnect,
  onDisconnect,
  onSaveConfig,
}: CalendarConnectProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center">
        <p className="text-text-muted">Connecting...</p>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-text">Google Calendar connected</span>
        </div>
        <button
          onClick={onDisconnect}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const configReady = clientId.length > 0 && clientSecret.length > 0;

  return (
    <div className="rounded-lg border border-border bg-white p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="client-id" className="block text-sm font-medium text-text mb-1">
            Client ID
          </label>
          <input
            id="client-id"
            type="text"
            value={clientId}
            onChange={(e) => onSaveConfig("clientId", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
            placeholder="Google OAuth Client ID"
          />
        </div>
        <div>
          <label htmlFor="client-secret" className="block text-sm font-medium text-text mb-1">
            Client Secret
          </label>
          <input
            id="client-secret"
            type="password"
            value={clientSecret}
            onChange={(e) => onSaveConfig("clientSecret", e.target.value)}
            className="w-full rounded border border-border px-3 py-2 text-sm"
            placeholder="Google OAuth Client Secret"
          />
        </div>
        <button
          onClick={onConnect}
          disabled={!configReady}
          className="w-full rounded-lg bg-plate px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Connect Google Calendar
        </button>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
