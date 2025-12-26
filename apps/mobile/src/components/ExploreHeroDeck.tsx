import React, { useState, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { HeroDeckCard } from "./HeroDeckCard";
import { getSessionGradient } from "../lib/sessionArt";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2; // Reduced threshold for easier swiping
const VELOCITY_THRESHOLD = 800; // Reduced velocity threshold
const HORIZONTAL_GATE = 8; // Lower threshold - easier to activate swipe
const HORIZONTAL_RATIO = 1.0; // More lenient - dx just needs to be >= dy

export type HeroSession = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  intensity?: "Soft" | "Medium" | "Deep";
  goalTag?: string;
};

interface ExploreHeroDeckProps {
  sessions: HeroSession[];
  onStart: (session: HeroSession) => void;
  onPreview?: (session: HeroSession) => void;
  onOpenDetails?: (session: HeroSession) => void;
}

export function ExploreHeroDeck({
  sessions,
  onStart,
  onPreview,
  onOpenDetails,
}: ExploreHeroDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwiping = useRef(false);

  const N = sessions.length;
  if (N === 0) return null;

  // Calculate indices for the 3 visible cards
  const prevIndex = (currentIndex - 1 + N) % N;
  const nextIndex = (currentIndex + 1) % N;

  const prevSession = sessions[prevIndex];
  const currentSession = sessions[currentIndex];
  const nextSession = sessions[nextIndex];

  // Create pan responder - improved gesture detection for smoother swiping
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Don't capture on start - let buttons work
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        // Activate on move if horizontal movement detected - capture early
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          const { dx, dy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          // Activate if horizontal movement exceeds gate and is dominant
          if (absDx > HORIZONTAL_GATE && absDx >= absDy * HORIZONTAL_RATIO) {
            isSwiping.current = true;
            return true;
          }
          return false;
        },
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
          const { dx, dy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          // Capture early if it looks like a swipe
          if (absDx > HORIZONTAL_GATE && absDx >= absDy * HORIZONTAL_RATIO) {
            isSwiping.current = true;
            return true;
          }
          return false;
        },
        onPanResponderGrant: () => {
          // Ensure we start from a clean state - flatten any existing offset first
          translateX.flattenOffset();
          // Reset to 0 and set up for new gesture
          translateX.setOffset(0);
          translateX.setValue(0);
        },
        onPanResponderMove: (evt, gestureState) => {
          // Update position during drag
          translateX.setValue(gestureState.dx);
        },
        onPanResponderRelease: (evt, gestureState) => {
          translateX.flattenOffset();
          const { dx, vx } = gestureState;
          const absDx = Math.abs(dx);
          const absVx = Math.abs(vx);

          // Determine if we should commit to a swipe (any direction)
          const shouldCommit = absDx > SWIPE_THRESHOLD || absVx > VELOCITY_THRESHOLD;

          if (shouldCommit && N > 1) {
            // Always advance to next card, regardless of swipe direction (left or right)
            // Animate current card off based on swipe direction, but always advance forward
            const exitDirection = dx > 0 ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2;
            Animated.timing(translateX, {
              toValue: exitDirection,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              // Always advance to next card (sequential forward movement)
              setCurrentIndex((prevIndex) => {
                const newIndex = (prevIndex + 1) % N;
                return newIndex;
              });
              // Reset to clean state for next card
              translateX.flattenOffset();
              translateX.setValue(0);
              translateX.setOffset(0);
              isSwiping.current = false;
            });
          } else {
            // Spring back to center with smoother animation
            Animated.spring(translateX, {
              toValue: 0,
              friction: 7,
              tension: 50,
              useNativeDriver: true,
            }).start(() => {
              isSwiping.current = false;
            });
          }
        },
        onPanResponderTerminate: () => {
          // Handle interruption (e.g., by another gesture)
          translateX.flattenOffset();
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }).start(() => {
            // Reset to clean state
            translateX.setOffset(0);
            isSwiping.current = false;
          });
        },
        onPanResponderTerminationRequest: () => {
          // Allow termination if not actively swiping
          return !isSwiping.current;
        },
      }),
    [N, translateX]
  );

  const currentCardStyle = {
    transform: [
      { translateX },
      {
        rotateZ: translateX.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: ['-5deg', '0deg', '5deg'],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const nextCardStyle = {
    transform: [
      {
        translateX: translateX.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [26, 14, 0],
          extrapolate: 'clamp',
        }),
      },
      {
        translateY: translateX.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [20, 10, 0],
          extrapolate: 'clamp',
        }),
      },
      {
        scale: translateX.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [0.92, 0.96, 1.0],
          extrapolate: 'clamp',
        }),
      },
    ],
    opacity: translateX.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: [0.96, 0.98, 1.0],
      extrapolate: 'clamp',
    }),
  };

  const prevCardStyle = {
    transform: [
      {
        translateX: translateX.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [0, -14, -26],
          extrapolate: 'clamp',
        }),
      },
      {
        translateY: translateX.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [0, 10, 20],
          extrapolate: 'clamp',
        }),
      },
      {
        scale: translateX.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [1.0, 0.96, 0.92],
          extrapolate: 'clamp',
        }),
      },
    ],
    opacity: translateX.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: [1.0, 0.98, 0.96],
      extrapolate: 'clamp',
    }),
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Featured Sessions</Text>
        <Text style={styles.indicator}>
          {String(currentIndex + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
        </Text>
      </View>

      <View style={styles.deckContainer}>
        {/* Previous card (behind, left side) */}
        {N > 1 && (
          <Animated.View
            style={[
              styles.cardWrapper,
              styles.prevCard,
              prevCardStyle,
            ]}
            pointerEvents="none"
          >
            <HeroDeckCard
              session={prevSession}
              onStart={() => {}}
              onPreview={onPreview}
              onOpenDetails={onOpenDetails}
            />
          </Animated.View>
        )}

        {/* Current card (front) */}
        <Animated.View
          style={[
            styles.cardWrapper,
            styles.currentCard,
            currentCardStyle,
          ]}
          {...panResponder.panHandlers}
        >
          <HeroDeckCard
            session={currentSession}
            onStart={() => onStart(currentSession)}
            onPreview={onPreview}
            onOpenDetails={onOpenDetails}
          />
        </Animated.View>

        {/* Next card (behind, right side) */}
        {N > 1 && (
          <Animated.View
            style={[
              styles.cardWrapper,
              styles.nextCard,
              nextCardStyle,
            ]}
            pointerEvents="none"
          >
            <HeroDeckCard
              session={nextSession}
              onStart={() => {}}
              onPreview={onPreview}
              onOpenDetails={onOpenDetails}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 340,
    marginBottom: theme.spacing[4],
    overflow: "visible",
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[3],
  },
  label: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 12,
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  indicator: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  deckContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  cardWrapper: {
    position: "absolute",
    width: CARD_WIDTH,
  },
  currentCard: {
    zIndex: 3,
  },
  nextCard: {
    zIndex: 2,
  },
  prevCard: {
    zIndex: 1,
  },
});

