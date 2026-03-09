import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import fetch from 'node-fetch';
import { nanoid } from 'nanoid';

// 預設讀取專案根目錄下的 .env 檔案
dotenv.config();

const GAS_URL = process.env.VITE_GOOGLE_APP_SCRIPT_URL;
const TURSO_DB_URL = process.env.VITE_TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.VITE_TURSO_AUTH_TOKEN;

if (!GAS_URL || !TURSO_DB_URL || !TURSO_AUTH_TOKEN) {
    console.error("Missing environment variables (VITE_GOOGLE_APP_SCRIPT_URL, VITE_TURSO_DATABASE_URL, VITE_TURSO_AUTH_TOKEN).");
    console.error("Please ensure your .env file is correctly set up in the root directory.");
    process.exit(1);
}

const tursoClient = createClient({
    url: TURSO_DB_URL,
    authToken: TURSO_AUTH_TOKEN,
});

async function runMigration() {
    try {
        console.log("1. Ensuring Turso 'exbreath_records' table exists...");
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS exbreath_records (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                level TEXT,
                duration TEXT,
                actualSeconds INTEGER,
                timestamp TEXT NOT NULL
            )
        `);

        console.log("2. Fetching records from Google Apps Script...");
        const response = await fetch(`${GAS_URL}?type=global&t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch from GAS. Status: ${response.status}`);
        }

        const data = await response.json();
        const records = Array.isArray(data) ? data : (data.records || []);

        console.log(`>> Found ${records.length} records in Google Sheets.`);

        if (records.length === 0) {
            console.log("No data to migrate. Exiting.");
            return;
        }

        console.log("3. Clearing previous dirty records and Migrating items via Transaction...");
        await tursoClient.execute("DELETE FROM exbreath_records");

        const start = Date.now();

        // Use batch to optimize inserts
        const stmts = records.map(record => ({
            sql: "INSERT INTO exbreath_records (id, userId, level, duration, actualSeconds, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            args: [
                nanoid(),
                record.id || record.userId || 'anonymous',
                record.level || 'Unknown',
                String(record.duration || ''),
                record.actualSeconds || 0,
                record.timestamp || new Date().toISOString()
            ]
        }));

        await tursoClient.batch(stmts, "write");
        console.log(`>> Migration Complete in ${Date.now() - start}ms! Successfully migrated ${records.length} records.`);

    } catch (err) {
        console.error("Migration Failed:", err);
    }
}

runMigration();
