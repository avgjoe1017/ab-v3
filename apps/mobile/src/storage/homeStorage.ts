import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  LAST_SESSION: "@ab/home/last_session",
  RECENT_INTENTIONS: "@ab/home/recent_intentions",
  USER_DEFAULTS: "@ab/home/user_defaults",
};

export interface LastSession {
  id: string;
  createdAt: string; // ISO timestamp
  durationSec: number;
  voiceId: string;
  voiceDisplayName?: string;
  beatPresetId?: string;
  beatDisplayName?: string;
  backgroundPresetId?: string;
  backgroundDisplayName?: string;
  pacePresetId?: string;
  paceDisplayName?: string;
  affirmationSource: {
    type: "quick_generate" | "custom_session" | "library";
    intentionText?: string;
  };
}

export interface RecentIntention {
  id: string;
  text: string;
  lastUsedAt: string; // ISO timestamp
}

export interface UserDefaults {
  defaultDuration?: number;
  defaultVoiceId?: string;
  defaultBeatPresetId?: string;
  defaultBackgroundPresetId?: string;
}

/**
 * Normalize intention text for comparison (trim, collapse spaces, lowercase)
 */
function normalizeIntention(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Get last session
 */
export async function getLastSession(): Promise<LastSession | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error("[homeStorage] Error loading last session:", error);
    return null;
  }
}

/**
 * Save last session
 */
export async function saveLastSession(session: LastSession): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SESSION, JSON.stringify(session));
  } catch (error) {
    console.error("[homeStorage] Error saving last session:", error);
  }
}

/**
 * Clear last session
 */
export async function clearLastSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SESSION);
}

/**
 * Get recent intentions (up to 10)
 */
export async function getRecentIntentions(): Promise<RecentIntention[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_INTENTIONS);
    if (!data) return [];
    const intentions: RecentIntention[] = JSON.parse(data);
    // Sort by lastUsedAt descending (most recent first)
    return intentions.sort(
      (a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
    );
  } catch (error) {
    console.error("[homeStorage] Error loading recent intentions:", error);
    return [];
  }
}

/**
 * Add or update a recent intention
 */
export async function upsertRecentIntention(text: string): Promise<void> {
  try {
    const normalized = normalizeIntention(text);
    if (!normalized) return;

    const existing = await getRecentIntentions();
    
    // Remove if already exists (case-insensitive match)
    const filtered = existing.filter(
      (intention) => normalizeIntention(intention.text) !== normalized
    );

    // Add/update to top
    filtered.unshift({
      id: Date.now().toString(),
      text: text.trim(), // Store original text, not normalized
      lastUsedAt: new Date().toISOString(),
    });

    // Keep only last 10
    const trimmed = filtered.slice(0, 10);

    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_INTENTIONS, JSON.stringify(trimmed));
  } catch (error) {
    console.error("[homeStorage] Error upserting recent intention:", error);
  }
}

/**
 * Delete a recent intention
 */
export async function deleteRecentIntention(id: string): Promise<void> {
  try {
    const existing = await getRecentIntentions();
    const filtered = existing.filter((intention) => intention.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_INTENTIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error("[homeStorage] Error deleting recent intention:", error);
  }
}

/**
 * Get user defaults
 */
export async function getUserDefaults(): Promise<UserDefaults> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DEFAULTS);
    if (!data) return {};
    return JSON.parse(data);
  } catch (error) {
    console.error("[homeStorage] Error loading user defaults:", error);
    return {};
  }
}

/**
 * Save user defaults
 */
export async function saveUserDefaults(defaults: Partial<UserDefaults>): Promise<void> {
  try {
    const existing = await getUserDefaults();
    const updated = { ...existing, ...defaults };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DEFAULTS, JSON.stringify(updated));
  } catch (error) {
    console.error("[homeStorage] Error saving user defaults:", error);
  }
}

