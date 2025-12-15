import AsyncStorage from "@react-native-async-storage/async-storage";

export interface RecentSession {
  sessionId: string;
  playedAt: string; // ISO timestamp
  playedFor?: number; // milliseconds played
}

const STORAGE_KEY = "@ab/recent_sessions";
const MAX_RECENT_SESSIONS = 50; // Keep last 50 sessions

/**
 * Get recent sessions, most recent first
 */
export async function getRecentSessions(): Promise<RecentSession[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const sessions: RecentSession[] = JSON.parse(data);
    // Sort by playedAt descending (most recent first)
    return sessions.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
  } catch (error) {
    console.error("[recentSessions] Error loading recent sessions:", error);
    return [];
  }
}

/**
 * Add a session to recent (or update if already exists)
 */
export async function addRecentSession(sessionId: string, playedFor?: number): Promise<void> {
  try {
    const recent = await getRecentSessions();
    
    // Remove if already exists
    const filtered = recent.filter(s => s.sessionId !== sessionId);
    
    // Add to front
    filtered.unshift({
      sessionId,
      playedAt: new Date().toISOString(),
      playedFor,
    });
    
    // Keep only last MAX_RECENT_SESSIONS
    const trimmed = filtered.slice(0, MAX_RECENT_SESSIONS);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("[recentSessions] Error adding recent session:", error);
  }
}

/**
 * Clear all recent sessions
 */
export async function clearRecentSessions(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

