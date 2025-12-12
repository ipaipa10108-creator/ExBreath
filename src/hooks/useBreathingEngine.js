import { useRef, useEffect, useState } from 'react';
import { PRESETS } from '../constants/presets';
import { TRANSLATIONS, VOICE_LANG_CODES } from '../constants/translations';

export function useBreathingEngine({
    mode,
    customSettings,
    totalDurationMinutes,
    isVoiceOn,
    isSoundOn,
    visualRefs,
    onComplete,
    visualsReady,
    language = 'en'
}) {
    const [isRunning, setIsRunning] = useState(false);
    const [infoText, setInfoText] = useState({ title: '', desc: '' });
    const [remainingSeconds, setRemainingSeconds] = useState(totalDurationMinutes * 60);

    const stateRef = useRef({
        isRunning: false,
        startTime: 0,
        sessionStartTime: 0,
        animationFrame: null,
        audioCtx: null,
        wakeLock: null,
        totalDurationMinutes: totalDurationMinutes,
        spokenCount: new Set(),
        currentPreset: null,
        isVoiceOn: isVoiceOn,
        isSoundOn: isSoundOn,
        language: language
    });

    // Update refs when props change
    useEffect(() => {
        stateRef.current.isVoiceOn = isVoiceOn;
        stateRef.current.isSoundOn = isSoundOn;
        stateRef.current.language = language;
    }, [isVoiceOn, isSoundOn, language]);

    // Load preset
    useEffect(() => {
        const preset = PRESETS[mode];
        if (preset && visualRefs.current) {
            const { track, dot, actionText, timerText } = visualRefs.current;
            if (!track) return;

            const t = TRANSLATIONS[language];
            const modeInfo = t.modes[mode];
            setInfoText({ title: modeInfo.title, desc: modeInfo.desc });

            track.setAttribute('d', preset.shapePath);
            const pt = track.getPointAtLength(0);
            updateDot(dot, pt);

            // Reset visuals
            resetVisuals();
            stateRef.current.currentPreset = preset;
        }
    }, [mode, visualRefs, visualsReady, language]);

    // Update duration ref when prop changes
    useEffect(() => {
        stateRef.current.totalDurationMinutes = totalDurationMinutes;
        setRemainingSeconds(totalDurationMinutes * 60);
    }, [totalDurationMinutes]);

    const start = async () => {
        if (stateRef.current.isRunning) return;

        setIsRunning(true);
        stateRef.current.isRunning = true;
        stateRef.current.sessionStartTime = performance.now();

        // Init Audio
        if (!stateRef.current.audioCtx) {
            stateRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (stateRef.current.audioCtx.state === 'suspended') {
            stateRef.current.audioCtx.resume();
        }

        // Init WakeLock via Video
        const video = document.getElementById('wakeLockVideo');
        if (video) video.play().catch(() => { });
        if ('wakeLock' in navigator) {
            try { stateRef.current.wakeLock = await navigator.wakeLock.request('screen'); } catch (err) { }
        }

        if (visualRefs.current?.dot) visualRefs.current.dot.style.opacity = 1;

        runLoop();
    };

    const stop = (finished = false) => {
        stateRef.current.isRunning = false;
        setIsRunning(false);
        cancelAnimationFrame(stateRef.current.animationFrame);
        window.speechSynthesis.cancel();

        const video = document.getElementById('wakeLockVideo');
        if (video) video.pause();
        if (stateRef.current.wakeLock) {
            stateRef.current.wakeLock.release().then(() => stateRef.current.wakeLock = null);
        }

        resetVisuals();

        if (finished) {
            if (visualRefs.current?.actionText) visualRefs.current.actionText.textContent = "COMPLETE";
            if (visualRefs.current?.timerText) visualRefs.current.timerText.textContent = "";
            playCompleteSound();

            const elapsed = (performance.now() - stateRef.current.sessionStartTime) / 1000;
            if (onComplete) onComplete(elapsed);
        }
    };

    const resetVisuals = () => {
        const { dot, timerText, actionText, fillLevelRect, track } = visualRefs.current || {};
        const t = TRANSLATIONS[stateRef.current.language]; // Use current language
        if (dot) dot.style.opacity = 0;
        if (timerText) timerText.textContent = "";
        if (actionText) actionText.textContent = t.visual.ready;
        if (fillLevelRect) fillLevelRect.setAttribute('y', 100);
        if (track) updateShapeColor(track, 'default');

        // Reset dot pos
        if (track && dot) {
            const pt = track.getPointAtLength(0);
            updateDot(dot, pt);
        }
    };

    const getCycleData = () => {
        const preset = PRESETS[mode];
        const data = JSON.parse(JSON.stringify(preset));
        if (mode === 'custom') {
            data.cycle = customSettings;
        }
        return data;
    };

    const runLoop = async () => {
        const data = getCycleData();
        let phaseIdx = 0;

        while (stateRef.current.isRunning) {
            const duration = data.cycle[phaseIdx];
            const actionKey = data.actions[phaseIdx];
            const effect = data.effects[phaseIdx];

            await runPhase(duration, actionKey, effect, phaseIdx, data);

            if (checkTotalTimeUp()) {
                stop(true);
                break;
            }
            phaseIdx = (phaseIdx + 1) % data.cycle.length;
        }
    };

    const checkTotalTimeUp = () => {
        if (stateRef.current.totalDurationMinutes === 0) return false;
        const elapsed = (performance.now() - stateRef.current.sessionStartTime) / 1000;
        return elapsed >= (stateRef.current.totalDurationMinutes * 60);
    };

    const runPhase = (duration, actionKey, effect, idx, data) => {
        return new Promise(resolve => {
            const startTime = performance.now();
            const { track, dot, timerText, actionText, fillLevelRect } = visualRefs.current;
            const totalLen = track.getTotalLength();
            const numSegments = data.cycle.length;

            // Get translated action text
            const lang = stateRef.current.language;
            const t = TRANSLATIONS[lang];
            // actionKey is 'inhale', 'hold', etc.
            // Some presets like cyclic have 'inhale' multiple times or 'rest'.
            // In presets.js I used 'inhale', 'exhale', 'hold', 'rest', 'hum', 'fill-max' (wait fill-max is effect)
            // cyclic has actions: ["inhale", "inhale", "exhale"] -> keys
            // But I need to handle "second inhale" logic or just map keys properly.
            // presets.js actions: ["inhale", "hold", "exhale", "hold"] -> t.voice.inhale ...
            // cyclic: ["inhale", "inhale", "exhale"] -> the second one should be "inhale" too?
            // Actually cyclic sighing is "Inhale", "Inhale again", "Exhale".
            // In translated map I have 'inhale': '吸氣'. 
            // If I want "再吸", I need a separate key 'inhale2' or handle it?
            // Let's use the key directly. If `actionKey` is 'inhale', it says 'Inhale'.
            // If I want "Second Inhale", I should update PRESETS to use a different key like 'inhaleMore' and add it to translations.
            // For now let's assume standard keys. Cyclic used just strings before.
            // Let's fallback to key if not found, or empty.

            // Special handling for Cyclic 'inhale' -> 'inhale'
            // If the key is just 'inhale', it maps to 'Inhale' / '吸氣'. 
            // For cyclic, user might want "Double Inhale". 
            // I'll stick to the keys I defined in presets.js: "inhale", "exhale". 
            // Cyclic actions in presets.js: ["inhale", "inhale", "exhale"]. 
            // So it will say "吸氣", "吸氣", "吐氣". Acceptable for now.

            const actionLabel = t.voice[actionKey] || actionKey;

            let startRatio = idx / numSegments;
            let endRatio = (idx + 1) / numSegments;

            const segmentLen = (endRatio - startRatio) * totalLen;
            const baseDist = startRatio * totalLen;

            if (actionText) actionText.textContent = actionLabel;
            updateShapeColor(track, effect);

            let hasSpokenStart = false;
            let spokenCount = new Set();

            const frame = (now) => {
                if (!stateRef.current.isRunning) { resolve(); return; }

                const sessionElapsed = (now - stateRef.current.sessionStartTime) / 1000;
                let totalRemaining = 0;

                if (stateRef.current.totalDurationMinutes > 0) {
                    totalRemaining = (stateRef.current.totalDurationMinutes * 60) - sessionElapsed;
                    setRemainingSeconds(Math.max(0, totalRemaining));
                    if (totalRemaining <= 0) { resolve(); return; }
                } else {
                    setRemainingSeconds(sessionElapsed); // Count up
                }

                const elapsed = (now - startTime) / 1000;
                const progress = Math.min(elapsed / duration, 1);
                const remaining = Math.ceil(duration - elapsed);

                if (timerText && remaining >= 0) timerText.textContent = remaining;

                if (!hasSpokenStart) {
                    hasSpokenStart = true;
                    // Use Ref values for realtime updates
                    speak(actionLabel, stateRef.current.isVoiceOn, stateRef.current.language);
                    playSound(effect, stateRef.current.isSoundOn, stateRef.current.audioCtx);
                }

                if (remaining <= 3 && remaining >= 1 && !spokenCount.has(remaining)) {
                    spokenCount.add(remaining);
                    speak(remaining.toString(), stateRef.current.isVoiceOn, stateRef.current.language);
                }

                const currentDist = baseDist + (segmentLen * progress);
                const pt = track.getPointAtLength(currentDist % totalLen);
                updateDot(dot, pt);
                updateLung(fillLevelRect, effect, progress);

                if (progress < 1) {
                    stateRef.current.animationFrame = requestAnimationFrame(frame);
                } else {
                    resolve();
                }
            };
            stateRef.current.animationFrame = requestAnimationFrame(frame);
        });
    };

    // Helper functions
    const updateDot = (dot, pt) => {
        if (dot) {
            dot.setAttribute('cx', pt.x);
            dot.setAttribute('cy', pt.y);
        }
    };

    const updateLung = (rect, effect, progress) => {
        if (!rect) return;
        let level = 100;
        if (effect === 'fill') level = 100 - (progress * 100);
        else if (effect === 'drain') level = progress * 100;
        else if (effect === 'hold-full' || effect === 'fill-max') level = 0;
        else if (effect === 'hold-empty') level = 100;
        rect.setAttribute('y', level);
    };

    const updateShapeColor = (path, effect) => {
        if (!path) return;
        path.style.filter = "none";

        if (effect === 'fill' || effect === 'fill-max') {
            path.style.stroke = "#D4AF37";
            path.style.filter = "drop-shadow(0 0 5px #D4AF37)";
        } else if (effect === 'hold-full') {
            path.style.stroke = "#FFFFFF";
            path.style.filter = "drop-shadow(0 0 10px #FFFFFF)";
        } else if (effect === 'drain') {
            path.style.stroke = "#666";
        } else if (effect === 'hold-empty') {
            path.style.stroke = "#333";
        } else {
            path.style.stroke = "#333";
        }
    };

    return {
        isRunning,
        start,
        stop,
        infoText,
        remainingSeconds
    };
}

// Sound Helpers
function speak(text, enabled, lang = 'en') {
    if (!enabled) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE_LANG_CODES[lang] || 'en-US';
    u.rate = 1.3;
    window.speechSynthesis.speak(u);
}

function playSound(effect, enabled, ctx) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (effect === 'fill' || effect === 'fill-max') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 4);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 4);
    } else if (effect === 'drain') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 4);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 4);
    } else {
        // Hold sounds - subtle
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, t);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1);
    }

    osc.start(t);
    osc.stop(t + 4);
}

function playCompleteSound() {
    // Simple beep
}
