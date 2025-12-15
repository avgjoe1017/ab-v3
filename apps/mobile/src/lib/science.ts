import scienceContent from "./science-content.json";
import type { ScienceCardData } from "../components/ScienceCard";

export interface FrequencyExplanation {
  title: string;
  content: string;
  benefits: string[];
}

/**
 * Get all science cards
 */
export function getAllScienceCards(): ScienceCardData[] {
  return scienceContent.scienceCards;
}

/**
 * Get a random science card
 */
export function getRandomScienceCard(): ScienceCardData {
  const cards = getAllScienceCards();
  const randomIndex = Math.floor(Math.random() * cards.length);
  return cards[randomIndex];
}

/**
 * Get multiple random science cards (without duplicates)
 */
export function getRandomScienceCards(count: number): ScienceCardData[] {
  const cards = getAllScienceCards();
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, cards.length));
}

/**
 * Get science cards by category
 */
export function getScienceCardsByCategory(category: string): ScienceCardData[] {
  return getAllScienceCards().filter((card) => card.category === category);
}

/**
 * Get frequency explanation for a brainwave state
 */
export function getFrequencyExplanation(brainwaveState: string | null | undefined): FrequencyExplanation | null {
  if (!brainwaveState) return null;
  
  const explanations = scienceContent.frequencyExplanations as Record<string, FrequencyExplanation>;
  return explanations[brainwaveState] || null;
}

/**
 * Get "Why We Don't" content
 */
export function getWhyWeDontContent(): ScienceCardData[] {
  return (scienceContent as any).whyWeDont || [];
}

