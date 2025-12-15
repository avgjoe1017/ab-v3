import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Mix } from "@ab/audio-engine";

export interface MixPreset {
  id: string;
  name: string;
  mix: Mix;
  voiceId?: string;
  backgroundId?: string; // For future use
  binauralHz?: number; // For future use
  createdAt: string; // ISO timestamp
}

const STORAGE_KEY = "@ab/mix_presets";

/**
 * Get all mix presets
 */
export async function getMixPresets(): Promise<MixPreset[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const presets: MixPreset[] = JSON.parse(data);
    // Sort by creation date, newest first
    return presets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("[mixPresets] Error loading mix presets:", error);
    return [];
  }
}

/**
 * Save a mix preset
 */
export async function saveMixPreset(preset: Omit<MixPreset, "id" | "createdAt">): Promise<MixPreset> {
  const presets = await getMixPresets();
  const newPreset: MixPreset = {
    ...preset,
    id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  
  presets.unshift(newPreset); // Add to front
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  
  return newPreset;
}

/**
 * Delete a mix preset
 */
export async function deleteMixPreset(presetId: string): Promise<void> {
  const presets = await getMixPresets();
  const filtered = presets.filter(p => p.id !== presetId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Update a mix preset name
 */
export async function updateMixPresetName(presetId: string, newName: string): Promise<void> {
  const presets = await getMixPresets();
  const updated = presets.map(p => 
    p.id === presetId ? { ...p, name: newName } : p
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

