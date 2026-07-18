use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

use crate::error::Error;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    id: i64,
    title: String,
    body: String,
    created_at: i64,
    updated_at: i64,
}

pub struct NoteState(pub Mutex<Connection>);

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

pub fn init(app: &AppHandle) -> Result<Connection, Error> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| Error::Io(std::io::Error::new(std::io::ErrorKind::NotFound, e)))?;
    std::fs::create_dir_all(&dir)?;

    let conn = Connection::open(dir.join("notes.db"))?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;
    Ok(conn)
}

#[tauri::command]
pub fn list_notes(state: State<'_, NoteState>) -> Result<Vec<Note>, Error> {
    let conn = state.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, title, body, created_at, updated_at FROM notes ORDER BY updated_at DESC",
    )?;
    let notes = stmt
        .query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                body: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(notes)
}

pub fn insert_note(conn: &Connection, title: &str, body: &str) -> Result<Note, Error> {
    let ts = now();
    conn.execute(
        "INSERT INTO notes (title, body, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
        params![title, body, ts],
    )?;
    Ok(Note {
        id: conn.last_insert_rowid(),
        title: title.to_string(),
        body: body.to_string(),
        created_at: ts,
        updated_at: ts,
    })
}

#[tauri::command]
pub fn add_note(title: String, body: String, state: State<'_, NoteState>) -> Result<Note, Error> {
    let conn = state.0.lock().unwrap();
    insert_note(&conn, &title, &body)
}

#[tauri::command]
pub fn update_note(
    id: i64,
    title: String,
    body: String,
    state: State<'_, NoteState>,
) -> Result<(), Error> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "UPDATE notes SET title = ?1, body = ?2, updated_at = ?3 WHERE id = ?4",
        params![title, body, now(), id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn delete_note(id: i64, state: State<'_, NoteState>) -> Result<(), Error> {
    let conn = state.0.lock().unwrap();
    conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
    Ok(())
}
