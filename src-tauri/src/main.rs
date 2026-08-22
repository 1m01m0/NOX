use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::Mutex;
use serde::Serialize;
use tauri::State;

struct AppState {
    app_server_process: Mutex<Option<Child>>,
}

#[derive(Serialize, Clone, Debug)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

#[tauri::command]
fn start_app_server(state: State<AppState>, port: u16) -> Result<String, String> {
    let mut proc_guard = state.app_server_process.lock().map_err(|e| e.to_string())?;
    if proc_guard.is_some() {
        return Ok(format!("App server already running on port {}", port));
    }

    match Command::new("codex-app-server")
        .arg("--listen")
        .arg(format!("ws://127.0.0.1:{}", port))
        .spawn()
    {
        Ok(child) => {
            *proc_guard = Some(child);
            Ok(format!("Started app-server on port {}", port))
        }
        Err(e) => Err(format!("Failed to start codex-app-server: {}", e)),
    }
}

#[tauri::command]
fn stop_app_server(state: State<AppState>) -> Result<String, String> {
    let mut proc_guard = state.app_server_process.lock().map_err(|e| e.to_string())?;
    if let Some(mut child) = proc_guard.take() {
        let _ = child.kill();
        Ok("App server stopped".to_string())
    } else {
        Ok("App server was not running".to_string())
    }
}

fn scan_dir(dir: &Path, depth: usize, max_depth: usize) -> Vec<FileNode> {
    if depth > max_depth {
        return Vec::new();
    }

    let mut entries = Vec::new();
    if let Ok(read_dir) = fs::read_dir(dir) {
        let mut items: Vec<_> = read_dir.filter_map(|e| e.ok()).collect();
        items.sort_by_key(|e| (!e.path().is_dir(), e.file_name()));

        for entry in items {
            let file_name = entry.file_name().to_string_lossy().to_string();
            // Skip hidden directories and large build artifacts
            if file_name.starts_with('.') || file_name == "node_modules" || file_name == "target" || file_name == "dist" {
                continue;
            }

            let path = entry.path();
            let is_dir = path.is_dir();
            let path_str = path.to_string_lossy().to_string();

            let children = if is_dir && depth < max_depth {
                Some(scan_dir(&path, depth + 1, max_depth))
            } else {
                None
            };

            entries.push(FileNode {
                name: file_name,
                path: path_str,
                is_dir,
                children,
            });
        }
    }
    entries
}

#[tauri::command]
fn list_workspace_files(workspace_path: String) -> Result<Vec<FileNode>, String> {
    let path = PathBuf::from(&workspace_path);
    if !path.exists() {
        return Err("Workspace path does not exist".to_string());
    }
    Ok(scan_dir(&path, 1, 4))
}

#[tauri::command]
fn pick_folder() -> Result<Option<String>, String> {
    // Open macOS native folder dialog using osascript
    let output = Command::new("osascript")
        .arg("-e")
        .arg("POSIX path of (choose folder with prompt \"选择工程工作区目录\")")
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !path.is_empty() {
            // strip trailing slash if present
            let clean_path = path.trim_end_matches('/').to_string();
            return Ok(Some(clean_path));
        }
    }
    Ok(None)
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            app_server_process: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            start_app_server,
            stop_app_server,
            list_workspace_files,
            pick_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
