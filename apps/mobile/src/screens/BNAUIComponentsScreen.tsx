import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
} from "react-native";
import { AppScreen } from "../components";
import { theme } from "../theme";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  Onboarding,
  type OnboardingStep,
  ParallaxScrollView,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Skeleton,
} from "../components/bna-ui";
import { PrimaryButton } from "../components/PrimaryButton";
import { MaterialIcons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

/**
 * Demo screen showcasing all implemented bna-ui components
 */
export default function BNAUIComponentsScreen({ navigation }: any) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Onboarding steps
  const onboardingSteps: OnboardingStep[] = [
    {
      id: "1",
      title: "Welcome to bna-ui",
      description: "Beautiful React Native components built with Expo",
      icon: <MaterialIcons name="favorite" size={64} color={theme.colors.accent.primary} />,
    },
    {
      id: "2",
      title: "Smooth Animations",
      description: "Built with react-native-reanimated for fluid interactions",
      icon: <MaterialIcons name="animation" size={64} color={theme.colors.accent.primary} />,
    },
    {
      id: "3",
      title: "Ready to Use",
      description: "All components are fully functional and customizable",
      icon: <MaterialIcons name="check-circle" size={64} color={theme.colors.accent.primary} />,
    },
  ];

  // Carousel items
  const carouselItems = [
    { id: "1", title: "Slide 1", color: "#f5f6f7" },
    { id: "2", title: "Slide 2", color: "#eeeff0" },
    { id: "3", title: "Slide 3", color: "#e9ecef" },
  ];

  return (
    <AppScreen>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.title}>bna-ui Components</Text>
          <Text style={styles.subtitle}>Showcase of implemented components</Text>

          {/* Carousel Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carousel</Text>
            <Carousel
              showIndicators
              showArrows
              autoPlay
              autoPlayInterval={3000}
              onIndexChange={setCurrentCarouselIndex}
              style={styles.carousel}
            >
              {carouselItems.map((item) => (
                <CarouselItem key={item.id}>
                  <View style={[styles.carouselItem, { backgroundColor: item.color }]}>
                    <Text style={styles.carouselItemText}>{item.title}</Text>
                  </View>
                </CarouselItem>
              ))}
            </Carousel>
            <Text style={styles.note}>Current index: {currentCarouselIndex}</Text>
          </View>

          {/* Sheet Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sheet (Bottom Drawer)</Text>
            <PrimaryButton
              label="Open Sheet"
              onPress={() => setSheetOpen(true)}
              variant="gradient"
            />
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet Example</SheetTitle>
                  <SheetDescription>
                    This is a bottom sheet drawer component. Swipe down or press outside to close.
                  </SheetDescription>
                </SheetHeader>
                <View style={styles.sheetContent}>
                  <Text style={styles.bodyText}>
                    You can put any content here. Sheets are great for forms, details, or secondary actions.
                  </Text>
                  <PrimaryButton
                    label="Close Sheet"
                    onPress={() => setSheetOpen(false)}
                    variant="primary"
                  />
                </View>
              </SheetContent>
            </Sheet>
          </View>

          {/* Skeleton Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skeleton (Loading States)</Text>
            <View style={styles.skeletonContainer}>
              <Skeleton width={screenWidth - 80} height={20} style={styles.skeleton} />
              <Skeleton width={screenWidth - 120} height={20} style={styles.skeleton} />
              <Skeleton width="60%" height={20} style={styles.skeleton} />
              <View style={styles.skeletonRow}>
                <Skeleton width={80} height={80} variant="rounded" />
                <View style={styles.skeletonTextColumn}>
                  <Skeleton width={screenWidth - 200} height={16} />
                  <Skeleton width={screenWidth - 220} height={16} style={styles.skeleton} />
                </View>
              </View>
            </View>
          </View>

          {/* ParallaxScrollView Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ParallaxScrollView</Text>
            <Text style={styles.note}>
              ParallaxScrollView creates a hero section that scales and translates as you scroll.
              Tap below to see it in action.
            </Text>
            <PrimaryButton
              label="View Parallax Example"
              onPress={() => navigation.navigate("ParallaxExample")}
              variant="gradient"
            />
          </View>

          {/* Onboarding Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Onboarding Flow</Text>
            <Text style={styles.note}>
              Multi-step onboarding with smooth animations and swipe gestures.
            </Text>
            <PrimaryButton
              label="View Onboarding Example"
              onPress={() => navigation.navigate("OnboardingExample")}
              variant="gradient"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[5],
  },
  title: {
    ...theme.typography.styles.h1,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    ...theme.typography.styles.body,
    marginBottom: theme.spacing[8],
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: theme.spacing[8],
  },
  sectionTitle: {
    ...theme.typography.styles.sectionHeading,
    marginBottom: theme.spacing[4],
  },
  carousel: {
    height: 200,
    marginBottom: theme.spacing[2],
  },
  carouselItem: {
    width: screenWidth - 80,
    height: 180,
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: theme.spacing[2],
  },
  carouselItemText: {
    ...theme.typography.styles.h2,
  },
  note: {
    ...theme.typography.styles.metadata,
    fontStyle: "italic",
    marginTop: theme.spacing[2],
  },
  sheetContent: {
    padding: theme.spacing[4],
    gap: theme.spacing[4],
  },
  bodyText: {
    ...theme.typography.styles.body,
  },
  skeletonContainer: {
    gap: theme.spacing[3],
  },
  skeleton: {
    marginTop: theme.spacing[2],
  },
  skeletonRow: {
    flexDirection: "row",
    gap: theme.spacing[4],
    marginTop: theme.spacing[4],
    alignItems: "center",
  },
  skeletonTextColumn: {
    flex: 1,
    gap: theme.spacing[2],
  },
});

