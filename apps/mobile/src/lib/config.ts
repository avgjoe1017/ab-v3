import Constants from "expo-constants";
import { Platform } from "react-native";

// API configuration with proper fallbacks
// Priority: process.env > app.json extra > platform-specific defaults
// 
// Platform-specific API URLs:
// - Android emulator: 10.0.2.2 (special IP that maps to host machine's localhost)
// - iOS simulator: 127.0.0.1 (works because simulator shares network)
// - Physical device: Use your computer's IP address (configure in app.json extra.PHYSICAL_DEVICE_IP)
//   Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
//
// To configure for physical device:
// 1. Set app.json extra.PHYSICAL_DEVICE_IP to your computer's IP
// 2. Or set EXPO_PUBLIC_API_BASE_URL environment variable
// 3. Or set process.env.API_BASE_URL

const expoExtra = (Constants.expoConfig?.extra as any) || {};
const physicalDeviceIP = expoExtra.PHYSICAL_DEVICE_IP || null;

// Detect if running on physical device
const isPhysicalDevice = Constants.isDevice || 
                         Constants.executionEnvironment === "standalone" ||
                         Constants.executionEnvironment === "storeClient";

// Determine API base URL with proper fallback chain
export const API_BASE_URL = (() => {
  // 1. Explicit env var (highest priority)
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // 2. Expo public env var (EXPO_PUBLIC_* vars are available at build time)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  // 3. app.json extra.API_BASE_URL
  if (expoExtra.API_BASE_URL) {
    return expoExtra.API_BASE_URL;
  }
  
  // 4. Platform-specific defaults (dev mode only)
  if (__DEV__) {
    if (isPhysicalDevice && physicalDeviceIP) {
      return `http://${physicalDeviceIP}:8787`;
    }
    
    if (Platform.OS === 'android') {
      return "http://10.0.2.2:8787";  // Android emulator special IP
    }
    
    return "http://127.0.0.1:8787";  // iOS simulator
  }
  
  // 5. Production fallback
  return "http://localhost:8787";
})();

// Debug logging to see what URL is being used
if (__DEV__) {
  console.log("[API Config] ========================================");
  console.log("[API Config] API_BASE_URL:", API_BASE_URL);
  console.log("[API Config] Platform.OS:", Platform.OS);
  console.log("[API Config] Constants.isDevice:", Constants.isDevice);
  console.log("[API Config] isPhysicalDevice:", isPhysicalDevice);
  console.log("[API Config] physicalDeviceIP:", physicalDeviceIP);
  console.log("[API Config] Source:", 
    process.env.API_BASE_URL ? "process.env.API_BASE_URL" :
    process.env.EXPO_PUBLIC_API_BASE_URL ? "EXPO_PUBLIC_API_BASE_URL" :
    expoExtra.API_BASE_URL ? "app.json extra.API_BASE_URL" :
    "platform default"
  );
  console.log("[API Config] ========================================");
}
