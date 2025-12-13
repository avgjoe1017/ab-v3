import Constants from "expo-constants";

// Prefer explicit .env; fall back to dev default.
export const API_BASE_URL =
  (process.env.API_BASE_URL as string | undefined) ??
  (Constants.expoConfig?.extra as any)?.API_BASE_URL ??
  "http://10.0.2.2:3000";
