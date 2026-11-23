import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const CHARACTER_IMAGE_SRC = '/notebook-character.png';

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

  const [pos, setPos] = useState({ x: 24, y: 150 });
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isWalking, setIsWalking] = useState(true);
  const [isNoticingVisitor, setIsNoticingVisitor] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let moveTimer: ReturnType<typeof setTimeout>;

    const pickNextSpot = () => {
      if (typeof window === 'undefined') return;

      const charW = 104;
      const charH = 148;
      const pad = 16;
      const maxX = Math.max(pad, window.innerWidth - charW - pad);
      const maxY = Math.max(pad + 64, window.innerHeight - charH - pad);

      const targetX = Math.floor(pad + Math.random() * (maxX - pad));
      const targetY = Math.floor(
        pad + 64 + Math.random() * (maxY - (pad + 64))
      );

      setPos((prev) => {
        setFacing(targetX >= prev.x ? 'right' : 'left');
        return { x: targetX, y: targetY };
      });
      setIsWalking(true);
      setIsNoticingVisitor(false);

      const walkDuration = 3000 + Math.random() * 2400;
      moveTimer = setTimeout(() => {
        setIsWalking(false);
        const noticeChance = Math.random() < 0.45;
        setIsNoticingVisitor(noticeChance);

        const pauseDuration = 2400 + Math.random() * 2600;
        moveTimer = setTimeout(pickNextSpot, pauseDuration);
      }, walkDuration);
    };

    moveTimer = setTimeout(pickNextSpot, 900);

    const handlePointer = () => {
      if (Math.random() < 0.22) {
        setIsNoticingVisitor(true);
        setTimeout(() => setIsNoticingVisitor(false), 1800);
      }
    };

    window.addEventListener('pointerdown', handlePointer, { passive: true });

    return () => {
      clearTimeout(moveTimer);
      window.removeEventListener('pointerdown', handlePointer);
    };
  }, []);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    const scheduleMessage = () => {
      const delayBeforeShow = 5500 + Math.random() * 6500;
      showTimer = setTimeout(() => {
        const pool = SECTION_LINES[router.pathname] || QUIET_LINES;
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
        width: '104px',
        height: '148px',
        cursor: 'pointer',
        userSelect: 'none',
        transition:
          'left 3s cubic-bezier(0.22, 1, 0.36, 1), top 3s cubic-bezier(0.22, 1, 0.36, 1)',
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

      <div
        className={isWalking ? 'nb-film-walk' : 'nb-film-idle'}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: `scaleX(${facing === 'left' ? -1 : 1})`,
          transition: 'transform 0.35s ease',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        <img
          src={CHARACTER_IMAGE_SRC}
          alt="Notebook inspired character"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            mixBlendMode: 'lighten',
            filter: isNoticingVisitor
              ? 'contrast(1.06) saturate(1.04)'
              : 'contrast(1.02)',
            WebkitMaskImage:
              'radial-gradient(ellipse 74% 82% at 50% 45%, #000 58%, rgba(0,0,0,0.55) 78%, transparent 100%)',
            maskImage:
              'radial-gradient(ellipse 74% 82% at 50% 45%, #000 58%, rgba(0,0,0,0.55) 78%, transparent 100%)',
            transition: 'filter 0.35s ease',
            display: 'block',
          }}
        />
      </div>

      <style jsx>{`
        .nb-film-idle {
          animation: nbFilmBreathe 3.4s ease-in-out infinite;
        }

        .nb-film-walk {
          animation: nbFilmStride 1.15s ease-in-out infinite;
        }

        @keyframes nbFilmBreathe {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-2.5px) scale(1.01);
          }
        }

        @keyframes nbFilmStride {
          0%,
          100% {
            transform: translateY(0px) rotate(-1.2deg);
          }
          50% {
            transform: translateY(-4.5px) rotate(1.2deg);
          }
        }
      `}</style>
    </div>
  );
}
