use serde::Serialize;
use sha2::{Digest, Sha256};
use std::io::Read;
use tauri::ipc::Channel;

use crate::error::Error;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HashProgress {
    processed: u64,
    total: u64,
}

#[tauri::command]
pub async fn hash_file(path: String, on_progress: Channel<HashProgress>) -> Result<String, Error> {
    tauri::async_runtime::spawn_blocking(move || {
        let file = std::fs::File::open(&path)?;
        let total = file.metadata()?.len();
        let mut reader = std::io::BufReader::new(file);
        let mut hasher = Sha256::new();
        let mut buf = vec![0u8; 1024 * 1024]; // 1 MB buffer
        let mut processed = 0u64;

        loop {
            let n = reader.read(&mut buf)?;
            if n == 0 {
                break;
            }
            hasher.update(&buf[..n]);
            processed += n as u64;
            let _ = on_progress.send(HashProgress { processed, total });
        }

        Ok(format!("{:x}", hasher.finalize()))
    })
    .await
    .map_err(|_| Error::Task)?
}
