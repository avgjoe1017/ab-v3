import { create } from "zustand";

export type AppMode = "guest" | "authed";

type AppModeState = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
};

export const useAppMode = create<AppModeState>((set) => ({
  mode: "guest",
  setMode: (mode) => set({ mode }),
}));
