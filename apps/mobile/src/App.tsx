import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";
import { View, Pressable } from "react-native";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
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
import { useProgramTracking } from "./hooks/useProgramTracking";
import { useRecentTracking } from "./hooks/useRecentTracking";
import { isOnboardingComplete } from "./storage/onboarding";
import { getClerkPublishableKey, useAuthToken } from "./lib/auth";
import { initializeRevenueCat } from "./lib/revenuecat";
import { theme } from "./theme";
import { setAuthToken } from "./lib/api";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Custom tab bar button with conditional black background
const CustomTabBarButton = ({ children, onPress, accessibilityState, ...props }: BottomTabBarButtonProps) => {
  const isFocused = accessibilityState?.selected ?? false;
  
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: isFocused ? "#000000" : "transparent",
        borderRadius: 24,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 2,
        alignItems: "center",
        justifyContent: "center",
      }}
      {...props}
    >
      {children}
    </Pressable>
  );
};

// Floating bottom tab bar styles - white pill with black border
const floatingTabBarStyle = {
  position: "absolute" as const,
  bottom: 20,
  left: 20,
  right: 20,
  backgroundColor: "#ffffff",
  borderRadius: 32,
  height: 64,
  paddingBottom: 8,
  paddingTop: 8,
  paddingHorizontal: 4,
  elevation: 8,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  borderTopWidth: 0,
  borderWidth: 1,
  borderColor: "#000000",
};

// Main Tab Navigator for the 4 main pages
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ffffff", // White for active tab (icon and text)
        tabBarInactiveTintColor: "#000000", // Black for inactive tabs
        tabBarStyle: floatingTabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelVisibilityMode: "selected", // Show label only for selected tab
        lazy: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Today"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="auto-awesome" size={24} color={color} />
          ),
          tabBarLabel: "Home",
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="explore" size={24} color={color} />
          ),
          tabBarLabel: "Explore",
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="favorite" size={24} color={color} />
          ),
          tabBarLabel: "My Library",
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
    </Tab.Navigator>
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
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          // Smooth transitions for stack screens
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      >
        {/* Main tabs as the initial screen */}
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        {/* Detail screens */}
        <Stack.Screen name="Editor" component={AIAffirmationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditorLegacy" component={EditorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AudioGenerationLoading" component={AudioGenerationLoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SOS" component={SOSScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
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

  React.useEffect(() => {
    setAuthToken(authToken);
  }, [authToken]);

  return <AppContent {...props} />;
}

function AppContentWithoutAuth(props: AppContentProps) {
  React.useEffect(() => {
    setAuthToken(null);
  }, []);

  return <AppContent {...props} />;
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

  // If Clerk key is configured, wrap with ClerkProvider
  if (clerkPublishableKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <AppContentWithAuth
          showOnboarding={showOnboarding}
          onOnboardingComplete={handleOnboardingComplete}
        />
      </ClerkProvider>
    );
  }

  // Otherwise, render without Clerk (development mode)
  return (
    <AppContentWithoutAuth
      showOnboarding={showOnboarding}
      onOnboardingComplete={handleOnboardingComplete}
    />
  );
}
