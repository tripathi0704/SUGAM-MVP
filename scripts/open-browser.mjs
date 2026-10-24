import net from "node:net";
import { exec } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

// Single-instance guard: prevent multiple browser tabs if triggered simultaneously
const lockFile = path.join(os.tmpdir(), "sugam_browser_open.lock");
try {
  if (fs.existsSync(lockFile)) {
    const stats = fs.statSync(lockFile);
    if (Date.now() - stats.mtimeMs < 8000) {
      process.exit(0);
    }
  }
  fs.writeFileSync(lockFile, Date.now().toString());
} catch {}

// Cross-platform browser launcher
function openInBrowser(targetUrl) {
  if (process.platform === "win32") {
    // rundll32 is the most reliable Windows shell protocol handler invocation
    exec(`rundll32 url.dll,FileProtocolHandler "${targetUrl}"`, (err) => {
      if (err) {
        // Fallback: cmd start with explicit empty title
        exec(`start "" "${targetUrl}"`, (err2) => {
          if (err2) {
            exec(`explorer "${targetUrl}"`);
          }
        });
      }
    });
  } else if (process.platform === "darwin") {
    exec(`open "${targetUrl}"`);
  } else {
    exec(`xdg-open "${targetUrl}"`);
  }
}

// Fast TCP port checker (connects directly to 127.0.0.1 to avoid IPv6 DNS latency)
function checkTcpPort(port, host = "127.0.0.1", timeoutMs = 300) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let hasResolved = false;

    const onDone = (isOpen) => {
      if (!hasResolved) {
        hasResolved = true;
        socket.destroy();
        resolve(isOpen);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => onDone(true));
    socket.once("timeout", () => onDone(false));
    socket.once("error", () => onDone(false));

    socket.connect(port, host);
  });
}

async function waitForServerAndOpen() {
  const maxAttempts = 120; // 30 seconds max (120 * 250ms)
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const tcpOpen = await checkTcpPort(PORT, "127.0.0.1", 300);
    
    if (tcpOpen) {
      // Give Next.js 350ms to ensure the HTTP listener has fully bound
      await new Promise((r) => setTimeout(r, 350));
      console.log(`\n[SUGAM] Server detected on ${URL}! Opening default browser...`);
      openInBrowser(URL);
      return;
    }

    await new Promise((r) => setTimeout(r, 250));
  }

  // Fallback: if timeout reached, attempt opening anyway
  console.log(`\n[SUGAM] Timeout reached, opening ${URL} in browser...`);
  openInBrowser(URL);
}

waitForServerAndOpen();
