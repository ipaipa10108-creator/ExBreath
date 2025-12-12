import { forwardRef, useImperativeHandle, useRef } from 'react';

const VisualArea = forwardRef(({ mode, language = 'en' }, ref) => {
    const trackRef = useRef(null);
    const dotRef = useRef(null);
    const fillLevelRectRef = useRef(null);
    const timerTextRef = useRef(null);
    const actionTextRef = useRef(null);
    const lungShapeRef = useRef(null);

    useImperativeHandle(ref, () => ({
        track: trackRef.current,
        dot: dotRef.current,
        fillLevelRect: fillLevelRectRef.current,
        timerText: timerTextRef.current,
        actionText: actionTextRef.current,
        lungShape: lungShapeRef.current
    }));

    return (
        <div className="w-full h-full flex items-center justify-center p-4 relative">
            <svg className="w-full h-full max-w-[90vh] max-h-[90vh]" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="goldLinearGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fff4cc" />
                        <stop offset="30%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#aa8a29" />
                    </linearGradient>

                    <mask id="liquidMask">
                        <rect x="0" y="0" width="100" height="100" fill="black" />
                        <rect ref={fillLevelRectRef} id="fillLevelRect" x="0" y="100" width="100" height="100" fill="white" />
                    </mask>

                    <g id="complexLungShape">
                        <path d="M 46,30 C 44,28 40,28 38,32 C 30,45 25,60 25,75 C 25,85 35,90 42,88 C 46,87 46,75 46,75 Z" />
                        <path d="M 54,30 C 56,28 60,28 62,32 C 70,45 75,60 75,75 C 75,85 65,90 58,88 C 54,87 54,75 54,75 Z" />
                        <path d="M 48,32 L 48,15 L 52,15 L 52,32" />
                    </g>

                    <mask id="lungMask">
                        <rect width="100" height="100" fill="black" />
                        <use href="#complexLungShape" fill="white" />
                    </mask>

                    <g id="bronchiTree">
                        <path d="M 50,32 Q 46,45 35,60 M 35,60 Q 30,70 28,75 M 35,60 Q 40,70 42,75" className="fill-none stroke-black stroke-[0.5] opacity-30" />
                        <path d="M 50,32 Q 54,45 65,60 M 65,60 Q 70,70 72,75 M 65,60 Q 60,70 58,75" className="fill-none stroke-black stroke-[0.5] opacity-30" />
                    </g>
                </defs>

                <path
                    ref={trackRef}
                    className="fill-none stroke-[#333] stroke-2 transition-[stroke] duration-300 stroke-linecap-round stroke-linejoin-round"
                />

                <g style={{ transformOrigin: '50% 50%', transform: 'scale(0.9)' }}>
                    <use href="#complexLungShape" className="fill-[#111] stroke-[#333] stroke-[0.5]" />

                    <g mask="url(#lungMask)">
                        <rect x="0" y="0" width="100" height="100" fill="url(#goldLinearGradient)" mask="url(#liquidMask)" />
                    </g>

                    <use href="#bronchiTree" />

                    <use
                        ref={lungShapeRef}
                        href="#complexLungShape"
                        className="fill-none stroke-primary-gold stroke-1 opacity-80 drop-shadow-[0_0_2px_rgba(212,175,55,0.5)]"
                    />
                </g>

                <circle
                    ref={dotRef}
                    className="fill-white stroke-primary-gold stroke-2 drop-shadow-[0_0_8px_rgba(212,175,55,1)] opacity-0 transition-opacity duration-300"
                    r="2.5"
                />

                <text
                    ref={timerTextRef}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ paintOrder: 'stroke' }}
                    className="font-bold text-[28px] fill-white stroke-black stroke-[4px] pointer-events-none select-none font-[Helvetica_Neue,Arial,sans-serif] drop-shadow-lg"
                    x="50" y="50"
                ></text>

                <text
                    ref={actionTextRef}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ paintOrder: 'stroke' }}
                    className="text-[14px] font-[900] tracking-[3px] fill-primary-gold stroke-black stroke-[3px] uppercase pointer-events-none select-none drop-shadow-lg"
                    x="50" y="72"
                >{language === 'en' ? 'READY' : (language === 'zh' ? '準備' : '準備')}</text>
            </svg>

            <video id="wakeLockVideo" playsInline muted loop className="absolute opacity-[0.001] w-px h-px pointer-events-none">
                <source src="data:video/mp4;base64,AAAAHGZ0eXBNNEVAAAAAAAAAAAEAAACgYW1vbQAAAAAAAAAAAAAAAAAAAABtb292AAAAbG12aGQAAAAA6a2gAAAAAAHAAACaAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKgbWRhdAAAAAAAAAAAAAAA" type="video/mp4" />
            </video>
        </div>
    );
});

VisualArea.displayName = "VisualArea";
export default VisualArea;
