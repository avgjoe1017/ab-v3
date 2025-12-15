import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@ab/saved_sessions";

/**
 * Get all saved session IDs
 */
export async function getSavedSessions(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("[savedSessions] Error loading saved sessions:", error);
    return [];
  }
}

/**
 * Check if a session is saved
 */
export async function isSessionSaved(sessionId: string): Promise<boolean> {
  const saved = await getSavedSessions();
  return saved.includes(sessionId);
}

/**
 * Save a session
 */
export async function saveSession(sessionId: string): Promise<void> {
  const saved = await getSavedSessions();
  if (!saved.includes(sessionId)) {
    saved.push(sessionId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }
}

/**
 * Unsave a session
 */
export async function unsaveSession(sessionId: string): Promise<void> {
  const saved = await getSavedSessions();
  const filtered = saved.filter(id => id !== sessionId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Toggle saved state of a session
 */
export async function toggleSavedSession(sessionId: string): Promise<boolean> {
  const isSaved = await isSessionSaved(sessionId);
  if (isSaved) {
    await unsaveSession(sessionId);
    return false;
  } else {
    await saveSession(sessionId);
    return true;
  }
}

