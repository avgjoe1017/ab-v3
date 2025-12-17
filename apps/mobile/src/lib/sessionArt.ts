/**
 * Session Art Utility
 * Provides placeholder images for session art (album covers and backgrounds)
 */

// Import placeholder images
const placeholderImages = [
  require("../../../assets/images/1.jpg"),
  require("../../../assets/images/1_Untitled design.jpg"),
  require("../../../assets/images/2_Untitled design.jpg"),
  require("../../../assets/images/3_Untitled design.jpg"),
  require("../../../assets/images/5_Untitled design.jpg"),
  require("../../../assets/images/6_Untitled design.jpg"),
  require("../../../assets/images/7_Untitled design.jpg"),
  require("../../../assets/images/Untitled design.jpg"),
  require("../../../assets/images/Untitled design (1).jpg"),
  require("../../../assets/images/Untitled design (2).jpg"),
  require("../../../assets/images/Untitled design (3).jpg"),
  require("../../../assets/images/Untitled design (4).jpg"),
  require("../../../assets/images/Untitled design (5).jpg"),
];

/**
 * Get a placeholder image for a session based on its ID
 * Uses a simple hash function to consistently return the same image for the same session ID
 */
export function getSessionArtImage(sessionId: string | null | undefined) {
  if (!sessionId) {
    return placeholderImages[0];
  }

  // Simple hash function to convert sessionId to index
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    const char = sessionId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % placeholderImages.length;
  return placeholderImages[index];
}

/**
 * Get all placeholder images (useful for testing or fallback)
 */
export function getAllPlaceholderImages() {
  return placeholderImages;
}

