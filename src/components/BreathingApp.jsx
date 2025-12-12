import { useState, useRef, useEffect } from 'react';
import ControlPanel from './ControlPanel';
import VisualArea from './VisualArea';
import HistoryModal from './HistoryModal';
import { useBreathingEngine } from '../hooks/useBreathingEngine';
import { uploadRecord, getLocalHistory, fetchRemoteHistory } from '../services/api';
import { LogOut } from 'lucide-react';

export default function BreathingApp({ userId, language, setLanguage }) {
    const [mode, setMode] = useState('box');
    const [duration, setDuration] = useState(5); // minutes
    const [isSoundOn, setIsSoundOn] = useState(true);
    const [isVoiceOn, setIsVoiceOn] = useState(true);
    const [customSettings, setCustomSettings] = useState([4, 4, 4, 4]);
    const [visualsReady, setVisualsReady] = useState(false);

    // Language State managed in parent App.jsx

    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState({});

    const visualRef = useRef(null);

    useEffect(() => {
        if (visualRef.current) {
            setVisualsReady(true);
        }
    }, []);

    const calculateStatsFromRecords = (records) => {
        const stats = {
            totalSessions: 0,
            totalTimeSeconds: 0,
            lastSession: null,
            byMode: {},
            records: records
        };

        records.forEach(r => {
            // Priority: actualSeconds from remote > calculated from duration > 0
            let durationSec = 0;
            if (r.actualSeconds !== undefined && r.actualSeconds !== null && r.actualSeconds !== "") {
                durationSec = Number(r.actualSeconds);
            } else {
                // Fallback for old records or if actualSeconds missing
                durationSec = r.duration === 'Infinite' ? 0 : (Number(r.duration) * 60);
            }

            // Update Stats
            stats.totalSessions += 1;
            stats.totalTimeSeconds += durationSec;

            // Last session logic
            stats.lastSession = {
                mode: r.level,
                duration: r.duration,
                timestamp: r.timestamp
            };

            if (!stats.byMode[r.level]) stats.byMode[r.level] = { count: 0, time: 0 };
            stats.byMode[r.level].count += 1;
            stats.byMode[r.level].time += durationSec;
        });

        return stats;
    };

    const handleOpenHistory = async () => {
        // 1. Show Local First
        setHistoryData(getLocalHistory());
        setShowHistory(true);

        // 2. Fetch Remote
        const remoteRecords = await fetchRemoteHistory(userId);
        if (remoteRecords && Array.isArray(remoteRecords) && remoteRecords.length > 0) {
            const mergedStats = calculateStatsFromRecords(remoteRecords);
            setHistoryData(mergedStats);
        }
    };

    const handleComplete = (actualElapsed) => {
        uploadRecord({
            id: userId,
            level: mode,
            duration: duration === 0 ? 'Infinite' : duration,
            actualSeconds: actualElapsed,
            completed: true,
        });
    };

    const engine = useBreathingEngine({
        mode,
        customSettings,
        totalDurationMinutes: duration,
        isVoiceOn,
        isSoundOn,
        visualRefs: visualRef,
        onComplete: handleComplete,
        visualsReady,
        language // Pass language to engine
    });

    const handleLogout = () => {
        if (engine.isRunning) engine.stop();
        localStorage.removeItem('exbreath_user_id');
        window.location.reload();
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-black">
            {/* Visual Area (Left/Top) */}
            <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000_90%)] overflow-hidden border-b md:border-b-0 md:border-r border-[#333]">
                <VisualArea mode={mode} ref={visualRef} language={language} />

                <div className="absolute top-4 left-4 text-gray-500 text-xs font-mono select-none">
                    User: <span className="text-primary-gold">{userId}</span>
                </div>
                <button onClick={handleLogout} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20">
                    <LogOut size={16} />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-sm pointer-events-none select-none">
                    {duration === 0 ? (language === 'en' ? "Mode: Infinite" : (language === 'zh' ? "模式: 無限" : "モード: 無限")) : (
                        <>
                            {language === 'en' ? "Time Left: " : (language === 'zh' ? "剩餘時間: " : "残り時間: ")}
                            <span className="text-primary-gold">
                                {Math.floor(engine.remainingSeconds / 60)}:
                                {(Math.floor(engine.remainingSeconds) % 60).toString().padStart(2, '0')}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Control Panel (Right/Bottom) */}
            <div className="h-[45dvh] md:h-full md:w-[400px] shrink-0 bg-panel-bg flex flex-col border-t border-[#333] overflow-hidden">
                <ControlPanel
                    onStart={engine.start}
                    onStop={() => engine.stop(false)}
                    isRunning={engine.isRunning}
                    mode={mode}
                    setMode={setMode}
                    duration={duration}
                    setDuration={setDuration}
                    toggleSound={() => setIsSoundOn(!isSoundOn)}
                    isSoundOn={isSoundOn}
                    toggleVoice={() => setIsVoiceOn(!isVoiceOn)}
                    isVoiceOn={isVoiceOn}
                    customSettings={customSettings}
                    setCustomSettings={setCustomSettings}
                    onOpenHistory={handleOpenHistory}
                    infoText={engine.infoText}
                    language={language}
                    setLanguage={setLanguage}
                />
            </div>

            <HistoryModal
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                history={historyData}
                language={language}
            />
        </div>
    );
}
