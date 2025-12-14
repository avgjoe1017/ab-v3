import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Asset } from "expo-asset";
import HomeScreen from "./screens/HomeScreen";
import PlayerScreen from "./screens/PlayerScreen";
import EditorScreen from "./screens/EditorScreen";
import { AudioDebugger } from "./components/AudioDebugger";
import { TestDataHelper } from "./components/TestDataHelper";
import { getAudioEngine } from "@ab/audio-engine";

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  // Initialize preroll asset URI in AudioEngine on app start
  useEffect(() => {
    const initializePrerollAsset = async () => {
      try {
        // Asset is in apps/mobile/assets/audio/, so from src/ we need to go up one level
        // @ts-ignore - Metro will resolve this asset
        const assetModule = require("../assets/audio/preroll_atmosphere.m4a");
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        const uri = asset.localUri || asset.uri;
        if (!uri) {
          throw new Error("Failed to get asset URI");
        }
        getAudioEngine().setPrerollAssetUri(uri);
        console.log("[App] ✅ Preroll asset initialized:", uri);
      } catch (error) {
        console.error("[App] ❌ Failed to initialize preroll asset:", error);
        // Try fallback: use the module directly if Asset API fails
        try {
          // @ts-ignore
          const assetModule = require("../assets/audio/preroll_atmosphere.m4a");
          if (typeof assetModule === 'number') {
            // It's an asset ID
            getAudioEngine().setPrerollAssetUri(assetModule.toString());
            console.log("[App] ✅ Preroll asset initialized (fallback):", assetModule);
          } else {
            console.error("[App] ❌ Could not resolve preroll asset");
          }
        } catch (fallbackError) {
          console.error("[App] ❌ Fallback also failed:", fallbackError);
        }
      }
    };
    initializePrerollAsset();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Editor" component={EditorScreen} />
            <Stack.Screen name="Player" component={PlayerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        {/* Debug components - collapsible in development */}
        {__DEV__ && (
          <>
            <AudioDebugger />
            <TestDataHelper />
          </>
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
