import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";
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
import EditorScreen from "./screens/EditorScreen";
import SOSScreen from "./screens/SOSScreen";
import ProgramsListScreen from "./screens/ProgramsListScreen";
import ProgramDetailScreen from "./screens/ProgramDetailScreen";
import LibraryScreen from "./screens/LibraryScreen";
import SessionDetailScreen from "./screens/SessionDetailScreen";
import OnboardingFlow from "./screens/OnboardingFlow";
import SettingsScreen from "./screens/SettingsScreen";
import { useProgramTracking } from "./hooks/useProgramTracking";
import { useRecentTracking } from "./hooks/useRecentTracking";
import { isOnboardingComplete } from "./storage/onboarding";
import { getClerkPublishableKey } from "./lib/auth";
import { initializeRevenueCat } from "./lib/revenuecat";
import { theme } from "./theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Main Tab Navigator for the 4 main pages
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent.secondary,
        tabBarInactiveTintColor: theme.colors.text.muted,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 85,
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.subtle,
          paddingBottom: theme.spacing[6],
          paddingTop: theme.spacing[2],
          paddingHorizontal: theme.spacing[6],
          elevation: 0, // Remove shadow on Android
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
        },
        tabBarIconStyle: {
          marginTop: theme.spacing[1],
        },
        // Smooth screen transitions - tabs stay mounted for instant switching
        lazy: false,
        // Disable default animations for smoother tab switching
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Today"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: "relative" }}>
              <MaterialIcons
                name="calendar-today"
                size={24}
                color={color}
              />
              {focused && (
                <View style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.accent.secondary,
                }} />
              )}
            </View>
          ),
          tabBarLabel: "Today",
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="explore" size={24} color={color} />
          ),
          tabBarLabel: "Explore",
        }}
      />
      <Tab.Screen
        name="Programs"
        component={ProgramsListScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="book" size={24} color={color} />
          ),
          tabBarLabel: "Programs",
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="library-music" size={24} color={color} />
          ),
          tabBarLabel: "Library",
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
        <Stack.Screen name="Editor" component={EditorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SOS" component={SOSScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
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

  // Wrap app with ClerkProvider if publishable key is available
  const appContent = (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {showOnboarding ? (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        ) : (
          <MainApp />
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );

  // If Clerk key is configured, wrap with ClerkProvider
  if (clerkPublishableKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        {appContent}
      </ClerkProvider>
    );
  }

  // Otherwise, render without Clerk (development mode)
  return appContent;
}
