/**
 * Program types for the Programs feature
 */

export interface Program {
  id: string;
  title: string;
  description: string;
  totalDays: number;
  goalTag?: string;
  days: ProgramDay[];
}

export interface ProgramDay {
  day: number;
  sessionId: string;
  sessionTitle: string;
  description?: string;
}

// Placeholder programs - these should be replaced with real programs from the API
export const PLACEHOLDER_PROGRAMS: Program[] = [
  {
    id: "calm-inner-noise",
    title: "Calm the Inner Noise",
    description: "A 7-day journey to quiet your mind and find peace",
    totalDays: 7,
    goalTag: "calm",
    days: [
      { day: 1, sessionId: "day1-session", sessionTitle: "Day 1: Finding Stillness" },
      { day: 2, sessionId: "day2-session", sessionTitle: "Day 2: Letting Go" },
      { day: 3, sessionId: "day3-session", sessionTitle: "Day 3: Present Moment" },
      { day: 4, sessionId: "day4-session", sessionTitle: "Day 4: Inner Peace" },
      { day: 5, sessionId: "day5-session", sessionTitle: "Day 5: Deep Calm" },
      { day: 6, sessionId: "day6-session", sessionTitle: "Day 6: Quiet Mind" },
      { day: 7, sessionId: "day7-session", sessionTitle: "Day 7: Complete Rest" },
    ],
  },
  {
    id: "confidence-rewire",
    title: "Confidence Rewire",
    description: "10 days to build unshakeable self-confidence",
    totalDays: 10,
    goalTag: "confidence",
    days: Array.from({ length: 10 }, (_, i) => ({
      day: i + 1,
      sessionId: `confidence-day-${i + 1}`,
      sessionTitle: `Day ${i + 1}: Building Confidence`,
    })),
  },
  {
    id: "sleep-switch",
    title: "Sleep Switch",
    description: "7 nights to transform your sleep",
    totalDays: 7,
    goalTag: "sleep",
    days: Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      sessionId: `sleep-day-${i + 1}`,
      sessionTitle: `Night ${i + 1}: Deep Sleep`,
    })),
  },
];

