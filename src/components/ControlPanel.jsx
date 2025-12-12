import { Play, Square, Volume2, VolumeX, Mic, MicOff, History, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TRANSLATIONS } from '../constants/translations';

export default function ControlPanel({
    onStart,
    onStop,
    isRunning,
    mode,
    setMode,
    duration,
    setDuration,
    toggleSound,
    isSoundOn,
    toggleVoice,
    isVoiceOn,
    customSettings,
    setCustomSettings,
    onOpenHistory,
    infoText,
    language,
    setLanguage
}) {
    const t = TRANSLATIONS[language];
    // Use t for translations

    const modes = [
        { id: 'box', label: t.modes.box.label },
        { id: 'custom', label: t.modes.custom.label },
        { id: '478', label: t.modes['478'].label },
        { id: 'diaphragm', label: t.modes.diaphragm.label },
        { id: 'cyclic', label: t.modes.cyclic.label },
        { id: 'humming', label: t.modes.humming.label },
    ];

    const durations = [
        { min: 1, label: `1${t.panel.minutes}` },
        { min: 3, label: `3${t.panel.minutes}` },
        { min: 5, label: `5${t.panel.minutes}` },
        { min: 10, label: `10${t.panel.minutes}` },
        { min: 0, label: t.panel.infinite },
    ];

    const handleCustomChange = (idx, val) => {
        const newSettings = [...customSettings];
        newSettings[idx] = Math.max(1, Number(val));
        setCustomSettings(newSettings);
    };

    const toggleLang = () => {
        if (language === 'en') setLanguage('zh');
        else if (language === 'zh') setLanguage('ja');
        else setLanguage('en');
    };

    const getLangLabel = () => {
        if (language === 'en') return 'EN';
        if (language === 'zh') return '中';
        return 'JP';
    }

    return (
        <div className="flex flex-col h-full bg-panel-bg relative">
            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4">
                <div className="space-y-4">
                    <div className="relative">
                        <h1 className="text-2xl text-primary-gold font-light tracking-[4px] text-center">{t.appTitle}</h1>
                        <button
                            onClick={toggleLang}
                            className="absolute right-0 top-1 text-xs text-gray-500 hover:text-primary-gold flex items-center gap-1 border border-gray-700 rounded px-1.5 py-0.5 transition-colors"
                        >
                            <Globe size={10} /> {getLangLabel()}
                        </button>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 font-mono tracking-wider">{t.panel.mode}</label>
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            disabled={isRunning}
                            className="w-full p-3 bg-[#222] border border-[#444] text-primary-gold rounded-md font-bold cursor-pointer focus:outline-none focus:border-primary-gold transition-colors disabled:opacity-50"
                        >
                            {modes.map(m => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Duration Control */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 font-mono tracking-wider">{t.panel.duration}</label>
                        <div className="flex gap-1.5">
                            {durations.map(d => (
                                <button
                                    key={d.min}
                                    onClick={() => setDuration(d.min)}
                                    disabled={isRunning}
                                    className={`flex-1 py-3 rounded text-xs font-bold transition-all disabled:opacity-50 
                                        ${duration === d.min
                                            ? 'bg-primary-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                                            : 'bg-[#222] border border-[#444] text-gray-400 hover:bg-[#333]'
                                        }
                                    `}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Panel (Conditional) */}
                    <AnimatePresence>
                        {mode === 'custom' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="grid grid-cols-4 gap-2 bg-[#222] p-3 rounded-lg border border-[#333] overflow-hidden"
                            >
                                {[t.voice.inhale, t.voice.hold, t.voice.exhale, t.voice.hold].map((label, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        <label className="text-[10px] text-gray-400 mb-1">{label}</label>
                                        <input
                                            type="number"
                                            value={customSettings[idx]}
                                            onChange={(e) => handleCustomChange(idx, e.target.value)}
                                            disabled={isRunning}
                                            className="w-full bg-black border border-[#555] text-primary-gold text-center p-1 rounded text-sm focus:border-primary-gold outline-none disabled:opacity-50"
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Toggles */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 font-mono tracking-wider">{t.panel.breathing}</label>
                        <div className="flex justify-center gap-4 bg-black/20 p-3 rounded-lg">
                            <button
                                onClick={toggleVoice}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${isVoiceOn ? 'text-primary-gold drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]' : 'text-gray-600'}`}
                            >
                                {isVoiceOn ? <Mic size={14} /> : <MicOff size={14} />}
                                {t.panel.voice}
                            </button>
                            <button
                                onClick={toggleSound}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${isSoundOn ? 'text-primary-gold drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]' : 'text-gray-600'}`}
                            >
                                {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                {t.panel.sound}
                            </button>
                            <div className="w-px bg-[#333] mx-1"></div>
                            <button
                                onClick={onOpenHistory}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                <History size={14} />
                                {t.panel.history}
                            </button>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="p-4 bg-[#151515] border-l-2 border-primary-gold rounded-r-md text-sm text-[#ccc] leading-relaxed">
                        <h3 className="text-primary-gold border-b border-[#333] pb-1 mb-2 font-bold">
                            {infoText ? infoText.title : t.panel.ready}
                        </h3>
                        <p className="whitespace-pre-line text-xs text-gray-400">
                            {infoText ? infoText.desc : t.panel.readyDesc}
                        </p>
                    </div>
                    <div className="h-4"></div>
                </div>
            </div>

            {/* Fixed Footer for Actions */}
            <div
                className="shrink-0 p-4 border-t border-[#222] bg-panel-bg z-50 w-full shadow-[0_-5px_15px_rgba(0,0,0,0.5)]"
                style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 10px))' }}
            >
                {!isRunning ? (
                    <button
                        onClick={onStart}
                        className="w-full bg-gradient-to-br from-primary-gold to-yellow-700 text-black font-bold py-4 rounded-lg hover:brightness-110 flex items-center justify-center gap-2 text-lg shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all active:scale-[0.98]"
                    >
                        <Play fill="black" size={20} /> <span className="tracking-widest">{t.panel.start}</span>
                    </button>
                ) : (
                    <button
                        onClick={onStop}
                        className="w-full bg-[#333] border border-[#555] text-gray-400 font-bold py-4 rounded-lg hover:bg-[#444] flex items-center justify-center gap-2 text-lg transition-all active:scale-[0.98]"
                    >
                        <Square fill="currentColor" size={20} /> <span className="tracking-widest">{t.panel.stop}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
