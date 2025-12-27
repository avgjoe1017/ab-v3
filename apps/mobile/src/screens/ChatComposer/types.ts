/**
 * Chat Composer Types
 * Keep this tight so rendering stays predictable
 */

export type ChatRole = "user" | "assistant";

export type ChatMessageKind = "text" | "chips" | "card" | "loading";

export type ChipActionKind =
  | "setLength"
  | "setBrainLayer"
  | "generate"
  | "edit"
  | "audio"
  | "start"
  | "presetGoal"
  | "setVoice"
  | "setBackground";

export interface ChipAction {
  id: string;
  label: string;
  kind: ChipActionKind;
  payload?: unknown;
  /** Optional: mark as primary CTA (different styling) */
  primary?: boolean;
  /** Optional: icon name from MaterialIcons */
  icon?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  kind: ChatMessageKind;
  /** Text content for text/loading messages */
  text?: string;
  /** Chip actions for chips messages */
  chips?: ChipAction[];
  /** Card content for card messages */
  card?: {
    title: string;
    subtitle?: string;
    preview?: string[];
    actions?: ChipAction[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Card types for session ready state
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionReadyCard {
  affirmationCount: number;
  previewAffirmations: string[];
  voiceId: string;
  brainLayer: string;
  background: string;
}

