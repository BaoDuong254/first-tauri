use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};

use crate::error::Error;
use crate::note::{self, NoteState};

pub fn open_quick_note(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("quicknote") {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    let result = WebviewWindowBuilder::new(app, "quicknote", WebviewUrl::App("index.html".into()))
        .title("Quick Note")
        .inner_size(400.0, 280.0)
        .resizable(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .center()
        .build();

    if let Err(e) = result {
        eprintln!("failed to open quick note window: {e}");
    }
}

#[tauri::command]
pub async fn toggle_quick_note(app: AppHandle) {
    open_quick_note(&app);
}

#[tauri::command]
pub fn save_quick_note(
    app: AppHandle,
    state: State<'_, NoteState>,
    content: String,
) -> Result<(), Error> {
    let content = content.trim();
    if content.is_empty() {
        return Ok(());
    }

    let (title, body) = match content.split_once('\n') {
        Some((first, rest)) => (first.trim(), rest.trim()),
        None => (content, ""),
    };

    {
        let conn = state.0.lock().unwrap();
        note::insert_note(&conn, title, body)?;
    }

    let _ = app.emit_to("main", "note-added", ());

    if let Some(window) = app.get_webview_window("quicknote") {
        let _ = window.close();
    }

    Ok(())
}
