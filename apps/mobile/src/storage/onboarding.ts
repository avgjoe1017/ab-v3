import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@ab/onboarding_complete";

export type OnboardingGoal = "sleep" | "focus" | "calm" | "confidence";
export type OnboardingVoice = "shimmer" | "onyx" | "nova" | "echo" | "fable" | "alloy";
export type DefaultBehavior = "quick-start" | "choose-each-time";

export interface OnboardingPreferences {
  goal?: OnboardingGoal;
  voice?: OnboardingVoice;
  defaultBehavior?: DefaultBehavior;
  completed: boolean;
}

/**
 * Check if onboarding has been completed
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return false;
    const prefs: OnboardingPreferences = JSON.parse(data);
    return prefs.completed === true;
  } catch (error) {
    console.error("[onboarding] Error checking completion:", error);
    return false;
  }
}

/**
 * Get onboarding preferences
 */
export async function getOnboardingPreferences(): Promise<OnboardingPreferences> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return { completed: false };
    return JSON.parse(data);
  } catch (error) {
    console.error("[onboarding] Error loading preferences:", error);
    return { completed: false };
  }
}

/**
 * Save onboarding preferences
 */
export async function saveOnboardingPreferences(prefs: Partial<OnboardingPreferences>): Promise<void> {
  try {
    const existing = await getOnboardingPreferences();
    const updated: OnboardingPreferences = {
      ...existing,
      ...prefs,
      completed: true, // Mark as completed when saving
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("[onboarding] Error saving preferences:", error);
  }
}

/**
 * Skip onboarding
 */
export async function skipOnboarding(): Promise<void> {
  await saveOnboardingPreferences({ completed: true });
}

