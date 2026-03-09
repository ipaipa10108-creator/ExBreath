import { createClient } from "@libsql/client/web";

const VITE_TURSO_DB_URL = import.meta.env.VITE_TURSO_DATABASE_URL || '';
const VITE_TURSO_AUTH_TOKEN = import.meta.env.VITE_TURSO_AUTH_TOKEN || '';

export const tursoClient = (VITE_TURSO_DB_URL && VITE_TURSO_AUTH_TOKEN)
    ? createClient({
        url: VITE_TURSO_DB_URL,
        authToken: VITE_TURSO_AUTH_TOKEN,
    })
    : null;

/**
 * 自動初始化資料庫資料表
 */
export const initTursoDb = async () => {
    if (!tursoClient) {
        console.warn("Turso client is not initialized. Please check your environment variables.");
        return;
    }

    try {
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
        console.log("Turso Database Initialized (exbreath_records table ensured).");
    } catch (err) {
        console.error("Failed to initialize Turso database table:", err);
    }
};
