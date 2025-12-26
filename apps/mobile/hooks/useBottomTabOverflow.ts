import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Hook to get bottom tab bar overflow (for parallax scrollview)
 * Returns the bottom safe area inset
 */
export function useBottomTabOverflow(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom;
}
