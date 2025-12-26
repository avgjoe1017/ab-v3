/**
 * Authentication Utilities
 * 
 * Clerk integration for mobile app
 */

import React from "react";
import Constants from "expo-constants";

// Import Clerk hooks at module level (required for React hooks)
// We'll check context before using them
let clerkModule: typeof import("@clerk/clerk-expo") | null = null;
try {
  // Try to import Clerk - this will fail if not installed, but that's okay
  clerkModule = require("@clerk/clerk-expo");
} catch {
  // Clerk not available - that's fine for dev mode
  clerkModule = null;
}

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
 * Check if we should skip authentication (dev mode)
 */
export function shouldSkipAuth(): boolean {
  return __DEV__;
}

// Context to track if Clerk is available
const ClerkAvailableContext = React.createContext<boolean>(false);

/**
 * Provider to indicate whether Clerk is available
 * This allows us to safely use useAuthToken even when ClerkProvider is not present
 */
export function ClerkAvailableProvider({ 
  children, 
  available 
}: { 
  children: React.ReactNode; 
  available: boolean;
}) {
  return React.createElement(
    ClerkAvailableContext.Provider,
    { value: available },
    children
  );
}

/**
 * Hook to get authentication token for API requests
 * 
 * Returns the Clerk session token to use in Authorization header
 * Returns null if Clerk is not available (dev mode or not configured)
 * 
 * IMPORTANT: This hook is safe to call even when ClerkProvider is not present.
 * In dev mode, it will always return null without attempting to use Clerk hooks.
 * 
 * The context check ensures we only call Clerk hooks when ClerkProvider is present.
 */
export function useAuthToken(): string | null {
  const clerkAvailable = React.useContext(ClerkAvailableContext);
  
  // In dev mode, always return null (skip auth)
  // This check happens first to avoid any Clerk hook calls
  if (shouldSkipAuth()) {
    return null;
  }

  // If Clerk module is not available, return null
  if (!clerkModule) {
    return null;
  }

  // If our context says Clerk is not available, return null
  // This means we're not inside ClerkProvider, so don't call Clerk hooks
  if (!clerkAvailable) {
    return null;
  }

  // At this point, we know:
  // 1. Not in dev mode
  // 2. Clerk module is available
  // 3. Our context says we're inside ClerkProvider
  // So it's safe to call Clerk hooks
  const { useAuth: useClerkAuth } = clerkModule;
  const { getToken } = useClerkAuth();
  const [token, setToken] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    let mounted = true;
    getToken().then((t: string | null) => {
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
