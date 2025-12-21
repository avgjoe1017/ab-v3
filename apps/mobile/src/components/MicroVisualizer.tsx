import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { theme } from "../theme";
import { getAudioEngine, type AudioEngineSnapshot } from "@ab/audio-engine";

interface MicroVisualizerProps {
  barCount?: number;
  height?: number;
  color?: string;
  style?: ViewStyle;
  isPlaying?: boolean;
}

/**
 * MicroVisualizer - 30-bar audio visualizer for player glass panel
 * Uses Inter Semibold for time indicators
 */
export const MicroVisualizer: React.FC<MicroVisualizerProps> = ({
  barCount = 30,
  height = 40,
  color = theme.colors.accent.highlight,
  style,
  isPlaying = false,
}) => {
  const engine = useRef(getAudioEngine()).current;
  const [snapshot, setSnapshot] = useState<AudioEngineSnapshot>(() => engine.getState());
  const animations = useRef<Animated.Value[]>(
    Array(barCount)
      .fill(0)
      .map(() => new Animated.Value(0.2))
  ).current;

  useEffect(() => {
    return engine.subscribe((s) => setSnapshot(s));
  }, [engine]);

  useEffect(() => {
    if (!isPlaying || snapshot.status !== "playing") {
      // Reset to low values when not playing
      animations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    // Animate bars based on audio state
    const animateBars = () => {
      animations.forEach((anim, index) => {
        // Create varied animation pattern
        const delay = index * 50;
        const targetValue = 0.2 + Math.random() * 0.8;
        
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: targetValue,
            duration: 100 + Math.random() * 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    };

    const interval = setInterval(animateBars, 300);
    return () => clearInterval(interval);
  }, [isPlaying, snapshot.status, animations]);

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={styles.barsContainer}>
        {animations.map((anim, index) => {
          const barHeight = height * 0.8; // Max height is 80% of container
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                {
                  width: Math.max(2, (100 / barCount) - 1),
                  height: barHeight,
                  backgroundColor: color,
                  opacity: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                  transform: [
                    {
                      scaleY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
    gap: 2,
  },
  bar: {
    borderRadius: 1,
  },
});

