// Player-count and phase-timer configuration, centralized here (see ROADMAP §3).
// Player counts follow the INSIDER.md design doc.
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;

// Phase durations in ms.
export const TIMERS = {
    SETUP: 10000,
    GUESSING: 18000,
    REVEAL: 5000,
    VOTE: 18000,
    TIE_BREAK: 15000,
};
