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
                        {/* Trachea */}
                        <path d="M46.5,10 L53.5,10 C53.5,20 53.5,24 55,28 C57,32 61,35.5 63,37 L60.5,40 C58,38 53.5,34 51,30 C48.5,34 44,38 41.5,40 L39,37 C41,35.5 45,32 47,28 C48.5,24 48.5,20 46.5,10 Z" />
                        {/* Viewer's Left Lung */}
                        <path d="M42,25 C36,22 28,24 23,32 C18,41 15,55 17,70 C19,85 26,92 35,90 C42,88 45,82 46.5,74 C48,64 49,48 46,35 C45.5,31 44,28 42,25 Z" />
                        {/* Viewer's Right Lung */}
                        <path d="M58,25 C64,22 72,24 77,32 C82,41 85,55 83,70 C81,85 74,92 65,90 C58,88 55,82 53.5,74 C52,64 51,48 54,35 C54.5,31 56,28 58,25 Z" />
                    </g>

                    <mask id="lungMask">
                        <rect width="100" height="100" fill="black" />
                        <use href="#complexLungShape" fill="white" />
                    </mask>

                    <g id="lungDetails">
                        {/* Tracheal Rings */}
                        <path d="M46.5,12 L53.5,12 M46.5,15 L53.5,15 M46.5,18 L53.5,18 M46.5,21 L53.5,21 M47,24 L53,24 M48,27 L52,27" className="fill-none stroke-black stroke-[0.6] opacity-40" />
                        {/* Lobe Fissures */}
                        <path d="M17,55 Q28,50 48,58" className="fill-none stroke-black stroke-[0.4] opacity-30" />
                        <path d="M21,38 Q30,55 46.5,65" className="fill-none stroke-black stroke-[0.4] opacity-30" />
                        <path d="M79,38 Q70,55 53.5,65" className="fill-none stroke-black stroke-[0.4] opacity-30" />
                    </g>

                    <g id="bronchiTree">
                        {/* Left tree */}
                        <path d="M45,31 Q38,39 30,47 Q25,53 22,60 M30,47 Q35,53 33,63 M36,40 Q28,49 26,56 M42,35 Q35,43 36,49 M31,46 Q25,48 20,53" className="fill-none stroke-black stroke-[0.5] opacity-40" />
                        <path d="M22,60 Q20,66 19,72 M22,60 Q25,65 26,71 M33,63 Q31,70 29,76 M33,63 Q36,68 38,74 M26,56 Q24,62 23,68" className="fill-none stroke-black stroke-[0.3] opacity-30" />
                        {/* Right tree */}
                        <path d="M55,31 Q62,39 70,47 Q75,53 78,60 M70,47 Q65,53 67,63 M64,40 Q72,49 74,56 M58,35 Q65,43 64,49 M69,46 Q75,48 80,53" className="fill-none stroke-black stroke-[0.5] opacity-40" />
                        <path d="M78,60 Q80,66 81,72 M78,60 Q75,65 74,71 M67,63 Q69,70 71,76 M67,63 Q64,68 62,74 M74,56 Q76,62 77,68" className="fill-none stroke-black stroke-[0.3] opacity-30" />
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

                    <use href="#lungDetails" />
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
