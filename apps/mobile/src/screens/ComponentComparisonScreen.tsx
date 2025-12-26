import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { AppScreen } from "../components";
import { PrimaryButton } from "../components/PrimaryButton";
import { Card } from "../components/Card";
import { theme } from "../theme";

/**
 * Component Comparison Screen
 * 
 * This screen allows you to compare your existing components
 * with bna-ui components side by side to see which looks better.
 */
export default function ComponentComparisonScreen({ navigation }: any) {
  return (
    <AppScreen>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Component Comparison</Text>
          <Text style={styles.subtitle}>
            Compare your existing components with bna-ui
          </Text>

          {/* Buttons Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buttons ✨ Now Enhanced!</Text>
            <Text style={styles.enhancementNote}>
              Your PrimaryButton now includes spring animations and haptic feedback from bna-ui
            </Text>
            
            <View style={styles.comparisonRow}>
              <View style={styles.componentColumn}>
                <Text style={styles.componentLabel}>Your Enhanced PrimaryButton</Text>
                <PrimaryButton
                  label="Generate Session"
                  onPress={() => console.log("PrimaryButton pressed")}
                  variant="gradient"
                />
                <View style={styles.spacing} />
                <PrimaryButton
                  label="Secondary Action"
                  onPress={() => {}}
                  variant="primary"
                />
                <View style={styles.spacing} />
                <PrimaryButton
                  label="Highlight"
                  onPress={() => {}}
                  variant="highlight"
                />
                <View style={styles.spacing} />
                <Text style={styles.featureBadge}>✨ Spring animations</Text>
                <Text style={styles.featureBadge}>📳 Haptic feedback</Text>
                <Text style={styles.featureBadge}>🎨 Smooth transitions</Text>
              </View>

              <View style={styles.componentColumn}>
                <Text style={styles.componentLabel}>Animation Pattern Source</Text>
                <Text style={styles.note}>
                  Patterns extracted from bna-ui button component:
                </Text>
                <Text style={styles.note}>• useSharedValue for animation state</Text>
                <Text style={styles.note}>• withSpring for smooth animations</Text>
                <Text style={styles.note}>• useAnimatedStyle for transforms</Text>
                <Text style={styles.note}>• expo-haptics for tactile feedback</Text>
              </View>
            </View>
          </View>

          {/* Cards Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cards ✨ Now Enhanced!</Text>
            <Text style={styles.enhancementNote}>
              Your Card component now includes subtle press animations
            </Text>
            
            <View style={styles.comparisonRow}>
              <View style={styles.componentColumn}>
                <Text style={styles.componentLabel}>Your Enhanced Card</Text>
                <Card variant="default" onPress={() => console.log("Card pressed")}>
                  <Text style={styles.cardTitle}>Session Title</Text>
                  <Text style={styles.cardBody}>
                    Tap this card to feel the subtle animation (try it!).
                  </Text>
                </Card>
                <View style={styles.spacing} />
                <Card variant="elevated" onPress={() => {}}>
                  <Text style={styles.cardTitle}>Elevated Card</Text>
                  <Text style={styles.cardBody}>
                    This card has elevated styling with press feedback.
                  </Text>
                </Card>
                <View style={styles.spacing} />
                <Text style={styles.featureBadge}>✨ Subtle scale animation</Text>
                <Text style={styles.featureBadge}>📳 Haptic feedback</Text>
              </View>

              <View style={styles.componentColumn}>
                <Text style={styles.componentLabel}>Animation Details</Text>
                <Text style={styles.note}>
                  Cards use gentle spring animations:
                </Text>
                <Text style={styles.note}>• Scales to 0.98 on press</Text>
                <Text style={styles.note}>• Smooth spring return</Text>
                <Text style={styles.note}>• Light haptic feedback</Text>
                <Text style={styles.note}>• Non-intrusive, meditative feel</Text>
              </View>
            </View>
          </View>

          {/* Features Comparison */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Your Enhanced Components:</Text>
                <Text style={styles.featureText}>✅ Uses your existing theme system</Text>
                <Text style={styles.featureText}>✅ Fully integrated with your design tokens</Text>
                <Text style={styles.featureText}>✅ Custom gradient variants</Text>
                <Text style={styles.featureText}>✅ Glass effects for cards</Text>
                <Text style={styles.featureText}>✨ NEW: Spring animations (from bna-ui)</Text>
                <Text style={styles.featureText}>✨ NEW: Haptic feedback (from bna-ui)</Text>
                <Text style={styles.featureText}>✨ NEW: Smooth press interactions</Text>
              </View>
              
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>What We Extracted:</Text>
                <Text style={styles.featureText}>• Animation patterns from bna-ui</Text>
                <Text style={styles.featureText}>• Spring physics (damping/stiffness)</Text>
                <Text style={styles.featureText}>• Haptic feedback integration</Text>
                <Text style={styles.featureText}>• useAnimatedStyle patterns</Text>
              </View>
            </View>
          </View>

          {/* What We Did */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ What We Did</Text>
            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationText}>
                ✨ Successfully extracted animation and haptic patterns from bna-ui and integrated
                them into your existing PrimaryButton and Card components!
              </Text>
              <Text style={styles.recommendationText}>
                Your components now have:
              </Text>
              <Text style={styles.recommendationText}>
                • Smooth spring animations using react-native-reanimated
              </Text>
              <Text style={styles.recommendationText}>
                • Haptic feedback on press (iOS & Android)
              </Text>
              <Text style={styles.recommendationText}>
                • All while maintaining your existing theme system and design tokens
              </Text>
              <Text style={styles.recommendationText}>
                • Animations are optional (animated prop) and can be disabled if needed
              </Text>
            </View>
          </View>

          {/* bna-ui Components */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Full bna-ui Components</Text>
            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationText}>
                We've also installed full bna-ui components:
              </Text>
              <Text style={styles.recommendationText}>
                • Carousel - Swipeable carousel with indicators and arrows
              </Text>
              <Text style={styles.recommendationText}>
                • Onboarding - Multi-step onboarding flow with gestures
              </Text>
              <Text style={styles.recommendationText}>
                • ParallaxScrollView - Hero sections with parallax scrolling
              </Text>
              <Text style={styles.recommendationText}>
                • Sheet - Bottom drawer/sheet component
              </Text>
              <Text style={styles.recommendationText}>
                • Skeleton - Loading state placeholders
              </Text>
              <View style={styles.spacing} />
              <PrimaryButton
                label="View bna-ui Components Demo"
                onPress={() => navigation.navigate("BNAUIComponents")}
                variant="gradient"
              />
            </View>
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
  comparisonRow: {
    flexDirection: "row",
    gap: theme.spacing[4],
  },
  componentColumn: {
    flex: 1,
  },
  componentLabel: {
    ...theme.typography.styles.cardTitle,
    marginBottom: theme.spacing[3],
    color: theme.colors.text.secondary,
  },
  spacing: {
    height: theme.spacing[3],
  },
  cardTitle: {
    ...theme.typography.styles.cardTitle,
    marginBottom: theme.spacing[2],
  },
  cardBody: {
    ...theme.typography.styles.body,
  },
  note: {
    ...theme.typography.styles.metadata,
    fontStyle: "italic",
    marginTop: theme.spacing[2],
  },
  enhancementNote: {
    ...theme.typography.styles.body,
    color: theme.colors.accent.primary,
    marginBottom: theme.spacing[4],
    fontWeight: "500",
  },
  featureBadge: {
    ...theme.typography.styles.metadata,
    color: theme.colors.semantic.success,
    marginTop: theme.spacing[1],
  },
  featureList: {
    gap: theme.spacing[4],
  },
  featureRow: {
    padding: theme.spacing[4],
    backgroundColor: theme.colors.background.surfaceSubtle,
    borderRadius: theme.radius.lg,
  },
  featureLabel: {
    ...theme.typography.styles.cardTitle,
    marginBottom: theme.spacing[2],
  },
  featureText: {
    ...theme.typography.styles.body,
    marginBottom: theme.spacing[1],
  },
  recommendationBox: {
    padding: theme.spacing[5],
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  recommendationText: {
    ...theme.typography.styles.body,
    marginBottom: theme.spacing[3],
    lineHeight: 22,
  },
});

