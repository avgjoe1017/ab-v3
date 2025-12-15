/**
 * Session Frequency Mapping
 * 
 * Phase 4.1: Maps session goalTag to appropriate binaural frequency and brainwave state
 * Based on roadmap specifications
 */

export interface FrequencyInfo {
    frequencyHz: number;
    brainwaveState: "Delta" | "Theta" | "Alpha" | "SMR" | "Beta";
    description: string;
}

/**
 * Map goalTag to frequency and brainwave state
 * Based on roadmap Phase 3.1 session specifications
 */
export function getFrequencyForGoalTag(goalTag: string | null | undefined): FrequencyInfo {
    if (!goalTag) {
        // Default to Alpha 10Hz (most common)
        return {
            frequencyHz: 10,
            brainwaveState: "Alpha",
            description: "Relaxed alertness, calm focus",
        };
    }

    const normalizedTag = goalTag.toLowerCase();

    // Map goalTag to frequency based on roadmap
    switch (normalizedTag) {
        case "wake-up":
        case "coffee-replacement":
            return {
                frequencyHz: 17, // Beta Low (14-20 Hz range)
                brainwaveState: "Beta",
                description: "Wake up, alertness, energy",
            };

        case "meditate":
            return {
                frequencyHz: 7, // Theta (7-8 Hz)
                brainwaveState: "Theta",
                description: "Deep meditation, presence, awareness",
            };

        case "focus":
            return {
                frequencyHz: 13.5, // SMR (12-15 Hz)
                brainwaveState: "SMR",
                description: "Clarity, concentration, flow",
            };

        case "sleep":
            return {
                frequencyHz: 3, // Delta (2-4 Hz)
                brainwaveState: "Delta",
                description: "Deep sleep, release, rest",
            };

        case "pre-performance":
            return {
                frequencyHz: 12, // Alpha 12Hz (10-12 Hz)
                brainwaveState: "Alpha",
                description: "Confidence, readiness, calm",
            };

        case "anxiety":
        case "anxiety-relief":
            return {
                frequencyHz: 10, // Alpha 10Hz
                brainwaveState: "Alpha",
                description: "Safety, grounding, control",
            };

        case "creativity":
            return {
                frequencyHz: 7, // Theta-Alpha crossover (6-10 Hz)
                brainwaveState: "Theta",
                description: "Openness, curiosity, expression",
            };

        default:
            // Fallback to Alpha 10Hz
            return {
                frequencyHz: 10,
                brainwaveState: "Alpha",
                description: "Relaxed alertness, calm focus",
            };
    }
}

/**
 * Get human-readable frequency description
 */
export function getFrequencyDescription(frequencyHz: number, brainwaveState: string): string {
    return `${frequencyHz} Hz ${brainwaveState} waves`;
}

