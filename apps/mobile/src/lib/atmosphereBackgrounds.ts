/**
 * Adaptive Atmosphere Backgrounds
 * Provides background colors and gradients based on brainwave state or time of day
 */

export type BrainwaveState = "Delta" | "Alpha" | "Beta" | "Theta" | "Gamma";

export interface AtmosphereConfig {
  colors: string[];
  description: string;
  microTexture?: "stars" | "breathing" | "energy";
}

/**
 * Get atmosphere configuration based on brainwave state
 */
export function getAtmosphereForBrainwave(
  brainwaveState?: BrainwaveState | string | null
): AtmosphereConfig {
  const state = brainwaveState?.toLowerCase();

  switch (state) {
    case "delta":
      return {
        colors: ["#0a0e27", "#1a1f3a", "#2d1b4e"], // Deep Midnight Blue
        description: "Deep Sleep",
        microTexture: "stars",
      };
    case "alpha":
      return {
        colors: ["#0f2e1f", "#1a4a2f", "#2d5f3f"], // Soft Forest Green
        description: "Relaxed Focus",
        microTexture: "breathing",
      };
    case "beta":
      return {
        colors: ["#4a2c0a", "#6b3f0f", "#8b5a1f"], // Sunset Orange
        description: "Active Energy",
        microTexture: "energy",
      };
    case "theta":
      return {
        colors: ["#1a1f3a", "#2d2b4e", "#3d3a6b"], // Deep Purple-Blue
        description: "Deep Meditation",
        microTexture: "breathing",
      };
    case "gamma":
      return {
        colors: ["#3a2a0f", "#5a4a1f", "#7a6a2f"], // Vibrant Gold
        description: "High Energy",
        microTexture: "energy",
      };
    default:
      // Default: Alpha-like (balanced)
      return {
        colors: ["#0f172a", "#1e1b4b", "#2e1065"], // Current default gradient
        description: "Balanced",
        microTexture: "breathing",
      };
  }
}

/**
 * Get atmosphere configuration based on time of day
 */
export function getAtmosphereForTimeOfDay(): AtmosphereConfig {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    // Morning - Alpha-like (soft focus)
    return {
      colors: ["#0f2e1f", "#1a4a2f", "#2d5f3f"],
      description: "Morning",
      microTexture: "breathing",
    };
  } else if (hour >= 12 && hour < 18) {
    // Afternoon - Beta-like (active)
    return {
      colors: ["#4a2c0a", "#6b3f0f", "#8b5a1f"],
      description: "Afternoon",
      microTexture: "energy",
    };
  } else if (hour >= 18 && hour < 22) {
    // Evening - Theta-like (winding down)
    return {
      colors: ["#1a1f3a", "#2d2b4e", "#3d3a6b"],
      description: "Evening",
      microTexture: "breathing",
    };
  } else {
    // Night - Delta-like (deep rest)
    return {
      colors: ["#0a0e27", "#1a1f3a", "#2d1b4e"],
      description: "Night",
      microTexture: "stars",
    };
  }
}

