import type { NextConfig } from "next";
import { spawn } from "node:child_process";
import path from "node:path";

// Auto-open browser when starting dev server
if (process.env.NODE_ENV !== "production" && !process.env.SUGAM_BROWSER_INIT) {
  process.env.SUGAM_BROWSER_INIT = "1";
  try {
    const scriptPath = path.resolve(process.cwd(), "scripts", "open-browser.mjs");
    const child = spawn(process.execPath, [scriptPath], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
  } catch {}
}

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;

