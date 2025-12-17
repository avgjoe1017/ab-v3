/**
 * Authentication Utilities
 * 
 * Clerk integration for mobile app
 */

import React from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";

/**
 * Get Clerk publishable key from environment
 */
export function getClerkPublishableKey(): string | null {
  // Check expo config extra first (recommended for Expo)
  const expoExtra = (Constants.expoConfig?.extra as any) || {};
  if (expoExtra.CLERK_PUBLISHABLE_KEY) {
    return expoExtra.CLERK_PUBLISHABLE_KEY;
  }
  
  // Fallback to process.env
  return process.env.CLERK_PUBLISHABLE_KEY || null;
}

/**
 * Hook to get authentication token for API requests
 * 
 * Returns the Clerk session token to use in Authorization header
 */
export function useAuthToken(): string | null {
  const { getToken } = useClerkAuth();
  const [token, setToken] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    let mounted = true;
    getToken().then((t) => {
      if (mounted) setToken(t);
    }).catch(() => {
      if (mounted) setToken(null);
    });
    
    return () => {
      mounted = false;
    };
  }, [getToken]);
  
  return token;
}
