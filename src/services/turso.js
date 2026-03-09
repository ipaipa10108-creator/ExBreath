import { createClient } from "@libsql/client/web";

const VITE_TURSO_DATABASE_URL = import.meta.env.VITE_TURSO_DATABASE_URL || "";
const VITE_TURSO_AUTH_TOKEN = import.meta.env.VITE_TURSO_AUTH_TOKEN || "";

/**
 * Turso Client instance
 */
export const tursoClient = (VITE_TURSO_DATABASE_URL && VITE_TURSO_AUTH_TOKEN)
    ? createClient({
        url: VITE_TURSO_DATABASE_URL,
        authToken: VITE_TURSO_AUTH_TOKEN,
    })
    : null;

/**
 * Initialize Turso Database Schema
 */
export const initTursoDb = async () => {
    if (!tursoClient) return;

    try {
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS records (
                id TEXT,
                level TEXT,
                duration TEXT,
                actualSeconds REAL,
                completed INTEGER,
                timestamp TEXT,
                PRIMARY KEY (id, timestamp)
            )
        `);
        console.log("Turso database initialized");
    } catch (err) {
        console.error("Failed to initialize Turso database", err);
    }
};
