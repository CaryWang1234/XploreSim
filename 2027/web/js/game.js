// The 2027 game pack: the one file that changes when the game is published.
//
// The console shell, the build, the deploy and every guard read this object. Filling it in
// updates the page without touching the shell, which is the whole point of shipping the
// placeholder before kickoff. Values marked `placeholder: true` are scaffolding, not rules:
// the contract in game-contract.js refuses to call the pack live while any of them remain.

export const GAME = {
  status: 'tba', // 'tba' until the manual exists, 'draft' while transcribing, 'live' when shipped
  season: 2027,
  name: 'TBA',
  edition: '2027 FIRST Robotics Competition',
  manual: {
    title: '2027 Game Manual',
    version: 'not published',
    source: null, // path or URL of the PDF the constants are transcribed from
  },

  // The shell takes its accent from here, so the season colour is a pack value, not CSS.
  theme: {
    accent: '#8b9bb4',
    accentDim: '#3a414b',
  },

  // Nouns the shell prints. Change these instead of editing the page copy.
  labels: {
    piece: 'GAME PIECE',
    goal: 'GOAL',
    home: 'ALLIANCE ZONE',
    neutral: 'NEUTRAL ZONE',
    endgame: 'END GAME',
  },

  clock: {
    matchSec: 160,
  },

  // Phases are ordered. `kind` is what the scoring table keys on: several TELEOP phases may
  // share one kind, and each phase still gets its own row on the timeline.
  phases: [
    { key: 'auto', kind: 'auto', label: 'AUTO', sec: 20, placeholder: true },
    { key: 'teleop', kind: 'teleop', label: 'TELEOP', sec: 110, placeholder: true },
    { key: 'endgame', kind: 'endgame', label: 'END GAME', sec: 30, placeholder: true },
  ],

  // Every way a MATCH can put points on the board. `points` is keyed by phase kind. A kind
  // that is absent from the map scores nothing, which is how END GAME-only actions are read.
  actions: [
    {
      key: 'score',
      label: 'Score a GAME PIECE',
      points: { auto: 1, teleop: 1, endgame: 1 },
      placeholder: true,
    },
    {
      key: 'climb',
      label: 'Climb at match end',
      points: { endgame: 15 },
      placeholder: true,
    },
  ],

  rp: [
    { key: 'win', label: 'Win', value: 3, placeholder: true },
    { key: 'tie', label: 'Tie', value: 1, placeholder: true },
  ],

  // Each entry is a manual clause the engine implements. `engine` names the function or
  // state that carries it, so the Rule sources tab stays an audit trail rather than a copy
  // of the manual. At least one entry is required before status can become 'live'.
  rules: [],

  // Field envelope in inches, the manual's authoritative unit (2026 §1.6; keep the same
  // convention). Null while the game is unpublished.
  field: {
    lengthIn: null,
    widthIn: null,
    placeholder: true,
  },
};
