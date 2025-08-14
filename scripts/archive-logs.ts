import { promises as fs } from "fs";
import path from "path";

/**
 * Example script to remove or archive log files older than N days.
 *
 * Usage:
 *  MAX_LOG_AGE_DAYS=30 LOG_DIR=./logs ARCHIVE_DIR=./logs/archive \
 *    npx ts-node scripts/archive-logs.ts
 */

const LOG_DIR = process.env.LOG_DIR || path.resolve("logs");
const ARCHIVE_DIR = process.env.ARCHIVE_DIR;
const MAX_LOG_AGE_DAYS = parseInt(process.env.MAX_LOG_AGE_DAYS ?? "30", 10);

async function archiveLogs() {
    const now = Date.now();
    const cutoff = now - MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000;

    let files: string[];
    try {
        files = await fs.readdir(LOG_DIR);
    } catch (err) {
        console.error(`Cannot read log directory "${LOG_DIR}":`, err);
        return;
    }

    for (const file of files) {
        const filePath = path.join(LOG_DIR, file);
        const stat = await fs.stat(filePath);
        if (stat.mtime.getTime() < cutoff) {
            if (ARCHIVE_DIR) {
                await fs.mkdir(ARCHIVE_DIR, { recursive: true });
                const dest = path.join(ARCHIVE_DIR, file);
                await fs.rename(filePath, dest);
                console.log(`Archived ${file}`);
            } else {
                await fs.unlink(filePath);
                console.log(`Removed ${file}`);
            }
        }
    }
}

archiveLogs().catch((err) => {
    console.error("Failed to archive logs:", err);
    process.exit(1);
});
