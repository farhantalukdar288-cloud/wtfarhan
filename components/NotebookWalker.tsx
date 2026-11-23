import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

// Optional: put a transparent PNG/WebP/GIF at public/cat-character.png
// If not found, the built-in cinematic cat renders automatically.
const CUSTOM_CAT_IMAGE_SRC = '/cat-character.png';

// Possibility toggle:
// false = messages only appear when you tap/click the cat
// true  = also shows quiet messages occasionally on its own
const ALLOW_AUTO_MESSAGES = false;

const QUIET_CAT_LINES = [
  'Purr... take your time.',
  'Still exploring?',
  'Quiet corner of the web.',
  'Watching from the shadows.',
];

const SECTION_CAT_LINES: Record<string, string[]> = {
  '/': [
    'Purr... take your time.',
    'Curious about this world?',
    'Quiet corner of the web.',
  ],
  '/chat': [
    'Want to talk to the AI?',
    'Ask whatever is on your mind.',
  ],
  '/about': [
    'A few quiet chapters here.',
    'Still exploring?',
  ],
  '/contact': [
    'Leave a note if you like.',
    'Good to see you around.',
  ],
};

type CatMood = 'prowl' | 'stalk' | 'alert' | 'groom';

export default function NotebookWalker() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = useState({ x: 40, y: 180 });
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [mood, setMood] = useState<CatMood>('prowl');
  const [moveDurationMs, setMoveDurationMs] = useState(2600);
  const [message, setMessage] = useState<string | null>(null);
  const [useCustomImage, setUseCustomImage] = useState(true);

  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Infinite cat movement loop: prowl -> pause/alert/groom -> prowl again forever
  useEffect(() => {
    let cancelled = false;
    let activeTimer: ReturnType<typeof setTimeout> | null = null;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        activeTimer = setTimeout(() => {
          if (!cancelled) resolve();
        }, ms);
      });

    const pickScreenPoint = () => {
      if (typeof window === 'undefined') return { x: 40, y: 180 };
      const catW = 92;
      const catH = 86;
      const pad = 16;
      const topSafe = 68;
      const maxX = Math.max(pad, window.innerWidth - catW - pad);
      const maxY = Math.max(topSafe, window.innerHeight - catH - pad);

      return {
        x: Math.floor(pad + Math.random() * (maxX - pad)),
        y: Math.floor(topSafe + Math.random() * (maxY - topSafe)),
      };
    };

    const runInfiniteCatCycle = async () => {
      await sleep(500);

      while (!cancelled) {
        // 1. Prowl / walk to a new spot smoothly
        const nextSpot = pickScreenPoint();
        const walkMs = 2200 + Math.floor(Math.random() * 1800);

        setMoveDurationMs(walkMs);
        setMood('prowl');
        setPos((prev) => {
          setFacing(nextSpot.x >= prev.x ? 'right' : 'left');
          return nextSpot;
        });

        await sleep(walkMs);
        if (cancelled) break;

        // 2. Brief cat-like pause: either alertly noticing surroundings/visitor or grooming/settling
        const pauseRoll = Math.random();
        if (pauseRoll < 0.45) {
          setMood('alert');
          await sleep(1100 + Math.floor(Math.random() * 900));
        } else if (pauseRoll < 0.78) {
          setMood('groom');
          await sleep(1200 + Math.floor(Math.random() * 1000));
        } else {
          setMood('stalk');
          await sleep(750 + Math.floor(Math.random() * 650));
        }
        if (cancelled) break;

        // 3. Occasional quick subtle turn before next prowl
        if (Math.random() < 0.5) {
          setFacing((prev) => (prev === 'left' ? 'right' : 'left'));
          await sleep(350);
        }
      }
    };

    runInfiniteCatCycle();

    return () => {
      cancelled = true;
      if (activeTimer) clearTimeout(activeTimer);
    };
  }, []);

  // Optional auto messages (off by default so messages mainly appear on tap)
  useEffect(() => {
    if (!ALLOW_AUTO_MESSAGES) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      const waitMs = 8500 + Math.floor(Math.random() * 8500);
      timer = setTimeout(() => {
        if (cancelled) return;
        const pool = SECTION_CAT_LINES[router.pathname] || QUIET_CAT_LINES;
        const line = pool[Math.floor(Math.random() * pool.length)];
        setMessage(line);
        setMood('alert');

        timer = setTimeout(() => {
          if (cancelled) return;
          setMessage(null);
          scheduleNext();
        }, 3200);
      }, waitMs);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router.pathname]);

  const handleCatTap = () => {
    const pool = SECTION_CAT_LINES[router.pathname] || QUIET_CAT_LINES;
    const nextLine = pool[Math.floor(Math.random() * pool.length)];

    setMessage(nextLine);
    setMood('alert');

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setMessage(null);
    }, 3200);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const isMoving = mood === 'prowl';
  const isAlert = mood === 'alert';

  return (
    <div
      ref={containerRef}
      onClick={handleCatTap}
      role="button"
      tabIndex={0}
      aria-label="Interactive cat companion"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleCatTap();
      }}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 45,
        width: '92px',
        height: '86px',
        cursor: 'pointer',
        userSelect: 'none',
        transition: isMoving
          ? `left ${moveDurationMs}ms cubic-bezier(0.25, 0.85, 0.35, 1), top ${moveDurationMs}ms cubic-bezier(0.25, 0.85, 0.35, 1)`
          : 'none',
      }}
    >
      {message && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            minWidth: '136px',
            maxWidth: '190px',
            padding: '8px 11px',
            borderRadius: '12px',
            background: 'rgba(12, 21, 16, 0.94)',
            border: '1px solid rgba(214, 184, 122, 0.42)',
            boxShadow: '0 10px 26px rgba(0, 0, 0, 0.48)',
            color: '#ece8dc',
            fontSize: '11.5px',
            lineHeight: 1.4,
            letterSpacing: '0.01em',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          {message}
        </div>
      )}

      <div
        className={
          mood === 'prowl'
            ? 'cat-prowl'
            : mood === 'groom'
            ? 'cat-groom'
            : mood === 'alert'
            ? 'cat-alert'
            : 'cat-stalk'
        }
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: `scaleX(${facing === 'left' ? -1 : 1})`,
          transition: 'transform 0.28s ease',
        }}
      >
        {useCustomImage ? (
          <img
            src={CUSTOM_CAT_IMAGE_SRC}
            alt="Cat companion"
            onError={() => setUseCustomImage(false)}
            style={{
              width: '100%',
              height: '78px',
              objectFit: 'contain',
              objectPosition: 'bottom center',
              filter: isAlert
                ? 'drop-shadow(0 6px 14px rgba(214, 184, 122, 0.24))'
                : 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45))',
              display: 'block',
            }}
          />
        ) : (
          <svg
            viewBox="0 0 112 98"
            width="92"
            height="80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse
              cx="57"
              cy="90"
              rx="29"
              ry="5"
              fill="rgba(0, 0, 0, 0.42)"
            />

            {/* Tail */}
            <path
              className={isMoving ? 'cat-tail-walk' : 'cat-tail-idle'}
              d="M28 63C14 59 10 42 18 31"
              stroke="#c9b89c"
              strokeWidth="5.5"
              strokeLinecap="round"
            />

            {/* Back legs */}
            <rect
              className={isMoving ? 'cat-paw-a' : ''}
              x="31"
              y="65"
              width="7"
              height="20"
              rx="3.5"
              fill="#a8977c"
            />
            <rect
              className={isMoving ? 'cat-paw-b' : ''}
              x="43"
              y="65"
              width="7"
              height="20"
              rx="3.5"
              fill="#b8a78c"
            />

            {/* Front legs */}
            <rect
              className={isMoving ? 'cat-paw-b' : ''}
              x="63"
              y="65"
              width="7"
              height="20"
              rx="3.5"
              fill="#c9b89c"
            />
            <rect
              className={isMoving ? 'cat-paw-a' : ''}
              x="74"
              y="65"
              width="7"
              height="20"
              rx="3.5"
              fill="#d8c8ae"
            />

            {/* Torso */}
            <rect
              x="28"
              y="47"
              width="57"
              height="24"
              rx="12"
              fill="#c9b89c"
            />
            <path
              d="M73 48C77 52 77 63 73 69"
              stroke="#c9a259"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Head */}
            <g
              className={isAlert ? 'cat-head-alert' : 'cat-head-idle'}
              style={{ transformOrigin: '81px 39px' }}
            >
              <circle cx="81" cy="39" r="16" fill="#d6c6ac" />
              <path d="M69 28L66 14L77 23Z" fill="#c9b89c" />
              <path d="M85 23L93 13L94 28Z" fill="#c9b89c" />
              <path d="M70 26L68 17L75 23Z" fill="#b88476" />
              <path d="M86 23L91 16L92 26Z" fill="#b88476" />

              <circle
                cx="86"
                cy="38"
                r={isAlert ? '2.8' : '2.1'}
                fill="#1b261f"
              />
              <circle cx="86.8" cy="37.2" r="0.85" fill="#f5efe2" />

              <path d="M95 41L92 43.5L96 44Z" fill="#b88476" />
              <path
                d="M90 46L80 45M90 48L81 49"
                stroke="#7d6e58"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </g>
          </svg>
        )}
      </div>

      <style jsx>{`
        .cat-stalk {
          animation: catStalkBreathe 2.8s ease-in-out infinite;
        }

        .cat-alert {
          animation: catAlertHold 1.4s ease-in-out infinite;
        }

        .cat-groom {
          animation: catGroomBob 0.9s ease-in-out infinite;
        }

        .cat-prowl {
          animation: catStepBob 0.58s ease-in-out infinite;
        }

        .cat-head-idle {
          animation: catHeadScan 4.2s ease-in-out infinite;
        }

        .cat-head-alert {
          animation: catHeadTilt 0.8s ease-in-out infinite;
        }

        .cat-tail-idle {
          transform-origin: 28px 63px;
          animation: catTailSlow 3.2s ease-in-out infinite;
        }

        .cat-tail-walk {
          transform-origin: 28px 63px;
          animation: catTailWalk 0.8s ease-in-out infinite;
        }

        .cat-paw-a {
          transform-origin: center top;
          animation: catPawSwingA 0.58s ease-in-out infinite;
        }

        .cat-paw-b {
          transform-origin: center top;
          animation: catPawSwingB 0.58s ease-in-out infinite;
        }

        @keyframes catStalkBreathe {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-2px) scale(1.015);
          }
        }

        @keyframes catAlertHold {
          0%,
          100% {
            transform: translateY(-1px) scale(1.02);
          }
          50% {
            transform: translateY(-2.5px) scale(1.03);
          }
        }

        @keyframes catGroomBob {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(1.5px) rotate(-2deg);
          }
        }

        @keyframes catStepBob {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3.5px);
          }
        }

        @keyframes catHeadScan {
          0%,
          100% {
            transform: rotate(0deg);
          }
          35% {
            transform: rotate(-4deg);
          }
          70% {
            transform: rotate(4deg);
          }
        }

        @keyframes catHeadTilt {
          0%,
          100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }

        @keyframes catTailSlow {
          0%,
          100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(11deg);
          }
        }

        @keyframes catTailWalk {
          0%,
          100% {
            transform: rotate(-10deg);
          }
          50% {
            transform: rotate(12deg);
          }
        }

        @keyframes catPawSwingA {
          0%,
          100% {
            transform: rotate(16deg);
          }
          50% {
            transform: rotate(-16deg);
          }
        }

        @keyframes catPawSwingB {
          0%,
          100% {
            transform: rotate(-16deg);
          }
          50% {
            transform: rotate(16deg);
          }
        }
      `}</style>
    </div>
  );
}
