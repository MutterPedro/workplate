use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_tasks",
        sql: include_str!("../migrations/001_create_tasks.sql"),
        kind: MigrationKind::Up,
    }]
}
