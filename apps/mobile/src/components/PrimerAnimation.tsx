import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { theme } from "../theme";

interface PrimerAnimationProps {
  onComplete: () => void;
  duration?: number; // milliseconds
  skippable?: boolean;
  onSkip?: () => void;
}

/**
 * Primer Animation - 20-30 second breath-in/breath-out animation
 * Used during audio preparation to mask buffering
 */
export const PrimerAnimation: React.FC<PrimerAnimationProps> = ({
  onComplete,
  duration = 25000, // 25 seconds default
  skippable = true,
  onSkip,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Breathing animation: scale and opacity pulse
    const createBreathingCycle = () => {
      return Animated.parallel([
        Animated.sequence([
          // Breathe in
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 4000, // 4 seconds inhale
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.8,
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          // Breathe out
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 5000, // 5 seconds exhale
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.3,
              duration: 5000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    };

    // Run breathing cycles for the duration
    const cycles = Math.floor(duration / 9000); // Each cycle is ~9 seconds
    const animations = Array(cycles)
      .fill(null)
      .map(() => createBreathingCycle());

    Animated.sequence(animations).start(() => {
      // Fade out at the end
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete();
      });
    });
  }, [duration, scaleAnim, opacityAnim, onComplete]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.innerCircle} />
      </Animated.View>
      {skippable && onSkip && (
        <View style={styles.skipContainer}>
          {/* Skip button would go here if needed */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    zIndex: 1000,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.accent.secondary,
    opacity: 0.5,
  },
  skipContainer: {
    position: "absolute",
    bottom: 100,
  },
});

