/**
 * Composer Input Bar Component
 * ChatGPT/Claude-style input bar
 */

import React from "react";
import { View, TextInput, Pressable, StyleSheet, Platform, KeyboardAvoidingView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ComposerInputBarProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ComposerInputBar({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Message...",
}: ComposerInputBarProps) {
  const insets = useSafeAreaInsets();
  const canSend = value.trim().length >= 2 && !disabled;
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor="#999999"
              multiline
              maxLength={140}
              editable={!disabled}
              returnKeyType="send"
              onSubmitEditing={canSend ? onSend : undefined}
              blurOnSubmit={false}
            />
            {canSend && (
              <Pressable
                style={styles.sendButton}
                onPress={onSend}
                hitSlop={8}
              >
                <MaterialIcons
                  name="arrow-upward"
                  size={20}
                  color="#FFFFFF"
                />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 12,
  },
  inputWrapper: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F2F2F7",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    paddingVertical: 0,
    paddingHorizontal: 0,
    maxHeight: 100,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});

