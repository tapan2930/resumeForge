import fs from "fs";

const MAC_CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MAC_BRAVE =
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const MAC_CHROMIUM =
  "/Applications/Chromium.app/Contents/MacOS/Chromium";

const WIN_BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
];

const LINUX_CANDIDATES = [
  process.env.CHROME_BIN,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/brave-browser",
  "/usr/bin/brave",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((p): p is string => Boolean(p));

/**
 * Path to a Chromium-based browser binary (Chrome, Brave, Chromium, etc.).
 * `@sparticuz/chromium` is Linux/Lambda-only — spawning it on macOS throws spawn ENOEXEC.
 */
export function resolveLocalChromeExecutable(): string | null {
  const fromEnv = process.env.CHROME_EXECUTABLE_PATH?.trim();
  if (fromEnv) {
    try {
      if (fs.existsSync(fromEnv)) return fromEnv;
    } catch {
      /* ignore */
    }
    return fromEnv;
  }

  if (process.platform === "darwin") {
    if (fs.existsSync(MAC_CHROME)) return MAC_CHROME;
    if (fs.existsSync(MAC_BRAVE)) return MAC_BRAVE;
    if (fs.existsSync(MAC_CHROMIUM)) return MAC_CHROMIUM;
    return null;
  }

  if (process.platform === "win32") {
    for (const p of WIN_BROWSERS) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  if (process.platform === "linux") {
    for (const p of LINUX_CANDIDATES) {
      if (fs.existsSync(p)) return p;
    }
  }

  return null;
}

/** True when we should use @sparticuz/chromium (e.g. Vercel Lambda Linux). */
export function shouldUseSparticuzChromium(): boolean {
  if (process.env.CHROME_EXECUTABLE_PATH?.trim()) return false;
  return process.platform === "linux";
}
