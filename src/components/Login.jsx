import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { TRANSLATIONS } from '../constants/translations';

export default function Login({ onLogin, language, setLanguage }) {
    const [inputVal, setInputVal] = useState('');
    const [remember, setRemember] = useState(false);

    const t = TRANSLATIONS[language];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputVal.trim()) {
            onLogin(inputVal.trim(), remember);
        }
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
        <div className="flex flex-col items-center justify-center h-full p-6 relative">
            <button
                onClick={toggleLang}
                className="absolute top-6 right-6 text-sm text-gray-500 hover:text-primary-gold flex items-center gap-1.5 border border-gray-700 rounded px-2 py-1 transition-colors"
            >
                <Globe size={14} /> {getLangLabel()}
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-panel-bg border border-gray-800 p-8 rounded-2xl shadow-2xl shadow-primary-gold/10"
            >
                <h1 className="text-3xl font-light text-primary-gold text-center mb-8 tracking-widest">
                    {t.appTitle}
                </h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="userId" className="block text-sm text-gray-400 mb-2">{t.login.userId}</label>
                        <input
                            id="userId"
                            type="text"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            placeholder={t.login.placeholder}
                            className="w-full bg-black border border-gray-700 rounded-lg p-4 text-primary-gold focus:border-primary-gold focus:outline-none transition-colors text-center text-lg"
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center justify-center gap-2">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-700 text-primary-gold focus:ring-primary-gold"
                        />
                        <label htmlFor="rememberMe" className="text-xs text-gray-400 cursor-pointer select-none">
                            {t.login.remember}
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={!inputVal.trim()}
                        className="w-full bg-gradient-to-br from-primary-gold to-yellow-700 text-black font-bold py-4 rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {t.login.start}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
