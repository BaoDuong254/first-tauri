use std::path::Path;
use std::sync::Mutex;

use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};
use walkdir::WalkDir;

use crate::error::Error;

pub struct WatcherState(pub Mutex<Option<RecommendedWatcher>>);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FsEvent {
    kind: String, // "create" | "modify" | "remove" | "other"
    paths: Vec<String>,
}

#[tauri::command]
pub fn start_watch(
    path: String,
    state: State<'_, WatcherState>,
    app: AppHandle,
) -> Result<Vec<String>, Error> {
    let app_handle = app.clone();
    let mut watcher = notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
        if let Ok(event) = res {
            let kind = match event.kind {
                EventKind::Create(_) => "create",
                EventKind::Modify(_) => "modify",
                EventKind::Remove(_) => "remove",
                _ => "other",
            };
            let payload = FsEvent {
                kind: kind.to_string(),
                paths: event
                    .paths
                    .iter()
                    .map(|p| p.display().to_string())
                    .collect(),
            };
            let _ = app_handle.emit("fs-event", payload);
        }
    })?;

    watcher.watch(Path::new(&path), RecursiveMode::Recursive)?;

    *state.0.lock().unwrap() = Some(watcher);

    let entries = WalkDir::new(&path)
        .max_depth(2)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .map(|e| e.path().display().to_string())
        .take(200)
        .collect();

    Ok(entries)
}

#[tauri::command]
pub fn stop_watch(state: State<'_, WatcherState>) {
    *state.0.lock().unwrap() = None;
}
