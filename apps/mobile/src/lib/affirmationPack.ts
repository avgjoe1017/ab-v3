/**
 * Affirmation Pack Model and "Decide for me" logic
 * Shared between Quick Generate and Guided paths
 */

import { randomUUID } from "expo-crypto";

export type AffirmationStyle = "grounded" | "confident" | "gentle" | "focus" | "balanced";

export type BrainLayerType = "binaural" | "solfeggio" | "off";

export type VoiceId = "alloy" | "shimmer" | "onyx" | "nova";

export interface AudioSettings {
  voiceId: VoiceId;
  brainLayerType: BrainLayerType;
  brainLayerPreset?: string; // e.g., "Calm" (10Hz), "Focus" (13.5Hz), solfeggio frequency
  backgroundId: string; // e.g., "Babbling Brook", "Forest Rain"
  mix: {
    affirmations: number;
    binaural: number;
    background: number;
  };
}

export interface AffirmationPack {
  goal: string;
  context?: string;
  affirmations: string[];
  style: AffirmationStyle;
  length: 6 | 12 | 18 | 24; // number of affirmations
  audioSettings: AudioSettings;
  createdAt?: string;
}

/**
 * "Decide for me" logic - Auto-select audio settings based on goal text
 */
export function decideAudioSettings(goal: string, userHistory?: { solfeggioFrequent?: boolean }): AudioSettings {
  const goalLower = goal.toLowerCase();

  // Voice selection
  let voiceId: VoiceId = "nova"; // Default: warm/neutral
  if (goalLower.includes("sleep") || goalLower.includes("rest") || goalLower.includes("calm")) {
    voiceId = "shimmer"; // Softer, slower voice for sleep
  }

  // Brain layer selection
  let brainLayerType: BrainLayerType = "binaural";
  let brainLayerPreset: string | undefined = "Calm"; // Default: 10Hz Alpha

  if (goalLower.includes("sleep") || goalLower.includes("rest") || goalLower.includes("calm") || goalLower.includes("anxiety")) {
    brainLayerType = "binaural";
    brainLayerPreset = "Calm"; // 10Hz Alpha for calm/sleep
  } else if (goalLower.includes("focus") || goalLower.includes("work") || goalLower.includes("concentration") || goalLower.includes("discipline")) {
    brainLayerType = "binaural";
    brainLayerPreset = "Focus"; // 13.5Hz SMR for focus
  } else if (userHistory?.solfeggioFrequent) {
    // If user often chooses Solfeggio, pick matching mood
    if (goalLower.includes("sleep") || goalLower.includes("calm")) {
      brainLayerType = "solfeggio";
      brainLayerPreset = "396"; // Solfeggio for liberation/fear
    } else {
      brainLayerType = "solfeggio";
      brainLayerPreset = "528"; // Solfeggio for transformation/love
    }
  }

  // Background selection
  let backgroundId = "Babbling Brook"; // Default: neutral
  if (goalLower.includes("night") || goalLower.includes("sleep") || goalLower.includes("rest")) {
    backgroundId = "Babbling Brook"; // Brown noise equivalent (calming)
  } else if (goalLower.includes("stress") || goalLower.includes("anxiety") || goalLower.includes("overwhelm")) {
    backgroundId = "Forest Rain"; // Rain is calming
  } else if (goalLower.includes("focus") || goalLower.includes("work") || goalLower.includes("concentration")) {
    backgroundId = "Babbling Brook"; // Neutral noise for focus
  }

  return {
    voiceId,
    brainLayerType,
    brainLayerPreset,
    backgroundId,
    mix: {
      affirmations: 1,
      binaural: brainLayerType === "binaural" ? 0.3 : 0,
      background: 0.3,
    },
  };
}

/**
 * Map brain layer preset to actual frequency/asset
 */
export function getBrainLayerAsset(preset: string, type: BrainLayerType): { hz?: number; solfeggio?: string } {
  if (type === "binaural") {
    const presetMap: Record<string, number> = {
      "Calm": 10, // Alpha 10Hz
      "Focus": 13.5, // SMR 13.5Hz
      "Sleep": 3, // Delta 3Hz
      "Energy": 20, // Beta 20Hz
    };
    return { hz: presetMap[preset] || 10 };
  } else if (type === "solfeggio") {
    return { solfeggio: preset }; // e.g., "396", "528"
  }
  return {};
}

/**
 * Generate a positive, encouraging session title based on goal and goalTag
 * @param usedTitles - Array of titles already used by this user (to avoid duplicates)
 */
export function generateSessionTitle(goal: string, goalTag?: string, usedTitles: string[] = []): string {
  const goalLower = goal.toLowerCase();
  
  // Helper function to get unused title from a list
  const getUnusedTitle = (titles: string[]): string | null => {
    const unused = titles.filter(t => !usedTitles.includes(t));
    if (unused.length === 0) {
      // All titles used, return null to use fallback
      return null;
    }
    return unused[Math.floor(Math.random() * unused.length)]!;
  };

  // If we have a goalTag, use it to generate context-appropriate titles
  if (goalTag) {
    const tagTitles: Record<string, string[]> = {
      "focus": [
        "Deep Focus & Clarity",
        "Peak Concentration",
        "Flow State Activation",
        "Laser-Sharp Focus",
        "Unstoppable Productivity",
        "Mental Clarity & Precision",
      ],
      "sleep": [
        "Peaceful Rest",
        "Deep Sleep Journey",
        "Restful Restoration",
        "Tranquil Slumber",
        "Calm & Restful",
        "Peaceful Night's Rest",
      ],
      "meditate": [
        "Mindful Presence",
        "Inner Peace & Stillness",
        "Present Moment Awareness",
        "Calm & Centered",
        "Deep Meditation",
        "Tranquil Mind",
      ],
      "anxiety-relief": [
        "Calm & Confident",
        "Peace & Serenity",
        "Anxiety Relief & Ease",
        "Inner Calm & Strength",
        "Worry-Free & Present",
        "Tranquil Confidence",
      ],
      "wake-up": [
        "Energized Morning",
        "Fresh Start & Clarity",
        "Morning Motivation",
        "Awakened & Ready",
        "Bright New Day",
        "Morning Energy Boost",
      ],
    };
    
    const titles = tagTitles[goalTag];
    if (titles && titles.length > 0) {
      const unusedTitle = getUnusedTitle(titles);
      if (unusedTitle) {
        return unusedTitle;
      }
      // All titles used for this tag, fall through to keyword-based generation
    }
  }
  
  // Fallback: Generate title based on goal text keywords
  if (goalLower.includes("focus") || goalLower.includes("concentrat") || goalLower.includes("work")) {
    const titles = [
      "Deep Focus & Clarity",
      "Peak Concentration",
      "Flow State Activation",
      "Laser-Sharp Focus",
    ];
    const unusedTitle = getUnusedTitle(titles);
    if (unusedTitle) return unusedTitle;
  }
  
  if (goalLower.includes("sleep") || goalLower.includes("rest") || goalLower.includes("night")) {
    const titles = [
      "Peaceful Rest",
      "Deep Sleep Journey",
      "Restful Restoration",
      "Tranquil Slumber",
    ];
    const unusedTitle = getUnusedTitle(titles);
    if (unusedTitle) return unusedTitle;
  }
  
  if (goalLower.includes("anxiety") || goalLower.includes("stress") || goalLower.includes("worry") || goalLower.includes("calm")) {
    const titles = [
      "Calm & Confident",
      "Peace & Serenity",
      "Anxiety Relief & Ease",
      "Inner Calm & Strength",
    ];
    const unusedTitle = getUnusedTitle(titles);
    if (unusedTitle) return unusedTitle;
  }
  
  if (goalLower.includes("meditat") || goalLower.includes("mindful") || goalLower.includes("present")) {
    const titles = [
      "Mindful Presence",
      "Inner Peace & Stillness",
      "Present Moment Awareness",
      "Calm & Centered",
    ];
    const unusedTitle = getUnusedTitle(titles);
    if (unusedTitle) return unusedTitle;
  }
  
  if (goalLower.includes("wake") || goalLower.includes("morning") || goalLower.includes("energ")) {
    const titles = [
      "Energized Morning",
      "Fresh Start & Clarity",
      "Morning Motivation",
      "Awakened & Ready",
    ];
    const unusedTitle = getUnusedTitle(titles);
    if (unusedTitle) return unusedTitle;
  }
  
  // Detect negative states and transform them into positive titles
  if (goalLower.includes("tired") || goalLower.includes("exhausted") || goalLower.includes("worn out")) {
    const titles = [
      "Rest & Renewal",
      "Peaceful Restoration",
      "Calm & Recharged",
      "Gentle Rest & Recovery",
      "Renewed Energy",
      "Restful Recovery",
    ];
    const unusedTitle = getUnusedTitle(titles);
    if (unusedTitle) return unusedTitle;
  }
  
  if (goalLower.includes("sad") || goalLower.includes("down") || goalLower.includes("depressed") || goalLower.includes("blue")) {
    const titles = [
      "Lift & Light",
      "Inner Strength & Hope",
      "Comfort & Healing",
      "Peace & Renewal",
      "Gentle Uplift",
      "Warmth & Support",
    ];
    const unusedTitle = getUnusedTitle(titles);
    if (unusedTitle) return unusedTitle;
  }
  
  if (goalLower.includes("unmotivated") || goalLower.includes("lazy") || goalLower.includes("stuck") || goalLower.includes("procrastinat")) {
    const titles = [
      "Momentum & Action",
      "Fresh Motivation",
      "Forward Movement",
      "Inspired Action",
      "Productive Energy",
      "Get Moving & Thrive",
    ];
    const unusedTitle = getUnusedTitle(titles);
    if (unusedTitle) return unusedTitle;
  }
  
  if (goalLower.includes("stressed") || goalLower.includes("overwhelmed") || goalLower.includes("pressure")) {
    const titles = [
      "Calm & Centered",
      "Peace & Clarity",
      "Release & Relief",
      "Tranquil Strength",
      "Ease & Balance",
      "Inner Calm",
    ];
    const unusedTitle = getUnusedTitle(titles);
    if (unusedTitle) return unusedTitle;
  }
  
  if (goalLower.includes("anxious") || goalLower.includes("worried") || goalLower.includes("nervous") || goalLower.includes("fear")) {
    const titles = [
      "Calm & Confident",
      "Peace & Serenity",
      "Anxiety Relief & Ease",
      "Inner Calm & Strength",
      "Worry-Free & Present",
      "Tranquil Confidence",
    ];
    const unusedTitle = getUnusedTitle(titles);
    if (unusedTitle) return unusedTitle;
  }
  
  // Default: Create a specific, encouraging title from the goal text
  // Extract meaningful keywords and create context-specific titles
  const goalWords = goal.trim().split(/\s+/).filter(w => w.length > 0);
  
  // Remove common stop words and negative words
  const stopWords = new Set(["i", "im", "i'm", "am", "is", "are", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "as", "be", "been", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "can", "this", "that", "these", "those", "my", "me", "we", "you", "your", "he", "she", "it", "they", "them", "need", "want", "get", "got", "go", "going", "about", "because", "of"]);
  const negativeWords = new Set(["tired", "sad", "exhausted", "unmotivated", "stuck", "stressed", "anxious", "worried", "down", "depressed", "lazy", "procrastinate", "overwhelmed", "pressure", "nervous", "fear", "afraid", "scared", "worried", "troubled", "difficult", "hard", "bad", "wrong", "fail", "failure", "can't", "cannot", "don't", "won't"]);
  
  // Extract meaningful keywords
  const keywords = goalWords
    .map(w => w.toLowerCase().replace(/[.,!?;:]/g, ""))
    .filter(w => !stopWords.has(w) && !negativeWords.has(w) && w.length > 2)
    .slice(0, 3); // Take up to 3 meaningful keywords
  
  // If we have keywords, create a specific title
  if (keywords.length > 0) {
    const keywordPhrase = keywords.join(" ");
    const capitalized = keywordPhrase.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    
    // Create specific titles based on keyword count
    if (keywords.length === 1) {
      const singleWordTitles = [
        `${capitalized} & Growth`,
        `${capitalized} & Confidence`,
        `${capitalized} & Strength`,
        `Empowered ${capitalized}`,
        `Confident ${capitalized}`,
      ];
      return singleWordTitles[Math.floor(Math.random() * singleWordTitles.length)]!;
    } else {
      // Multiple keywords - use them directly with positive framing
      const multiWordTitles = [
        `${capitalized} & Success`,
        `${capitalized} & Clarity`,
        `${capitalized} & Growth`,
        `Strong ${capitalized}`,
        `Confident ${capitalized}`,
      ];
      return multiWordTitles[Math.floor(Math.random() * multiWordTitles.length)]!;
    }
  }
  
  // If no keywords extracted, look for specific patterns in the goal
  if (goalLower.includes("confidence") || goalLower.includes("confident")) {
    return "Build Confidence & Strength";
  }
  if (goalLower.includes("energy") || goalLower.includes("energetic")) {
    return "Boost Energy & Vitality";
  }
  if (goalLower.includes("happiness") || goalLower.includes("happy") || goalLower.includes("joy")) {
    return "Cultivate Joy & Happiness";
  }
  if (goalLower.includes("success") || goalLower.includes("achieve") || goalLower.includes("accomplish")) {
    return "Achieve Success & Goals";
  }
  if (goalLower.includes("love") || goalLower.includes("relationship") || goalLower.includes("connection")) {
    return "Nurture Love & Connection";
  }
  if (goalLower.includes("health") || goalLower.includes("wellness") || goalLower.includes("heal")) {
    return "Health & Wellness Journey";
  }
  if (goalLower.includes("creativity") || goalLower.includes("creative") || goalLower.includes("create")) {
    return "Unleash Creativity & Inspiration";
  }
  if (goalLower.includes("courage") || goalLower.includes("brave") || goalLower.includes("fearless")) {
    return "Build Courage & Boldness";
  }
  if (goalLower.includes("gratitude") || goalLower.includes("grateful") || goalLower.includes("thankful")) {
    return "Cultivate Gratitude & Appreciation";
  }
  if (goalLower.includes("patience") || goalLower.includes("patient") || goalLower.includes("calm")) {
    return "Develop Patience & Calm";
  }
  
  // Final fallback: Use goal text directly but capitalize and clean it up
  const cleanedGoal = goal.trim()
    .replace(/^[iI]['']?m\s+/i, "") // Remove "I'm" prefix
    .replace(/^[iI]\s+/i, "") // Remove "I" prefix
    .replace(/^[aA]m\s+/i, "") // Remove "am" prefix
    .replace(/[.,!?;:]+$/, "") // Remove trailing punctuation
    .trim();
  
  if (cleanedGoal.length > 0 && cleanedGoal.length <= 40) {
    // Capitalize first letter
    return cleanedGoal.charAt(0).toUpperCase() + cleanedGoal.slice(1);
  }
  
  // Absolute last resort - but still specific
  const specificFallbacks = [
    "Your Journey Forward",
    "Steps Toward Growth",
    "Building Your Path",
    "Moving Forward",
    "Your Next Chapter",
  ];
  return specificFallbacks[Math.floor(Math.random() * specificFallbacks.length)]!;
}

/**
 * Convert AffirmationPack to session creation payload (DraftSession format)
 * @param usedTitles - Array of titles already used by this user (to avoid duplicates)
 */
export function packToSessionPayload(pack: AffirmationPack, usedTitles: string[] = []): {
  localDraftId: string;
  title: string;
  goalTag?: string;
  affirmations: string[];
  voiceId: string;
  pace: "slow";
  solfeggioHz?: number;
} {
  // Extract goal tag from goal text (simple keyword matching)
  let goalTag: string | undefined;
  const goalLower = pack.goal.toLowerCase();
  if (goalLower.includes("focus") || goalLower.includes("work") || goalLower.includes("concentration")) {
    goalTag = "focus";
  } else if (goalLower.includes("sleep") || goalLower.includes("rest")) {
    goalTag = "sleep";
  } else if (goalLower.includes("anxiety") || goalLower.includes("calm")) {
    goalTag = "anxiety-relief";
  } else if (goalLower.includes("meditate") || goalLower.includes("meditation")) {
    goalTag = "meditate";
  }

  // Generate a positive, encouraging title instead of using raw goal text
  const generatedTitle = generateSessionTitle(pack.goal, goalTag, usedTitles);

  // Build base payload
  const payload: {
    localDraftId: string;
    title: string;
    goalTag?: string;
    affirmations: string[];
    voiceId: string;
    pace: "slow";
    solfeggioHz?: number;
  } = {
    localDraftId: randomUUID(), // Generate a UUID for the draft
    title: generatedTitle,
    goalTag,
    affirmations: pack.affirmations,
    voiceId: pack.audioSettings.voiceId,
    pace: "slow", // Required by DraftSessionSchema
  };

  // Add solfeggioHz if using solfeggio brain layer
  if (pack.audioSettings.brainLayerType === "solfeggio" && pack.audioSettings.brainLayerPreset) {
    const hz = Number(pack.audioSettings.brainLayerPreset);
    if (!isNaN(hz) && hz > 0) {
      payload.solfeggioHz = hz;
    }
  }

  return payload;
}

