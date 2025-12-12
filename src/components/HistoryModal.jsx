import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { TRANSLATIONS } from '../constants/translations';

export default function HistoryModal({ isOpen, onClose, history, language }) {
    if (!isOpen) return null;

    const t = TRANSLATIONS[language];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-[#111] border border-[#333] w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
                        <h2 className="text-primary-gold text-lg font-bold tracking-widest flex items-center gap-2">
                            {t.history.title}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                        {(!history || history.totalSessions === undefined) ? (
                            <div className="text-gray-500 text-center py-10">{t.history.loading}</div>
                        ) : (
                            <>
                                {/* Summary Stats */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-[#222] p-2 rounded-lg text-center">
                                        <div className="text-gray-400 text-[10px] mb-1">{t.history.todayTotal} ({t.panel.minutes})</div>
                                        <div className="text-xl font-bold text-primary-gold">{Math.floor((history.todayTimeSeconds || 0) / 60)}</div>
                                    </div>
                                    <div className="bg-[#222] p-2 rounded-lg text-center">
                                        <div className="text-gray-400 text-[10px] mb-1">{t.history.totalSessions}</div>
                                        <div className="text-xl font-bold text-white">{history.totalSessions || 0}</div>
                                    </div>
                                    <div className="bg-[#222] p-2 rounded-lg text-center">
                                        <div className="text-gray-400 text-[10px] mb-1">{t.history.totalTime} ({t.panel.minutes})</div>
                                        <div className="text-xl font-bold text-primary-gold">{Math.floor((history.totalTimeSeconds || 0) / 60)}</div>
                                    </div>
                                </div>

                                {/* Last Session */}
                                <div className="bg-[#1a1a1a] p-4 rounded-lg border-l-4 border-primary-gold">
                                    <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                                        {t.history.lastSession}
                                    </h3>
                                    {history.lastSession ? (
                                        <div className="space-y-1">
                                            <div className="text-white font-bold">
                                                {t.modes[history.lastSession.mode] ? t.modes[history.lastSession.mode].title : history.lastSession.mode}
                                            </div>
                                            <div className="text-xs text-gray-500 flex justify-between">
                                                <span>{history.lastSession.duration === 'Infinite' ? t.panel.infinite : `${history.lastSession.duration} ${t.panel.minutes}`}</span>
                                                <span>{new Date(history.lastSession.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-600 text-sm">--</div>
                                    )}
                                </div>

                                {/* Breakdown */}
                                <div>
                                    <h3 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                                        {t.history.records}
                                    </h3>
                                    <div className="space-y-2">
                                        {Object.entries(history.byMode || {}).map(([key, data]) => (
                                            <div key={key} className="flex justify-between items-center text-sm bg-[#222] p-3 rounded">
                                                <span className="text-gray-300 truncate max-w-[50%]">
                                                    {t.modes[key] ? t.modes[key].title : key}
                                                </span>
                                                <div className="flex gap-4 text-xs text-gray-500">
                                                    <span>{data.count}</span>
                                                    <span className="w-16 text-right">{Math.floor(data.time / 60)} {t.panel.minutes}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-4 border-t border-[#333]">
                        <button
                            onClick={onClose}
                            className="w-full bg-[#222] hover:bg-[#333] text-gray-300 py-3 rounded text-sm transition-colors"
                        >
                            {t.history.close}
                        </button>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
