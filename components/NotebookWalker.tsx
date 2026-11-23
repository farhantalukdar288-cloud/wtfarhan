import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

// ============================================================================
// POSSIBILITIES & CONFIGURATION (Edit these values to customize behavior)
// ============================================================================

// 1. Custom image path in /public (PNG, WebP, or GIF).
const CUSTOM_CAT_IMAGE_SRC = '/cat-character.png';

// Set to true ONLY if /public/cat-character.png exists and loads properly.
// Keep false to always render the clean built-in animated cat without broken icon.
const USE_CUSTOM_IMAGE_BY_DEFAULT = false;

// 2. Movement behavior mode:
//    - 'mixed'  : Roams across screen, pauses to groom/alert/sleep, occasionally notices pointer
//    - 'roam'   : Continuously roams & pauses in an infinite natural cycle
//    - 'follow' : Chases desktop cursor (falls back to roaming on touch-only screens)
const BEHAVIOR_MODE: 'mixed' | 'roam' | 'follow' = 'mixed';

// 3. Message bubble trigger mode:
//    - false : Messages ONLY appear when you tap/click the cat
//    - true  : Also shows occasional quiet messages on its own
const AUTO_MESSAGES = false;

// 4. Cat coat accent palette (harmonized with pine-dark #080d0a & warm gold)
const CAT_PALETTE = {
  coatLight: '#dfd2bc',
  coatMid: '#c7b599',
  coatDark: '#9e8b70',
  innerEar: '#c48979',
  eyeDark: '#16211a',
  eyeGlow: '#f6f1e4',
  collarGold: '#c9a259',
};

const QUIET_LINES = [
  'Purr... take your time.',
  'Still exploring this corner?',
  'Quiet nights, steady steps.',
  'Watching from the pine shadows.',
];

const ROUTE_LINES: Record<string, string[]> = {
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
    'A few chapters of the story.',
    'Still exploring?',
  ],
  '/contact': [
    'Leave a note if you like.',
    'Good to see you around.',
  ],
};

// ============================================================================
// TYPES & HELPERS
// ============================================================================

type CatState = 'walk' | 'stalk' | 'alert' | 'groom' | 'sleep';

interface Position {
  x: number;
  y: number;
}

const CAT_WIDTH = 96;
const CAT_HEIGHT = 88;
const EDGE_PADDING = 16;
const TOP_SAFE_AREA = 68;

function clampToViewport(x: number, y: number): Position {
  if (typeof window === 'undefined') {
    return { x: 40, y: 180 };
  }
  const maxX = Math.max(EDGE_PADDING, window.innerWidth - CAT_WIDTH - EDGE_PADDING);
  const maxY = Math.max(TOP_SAFE_AREA, window.innerHeight - CAT_HEIGHT - EDGE_PADDING);

  return {
    x: Math.min(Math.max(x, EDGE_PADDING), maxX),
    y: Math.min(Math.max(y, TOP_SAFE_AREA), maxY),
  };
}

function pickRandomScreenSpot(): Position {
  if (typeof window === 'undefined') {
    return { x: 40, y: 180 };
  }
  const maxX = Math.max(EDGE_PADDING, window.innerWidth - CAT_WIDTH - EDGE_PADDING);
  const maxY = Math.max(TOP_SAFE_AREA, window.innerHeight - CAT_HEIGHT - EDGE_PADDING);

  return {
    x: Math.floor(EDGE_PADDING + Math.random() * (maxX - EDGE_PADDING)),
    y: Math.floor(TOP_SAFE_AREA + Math.random() * (maxY - TOP_SAFE_AREA)),
  };
}

function pickMessageForRoute(pathname: string): string {
  const specific = ROUTE_LINES[pathname] || [];
  const combined = specific.length > 0 ? [...specific, ...QUIET_LINES] : QUIET_LINES;
  const idx = Math.floor(Math.random() * combined.length);
  return combined[idx];
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function NotebookWalker() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = useState<Position>({ x: 42, y: 185 });
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [catState, setCatState] = useState<CatState>('walk');
  const [glideMs, setGlideMs] = useState<number>(2500);
  const [message, setMessage] = useState<string | null>(null);
  const [useCustomImg, setUseCustomImg] = useState<boolean>(USE_CUSTOM_IMAGE_BY_DEFAULT);

  const posRef = useRef<Position>(pos);
  posRef.current = pos;

  const pointerRef = useRef<Position | null>(null);
  const lastPointerMoveRef = useRef<number>(0);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        pointerRef.current = {
          x: e.clientX - CAT_WIDTH / 2,
          y: e.clientY - CAT_HEIGHT / 2,
        };
        lastPointerMoveRef.current = Date.now();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        pointerRef.current = null;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setPos((prev) => clampToViewport(prev.x, prev.y));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(() => {
          if (!cancelled) resolve();
        }, ms);
      });

    const moveToward = (rawTarget: Position, duration: number, nextState: CatState) => {
      const clamped = clampToViewport(rawTarget.x, rawTarget.y);
      const dx = clamped.x - posRef.current.x;

      if (Math.abs(dx) > 4) {
        setFacing(dx >= 0 ? 'right' : 'left');
      }

      setGlideMs(duration);
      setCatState(nextState);
      setPos(clamped);
    };

    const runInfiniteCycle = async () => {
      await wait(550);

      while (!cancelled) {
        const now = Date.now();
        const hasRecentMouse =
          pointerRef.current !== null && now - lastPointerMoveRef.current < 4500;

        if (
          (BEHAVIOR_MODE === 'follow' && hasRecentMouse && pointerRef.current) ||
          (BEHAVIOR_MODE === 'mixed' &&
            hasRecentMouse &&
            pointerRef.current &&
            Math.random() < 0.35)
        ) {
          const target = pointerRef.current;
          const dist = Math.hypot(
            target.x - posRef.current.x,
            target.y - posRef.current.y
          );

          if (dist > 48) {
            const stepDuration = Math.min(1800, Math.max(650, dist * 4.2));
            moveToward(target, stepDuration, 'walk');
            await wait(stepDuration);
            if (cancelled) break;
          } else {
            setCatState('alert');
            await wait(700);
            if (cancelled) break;
          }
          continue;
        }

        const stepsInBout = 1 + Math.floor(Math.random() * 2);
        for (let s = 0; s < stepsInBout; s++) {
          if (cancelled) break;
          const spot = pickRandomScreenSpot();
          const duration = 2100 + Math.floor(Math.random() * 1900);
          const gait: CatState = Math.random() < 0.65 ? 'walk' : 'stalk';

          moveToward(spot, duration, gait);
          await wait(duration);
        }
        if (cancelled) break;

        const roll = Math.random();
        if (BEHAVIOR_MODE === 'roam') {
          setCatState('alert');
          await wait(700 + Math.floor(Math.random() * 600));
        } else if (roll < 0.38) {
          setCatState('alert');
          await wait(1100 + Math.floor(Math.random() * 900));
        } else if (roll < 0.72) {
          setCatState('groom');
          await wait(1300 + Math.floor(Math.random() * 1000));
        } else {
          setCatState('sleep');
          await wait(1600 + Math.floor(Math.random() * 1400));
        }
        if (cancelled) break;

        if (Math.random() < 0.45) {
          setFacing((prev) => (prev === 'left' ? 'right' : 'left'));
          await wait(320);
        }
      }
    };

    runInfiniteCycle();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!AUTO_MESSAGES) return;

    let cancelled = false;
    let loopTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleAuto = () => {
      const delay = 9000 + Math.floor(Math.random() * 9000);
      loopTimer = setTimeout(() => {
        if (cancelled) return;
        setMessage(pickMessageForRoute(router.pathname));
        setCatState((prev) => (prev === 'sleep' ? 'alert' : prev));

        loopTimer = setTimeout(() => {
          if (cancelled) return;
          setMessage(null);
          scheduleAuto();
        }, 3200);
      }, delay);
    };

    scheduleAuto();

    return () => {
      cancelled = true;
      if (loopTimer) clearTimeout(loopTimer);
    };
  }, [router.pathname]);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  const triggerTapInteraction = () => {
    const line = pickMessageForRoute(router.pathname);
    setMessage(line);
    setCatState('alert');

    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }

    messageTimerRef.current = setTimeout(() => {
      setMessage(null);
    }, 3200);
  };

  const isMoving = catState === 'walk' || catState === 'stalk';
  const isSleeping = catState === 'sleep';
  const isAlert = catState === 'alert';

  const bodyAnimClass =
    catState === 'walk'
      ? 'nw-cat-walk'
      : catState === 'stalk'
      ? 'nw-cat-stalk'
      : catState === 'groom'
      ? 'nw-cat-groom'
      : catState === 'sleep'
      ? 'nw-cat-sleep'
      : 'nw-cat-alert';

  return (
    <div
      ref={rootRef}
      onClick={triggerTapInteraction}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerTapInteraction();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Interactive cat companion"
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 45,
        width: `${CAT_WIDTH}px`,
        height: `${CAT_HEIGHT}px`,
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: isMoving
          ? `left ${glideMs}ms cubic-bezier(0.24, 0.84, 0.36, 1), top ${glideMs}ms cubic-bezier(0.24, 0.84, 0.36, 1)`
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
            minWidth: '140px',
            maxWidth: '198px',
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'rgba(11, 20, 15, 0.94)',
            border: '1px solid rgba(214, 184, 122, 0.42)',
            boxShadow: '0 10px 26px rgba(0, 0, 0, 0.5)',
            color: '#ece8dc',
            fontSize: '11.5px',
            lineHeight: 1.42,
            letterSpacing: '0.01em',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          {message}
        </div>
      )}

      {isSleeping && !message && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: facing === 'right' ? '8px' : 'auto',
            left: facing === 'left' ? '8px' : 'auto',
            fontSize: '11px',
            fontWeight: 600,
            color: 'rgba(214, 184, 122, 0.85)',
            pointerEvents: 'none',
          }}
        >
          z z
        </div>
      )}

      <div
        className={bodyAnimClass}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: `scaleX(${facing === 'left' ? -1 : 1})`,
          transition: 'transform 0.28s ease',
        }}
      >
        {useCustomImg ? (
          <img
            src={CUSTOM_CAT_IMAGE_SRC}
            alt="Cat companion"
            onError={() => setUseCustomImg(false)}
            style={{
              width: '100%',
              height: '80px',
              objectFit: 'contain',
              objectPosition: 'bottom center',
              filter: isAlert
                ? 'drop-shadow(0 6px 14px rgba(201, 162, 89, 0.25))'
                : 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.48))',
              display: 'block',
            }}
          />
        ) : (
          <svg
            viewBox="0 0 116 100"
            width={CAT_WIDTH}
            height="82"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse
              cx="58"
              cy="92"
              rx="31"
              ry="5"
              fill="rgba(0, 0, 0, 0.44)"
            />

            <path
              className={isMoving ? 'nw-tail-walk' : 'nw-tail-idle'}
              d="M28 64C14 60 10 42 19 31"
              stroke={CAT_PALETTE.coatMid}
              strokeWidth="5.5"
              strokeLinecap="round"
            />

            <rect
              className={isMoving ? 'nw-leg-a' : ''}
              x="31"
              y="66"
              width="7.5"
              height="20"
              rx="3.75"
              fill={CAT_PALETTE.coatDark}
            />
            <rect
              className={isMoving ? 'nw-leg-b' : ''}
              x="43"
              y="66"
              width="7.5"
              height="20"
              rx="3.75"
              fill={CAT_PALETTE.coatMid}
            />

            <rect
              className={isMoving ? 'nw-leg-b' : ''}
              x="64"
              y="66"
              width="7.5"
              height="20"
              rx="3.75"
              fill={CAT_PALETTE.coatMid}
            />
            <rect
              className={isMoving ? 'nw-leg-a' : ''}
              x="75"
              y="66"
              width="7.5"
              height="20"
              rx="3.75"
              fill={CAT_PALETTE.coatLight}
            />

            <rect
              x="28"
              y="47"
              width="58"
              height="24"
              rx="12"
              fill={CAT_PALETTE.coatMid}
            />

            <path
              d="M74 48C78 52 78 64 74 70"
              stroke={CAT_PALETTE.collarGold}
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            <g
              className={isAlert ? 'nw-head-alert' : 'nw-head-idle'}
              style={{ transformOrigin: '82px 39px' }}
            >
              <circle cx="82" cy="39" r="16.5" fill={CAT_PALETTE.coatLight} />

              <path
                d="M70 28L67 13L78 23Z"
                fill={CAT_PALETTE.coatMid}
              />
              <path
                d="M86 23L94 12L95 28Z"
                fill={CAT_PALETTE.coatMid}
              />
              <path
                d="M71 26L69 16L76 23Z"
                fill={CAT_PALETTE.innerEar}
              />
              <path
                d="M87 23L92 15L93 26Z"
                fill={CAT_PALETTE.innerEar}
              />

              {isSleeping ? (
                <path
                  d="M84 39Q87.5 41.5 91 39"
                  stroke={CAT_PALETTE.eyeDark}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <circle
                    cx="87.5"
                    cy="38"
                    r={isAlert ? '2.9' : '2.2'}
                    fill={CAT_PALETTE.eyeDark}
                  />
                  <circle
                    cx="88.3"
                    cy="37.1"
                    r="0.85"
                    fill={CAT_PALETTE.eyeGlow}
                  />
                </>
              )}

              <path
                d="M96.5 41L93.5 43.5L97.5 44.5Z"
                fill={CAT_PALETTE.innerEar}
              />
              <path
                d="M91 46.5L81 45.5M91 48.5L82 49.5"
                stroke={CAT_PALETTE.coatDark}
                strokeWidth="1.15"
                strokeLinecap="round"
              />
            </g>
          </svg>
        )}
      </div>

      <style jsx>{`
        .nw-cat-walk {
          animation: nwWalkBob 0.56s ease-in-out infinite;
        }

        .nw-cat-stalk {
          animation: nwStalkBob 0.92s ease-in-out infinite;
        }

        .nw-cat-alert {
          animation: nwAlertPulse 1.35s ease-in-out infinite;
        }

        .nw-cat-groom {
          animation: nwGroomTilt 0.85s ease-in-out infinite;
        }

        .nw-cat-sleep {
          animation: nwSleepBreath 3.4s ease-in-out infinite;
        }

        .nw-head-idle {
          animation: nwHeadLook 4.4s ease-in-out infinite;
        }

        .nw-head-alert {
          animation: nwHeadPerk 0.75s ease-in-out infinite;
        }

        .nw-tail-idle {
          transform-origin: 28px 64px;
          animation: nwTailSwaySlow 3.1s ease-in-out infinite;
        }

        .nw-tail-walk {
          transform-origin: 28px 64px;
          animation: nwTailSwayFast 0.78s ease-in-out infinite;
        }

        .nw-leg-a {
          transform-origin: center top;
          animation: nwPawA 0.56s ease-in-out infinite;
        }

        .nw-leg-b {
          transform-origin: center top;
          animation: nwPawB 0.56s ease-in-out infinite;
        }

        @keyframes nwWalkBob {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3.5px);
          }
        }

        @keyframes nwStalkBob {
          0%,
          100% {
            transform: translateY(0.5px);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes nwAlertPulse {
          0%,
          100% {
            transform: translateY(-1px) scale(1.015);
          }
          50% {
            transform: translateY(-2.5px) scale(1.03);
          }
        }

        @keyframes nwGroomTilt {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(1.5px) rotate(-2.5deg);
          }
        }

        @keyframes nwSleepBreath {
          0%,
          100% {
            transform: translateY(1px) scale(1);
          }
          50% {
            transform: translateY(-1px) scale(1.02);
          }
        }

        @keyframes nwHeadLook {
          0%,
          100% {
            transform: rotate(0deg);
          }
          35% {
            transform: rotate(-4.5deg);
          }
          70% {
            transform: rotate(4.5deg);
          }
        }

        @keyframes nwHeadPerk {
          0%,
          100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3.5deg);
          }
        }

        @keyframes nwTailSwaySlow {
          0%,
          100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(11deg);
          }
        }

        @keyframes nwTailSwayFast {
          0%,
          100% {
            transform: rotate(-10deg);
          }
          50% {
            transform: rotate(12deg);
          }
        }

        @keyframes nwPawA {
          0%,
          100% {
            transform: rotate(16deg);
          }
          50% {
            transform: rotate(-16deg);
          }
        }

        @keyframes nwPawB {
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
