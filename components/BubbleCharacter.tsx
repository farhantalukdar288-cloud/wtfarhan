import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const BUBBLE_LINES = [
  'Hey there — welcome to Farhan’s corner.',
  'Cozy winter nights, soft lights, and quiet thoughts.',
  'Tap the bubble to cycle lines, or jump into AI Chat.',
  'Everything here is kept clean, calm, and alive.'
];

export default function BubbleCharacter() {
  const [index, setIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (minimized) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BUBBLE_LINES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [minimized]);

  const handleCycle = () => {
    setIndex((prev) => (prev + 1) % BUBBLE_LINES.length);
  };

  return (
    <aside className="bubble-char-wrap" aria-label="Companion character">
      {!minimized && (
        <div
          className="messenger-bubble"
          role="button"
          tabIndex={0}
          onClick={handleCycle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCycle();
            }
          }}
        >
          <span className="messenger-bubble-kicker">FARHAN BOT · TAP TO CYCLE</span>
          <p>{BUBBLE_LINES[index]}</p>
          <div className="messenger-bubble-footer">
            <Link
              href="/chat"
              className="messenger-bubble-link"
              onClick={(e) => e.stopPropagation()}
            >
              Open AI Chat →
            </Link>
            <button
              type="button"
              className="messenger-bubble-hide"
              onClick={(e) => {
                e.stopPropagation();
                setMinimized(true);
              }}
            >
              Hide
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="char-avatar-btn"
        aria-label={minimized ? 'Show character bubble' : 'Next character line'}
        onClick={() => {
          if (minimized) {
            setMinimized(false);
          } else {
            handleCycle();
          }
        }}
      >
        <span className="char-3d-stage" aria-hidden="true">
          <span className="char-halo" />
          <span className="char-head">
            <span className="char-hair" />
            <span className="char-eyes">
              <i />
              <i />
            </span>
            <span className="char-smile" />
          </span>
          <span className="char-shoulders" />
        </span>
      </button>
    </aside>
  );
}
