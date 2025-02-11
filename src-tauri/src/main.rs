#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayMenuItem, Manager, WindowBuilder, Window};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tungstenite::{connect, Message};
use url::Url;
use std::thread;

#[derive(Debug, Deserialize, Serialize, Clone)]
struct NotificationData {
    title: String,
    message: String,
    #[serde(rename = "type")]
    notification_type: String,
    #[serde(rename = "requiresInteraction")]
    requires_interaction: bool,
    image: Option<String>
}

fn ensure_notification_window(app: &tauri::AppHandle) -> Result<Window, String> {
    if let Some(window) = app.get_window("notifications") {
        Ok(window)
    } else {
        let window = WindowBuilder::new(
            app,
            "notifications",
            tauri::WindowUrl::App("notification.html".into())
        )
        .inner_size(320.0, 360.0)
        .position(1000.0, 20.0)  // Initial position
        .decorations(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .transparent(true)
        .visible(false)  // Start hidden
        .build()
        .map_err(|e| e.to_string())?;

        // Now that we have a window, we can get its monitor and adjust position
        if let Ok(Some(monitor)) = window.current_monitor() {
            let size = monitor.size();
            let x = (size.width as f64 - 340.0) as i32; // window width (320) + padding (20)
            let _ = window.set_position(tauri::Position::Physical(
                tauri::PhysicalPosition { x, y: 20 }
            ));
        }

        Ok(window)
    }
}

fn start_websocket(app_handle: tauri::AppHandle) {
    thread::spawn(move || {
        let url = Url::parse("wss://faye.chalamministries.com:8999").unwrap();
        
        loop {
            println!("Attempting to connect to WebSocket...");
            match connect(url.clone()) {
                Ok((mut socket, _)) => {
                    println!("WebSocket connected");

                    // Send initial subscription message
                    println!("Sending subscription message...");
                    let subscribe_msg = r#"{"action":"subscribe","channel":"/notifications"}"#;
                    if let Err(e) = socket.write_message(Message::Text(subscribe_msg.into())) {
                        println!("Failed to send subscription: {}", e);
                        thread::sleep(std::time::Duration::from_secs(5));
                        continue;
                    }

                    // Start time for ping check
                    let mut last_msg_time = std::time::Instant::now();
                    
                    loop {
                        // Check if we need to ping
                        if last_msg_time.elapsed().as_secs() > 30 {
                            println!("Sending ping...");
                            if let Err(e) = socket.write_message(Message::Ping(vec![])) {
                                println!("Ping failed: {}", e);
                                break;
                            }
                            last_msg_time = std::time::Instant::now();
                        }

                        // Try to read with a small timeout
                        match socket.read_message() {
                            Ok(message) => {
                                last_msg_time = std::time::Instant::now();
                                
                                match message {
                                    Message::Text(text) => {
                                        println!("Received message: {}", text);
                                        
                                        if let Ok(data) = serde_json::from_str::<serde_json::Value>(&text) {
                                            if let Some(message) = data.get("message") {
                                                // Convert the message to our notification format
                                                let notification = NotificationData {
                                                    title: message["member"].as_str().unwrap_or("Unknown").to_string(),
                                                    message: {
                                                        let mut message_parts = Vec::new();
                                                        
                                                        // Add status message or membership first
                                                        let status_message = match message["status"].as_i64().unwrap_or(1) {
                                                            0 => "NO MEMBERSHIP".to_string(),
                                                            2 => "EXPIRED".to_string(),
                                                            3 => message["message"].as_str().unwrap_or("").to_string(),
                                                            1 => format!("<span class=\"membership\">{}</span>", message["membership"].as_str().unwrap_or("")),
                                                            _ => message["membership"].as_str().unwrap_or("").to_string()
                                                        };
                                                        if status_message != "" {
                                                            message_parts.push(status_message);
                                                        }
                                                        
                                                        // Add balance due message if exists
                                                        if message["balanceDue"].as_bool().unwrap_or(false) {
                                                            message_parts.push(format!("BALANCE DUE: ${}", 
                                                                message["balance"].as_f64().unwrap_or(0.0)));
                                                        }
                                                        
                                                        // Add red alert if exists
                                                        if !message["redAlert"].as_str().unwrap_or("").is_empty() {
                                                            message_parts.push(format!("<span style=\"color: red; font-weight: bold;\">ALERT: </span>{}", 
                                                                message["redAlert"].as_str().unwrap_or("")));
                                                        }
                                                        
                                                        // Add yellow alert if exists
                                                        if !message["yellowAlert"].as_str().unwrap_or("").is_empty() {
                                                            message_parts.push(format!("<span style=\"color: #bf9500; font-weight: bold;\">WARNING: </span>{}", 
                                                                message["yellowAlert"].as_str().unwrap_or("")));
                                                        }
                                                        
                                                        message_parts.join("<br />")
                                                    },
                                                    notification_type: {
                                                        if !message["redAlert"].as_str().unwrap_or("").is_empty() ||
                                                           message["status"].as_i64().unwrap_or(1) == 0 ||   // Non member
                                                           message["status"].as_i64().unwrap_or(1) == 2 ||   // Expired
                                                           message["status"].as_i64().unwrap_or(1) == 3 ||   // Red alert status
                                                           (message["balanceDue"].as_bool().unwrap_or(false) && 
                                                            message["balance"].as_f64().unwrap_or(0.0) > 25.0) {
                                                            "red".to_string()
                                                        } else if message["status"].as_i64().unwrap_or(1) == 1 && // Must be valid status
                                                                 (!message["yellowAlert"].as_str().unwrap_or("").is_empty() ||
                                                                  (message["balanceDue"].as_bool().unwrap_or(false) && 
                                                                   message["balance"].as_f64().unwrap_or(0.0) <= 25.0)) {
                                                            "yellow".to_string()
                                                        } else {
                                                            "green".to_string()
                                                        }
                                                    },
                                                    requires_interaction: !message["redAlert"].as_str().unwrap_or("").is_empty() ||
                                                        !message["yellowAlert"].as_str().unwrap_or("").is_empty() ||
                                                        message["status"].as_i64().unwrap_or(1) == 0 ||   // Non member
                                                        message["status"].as_i64().unwrap_or(1) == 2 ||   // Expired
                                                        message["status"].as_i64().unwrap_or(1) == 3 ||   // Red alert status
                                                        (message["balanceDue"].as_bool().unwrap_or(false) && 
                                                         message["balance"].as_f64().unwrap_or(0.0) > 25.0),
                                                    image: message["image"].as_str().map(String::from)
                                                };
                                                
                                                // Show notification
                                                if let Ok(window) = ensure_notification_window(&app_handle) {
                                                    let _ = window.emit("notification-data", notification.clone());
                                                }

                                                // Also emit to main window if it exists
                                                if let Some(main_window) = app_handle.get_window("primary") {
                                                    let _ = main_window.emit("checkin-data", message);
                                                }
                                            }
                                        }
                                    }
                                    Message::Ping(_) => {
                                        if let Err(e) = socket.write_message(Message::Pong(vec![])) {
                                            println!("Failed to send pong: {}", e);
                                            break;
                                        }
                                    }
                                    Message::Pong(_) => {
                                        println!("Received pong");
                                    }
                                    Message::Close(_) => {
                                        println!("Received close frame");
                                        break;
                                    }
                                    _ => {}
                                }
                            }
                            Err(e) => {
                                println!("Error reading from WebSocket: {}", e);
                                break;
                            }
                        }

                        // Small sleep to prevent tight loop
                        thread::sleep(std::time::Duration::from_millis(100));
                    }
                }
                Err(e) => {
                    println!("Failed to connect: {}", e);
                }
            }

            // Wait before reconnecting
            println!("WebSocket disconnected, waiting 5 seconds before reconnecting...");
            thread::sleep(std::time::Duration::from_secs(5));
        }
    });
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .setup(move |app| {
            let app_handle = app.handle();
            
            // Create main window
            let _main_window = WindowBuilder::new(
                app,
                "primary",
                tauri::WindowUrl::App("index.html".into())
            )
            .title("EF Checkins")
            .inner_size(400.0, 600.0)
            .visible(false)
            .build()?;

            // Start WebSocket connection
            start_websocket(app_handle);

            Ok(())
        })
        .on_system_tray_event(|app, event| {
            match event {
                tauri::SystemTrayEvent::LeftClick {
                    position: _,
                    size: _,
                    ..
                } => {
                    if let Some(window) = app.get_window("primary") {
                        if window.is_visible().unwrap() {
                            window.hide().unwrap();
                        } else {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                }
                tauri::SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_window("primary") {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    _ => {}
                },
                _ => {}
            }
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}