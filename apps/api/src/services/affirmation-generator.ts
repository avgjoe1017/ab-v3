/**
 * Affirmation Generation Service
 * Uses OpenAI to generate values-based, personalized affirmations
 * 
 * Phase 1.1: Core AI Pipeline
 */

export interface AffirmationGenerationRequest {
  values?: string[]; // User's core values (from onboarding)
  sessionType: string; // "Focus", "Sleep", "Meditate", etc.
  struggle?: string; // Optional: what user is working on
  count?: number; // Number of affirmations to generate (default: 4)
}

export interface AffirmationGenerationResponse {
  affirmations: string[];
  reasoning?: string; // Optional explanation of generation choices
}

/**
 * Generate personalized affirmations using OpenAI
 * 
 * Requirements (per roadmap):
 * - First-person statements ("I am..." not "You are...")
 * - Values-connected (not generic positivity)
 * - Present tense, believable stretch (not delusional)
 * - Appropriate for user's self-esteem level (avoid backfire effect)
 * - Each affirmation 8-15 words
 */
export async function generateAffirmations(
  request: AffirmationGenerationRequest
): Promise<AffirmationGenerationResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured. Add OPENAI_API_KEY to apps/api/.env");
  }

  const count = request.count ?? 4; // Default to 4 affirmations (3-6 range per roadmap)
  
  // Build prompt following roadmap structure
  const prompt = buildAffirmationPrompt(request, count);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Cost-effective, good quality
        messages: [
          {
            role: "system",
            content: "You are an expert in values-based affirmation generation. You create affirmations that are believable, connected to personal values, and avoid generic positivity. Your affirmations help people build genuine self-belief through repetition.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7, // Some creativity, but not too random
        max_tokens: 500, // Enough for 4-6 affirmations + reasoning
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    // Parse affirmations from response
    const affirmations = parseAffirmations(content);
    
    if (affirmations.length === 0) {
      throw new Error("Failed to parse affirmations from OpenAI response");
    }

    // Extract reasoning if present
    const reasoning = extractReasoning(content);

    return {
      affirmations,
      reasoning,
    };
  } catch (error) {
    console.error("[AffirmationGenerator] Error generating affirmations:", error);
    throw error;
  }
}

/**
 * Build the prompt for OpenAI following roadmap structure
 */
function buildAffirmationPrompt(
  request: AffirmationGenerationRequest,
  count: number
): string {
  const valuesText = request.values && request.values.length > 0
    ? `User's core values: ${request.values.join(", ")}`
    : "No specific values provided (use generic but meaningful affirmations)";

  const struggleText = request.struggle
    ? `User's current struggle/goal: ${request.struggle}`
    : "";

  return `Generate ${count} affirmations for a ${request.sessionType} session.

${valuesText}
${struggleText ? struggleText + "\n" : ""}
Requirements:
- First-person, present tense ("I am..." not "You are...")
${request.values && request.values.length > 0 ? "- Connected to at least one stated value\n" : ""}
- Believable stretch, not fantasy
- No generic positivity ("I am amazing" - too vague)
- Each affirmation 8-15 words
- Appropriate for meditation/affirmation practice (calm, grounding)
- Suitable for ${request.sessionType} context

Format your response as a numbered list of affirmations, one per line.
Example:
1. I am capable of handling whatever comes my way with calm and clarity.
2. I trust my ability to make decisions that align with my values.

${request.values && request.values.length > 0 ? "Make sure each affirmation connects to at least one of the user's stated values." : ""}`;
}

/**
 * Parse affirmations from OpenAI response
 * Handles various formats: numbered lists, bullet points, plain text
 */
function parseAffirmations(content: string): string[] {
  const affirmations: string[] = [];
  
  // Try numbered list format (1. ... 2. ...)
  const numberedMatches = content.match(/^\d+\.\s+(.+)$/gm);
  if (numberedMatches) {
    for (const match of numberedMatches) {
      const text = match.replace(/^\d+\.\s+/, "").trim();
      if (text && text.length > 0) {
        affirmations.push(text);
      }
    }
    if (affirmations.length > 0) {
      return affirmations;
    }
  }

  // Try bullet point format (- ... or • ...)
  const bulletMatches = content.match(/^[-•]\s+(.+)$/gm);
  if (bulletMatches) {
    for (const match of bulletMatches) {
      const text = match.replace(/^[-•]\s+/, "").trim();
      if (text && text.length > 0) {
        affirmations.push(text);
      }
    }
    if (affirmations.length > 0) {
      return affirmations;
    }
  }

  // Try line-by-line (non-empty lines that look like affirmations)
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, markdown headers, and reasoning sections
    if (
      trimmed.length > 0 &&
      !trimmed.startsWith("#") &&
      !trimmed.toLowerCase().includes("reasoning") &&
      !trimmed.toLowerCase().includes("explanation") &&
      trimmed.length >= 20 && // Minimum length for a real affirmation
      trimmed.length <= 150 // Maximum reasonable length
    ) {
      // Remove any leading numbers/bullets that weren't caught
      const cleaned = trimmed.replace(/^[\d\-•].+\s+/, "").trim();
      if (cleaned.length > 0) {
        affirmations.push(cleaned);
      }
    }
  }

  return affirmations;
}

/**
 * Extract reasoning/explanation from response if present
 */
function extractReasoning(content: string): string | undefined {
  // Look for reasoning sections
  const reasoningMatch = content.match(
    /(?:reasoning|explanation)[:\s]+(.+?)(?:\n\n|\n\d+\.|$)/is
  );
  
  if (reasoningMatch && reasoningMatch[1]) {
    return reasoningMatch[1].trim();
  }

  return undefined;
}

