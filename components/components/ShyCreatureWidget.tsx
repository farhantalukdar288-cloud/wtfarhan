"use client";

import React, { useState } from "react";

export default function ShyCreatureWidget() {
  // Position in percentages so it always stays safely inside mobile screens
  const [spot, setSpot] = useState({ left: 16, top: 72 });
  const [dodgeCount, setDodgeCount] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const safeSpots = [
    { left: 14, top: 18 },
    { left: 48, top: 34 },
    { left: 18, top: 58 },
    { left: 44, top: 76 },
  ];

  const moveAwayOnTouch = (e: React.SyntheticEvent) => {
    if (revealed || dodgeCount >= 3) return;

    // Prevent accidental double trigger on touch devices
    e.preventDefault();
    e.stopPropagation();

    const nextIndex = (dodgeCount + 1) % safeSpots.length;
    setSpot(safeSpots[nextIndex]);
    setDodgeCount((prev) => prev + 1);
  };

  const handleOpen = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setRevealed(true);
  };

  const handleReset = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setRevealed(false);
    setDodgeCount(0);
    setSpot({ left: 16, top: 72 });
  };

  return (
    <div
      style={{
        position: "fixed",
        left: `${spot.left}%`,
        top: `${spot.top}%`,
        zIndex: 9999,
        maxWidth: "calc(100vw - 32px)",
        transition:
          "left 0.24s cubic-bezier(0.22, 1, 0.36, 1), top 0.24s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {!revealed ? (
        <button
          type="button"
          onPointerDown={dodgeCount < 3 ? moveAwayOnTouch : handleOpen}
          onClick={dodgeCount >= 3 ? handleOpen : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 18px",
            borderRadius: "999px",
            background: "rgba(14, 23, 18, 0.94)",
            border: "1px solid rgba(214, 184, 122, 0.6)",
            color: "#eef1ec",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.6)",
            fontSize: "14px",
            lineHeight: 1.2,
            touchAction: "manipulation",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              flexShrink: 0,
              background: dodgeCount >= 3 ? "#9fb86c" : "#d6b87a",
              boxShadow: "0 0 12px rgba(214, 184, 122, 0.85)",
            }}
          />
          <span>
            {dodgeCount < 3
              ? `Tap me (${3 - dodgeCount} left)`
              : "Caught! Tap to open"}
          </span>
        </button>
      ) : (
        <div
          style={{
            width: "min(290px, calc(100vw - 32px))",
            padding: "18px",
            borderRadius: "20px",
            background: "rgba(14, 23, 18, 0.97)",
            border: "1px solid #d6b87a",
            color: "#eef1ec",
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.7)",
          }}
        >
          <div
            style={{
              color: "#d6b87a",
              fontWeight: 600,
              fontSize: "15px",
              marginBottom: "6px",
            }}
          >
            Farhan&apos;s Secret Spot
          </div>
          <p
            style={{
              margin: "0 0 14px 0",
              fontSize: "13px",
              color: "#c5cec6",
              lineHeight: 1.5,
            }}
          >
            You chased it down on mobile—welcome to the hidden corner of the pine dark.
          </p>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: "8px 14px",
              borderRadius: "12px",
              background: "rgba(159, 184, 108, 0.18)",
              border: "1px solid rgba(159, 184, 108, 0.5)",
              color: "#9fb86c",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Hide again
          </button>
        </div>
      )}
    </div>
  );
}
