CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    blocking INTEGER NOT NULL DEFAULT 0,
    link TEXT,
    priority TEXT NOT NULL DEFAULT 'P2',
    project TEXT NOT NULL DEFAULT '',
    size TEXT NOT NULL DEFAULT 'M',
    status TEXT NOT NULL DEFAULT 'plate',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(status, sort_order);
