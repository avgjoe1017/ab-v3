import { useColorScheme as useRNColorScheme } from "react-native";

/**
 * Hook to get the current color scheme (light/dark)
 * Compatible with bna-ui components
 */
export function useColorScheme(): "light" | "dark" {
  const scheme = useRNColorScheme();
  return scheme === "dark" ? "dark" : "light";
}

