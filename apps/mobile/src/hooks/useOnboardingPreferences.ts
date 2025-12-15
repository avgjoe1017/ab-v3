import { useQuery } from "@tanstack/react-query";
import { getOnboardingPreferences, type OnboardingPreferences } from "../storage/onboarding";

/**
 * Hook to get onboarding preferences
 */
export function useOnboardingPreferences() {
  return useQuery<OnboardingPreferences>({
    queryKey: ["onboarding-preferences"],
    queryFn: getOnboardingPreferences,
  });
}

