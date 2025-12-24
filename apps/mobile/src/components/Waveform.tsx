import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, ViewStyle, Easing, LayoutChangeEvent, Dimensions } from "react-native";

interface WaveformProps {
  /** Width of the waveform */
  width?: number;
  /** Height of the waveform */
  height?: number;
  /** Color of the wave (default: theme accent) */
  color?: string;
  /** Number of wave cycles (default: 2) */
  cycles?: number;
  /** Whether the wave is animating (playing audio) */
  isPlaying?: boolean;
  /** Wave amplitude multiplier when playing (0-1, default: 0.5) */
  amplitude?: number;
  /** Animation speed (default: 3000ms per cycle) */
  speed?: number;
  /** Additional styles */
  style?: ViewStyle;
}

/**
 * Waveform - Smooth, organic wave visualization for audio playback
 * Creates flowing, Apple-inspired waveform pattern that animates during playback
 * Designed to replace or complement bar-based visualizers with a more organic feel
 * Inspired by modern audio player waveforms with smooth, continuous curves
 */
export const Waveform: React.FC<WaveformProps> = ({
  width: propWidth,
  height = 80,
  color = "#212529",
  cycles = 2,
  isPlaying = false,
  amplitude = 0.5,
  speed = 3000,
  style,
}) => {
  const [containerWidth, setContainerWidth] = useState(propWidth || Dimensions.get("window").width - 80);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const waveSegments = 100; // More segments for smoother wave

  const width = propWidth || containerWidth;

  const handleLayout = (event: LayoutChangeEvent) => {
    if (!propWidth) {
      setContainerWidth(event.nativeEvent.layout.width);
    }
  };

  // Animate wave when playing
  useEffect(() => {
    if (isPlaying) {
      const animation = Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: speed,
          easing: Easing.linear,
          useNativeDriver: false, // We need to animate layout properties
        })
      );
      animation.start();
      return () => animation.stop();
    } else {
      // Fade to static state
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [isPlaying, animatedValue, speed]);

  // Generate wave bars
  const bars = Array.from({ length: waveSegments }).map((_, index) => {
    const normalizedX = (index / waveSegments) * cycles * Math.PI * 2;
    
    // Create smooth wave using sine function with harmonic for organic feel
    const baseWave = Math.sin(normalizedX);
    const harmonic = Math.sin(normalizedX * 1.7) * 0.2;
    const waveValue = baseWave + harmonic;
    
    // Calculate static bar height
    const baseHeight = height * 0.15;
    const waveHeight = Math.abs(waveValue) * height * amplitude;
    
    return {
      index,
      x: (index / waveSegments) * width,
      width: (width / waveSegments) + 1.5, // Slight overlap
      baseHeight,
      waveValue,
      maxHeight: baseHeight + waveHeight,
    };
  });

  return (
    <View 
      style={[styles.container, propWidth ? { width, height } : { height }, style]}
      onLayout={handleLayout}
    >
      <View style={[styles.waveContainer, { width }]}>
        {bars.map((bar) => {
          const normalizedX = (bar.index / waveSegments) * cycles * Math.PI * 2;
          
          // Animate height based on playing state
          const animatedHeight = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [bar.baseHeight, bar.maxHeight],
          });

          const animatedOpacity = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 0.85],
          });

          // Animate vertical position to create wave motion
          const translateY = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [
              height / 2 - bar.baseHeight / 2,
              height / 2 - bar.baseHeight / 2 + Math.sin(normalizedX) * height * amplitude * 0.2,
            ],
          });

          return (
            <Animated.View
              key={bar.index}
              style={[
                styles.waveBar,
                {
                  left: bar.x,
                  width: bar.width,
                  height: animatedHeight,
                  backgroundColor: color,
                  opacity: animatedOpacity,
                  borderRadius: bar.width / 2,
                  transform: [{ translateY }],
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
    overflow: "hidden",
  },
  waveContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  waveBar: {
    position: "absolute",
  },
});
