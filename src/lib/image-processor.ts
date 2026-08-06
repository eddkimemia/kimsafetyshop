import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const SCRIPT_DIR = path.join(process.cwd(), "public", "images", "products");
const SCRIPT = path.join(SCRIPT_DIR, "process_images.py");
const BACKUP_DIR = path.join(process.cwd(), ".next", "image-backups");

const PYTHON =
  process.env.PYTHON ||
  (process.platform === "win32" ? "python" : "python3");

export function processProductImage(filename: string, timeoutMs = 180_000): Promise<boolean> {
  return new Promise((resolve) => {
    if (!fs.existsSync(SCRIPT)) {
      console.warn("[image-processor] script not found:", SCRIPT);
      resolve(false);
      return;
    }
    const child = spawn(
      PYTHON,
      [
        SCRIPT,
        "--input",
        SCRIPT_DIR,
        "--output",
        BACKUP_DIR,
        "--in-place",
        "--workers",
        "1",
        "--files",
        filename,
      ],
      { cwd: SCRIPT_DIR, windowsHide: true }
    );
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill();
      console.warn("[image-processor] timed out:", filename);
      resolve(false);
    }, timeoutMs);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      console.error("[image-processor] spawn error:", e.message);
      resolve(false);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(true);
      } else {
        console.error(`[image-processor] failed (${code}):`, filename, err || out);
        resolve(false);
      }
    });
  });
}
