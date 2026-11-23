import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const QUIET_LINES = [
  'Take your time.',
  'Still exploring?',
  'Quiet corner of the web.',
  'Good to see you around.',
];

const SECTION_LINES: Record<string, string[]> = {
  '/': [
    'Take your time.',
    'Curious about the story behind this?',
    'Quiet corner of the web.',
  ],
  '/chat': [
    'Want to talk to my AI?',
    'Ask whatever is on your mind.',
  ],
  '/about': [
    'A few chapters of the story.',
    'Still exploring?',
  ],
  '/contact': [
    'You can always leave a note.',
    'Good to see you around.',
  ],
};

export default function NotebookWalker() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = useState({ x: 24, y: 120 });
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isWalking, setIsWalking] = useState(true);
  const [isNoticingVisitor, setIsNoticingVisitor] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // স্ক্রিনের ভেতর হাঁটা ও মাঝে মাঝে থেমে ভিজিটরের দিকে তাকানো
  useEffect(() => {
    let moveTimer: ReturnType<typeof setTimeout>;
    let stepInterval: ReturnType<typeof setInterval>;

    const pickNextSpot = () => {
      if (typeof window === 'undefined') return;

      const charW = 84;
      const charH = 148;
      const pad = 18;
      const maxX = Math.max(pad, window.innerWidth - charW - pad);
      const maxY = Math.max(pad + 60, window.innerHeight - charH - pad);

      const targetX = Math.floor(pad + Math.random() * (maxX - pad));
      const targetY = Math.floor(pad + 60 + Math.random() * (maxY - (pad + 60)));

      setPos((prev) => {
        setFacing(targetX >= prev.x ? 'right' : 'left');
        return { x: targetX, y: targetY };
      });
      setIsWalking(true);
      setIsNoticingVisitor(false);

      // কিছুক্ষণ হাঁটার পর থেমে মাঝে মাঝে ভিজিটরের দিকে মনোযোগ দেওয়া
      const walkDuration = 2800 + Math.random() * 2400;
      moveTimer = setTimeout(() => {
        setIsWalking(false);
        const noticeChance = Math.random() < 0.45;
        setIsNoticingVisitor(noticeChance);

        const pauseDuration = 2200 + Math.random() * 2600;
        moveTimer = setTimeout(pickNextSpot, pauseDuration);
      }, walkDuration);
    };

    // প্রথম লোডে একটু পর হাঁটা শুরু হবে
    moveTimer = setTimeout(pickNextSpot, 900);

    // পয়েন্টার/টাচ করলে মাঝে মাঝে স্বাভাবিকভাবে খেয়াল করার অনুভূতি
    const handlePointer = () => {
      if (Math.random() < 0.22) {
        setIsNoticingVisitor(true);
        setTimeout(() => setIsNoticingVisitor(false), 1800);
      }
    };

    window.addEventListener('pointerdown', handlePointer, { passive: true });
    stepInterval = setInterval(() => {
      // keep alive hook if needed
    }, 10000);

    return () => {
      clearTimeout(moveTimer);
      clearInterval(stepInterval);
      window.removeEventListener('pointerdown', handlePointer);
    };
  }, []);

  // মাঝে মাঝে শান্ত সিনেম্যাটিক মেসেজ দেখানো (সবসময় নয়, মাঝে মাঝে চুপ থাকবে)
  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    const scheduleMessage = () => {
      const delayBeforeShow = 5500 + Math.random() * 6500;
      showTimer = setTimeout(() => {
        const pool =
          SECTION_LINES[router.pathname] || QUIET_LINES;
        const combined = [...pool, ...QUIET_LINES];
        const nextLine =
          combined[Math.floor(Math.random() * combined.length)];

        setMessage(nextLine);
        setIsNoticingVisitor(true);

        const visibleDuration = 3400;
        hideTimer = setTimeout(() => {
          setMessage(null);
          setIsNoticingVisitor(false);
          scheduleMessage();
        }, visibleDuration);
      }, delayBeforeShow);
    };

    scheduleMessage();

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [router.pathname]);

  const handleCharacterTap = () => {
    const pool = SECTION_LINES[router.pathname] || QUIET_LINES;
    const nextLine = pool[Math.floor(Math.random() * pool.length)];
    setMessage(nextLine);
    setIsNoticingVisitor(true);
    setTimeout(() => {
      setMessage(null);
      setIsNoticingVisitor(false);
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleCharacterTap}
      role="button"
      tabIndex={0}
      aria-label="Notebook inspired character"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleCharacterTap();
      }}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 45,
        width: '84px',
        height: '148px',
        cursor: 'pointer',
        userSelect: 'none',
        transition:
          'left 2.8s cubic-bezier(0.22, 1, 0.36, 1), top 2.8s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* শান্ত মেসেজ বাবল */}
      {message && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            minWidth: '132px',
            maxWidth: '185px',
            padding: '8px 11px',
            borderRadius: '12px',
            background: 'rgba(13, 22, 17, 0.92)',
            border: '1px solid rgba(214, 184, 122, 0.38)',
            boxShadow: '0 10px 26px rgba(0, 0, 0, 0.45)',
            color: '#e8e4d8',
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

      {/* The Notebook Movie-Inspired ফুল-বডি ক্যারেক্টার */}
      <div
        className={isWalking ? 'nb-walk-bob' : 'nb-idle-breathe'}
        style={{
          width: '100%',
          height: '100%',
          transform: `scaleX(${facing === 'left' ? -1 : 1})`,
          transition: 'transform 0.35s ease',
        }}
      >
        <svg
          viewBox="0 0 96 168"
          width="84"
          height="148"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* মাটিতে নরম শ্যাডো */}
          <ellipse
            cx="48"
            cy="161"
            rx="22"
            ry="5"
            fill="rgba(0, 0, 0, 0.42)"
          />

          {/* বাম ও ডান পা (হাঁটার মুভমেন্ট) */}
          <g className={isWalking ? 'nb-leg-left' : ''}>
            <rect
              x="35"
              y="104"
              width="9"
              height="48"
              rx="4"
              fill="#3d2b1f"
            />
            <rect
              x="33"
              y="148"
              width="13"
              height="7"
              rx="3"
              fill="#1c140e"
            />
          </g>

          <g className={isWalking ? 'nb-leg-right' : ''}>
            <rect
              x="52"
              y="104"
              width="9"
              height="48"
              rx="4"
              fill="#4a3525"
            />
            <rect
              x="51"
              y="148"
              width="13"
              height="7"
              rx="3"
              fill="#1c140e"
            />
          </g>

          {/* ব্রাউন ট্রাউজার ও বেল্ট */}
          <path
            d="M33 94H63L61 112H35L33 94Z"
            fill="#463123"
          />
          <rect
            x="33"
            y="92"
            width="30"
            height="5"
            rx="1.5"
            fill="#24170f"
          />
          <rect
            x="45"
            y="91.5"
            width="6"
            height="6"
            rx="1"
            fill="#c9a259"
          />

          {/* হালকা অফ-হোয়াইট/লিনেন ক্যাজুয়াল শার্ট (হাতা গোটানো) */}
          <path
            d="M28 48C28 43 35 40 48 40C61 40 68 43 68 48L64 93H32L28 48Z"
            fill="#dfd9c8"
            stroke="#b8b09c"
            strokeWidth="1"
          />
          {/* ভেতরের সাদা আন্ডার-শার্ট ভি-নেক */}
          <path
            d="M42 40L48 53L54 40"
            fill="#f4f1ea"
          />
          {/* শার্টের কলার */}
          <path
            d="M39 40L44 48L48 43L52 48L57 40"
            stroke="#9e9582"
            strokeWidth="1.3"
            fill="none"
          />

          {/* বাম হাত (পকেটের দিকে রাখা) */}
          <g className={isWalking ? 'nb-arm-left' : ''}>
            <path
              d="M29 48L23 74L33 94"
              stroke="#dfd9c8"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="33" cy="95" r="4" fill="#d6ad8c" />
          </g>

          {/* ডান হাত (পকেটের দিকে রাখা) */}
          <g className={isWalking ? 'nb-arm-right' : ''}>
            <path
              d="M67 48L73 74L63 94"
              stroke="#d6d0be"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="63" cy="95" r="4" fill="#d6ad8c" />
          </g>

          {/* ঘাড় */}
          <rect
            x="43"
            y="33"
            width="10"
            height="10"
            rx="4"
            fill="#d6ad8c"
          />

          {/* মাথা ও স্বাভাবিক সিনেম্যাটিক মুখ */}
          <g
            style={{
              transform: isNoticingVisitor
                ? 'translateY(-1px) scale(1.02)'
                : 'none',
              transformOrigin: '48px 24px',
              transition: 'transform 0.35s ease',
            }}
          >
            {/* মুখের অবয়ব */}
            <rect
              x="36"
              y="12"
              width="24"
              height="26"
              rx="11"
              fill="#deb696"
            />

            {/* হালকা দাড়ি ও স্টাবল */}
            <path
              d="M37 25C37 33 41.5 38 48 38C54.5 38 59 33 59 25C57 31 53 35 48 35C43 35 39 31 37 25Z"
              fill="#8a6848"
              opacity="0.65"
            />

            {/* স্বাভাবিক চোখ (ভিজিটরের দিকে তাকালে হালকা ফোকাস) */}
            <circle
              cx={isNoticingVisitor ? '43.5' : '42.5'}
              cy="23"
              r="1.8"
              fill="#231a14"
            />
            <circle
              cx={isNoticingVisitor ? '54.5' : '53.5'}
              cy="23"
              r="1.8"
              fill="#231a14"
            />

            {/* স্বাভাবিক ভ্রু */}
            <path
              d="M39.5 19.5C41.5 18.8 43.5 19 45 19.8"
              stroke="#7c5d3f"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M51 19.8C52.5 19 54.5 18.8 56.5 19.5"
              stroke="#7c5d3f"
              strokeWidth="1.4"
              strokeLinecap="round"
            />

            {/* হালকা স্বাভাবিক ঠোঁট */}
            <path
              d="M45.5 31C47 31.8 49 31.8 50.5 31"
              stroke="#8f644b"
              strokeWidth="1.4"
              strokeLinecap="round"
            />

            {/* মাঝারি/অগোছালো চুল (The Notebook স্টাইল) */}
            <path
              d="M35 20C34.5 11 40 6 48.5 6C57 6 62 11 61 20C59.5 15 55 12 48 12C41 12 37 15 35 20Z"
              fill="#8f6b47"
            />
            <path
              d="M35 18C33.5 22 34 27 36 30C35.5 25 36 21 37.5 18"
              fill="#7c5c3c"
            />
          </g>
        </svg>
      </div>

      {/* সিনেম্যাটিক ও নরম মুভমেন্ট অ্যানিমেশন */}
      <style jsx>{`
        .nb-idle-breathe {
          animation: nbBreathe 3.2s ease-in-out infinite;
        }

        .nb-walk-bob {
          animation: nbWalkBob 0.7s ease-in-out infinite;
        }

        .nb-leg-left {
          transform-origin: 39.5px 104px;
          animation: nbLegSwingA 0.7s ease-in-out infinite;
        }

        .nb-leg-right {
          transform-origin: 56.5px 104px;
          animation: nbLegSwingB 0.7s ease-in-out infinite;
        }

        .nb-arm-left {
          transform-origin: 29px 48px;
          animation: nbArmSwingB 0.7s ease-in-out infinite;
        }

        .nb-arm-right {
          transform-origin: 67px 48px;
          animation: nbArmSwingA 0.7s ease-in-out infinite;
        }

        @keyframes nbBreathe {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2.5px);
          }
        }

        @keyframes nbWalkBob {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes nbLegSwingA {
          0%,
          100% {
            transform: rotate(14deg);
          }
          50% {
            transform: rotate(-14deg);
          }
        }

        @keyframes nbLegSwingB {
          0%,
          100% {
            transform: rotate(-14deg);
          }
          50% {
            transform: rotate(14deg);
          }
        }

        @keyframes nbArmSwingA {
          0%,
          100% {
            transform: rotate(-8deg);
          }
          50% {
            transform: rotate(8deg);
          }
        }

        @keyframes nbArmSwingB {
          0%,
          100% {
            transform: rotate(8deg);
          }
          50% {
            transform: rotate(-8deg);
          }
        }
      `}</style>
    </div>
  );
}
