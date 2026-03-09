import { tursoClient, initTursoDb } from './turso';

// Initialize DB immediately
initTursoDb();

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
            sql: "SELECT * FROM records WHERE id = ? ORDER BY timestamp DESC",
            args: [userId]
        });
        return result.rows || [];
    } catch (err) {
        console.error("Fetch remote history failed", err);
        return null; // Fallback to local
    }
};

export const uploadRecord = async (data) => {
    const payload = {
        ...data,
        timestamp: new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, -1)
    };

    // 1. Save Local
    saveLocalHistory(payload);

    // 2. Upload to Turso
    if (!tursoClient) return;

    try {
        await tursoClient.execute({
            sql: "INSERT INTO records (id, level, duration, actualSeconds, completed, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            args: [
                payload.id,
                payload.level,
                payload.duration.toString(),
                payload.actualSeconds,
                payload.completed ? 1 : 0,
                payload.timestamp
            ]
        });
        console.log("Record uploaded to Turso", payload);
    } catch (err) {
        console.error("Upload to Turso failed", err);
    }
};

export const fetchGlobalHistory = async () => {
    if (!tursoClient) return [];
    try {
        const result = await tursoClient.execute("SELECT * FROM records ORDER BY timestamp DESC LIMIT 100");
        return result.rows || [];
    } catch (err) {
        console.error("Fetch global history failed", err);
        return [];
    }
};
