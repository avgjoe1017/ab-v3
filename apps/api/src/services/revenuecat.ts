/**
 * RevenueCat Integration
 * 
 * Phase 6.3: Check subscription status via RevenueCat API
 * 
 * To use:
 * 1. Get RevenueCat API key from dashboard
 * 2. Set environment variable:
 *    - REVENUECAT_API_KEY=...
 * 3. Install RevenueCat SDK in mobile app: pnpm add react-native-purchases
 * 4. Update getEntitlement() to check RevenueCat subscriptions
 */

export interface RevenueCatSubscription {
  plan: "free" | "pro";
  status: "active" | "expired" | "cancelled";
  expiresAt?: Date;
  source: "revenuecat";
}

/**
 * Check if RevenueCat is configured
 * 
 * @returns true if REVENUECAT_API_KEY is set
 */
export function isRevenueCatConfigured(): boolean {
  return !!process.env.REVENUECAT_API_KEY;
}

/**
 * Get subscription status from RevenueCat API
 * 
 * @param userId - User ID (Clerk user ID or RevenueCat app user ID)
 * @returns Subscription status or null if not configured/error
 */
export async function getRevenueCatSubscription(
  userId: string
): Promise<RevenueCatSubscription | null> {
  const apiKey = process.env.REVENUECAT_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
  
    if (!response.ok) {
      // 404 means user doesn't exist in RevenueCat (they're on free tier)
      if (response.status === 404) {
        return {
          plan: "free",
          status: "active",
          source: "revenuecat",
        };
      }
      
      console.error("[RevenueCat] API error:", response.status, response.statusText);
      return null;
    }
  
    const data = await response.json();
    const subscriber = data.subscriber;
  
    // Check for active pro subscription
    // RevenueCat entitlements are in subscriber.entitlements object
    const entitlements = subscriber?.entitlements || {};
    const proEntitlement = entitlements["pro"] || entitlements["premium"] || entitlements["entrain_pro"];
    
    if (proEntitlement) {
      const expiresDate = proEntitlement.expires_date;
      const isActive = !expiresDate || new Date(expiresDate) > new Date();
      
      if (isActive) {
        return {
          plan: "pro",
          status: "active",
          expiresAt: expiresDate ? new Date(expiresDate) : undefined,
          source: "revenuecat",
        };
      } else {
        return {
          plan: "free",
          status: "expired",
          source: "revenuecat",
        };
      }
    }
  
    // No pro entitlement found, user is on free tier
    return {
      plan: "free",
      status: "active",
      source: "revenuecat",
    };
  } catch (error) {
    console.error("[RevenueCat] Error checking subscription:", error);
    return null;
  }
}

/**
 * Check if user has active pro subscription
 * 
 * @param userId - User ID
 * @returns true if user has active pro subscription
 */
export async function hasProSubscription(userId: string): Promise<boolean> {
  const subscription = await getRevenueCatSubscription(userId);
  return subscription?.plan === "pro" && subscription?.status === "active";
}

