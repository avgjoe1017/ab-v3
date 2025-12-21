import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme";

interface PrimerAnimationProps {
  onComplete: () => void;
  duration?: number; // milliseconds
  skippable?: boolean;
  onSkip?: () => void;
  instruction?: string;
}

/**
 * Primer Animation - 20-30 second breath-in/breath-out animation
 * Used during audio preparation to mask buffering
 * Includes background noise visualization and minimal instructions
 */
export const PrimerAnimation: React.FC<PrimerAnimationProps> = ({
  onComplete,
  duration = 25000, // 25 seconds default
  skippable = true,
  onSkip,
  instruction = "Take a deep breath. Let your mind settle.",
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

  const textOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in instruction text
    Animated.timing(textOpacityAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [textOpacityAnim]);

  return (
    <View style={styles.container}>
      {/* Background noise visualization - subtle particles */}
      <View style={styles.backgroundNoise}>
        {Array.from({ length: 20 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.noiseParticle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: opacityAnim.interpolate({
                  inputRange: [0.3, 0.8],
                  outputRange: [0.1, 0.3],
                }),
              },
            ]}
          />
        ))}
      </View>

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

      {/* Instruction text */}
      <Animated.View
        style={[
          styles.instructionContainer,
          {
            opacity: textOpacityAnim,
          },
        ]}
      >
        <Text style={styles.instructionText}>{instruction}</Text>
      </Animated.View>

      {skippable && onSkip && (
        <Pressable style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
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
  backgroundNoise: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  noiseParticle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent.secondary,
  },
  instructionContainer: {
    position: "absolute",
    bottom: 200,
    paddingHorizontal: theme.spacing[6],
    alignItems: "center",
  },
  instructionText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  skipButton: {
    position: "absolute",
    bottom: 100,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  skipText: {
    ...theme.typography.styles.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
});

