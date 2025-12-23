const GAS_URL = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

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
    if (!GAS_URL) return null;
    try {
        // Appending query param for GAS doGet
        const response = await fetch(`${GAS_URL}?id=${encodeURIComponent(userId)}`, {
            method: 'GET',
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data; // Expected format: { records: [], stats: {} }
    } catch (err) {
        console.error("Fetch remote history failed", err);
        return null; // Fallback to local
    }
};

export const uploadRecord = async (data) => {
    const payload = {
        ...data,
        timestamp: new Date().toISOString()
    };

    // 1. Save Local
    saveLocalHistory(payload);

    // 2. Upload to Cloud
    if (!GAS_URL) {
        return;
    }

    try {
        // Use text/plain to avoid preflight options request which GAS hates sometimes, 
        // OR standard JSON if properly configured. 
        // For simplicity with GAS `doPost(e)`, JSON.stringify(payload) is standard.
        // We use no-cors to prevent errors if GAS doesn't return CORS headers, 
        // BUT we lose error handling. Ideally user updates GAS to handle CORS.
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // Keep no-cors for write to ensure it sends even if CORS fails
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log("Record uploaded", payload);
    } catch (err) {
        console.error("Upload failed", err);
    }
};

export const fetchGlobalHistory = async () => {
    if (!GAS_URL) return [];
    try {
        const response = await fetch(`${GAS_URL}?type=global&t=${Date.now()}`, {
            method: 'GET',
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        // The backend should return an array of records
        return Array.isArray(data) ? data : (data.records || []);
    } catch (err) {
        console.error("Fetch global history failed", err);
        return [];
    }
};
