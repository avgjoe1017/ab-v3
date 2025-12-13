import { create } from "zustand";
import { type DraftSession } from "@ab/contracts";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

interface DraftState {
    draft: DraftSession | null;
    // Actions
    initializeDraft: () => void;
    updateDraft: (patch: Partial<DraftSession>) => void;
    addAffirmation: (text: string) => void;
    removeAffirmation: (index: number) => void;
    clearDraft: () => void;
}

const DEFAULT_DRAFT: Omit<DraftSession, "localDraftId"> = {
    title: "",
    goalTag: "General",
    affirmations: [],
    voiceId: "en-US-Standard-C",
    pace: "slow",
};

export const useDraftStore = create<DraftState>()(
    persist(
        (set, get) => ({
            draft: null,

            initializeDraft: () => {
                if (!get().draft) {
                    set({
                        draft: {
                            ...DEFAULT_DRAFT,
                            localDraftId: Crypto.randomUUID()
                        }
                    });
                }
            },

            updateDraft: (patch) =>
                set((state) => ({
                    draft: state.draft ? { ...state.draft, ...patch } : null,
                })),

            addAffirmation: (text) =>
                set((state) => ({
                    draft: state.draft
                        ? { ...state.draft, affirmations: [...state.draft.affirmations, text] }
                        : null,
                })),

            removeAffirmation: (index) =>
                set((state) => ({
                    draft: state.draft
                        ? {
                            ...state.draft,
                            affirmations: state.draft.affirmations.filter((_, i) => i !== index),
                        }
                        : null,
                })),

            clearDraft: () => set({ draft: null }),
        }),
        {
            name: "ab-v3-loop-draft-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
