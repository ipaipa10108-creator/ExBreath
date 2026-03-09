import { tursoClient } from './turso';
import { nanoid } from 'nanoid';

// Local Storage Key
const STORAGE_KEY = 'exbreath_history';

export const getLocalHistory = () => {
    try {
        const str = localStorage.getItem(STORAGE_KEY);
        if (!str) return { totalSessions: 0, totalTimeSeconds: 0, lastSession: null, byMode: {}, records: [] };
        return JSON.parse(str);
    } catch {
        return { totalSessions: 0, totalTimeSeconds: 0, lastSession: null, byMode: {}, records: [] };
    }
};

const saveLocalHistory = (data) => {
    const current = getLocalHistory();
    const durationSec = data.duration === 'Infinite' ? (data.actualSeconds || 0) : (data.duration * 60);

    // Update Stats
    current.totalSessions = (current.totalSessions || 0) + 1;
    current.totalTimeSeconds = (current.totalTimeSeconds || 0) + durationSec;

    current.lastSession = {
        mode: data.level,
        duration: data.duration === 'Infinite' ? Math.floor(data.actualSeconds / 60) : data.duration,
        timestamp: data.timestamp
    };

    if (!current.byMode) current.byMode = {};
    if (!current.byMode[data.level]) current.byMode[data.level] = { count: 0, time: 0 };

    current.byMode[data.level].count += 1;
    current.byMode[data.level].time += durationSec;

    // Save raw record locally as well
    if (!current.records) current.records = [];
    current.records.push(data);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
};

export const fetchRemoteHistory = async (userId) => {
    if (!tursoClient) return null;
    try {
        const result = await tursoClient.execute({
            sql: "SELECT * FROM exbreath_records WHERE userId = ? ORDER BY timestamp DESC",
            args: [userId]
        });

        // Convert rows to JS objects matching the expected format { records: [], stats: {} }
        // (If the front-end depends on `stats` from remote, we should calculate it manually or just let it use local, 
        //  but the old GAS returned `{ records, stats }`. We'll just provide records for now.)
        const records = result.rows.map(row => ({
            id: row.id,
            userId: row.userId,
            level: row.level,
            duration: row.duration,
            actualSeconds: row.actualSeconds,
            timestamp: row.timestamp
        }));

        return { records, stats: {} };
    } catch (err) {
        console.error("Fetch remote history failed", err);
        return null; // Fallback to local
    }
};

export const uploadRecord = async (data) => {
    const payload = {
        ...data,
        // Generate Local ISO String (YYYY-MM-DDTHH:mm:ss.sss)
        timestamp: new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, -1)
    };

    // 1. Save Local
    saveLocalHistory(payload);

    // 2. Upload to Cloud (Turso)
    if (!tursoClient) {
        return;
    }

    try {
        const id = nanoid();
        await tursoClient.execute({
            sql: "INSERT INTO exbreath_records (id, userId, level, duration, actualSeconds, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            args: [id, payload.userId || 'anonymous', payload.level, String(payload.duration), payload.actualSeconds || 0, payload.timestamp]
        });
        console.log("Record uploaded to Turso", payload);
    } catch (err) {
        console.error("Upload to Turso failed", err);
    }
};

export const fetchGlobalHistory = async () => {
    if (!tursoClient) return [];
    try {
        const result = await tursoClient.execute("SELECT * FROM exbreath_records ORDER BY timestamp DESC LIMIT 100");
        const records = result.rows.map(row => ({
            id: row.id,
            userId: row.userId,
            level: row.level,
            duration: row.duration,
            actualSeconds: row.actualSeconds,
            timestamp: row.timestamp
        }));
        return records;
    } catch (err) {
        console.error("Fetch global history failed", err);
        return [];
    }
};
