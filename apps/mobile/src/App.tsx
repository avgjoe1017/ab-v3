import React from "react";
import "react-native-drawer-layout"; // Ensure drawer layout is loaded before drawer navigator
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import HomeScreen from "./screens/HomeScreen";
import ExploreScreen from "./screens/ExploreScreen";
import PlayerScreen from "./screens/PlayerScreen";
import AudioGenerationLoadingScreen from "./screens/AudioGenerationLoadingScreen";
import EditorScreen from "./screens/EditorScreen";
import AIAffirmationScreen from "./screens/AIAffirmationScreen";
import SOSScreen from "./screens/SOSScreen";
import ProgramDetailScreen from "./screens/ProgramDetailScreen";
import LibraryScreen from "./screens/LibraryScreen";
import SessionDetailScreen from "./screens/SessionDetailScreen";
import OnboardingFlow from "./screens/OnboardingFlow";
import SettingsScreen from "./screens/SettingsScreen";
import ComponentComparisonScreen from "./screens/ComponentComparisonScreen";
import BNAUIComponentsScreen from "./screens/BNAUIComponentsScreen";
import ParallaxExampleScreen from "./screens/ParallaxExampleScreen";
import OnboardingExampleScreen from "./screens/OnboardingExampleScreen";
import { useProgramTracking } from "./hooks/useProgramTracking";
import { useRecentTracking } from "./hooks/useRecentTracking";
import { isOnboardingComplete } from "./storage/onboarding";
import { getClerkPublishableKey, useAuthToken, ClerkAvailableProvider, shouldSkipAuth } from "./lib/auth";
import { initializeRevenueCat } from "./lib/revenuecat";
import { theme } from "./theme";
import { setAuthToken } from "./lib/api";
import SignInScreen from "./screens/SignInScreen";
import ChatComposerScreen from "./screens/ChatComposerScreen";
import { useAuth } from "@clerk/clerk-expo";
import { DrawerContent, HamburgerButton } from "./components";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const queryClient = new QueryClient();


// Main Drawer Navigator
function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: {
          width: 280,
        },
        overlayColor: "rgba(0, 0, 0, 0.5)",
        drawerActiveTintColor: "#007AFF",
        drawerInactiveTintColor: "#666666",
        drawerHideStatusBarOnOpen: false,
        drawerPosition: "left",
      }}
      initialRouteName="Compose"
    >
      <Drawer.Screen
        name="Compose"
        component={ChatComposerScreen}
        options={{
          drawerLabel: "Compose",
        }}
      />
      <Drawer.Screen
        name="Today"
        component={HomeScreen}
        options={{
          drawerLabel: "Today",
        }}
      />
      <Drawer.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          drawerLabel: "Explore",
        }}
      />
      <Drawer.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          drawerLabel: "Library",
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: "Settings",
        }}
      />
    </Drawer.Navigator>
  );
}

function MainApp() {
  // Track program progress
  useProgramTracking();
  // Track recent sessions
  useRecentTracking();

  // Initialize RevenueCat when app loads
  React.useEffect(() => {
    initializeRevenueCat().catch((error) => {
      console.error("[App] Failed to initialize RevenueCat:", error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
        screenOptions={{
          // Smooth transitions for stack screens
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      >
        {/* Main drawer as the initial screen */}
        <Stack.Screen name="MainDrawer" component={MainDrawer} options={{ headerShown: false }} />
        {/* Detail screens */}
        <Stack.Screen name="Editor" component={AIAffirmationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditorLegacy" component={EditorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AudioGenerationLoading" component={AudioGenerationLoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SOS" component={SOSScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ComponentComparison" component={ComponentComparisonScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BNAUIComponents" component={BNAUIComponentsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ParallaxExample" component={ParallaxExampleScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OnboardingExample" component={OnboardingExampleScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

type AppContentProps = {
  showOnboarding: boolean;
  onOnboardingComplete: () => void;
};

function AppContent({ showOnboarding, onOnboardingComplete }: AppContentProps) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {showOnboarding ? (
          <OnboardingFlow onComplete={onOnboardingComplete} />
        ) : (
          <MainApp />
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function AppContentWithAuth(props: AppContentProps) {
  const authToken = useAuthToken();
  const { isLoaded, isSignedIn } = useAuth();

  React.useEffect(() => {
    setAuthToken(authToken);
  }, [authToken]);

  // Show sign-in screen if not authenticated
  if (!isLoaded) {
    return null; // Loading state
  }

  if (!isSignedIn) {
    return <SignInScreen />;
  }

  return <AppContent {...props} />;
}

function AppContentWithoutAuth(props: AppContentProps) {
  React.useEffect(() => {
    setAuthToken(null);
  }, []);

  return (
    <ClerkAvailableProvider available={false}>
      <AppContent {...props} />
    </ClerkAvailableProvider>
  );
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = React.useState<boolean | null>(null);
  const clerkPublishableKey = getClerkPublishableKey();

  // Load Inter font family
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  React.useEffect(() => {
    // Check if onboarding is complete
    isOnboardingComplete().then((complete) => {
      setShowOnboarding(!complete);
    });
  }, []);

  // Wait for fonts to load before rendering
  if (!fontsLoaded) {
    return null;
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding === null) {
    // Loading state
    return null;
  }

  // In development mode, skip authentication even if Clerk is configured
  const skipAuth = __DEV__;

  // If Clerk key is configured and not in dev mode, wrap with ClerkProvider
  if (clerkPublishableKey && !skipAuth) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <ClerkAvailableProvider available={true}>
          <AppContentWithAuth
            showOnboarding={showOnboarding}
            onOnboardingComplete={handleOnboardingComplete}
          />
        </ClerkAvailableProvider>
      </ClerkProvider>
    );
  }

  // Otherwise, render without Clerk (development mode or no Clerk key)
  if (skipAuth) {
    console.log("[App] 🔧 Development mode: Authentication bypassed");
  }
  return (
    <AppContentWithoutAuth
      showOnboarding={showOnboarding}
      onOnboardingComplete={handleOnboardingComplete}
    />
  );
}
