mod db;
mod oauth;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:workplate.db", db::get_migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![oauth::listen_for_oauth_redirect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
