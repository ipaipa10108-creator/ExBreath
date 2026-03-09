import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import fetch from 'node-fetch';
import { nanoid } from 'nanoid';

dotenv.config();

const TURSO_DB_URL = process.env.VITE_TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.VITE_TURSO_AUTH_TOKEN;

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1TwlX8Zww8ze4vJLsOAp1LFF6_WxKTyDQ_VjXBxjAqdk/export?format=csv';

if (!TURSO_DB_URL || !TURSO_AUTH_TOKEN) {
    console.error("Missing environment variables (VITE_TURSO_DATABASE_URL, VITE_TURSO_AUTH_TOKEN).");
    process.exit(1);
}

const tursoClient = createClient({
    url: TURSO_DB_URL,
    authToken: TURSO_AUTH_TOKEN,
});

function parseCSVLine(line) {
    const result = [];
    let startValue = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            result.push(line.substring(startValue, i).replace(/^"|"$/g, '').trim());
            startValue = i + 1;
        }
    }
    result.push(line.substring(startValue).replace(/^"|"$/g, '').trim());
    return result;
}

async function runMigration() {
    try {
        console.log("1. Fetching CSV from Google Sheets...");
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status}`);
        }

        const text = await response.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

        // Headers: ID, Level, Duration, Timestamp, actualSeconds
        const headers = parseCSVLine(lines[0]);
        console.log("Headers:", headers);

        const records = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length < 5) continue; // Skip malformed rows
            const id = values[0];
            const level = values[1];
            const duration = values[2];
            const timestamp = values[3];
            const actualSecondsStr = values[4];
            const actualSeconds = parseFloat(actualSecondsStr) || 0;

            // Handle timestamp format (e.g. 2025/12/12下午5:20:45)
            let parsedTimestamp = timestamp;
            if (timestamp.includes('下午')) {
                parsedTimestamp = timestamp.replace('下午', ' PM').replace(/\//g, '-');
            } else if (timestamp.includes('上午')) {
                parsedTimestamp = timestamp.replace('上午', ' AM').replace(/\//g, '-');
            }

            // Validate date parsing
            const d = new Date(parsedTimestamp);
            if (!isNaN(d.getTime())) {
                parsedTimestamp = d.toISOString();
            }

            records.push({
                userId: id || 'anonymous',
                level: level,
                duration: duration,
                timestamp: parsedTimestamp || new Date().toISOString(),
                actualSeconds: actualSeconds
            });
        }

        console.log(`>> Found ${records.length} records in CSV.`);

        console.log("2. Clearing previous dirty records and Migrating items via Transaction...");
        await tursoClient.execute("DELETE FROM exbreath_records");

        const start = Date.now();

        // Use batch to optimize inserts
        const stmts = records.map(record => ({
            sql: "INSERT INTO exbreath_records (id, userId, level, duration, actualSeconds, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            args: [
                nanoid(),
                record.userId,
                record.level,
                String(record.duration),
                record.actualSeconds,
                record.timestamp
            ]
        }));

        await tursoClient.batch(stmts, "write");
        console.log(`>> Migration Complete in ${Date.now() - start}ms! Successfully migrated ${records.length} records.`);
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

runMigration();
