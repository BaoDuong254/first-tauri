use std::time::Duration;

use serde::Serialize;
use sysinfo::{System, MINIMUM_CPU_UPDATE_INTERVAL};
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
pub struct SystemStats {
    cpu_usage: f32,
    mem_used: u64,
    mem_total: u64,
}

pub fn start_monitor(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut sys = System::new();

        loop {
            sys.refresh_cpu_usage();
            tokio::time::sleep(MINIMUM_CPU_UPDATE_INTERVAL).await;
            sys.refresh_cpu_usage();

            sys.refresh_memory();

            let stats = SystemStats {
                cpu_usage: sys.global_cpu_usage(),
                mem_used: sys.used_memory(),
                mem_total: sys.total_memory(),
            };

            let _ = app.emit("system-stats", stats);

            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    });
}
