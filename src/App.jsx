import { useState, useEffect } from 'react';
import Login from './components/Login';
import BreathingApp from './components/BreathingApp';

export default function App() {
    const [userId, setUserId] = useState(null);
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('exbreath_language') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('exbreath_language', language);
    }, [language]);

    useEffect(() => {
        // Check local storage for existing session
        const savedId = localStorage.getItem('exbreath_user_id');
        if (savedId) {
            setUserId(savedId);
        }
    }, []);

    const handleLogin = (id, remember) => {
        setUserId(id);
        if (remember) {
            localStorage.setItem('exbreath_user_id', id);
        } else {
            localStorage.removeItem('exbreath_user_id');
        }
    };

    return (
        <div className="h-screen w-screen bg-black text-white overflow-hidden">
            {!userId ? (
                <Login onLogin={handleLogin} language={language} setLanguage={setLanguage} />
            ) : (
                <BreathingApp userId={userId} language={language} setLanguage={setLanguage} />
            )}
        </div>
    );
}
