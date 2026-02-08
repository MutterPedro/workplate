use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::time::Duration;

#[tauri::command]
pub async fn listen_for_oauth_redirect(port: u16, timeout_secs: u64) -> Result<String, String> {
    let addr = format!("127.0.0.1:{}", port);
    let listener = TcpListener::bind(&addr).map_err(|e| format!("Failed to bind: {e}"))?;
    listener
        .set_nonblocking(false)
        .map_err(|e| format!("Failed to set blocking: {e}"))?;

    // Use SO_RCVTIMEO via a blocking accept with a spawned timeout
    let deadline = std::time::Instant::now() + Duration::from_secs(timeout_secs);

    loop {
        if std::time::Instant::now() > deadline {
            return Err("Timed out waiting for OAuth redirect".into());
        }

        listener
            .set_nonblocking(true)
            .map_err(|e| format!("set_nonblocking: {e}"))?;

        match listener.accept() {
            Ok((mut stream, _)) => {
                let mut reader = BufReader::new(stream.try_clone().map_err(|e| e.to_string())?);
                let mut request_line = String::new();
                reader
                    .read_line(&mut request_line)
                    .map_err(|e| format!("Read error: {e}"))?;

                // Extract code from "GET /?code=AUTH_CODE&... HTTP/1.1"
                let code = request_line
                    .split_whitespace()
                    .nth(1) // the URI
                    .and_then(|uri| {
                        uri.split('?')
                            .nth(1)
                            .and_then(|qs| {
                                qs.split('&').find_map(|pair| {
                                    let mut kv = pair.splitn(2, '=');
                                    match (kv.next(), kv.next()) {
                                        (Some("code"), Some(v)) => Some(v.to_string()),
                                        _ => None,
                                    }
                                })
                            })
                    })
                    .ok_or_else(|| "No auth code in redirect".to_string())?;

                let body = "<html><body><h1>Connected!</h1><p>You can close this tab and return to WorkPlate.</p></body></html>";
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = stream.write_all(response.as_bytes());
                let _ = stream.flush();

                return Ok(code);
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                std::thread::sleep(Duration::from_millis(100));
                continue;
            }
            Err(e) => return Err(format!("Accept error: {e}")),
        }
    }
}
