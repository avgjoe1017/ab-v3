import Constants from "expo-constants";
import { Platform } from "react-native";

// Prefer explicit .env; fall back to dev default.
// Note: API server runs on port 8787 by default
// 
// Platform-specific API URLs:
// - Android emulator: 10.0.2.2 (special IP that maps to host machine's localhost)
// - iOS simulator: 127.0.0.1 (works because simulator shares network)
// - Physical device: MUST use your computer's IP address (e.g., 192.168.86.33)
//   Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
//
// Physical device IP - UPDATE THIS if your computer's IP is different
// Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
// Your detected IP: 192.168.86.33
const PHYSICAL_DEVICE_IP = "192.168.86.33";

// For Expo Go on physical device, we need to use the computer's IP
// Constants.isDevice might not work correctly in Expo Go, so we'll check executionEnvironment
// Expo Go typically has executionEnvironment === "standalone" or is a physical device
const isPhysicalDevice = Constants.isDevice || 
                         Constants.executionEnvironment === "standalone" ||
                         Constants.executionEnvironment === "storeClient";

// Force physical device mode for Expo Go (uncomment if detection doesn't work)
// const FORCE_PHYSICAL_DEVICE = true;  // Set to true if using Expo Go on physical device
const FORCE_PHYSICAL_DEVICE = true;  // Force IP address for Expo Go

export const API_BASE_URL =
  (process.env.API_BASE_URL as string | undefined) ??
  (Constants.expoConfig?.extra as any)?.API_BASE_URL ??
  (__DEV__ 
    ? (FORCE_PHYSICAL_DEVICE || isPhysicalDevice
        ? `http://${PHYSICAL_DEVICE_IP}:8787`  // Physical device (Expo Go) - use your computer's IP
        : Platform.OS === 'android' 
          ? "http://10.0.2.2:8787"  // Android emulator special IP
          : "http://127.0.0.1:8787")  // iOS simulator
    : "http://localhost:8787");

// Debug logging to see what URL is being used
if (__DEV__) {
  console.log("[API Config] ========================================");
  console.log("[API Config] API_BASE_URL:", API_BASE_URL);
  console.log("[API Config] Platform.OS:", Platform.OS);
  console.log("[API Config] Constants.isDevice:", Constants.isDevice);
  console.log("[API Config] FORCE_PHYSICAL_DEVICE:", FORCE_PHYSICAL_DEVICE);
  console.log("[API Config] isPhysicalDevice:", isPhysicalDevice);
  console.log("[API Config] PHYSICAL_DEVICE_IP:", PHYSICAL_DEVICE_IP);
  console.log("[API Config] ========================================");
}
