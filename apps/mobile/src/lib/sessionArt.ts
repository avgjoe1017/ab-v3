/**
 * Session Art Utility
 * Provides gradient configurations for session art (instead of placeholder images)
 * Uses the DuotoneCard palette system for consistency
 */

import { MaterialIcons } from "@expo/vector-icons";

// Mesh-style gradient palettes - softer, multi-point blends (Apple-inspired)
// Each palette uses 3-4 colors with intermediate stops for organic, mesh-like transitions
export const SESSION_GRADIENTS = {
  lavender: {
    colors: ["#c8b8e8", "#b8a8d8", "#a090c0", "#9888b8"] as [string, string, string, string],
    locations: [0, 0.3, 0.7, 1] as [number, number, number, number],
    iconColor: "#d8c8f0",
  },
  sage: {
    colors: ["#a0c8b8", "#90b8a8", "#78a090", "#88a098"] as [string, string, string, string],
    locations: [0, 0.35, 0.7, 1] as [number, number, number, number],
    iconColor: "#b8dcd0",
  },
  sky: {
    colors: ["#a0b8d8", "#90a8c8", "#7890b0", "#8098b8"] as [string, string, string, string],
    locations: [0, 0.3, 0.75, 1] as [number, number, number, number],
    iconColor: "#b8d0f0",
  },
  rose: {
    colors: ["#d8b0c0", "#c8a0b0", "#b08898", "#b890a0"] as [string, string, string, string],
    locations: [0, 0.35, 0.7, 1] as [number, number, number, number],
    iconColor: "#e8c8d8",
  },
  honey: {
    colors: ["#e8d0a0", "#d8c090", "#c8a870", "#d0b080"] as [string, string, string, string],
    locations: [0, 0.3, 0.75, 1] as [number, number, number, number],
    iconColor: "#f0e0b8",
  },
  twilight: {
    colors: ["#9888b8", "#8878a8", "#706090", "#786898"] as [string, string, string, string],
    locations: [0, 0.35, 0.7, 1] as [number, number, number, number],
    iconColor: "#b0a0c8",
  },
  mist: {
    colors: ["#b8b0c8", "#a8a0b8", "#9088a0", "#9890a8"] as [string, string, string, string],
    locations: [0, 0.3, 0.75, 1] as [number, number, number, number],
    iconColor: "#c8c0d8",
  },
} as const;

export type SessionGradientPalette = keyof typeof SESSION_GRADIENTS;

// Map goal tags to gradients
const GOAL_TAG_GRADIENTS: Record<string, SessionGradientPalette> = {
  sleep: "twilight",
  focus: "lavender",
  calm: "sage",
  confidence: "honey",
  anxiety: "sky",
  resilience: "rose",
  productivity: "lavender",
  beginner: "mist",
  relaxation: "sage",
  energy: "honey",
};

// Primary icons for each goal tag
const GOAL_TAG_PRIMARY_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  sleep: "bedtime",
  focus: "psychology",
  calm: "self-improvement",
  confidence: "bolt",
  anxiety: "spa",
  resilience: "fitness-center",
  productivity: "trending-up",
  beginner: "auto-awesome",
  relaxation: "waves",
  energy: "flash-on",
};

// Fallback icons per goal tag (for when primary is already used)
const GOAL_TAG_FALLBACK_ICONS: Record<string, (keyof typeof MaterialIcons.glyphMap)[]> = {
  sleep: ["nights-stay", "dark-mode", "airline-seat-flat", "snooze"],
  focus: ["center-focus-strong", "lightbulb", "remove-red-eye", "visibility"],
  calm: ["park", "nature", "water-drop", "air"],
  confidence: ["star", "emoji-events", "workspace-premium", "military-tech"],
  anxiety: ["healing", "favorite", "sentiment-satisfied", "mood"],
  resilience: ["shield", "security", "verified", "thumb-up"],
  productivity: ["schedule", "task-alt", "checklist", "assignment-turned-in"],
  beginner: ["explore", "wb-sunny", "tips-and-updates", "lightbulb-outline"],
  relaxation: ["beach-access", "hot-tub", "weekend", "local-cafe"],
  energy: ["electric-bolt", "battery-charging-full", "whatshot", "local-fire-department"],
};

// All palettes for rotation
const ALL_PALETTES: SessionGradientPalette[] = [
  "lavender", "sage", "sky", "rose", "honey", "twilight", "mist"
];

// Large pool of decorative icons (30+) for variety
const DECORATIVE_ICON_POOL: (keyof typeof MaterialIcons.glyphMap)[] = [
  // Nature & Wellness
  "self-improvement", "spa", "waves", "park", "nature", "water-drop",
  // Mind & Focus
  "psychology", "lightbulb", "visibility", "center-focus-strong",
  // Energy & Action
  "bolt", "flash-on", "electric-bolt", "whatshot", "trending-up",
  // Rest & Calm
  "bedtime", "nights-stay", "dark-mode", "snooze", "airline-seat-flat",
  // Achievement
  "auto-awesome", "stars", "star", "emoji-events", "workspace-premium",
  // Health
  "favorite", "healing", "fitness-center", "mood", "sentiment-satisfied",
  // Misc Decorative
  "wb-sunny", "brightness-5", "flare", "blur-on", "grain",
  "bubble-chart", "scatter-plot", "hexagon", "category", "extension",
];

/**
 * Simple hash function for consistent selection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Get gradient configuration for a session based on its ID and goal tag
 */
export function getSessionGradient(
  sessionId: string | null | undefined,
  goalTag?: string | null
): {
  palette: SessionGradientPalette;
  colors: [string, string, string, string];
  locations: [number, number, number, number];
  iconColor: string;
  icon: keyof typeof MaterialIcons.glyphMap;
} {
  // If we have a goal tag, use it to determine the gradient and primary icon
  if (goalTag) {
    const normalizedTag = goalTag.toLowerCase().replace(/[-_]/g, "");
    const palette = GOAL_TAG_GRADIENTS[normalizedTag] || "mist";
    const icon = GOAL_TAG_PRIMARY_ICONS[normalizedTag] || "auto-awesome";
    return {
      palette,
      ...SESSION_GRADIENTS[palette],
      icon,
    };
  }

  // Otherwise, use session ID to consistently pick a palette and icon
  if (!sessionId) {
    return {
      palette: "mist",
      ...SESSION_GRADIENTS.mist,
      icon: "auto-awesome",
    };
  }

  const hash = hashString(sessionId);
  const paletteIndex = hash % ALL_PALETTES.length;
  const iconIndex = (hash >> 4) % DECORATIVE_ICON_POOL.length;
  const palette = ALL_PALETTES[paletteIndex]!;
  
  return {
    palette,
    ...SESSION_GRADIENTS[palette],
    icon: DECORATIVE_ICON_POOL[iconIndex]!,
  };
}

/**
 * Get unique icons for a list of sessions (avoids duplicates on same page)
 * @param sessions - Array of session objects with id and optional goalTag
 * @returns Map of sessionId to gradient config with unique icons
 */
export function getUniqueSessionGradients<T extends { id: string; goalTag?: string | null }>(
  sessions: T[]
): Map<string, ReturnType<typeof getSessionGradient>> {
  const result = new Map<string, ReturnType<typeof getSessionGradient>>();
  const usedIcons = new Set<keyof typeof MaterialIcons.glyphMap>();

  for (const session of sessions) {
    const normalizedTag = session.goalTag?.toLowerCase().replace(/[-_]/g, "") || "";
    const palette = GOAL_TAG_GRADIENTS[normalizedTag] || 
      ALL_PALETTES[hashString(session.id) % ALL_PALETTES.length]!;
    
    // Try primary icon first
    let icon: keyof typeof MaterialIcons.glyphMap;
    const primaryIcon = GOAL_TAG_PRIMARY_ICONS[normalizedTag];
    
    if (primaryIcon && !usedIcons.has(primaryIcon)) {
      icon = primaryIcon;
    } else {
      // Try fallbacks for this goal tag
      const fallbacks = GOAL_TAG_FALLBACK_ICONS[normalizedTag] || [];
      const availableFallback = fallbacks.find(fb => !usedIcons.has(fb));
      
      if (availableFallback) {
        icon = availableFallback;
      } else {
        // Fall back to decorative pool based on hash, avoiding used icons
        const hash = hashString(session.id);
        let attempts = 0;
        let candidateIndex = hash % DECORATIVE_ICON_POOL.length;
        
        while (usedIcons.has(DECORATIVE_ICON_POOL[candidateIndex]!) && attempts < DECORATIVE_ICON_POOL.length) {
          candidateIndex = (candidateIndex + 1) % DECORATIVE_ICON_POOL.length;
          attempts++;
        }
        
        icon = DECORATIVE_ICON_POOL[candidateIndex]!;
      }
    }
    
    usedIcons.add(icon);
    
    result.set(session.id, {
      palette,
      ...SESSION_GRADIENTS[palette],
      icon,
    });
  }

  return result;
}

/**
 * Get gradient for player screen background (deeper, more muted version)
 */
export function getPlayerBackgroundGradient(
  sessionId: string | null | undefined,
  goalTag?: string | null
): [string, string, string] {
  const { palette } = getSessionGradient(sessionId, goalTag);
  
  // Return deeper versions for player background
  switch (palette) {
    case "lavender":
      return ["#3d3654", "#4a4070", "#352d4d"];
    case "sage":
      return ["#2d4038", "#3a5048", "#253530"];
    case "sky":
      return ["#2d3850", "#3a4868", "#253045"];
    case "rose":
      return ["#4a3540", "#583f4a", "#3d2d35"];
    case "honey":
      return ["#4a4030", "#584a38", "#3d3528"];
    case "twilight":
      return ["#2d2840", "#382f50", "#252035"];
    case "mist":
    default:
      return ["#3a3545", "#453f52", "#302b3a"];
  }
}
