/**
 * Message Bubble Component
 * ChatGPT/Claude-style message bubbles
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { theme } from "../../../theme";
import type { ChatRole, ChatMessageKind } from "../types";

interface MessageBubbleProps {
  role: ChatRole;
  kind: ChatMessageKind;
  children?: React.ReactNode;
  text?: string;
}

// Typing indicator dots animation
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animate(dot1, 0);
    const anim2 = animate(dot2, 200);
    const anim3 = animate(dot3, 400);

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const opacity1 = dot1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
  const opacity2 = dot2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
  const opacity3 = dot3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, { opacity: opacity1 }]} />
      <Animated.View style={[styles.typingDot, { opacity: opacity2 }]} />
      <Animated.View style={[styles.typingDot, { opacity: opacity3 }]} />
    </View>
  );
}

export function MessageBubble({ role, kind, children, text }: MessageBubbleProps) {
  const isUser = role === "user";
  const isLoading = kind === "loading";
  
  return (
    <View style={[
      styles.messageRow,
      isUser ? styles.messageRowUser : styles.messageRowAssistant,
    ]}>
      <View style={[
        styles.messageContainer,
        isUser ? styles.messageContainerUser : styles.messageContainerAssistant,
      ]}>
        {isLoading ? (
          <TypingIndicator />
        ) : kind === "text" && text ? (
          <Text style={[
            styles.text,
            isUser ? styles.textUser : styles.textAssistant,
          ]}>
            {text}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  messageContainer: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  messageContainerUser: {
    backgroundColor: "#007AFF", // iOS blue, similar to ChatGPT
    borderBottomRightRadius: 4,
  },
  messageContainerAssistant: {
    backgroundColor: "#F2F2F7", // Light gray, similar to ChatGPT assistant
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  textUser: {
    color: "#FFFFFF",
  },
  textAssistant: {
    color: "#000000",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#666666",
  },
});

