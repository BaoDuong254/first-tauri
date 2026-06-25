use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "todos.json";
const STORE_KEY: &str = "todos";

#[derive(Clone, Serialize, Deserialize)]
pub struct Todo {
    id: u64,
    text: String,
    done: bool,
}

/// In-memory source of truth, shared across IPC commands via `tauri::State`.
pub struct TodoState(pub Mutex<Vec<Todo>>);

/// Load the persisted todos from the store file (empty list if missing/invalid).
pub fn load(app: &AppHandle) -> Vec<Todo> {
    let Ok(store) = app.store(STORE_FILE) else {
        return Vec::new();
    };
    match store.get(STORE_KEY) {
        Some(value) => serde_json::from_value(value).unwrap_or_default(),
        None => Vec::new(),
    }
}

/// Write the current todo list back to the store file.
fn persist(app: &AppHandle, todos: &[Todo]) {
    if let Ok(store) = app.store(STORE_FILE) {
        store.set(STORE_KEY, json!(todos));
        let _ = store.save();
    }
}

#[tauri::command]
pub fn list_todos(state: State<'_, TodoState>) -> Vec<Todo> {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
pub fn add_todo(text: String, state: State<'_, TodoState>, app: AppHandle) -> Todo {
    let mut todos = state.0.lock().unwrap();
    let next_id = todos.iter().map(|t| t.id).max().unwrap_or(0) + 1;
    let todo = Todo {
        id: next_id,
        text,
        done: false,
    };
    todos.push(todo.clone());
    persist(&app, &todos);
    todo
}

#[tauri::command]
pub fn toggle_todo(id: u64, state: State<'_, TodoState>, app: AppHandle) {
    let mut todos = state.0.lock().unwrap();
    if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
        todo.done = !todo.done;
    }
    persist(&app, &todos);
}

#[tauri::command]
pub fn delete_todo(id: u64, state: State<'_, TodoState>, app: AppHandle) {
    let mut todos = state.0.lock().unwrap();
    todos.retain(|t| t.id != id);
    persist(&app, &todos);
}
