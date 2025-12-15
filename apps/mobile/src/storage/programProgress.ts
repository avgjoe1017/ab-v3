import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ProgramDayProgress {
  programId: string;
  day: number;
  completed: boolean;
  completedAt?: string; // ISO timestamp
}

const STORAGE_KEY = "@ab/program_progress";

/**
 * Get all program progress
 */
export async function getAllProgramProgress(): Promise<ProgramDayProgress[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("[programProgress] Error loading progress:", error);
    return [];
  }
}

/**
 * Get progress for a specific program
 */
export async function getProgramProgress(programId: string): Promise<ProgramDayProgress[]> {
  const all = await getAllProgramProgress();
  return all.filter(p => p.programId === programId);
}

/**
 * Mark a day as completed
 */
export async function markDayCompleted(programId: string, day: number): Promise<void> {
  const all = await getAllProgramProgress();
  const existing = all.find(p => p.programId === programId && p.day === day);
  
  if (existing) {
    existing.completed = true;
    existing.completedAt = new Date().toISOString();
  } else {
    all.push({
      programId,
      day,
      completed: true,
      completedAt: new Date().toISOString(),
    });
  }
  
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/**
 * Get the current day for a program (first incomplete day, or next day if all completed)
 */
export async function getCurrentDay(programId: string, totalDays: number): Promise<number> {
  const progress = await getProgramProgress(programId);
  const completedDays = progress
    .filter(p => p.completed)
    .map(p => p.day)
    .sort((a, b) => a - b);
  
  // Find first incomplete day
  for (let day = 1; day <= totalDays; day++) {
    if (!completedDays.includes(day)) {
      return day;
    }
  }
  
  // All days completed, return next day (could be used for "review")
  return totalDays;
}

/**
 * Check if a day is completed
 */
export async function isDayCompleted(programId: string, day: number): Promise<boolean> {
  const progress = await getProgramProgress(programId);
  return progress.some(p => p.programId === programId && p.day === day && p.completed);
}

/**
 * Get completion percentage for a program
 */
export async function getProgramCompletion(programId: string, totalDays: number): Promise<number> {
  const progress = await getProgramProgress(programId);
  const completedCount = progress.filter(p => p.completed).length;
  return Math.min(100, Math.round((completedCount / totalDays) * 100));
}

