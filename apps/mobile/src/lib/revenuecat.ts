/**
 * RevenueCat Integration
 * 
 * Subscription management for mobile app
 */

import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Get RevenueCat API key from environment
 */
function getRevenueCatApiKey(): string | null {
  const expoExtra = (Constants.expoConfig?.extra as any) || {};
  
  if (Platform.OS === "ios") {
    return expoExtra.REVENUECAT_IOS_API_KEY || process.env.REVENUECAT_IOS_API_KEY || null;
  } else {
    return expoExtra.REVENUECAT_ANDROID_API_KEY || process.env.REVENUECAT_ANDROID_API_KEY || null;
  }
}

/**
 * Initialize RevenueCat SDK
 * 
 * Call this once when the app starts
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  const apiKey = getRevenueCatApiKey();
  
  if (!apiKey) {
    console.warn("[RevenueCat] API key not found. RevenueCat features will be disabled.");
    return;
  }
  
  try {
    await Purchases.configure({ apiKey });
    
    if (userId) {
      await Purchases.logIn(userId);
    }
    
    console.log("[RevenueCat] Initialized successfully");
  } catch (error) {
    console.error("[RevenueCat] Initialization failed:", error);
  }
}

/**
 * Get current customer info (subscription status)
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error("[RevenueCat] Error getting customer info:", error);
    return null;
  }
}

/**
 * Check if user has active pro subscription
 */
export async function hasProSubscription(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;
    
    // Check for pro entitlement (adjust entitlement ID as needed)
    const entitlements = customerInfo.entitlements.active;
    return !!(entitlements["pro"] || entitlements["premium"] || entitlements["entrain_pro"]);
  } catch (error) {
    console.error("[RevenueCat] Error checking subscription:", error);
    return false;
  }
}

/**
 * Get available offerings (products available for purchase)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error("[RevenueCat] Error getting offerings:", error);
    return null;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error) {
    console.error("[RevenueCat] Purchase failed:", error);
    throw error;
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    console.error("[RevenueCat] Restore failed:", error);
    throw error;
  }
}

