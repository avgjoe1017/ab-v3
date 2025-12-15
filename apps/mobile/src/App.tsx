import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
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

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

function MainApp() {
  // Track program progress
  useProgramTracking();
  // Track recent sessions
  useRecentTracking();

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Explore" component={ExploreScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Editor" component={EditorScreen} />
            <Stack.Screen name="Player" component={PlayerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SOS" component={SOSScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ProgramsList" component={ProgramsListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Library" component={LibraryScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // Check if onboarding is complete
    isOnboardingComplete().then((complete) => {
      setShowOnboarding(!complete);
    });
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding === null) {
    // Loading state
    return null;
  }

  return (
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
}
